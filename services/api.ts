import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 
const CACHE_KEY = 'sistemcaja_local_db';

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

// --- LOCAL DATA ---
let localData: AppData = {
    products: [],
    sales: [],
    customers: [],
    users: [],
    apps: []
};

// --- HELPERS ---
const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleanStr = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

const mapProductFromSheet = (raw: any): Product => {
    // EL IMEI ES EL IDENTIFICADOR PRIMARIO
    const imei = String(raw.Imei || raw.IMEI || raw.sku || raw.Codigo || '');
    const fallbackId = String(raw.ID || raw.id || '');
    
    return {
        id: imei || fallbackId || `TEMP-${Date.now()}`, // Prioridad total al IMEI como ID
        name: String(raw['NOMBRE DEL PRODUCTO'] || raw.NOMBRE || raw.Nombre || raw.name || 'Producto Sin Nombre'),
        price: parseNumber(raw.Precio || raw.PRECIO || raw.price),
        stock: parseNumber(raw.Stock || raw.STOCK || raw.stock),
        sku: imei, // Mantenemos sku para compatibilidad visual
        category: String(raw.CATEGORIA || raw.Categoria || raw.category || 'General')
    };
};

const formatSaleForSheet = (sale: Sale) => ({
    id: sale.id,
    date: sale.date,
    total: sale.total, 
    paymentMethod: sale.paymentMethod,
    paymentType: sale.paymentType,
    customerId: sale.customerId || '',
    customerName: sale.customerName || '',
    exchangeRate: sale.exchangeRate || 0,
    items: JSON.stringify(sale.items)
});

// --- CACHE MANAGEMENT ---
const saveToCache = (data: AppData) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error guardando en caché", e);
    }
};

const loadFromCache = (): AppData | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
};

// --- API IMPLEMENTATION ---

export const fetchAllData = async (): Promise<AppData> => {
  const cachedData = loadFromCache();
  if (cachedData) {
      localData = cachedData;
  }

  try {
    const response = await fetch(SHEETS_API_URL, { 
        method: 'GET', 
        redirect: 'follow'
    });
    
    if (!response.ok) throw new Error("Error HTTP " + response.status);
    
    const text = await response.text();
    if (text.startsWith('<') || text.includes('DOCTYPE')) {
        throw new Error("Respuesta inválida de Google (HTML)");
    }

    const data = JSON.parse(text);
    
    const freshData: AppData = {
        products: Array.isArray(data.products) ? data.products.map(mapProductFromSheet) : [],
        sales: data.sales || [],
        customers: data.customers || [],
        users: data.users || [],
        apps: data.apps || []
    };

    if (freshData.products.length > 0) {
        saveToCache(freshData);
        localData = freshData;
    }

    return localData;

  } catch (error) {
    return localData;
  }
};

const sendToSheet = async (action: string, sheet: string, data: any) => {
    try {
        await fetch(SHEETS_API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action, sheet, data }),
            keepalive: true 
        });
        return true;
    } catch (e) {
        return false;
    }
};

export const api = {
  createSale: async (sale: Sale) => {
    return sendToSheet('create', 'Sales', formatSaleForSheet(sale));
  },
  
  updateStock: async (id: string, newStock: number) => {
    // Al pasar el id (que ahora es el IMEI), el backend puede actualizar la fila correcta
    return sendToSheet('updateStock', 'Products', { id, stock: newStock });
  },

  createPurchase: async (purchase: Purchase) => {
    const payload = { ...purchase, items: JSON.stringify(purchase.items) };
    return sendToSheet('create', 'Purchases', payload);
  },

  createCustomer: async (customer: Customer) => {
    return sendToSheet('create', 'Customers', customer);
  },

  createUser: async (user: User) => {
    return sendToSheet('create', 'Users', user);
  },

  createApp: async (app: ExternalApp) => {
    return sendToSheet('create', 'Apps', app);
  },
  
  deleteApp: async (id: string) => {
      return sendToSheet('delete', 'Apps', { id });
  }
};