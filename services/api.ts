import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

// --- LOCAL DATA (Respaldo) ---
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

const mapProductFromSheet = (raw: any): Product => ({
    id: String(raw.ID || raw.id || Date.now()),
    name: String(raw['NOMBRE DEL PRODUCTO'] || raw.NOMBRE || raw.Nombre || raw.name || 'Producto Sin Nombre'),
    price: parseNumber(raw.Precio || raw.PRECIO || raw.price),
    stock: parseNumber(raw.Stock || raw.STOCK || raw.stock),
    sku: String(raw.Imei || raw.IMEI || raw.sku || raw.Codigo || ''),
    category: String(raw.CATEGORIA || raw.Categoria || raw.category || 'General')
});

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

// --- API IMPLEMENTATION ---

export const fetchAllData = async (): Promise<AppData> => {
  console.log("📥 Obteniendo datos de Google Sheets...");
  try {
    const response = await fetch(SHEETS_API_URL, { 
        method: 'GET', 
        redirect: 'follow' 
    });
    
    if (!response.ok) throw new Error("Error conectando con la base de datos");
    
    const data = await response.json();
    
    // Actualizar cache local
    localData = {
        products: Array.isArray(data.products) ? data.products.map(mapProductFromSheet) : [],
        sales: data.sales || [],
        customers: data.customers || [],
        users: data.users || [],
        apps: data.apps || []
    };

    return localData;
  } catch (error) {
    console.warn("⚠️ Error de red o API Offline. Usando datos locales.", error);
    return localData;
  }
};

// Función para enviar datos "a ciegas" (Fire and Forget) para evitar el error de canal cerrado
const sendToSheet = async (action: string, sheet: string, data: any) => {
    try {
        // Usamos no-cors. Esto evita que el navegador espere una respuesta JSON estricta,
        // eliminando el error "message channel closed" si el script tarda mucho.
        await fetch(SHEETS_API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action, sheet, data }),
            keepalive: true // Mantiene la petición viva aunque se cierre la pestaña
        });
        console.log(`✅ Enviado: ${action} ${sheet}`);
        return true;
    } catch (e) {
        console.error(`❌ Error enviando ${action}:`, e);
        return false;
    }
};

export const api = {
  createSale: async (sale: Sale) => {
    return sendToSheet('create', 'Sales', formatSaleForSheet(sale));
  },
  
  updateStock: async (id: string, newStock: number) => {
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