import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

// --- LOCAL DATA STORE (Fallback & Cache) ---
let localData: AppData = {
    products: [
        { id: '1', name: 'DEMO: HONOR PLAY 10', price: 80.00, stock: 15, sku: '865573084579937', category: 'Telefonos' },
        { id: '2', name: 'DEMO: iPhone 14 Pro', price: 990.00, stock: 3, sku: '12345678998745600', category: 'Telefonos' },
        { id: '3', name: 'DEMO: Funda Silicona', price: 5.00, stock: 50, sku: 'ACC-CASE-001', category: 'Accesorios' },
        { id: '4', name: 'DEMO: Cargador 20W', price: 15.00, stock: 20, sku: 'ACC-CHG-20W', category: 'Accesorios' },
    ],
    sales: [],
    customers: [{ id: '12345678', name: 'Cliente Local', phone: '555-0000', email: 'cliente@demo.com', address: 'Ciudad' }],
    users: [{ id: 'admin', name: 'Admin Local', username: 'admin', role: 'admin', password: '123' }],
    apps: []
};

// --- HELPERS ---

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleanStr = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

const mapProductFromSheet = (raw: any): Product => {
    return {
        id: String(raw.ID || raw.id || Date.now()),
        name: String(raw['NOMBRE DEL PRODUCTO'] || raw.NOMBRE || raw.Nombre || raw.name || 'Sin Nombre'),
        price: parseNumber(raw.Precio || raw.PRECIO || raw.price),
        stock: parseNumber(raw.Stock || raw.STOCK || raw.stock),
        sku: String(raw.Imei || raw.IMEI || raw.sku || raw.Codigo || ''),
        category: String(raw.CATEGORIA || raw.Categoria || raw.category || 'General')
    };
};

const formatSaleForSheet = (sale: Sale) => {
    return {
        id: sale.id,
        date: sale.date,
        total: sale.total, 
        paymentMethod: sale.paymentMethod,
        paymentType: sale.paymentType,
        customerId: sale.customerId || '',
        customerName: sale.customerName || '',
        exchangeRate: sale.exchangeRate || 0,
        items: JSON.stringify(sale.items)
    };
};

// --- REQUEST QUEUE SYSTEM ---
// This ensures requests are sent one by one in the background, preventing Google Sheets from locking up.
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const task = requestQueue.shift();
        if (task) {
            try {
                await task();
            } catch (error) {
                console.error("Error processing queue item:", error);
                // We continue processing the rest of the queue even if one fails
            }
            // Rate limit: Wait 500ms between requests to be nice to Google Scripts
            await wait(500); 
        }
    }
    isProcessingQueue = false;
};

const enqueueRequest = (action: string, sheet: string, data: any) => {
    console.log(`[Queue] Encolando: ${action} -> ${sheet}`);
    
    requestQueue.push(async () => {
        console.log(`[Network] Enviando: ${action} -> ${sheet}`);
        await fetch(SHEETS_API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify({ action, sheet, data }),
            headers: { "Content-Type": "text/plain" },
            keepalive: true // Crucial: allows request to complete even if tab closes (partially)
        });
    });
    
    processQueue();
};


// --- API IMPLEMENTATION ---

export const fetchAllData = async (): Promise<AppData> => {
  console.log("Intentando conectar con Google Sheets...");
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos max

    const response = await fetch(SHEETS_API_URL, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Datos recibidos de la nube:", data);

    const products = Array.isArray(data.products) ? data.products.map(mapProductFromSheet) : [];
    const sales = data.sales || [];
    const customers = data.customers || [];
    const users = data.users || [];
    const apps = data.apps || [];

    // Update local cache
    localData = { products, sales, customers, users, apps };
    return localData;

  } catch (error) {
    console.error("⚠️ Error conectando con la API (Usando caché/offline):", error);
    // Return whatever we have in memory
    return localData;
  }
};

const sendRequest = async (action: string, sheet: string, data: any) => {
  // 1. Optimistic Update (Local Memory)
  // We update local data IMMEDIATELY so the user sees the change.
  try {
      if (sheet === 'Sales' && action === 'create') {
          localData.sales.push(data); 
      } else if (sheet === 'Products' && action === 'updateStock') {
          const p = localData.products.find(x => x.id === data.id);
          if (p) p.stock = data.stock;
      }
  } catch (e) { console.warn("Error actualizando cache local", e); }

  // 2. Queue Network Request (Fire & Forget)
  // We do NOT await this. We let the queue handle it in background.
  enqueueRequest(action, sheet, data);
  
  return true; 
};

export const api = {
  createSale: async (sale: Sale) => {
    const payload = formatSaleForSheet(sale);
    return sendRequest('create', 'Sales', payload);
  },
  createPurchase: async (purchase: Purchase) => {
    const payload = { ...purchase, items: JSON.stringify(purchase.items) };
    return sendRequest('create', 'Purchases', payload);
  },
  createProduct: async (product: Product) => {
    return sendRequest('create', 'Products', product);
  },
  updateStock: async (id: string, newStock: number) => {
    return sendRequest('updateStock', 'Products', { id, stock: newStock });
  },
  createCustomer: async (customer: Customer) => {
    return sendRequest('create', 'Customers', customer);
  },
  createUser: async (user: User) => {
    return sendRequest('create', 'Users', user);
  },
  createApp: async (app: ExternalApp) => {
    return sendRequest('create', 'Apps', app);
  },
  deleteApp: async (id: string) => {
      return sendRequest('delete', 'Apps', { id });
  }
};