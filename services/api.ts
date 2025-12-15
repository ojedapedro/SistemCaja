import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

// ¡IMPORTANTE! Reemplaza esta URL con la que obtuviste al desplegar tu Google Apps Script
// Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 

// VALIDACIÓN CORREGIDA: Solo verificamos que sea una URL válida http/https.
// Eliminamos el bloqueo por si la URL contenía caracteres del placeholder.
const isConfigured = SHEETS_API_URL.startsWith('http');

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

export const fetchAllData = async (): Promise<AppData> => {
  if (!isConfigured) {
    console.warn("API URL no configurada o inválida. Usando datos de prueba.");
    return getMockData();
  }

  try {
    const response = await fetch(SHEETS_API_URL);
    if (!response.ok) throw new Error("La respuesta de la red no fue correcta");
    const data = await response.json();
    return {
      products: data.products || [],
      sales: data.sales || [],
      customers: data.customers || [],
      users: data.users || [],
      apps: data.apps || []
    };
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return getMockData();
  }
};

const sendRequest = async (action: string, sheet: string, data: any) => {
  if (!isConfigured) {
      console.warn("Intento de envío bloqueado: URL de API no configurada.");
      return; 
  }
  
  console.log(`Enviando solicitud [${action}] a [${sheet}]:`, data);

  try {
    // Usamos mode: 'no-cors' como fallback si hay problemas estrictos de CORS, 
    // pero idealmente 'text/plain' funciona bien con GAS.
    await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, sheet, data }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });
    console.log("Datos enviados exitosamente.");
  } catch (error) {
    console.error(`Error ejecutando ${action} en ${sheet}:`, error);
  }
};

// Fallback Mock Data generator
const getMockData = (): AppData => ({
    products: [
        { id: '1', name: 'PHONE HONOR PLAY 10 4/128 GB', price: 80.00, stock: 15, sku: '865573084579937', category: 'Telefonos' },
        { id: '2', name: 'PHONE HONOR PLAY 10 4/128 GB (Blue)', price: 80.00, stock: 8, sku: '865573084581594', category: 'Telefonos' },
        { id: '3', name: 'PHONE HONOR PLAY 10 4/128 GB (Black)', price: 80.00, stock: 12, sku: '865573084579697', category: 'Telefonos' },
        { id: '4', name: 'iPhone 14 Pro', price: 990.00, stock: 3, sku: '12345678998745600', category: 'Telefonos' },
        { id: '5', name: 'Samsung Galaxy S23', price: 750.00, stock: 5, sku: 'SAM-S23-128', category: 'Telefonos' },
        { id: '6', name: 'Funda Silicona Universal', price: 5.00, stock: 50, sku: 'ACC-CASE-001', category: 'Accesorios' },
    ],
    sales: [],
    customers: [
        { id: '12345678', name: 'Andres Bello', phone: '4168889977', email: 'andres@example.com', address: 'Caracas' }
    ],
    users: [
        { id: 'admin', name: 'Admin Local', username: 'admin', role: 'admin', password: '123' }
    ],
    apps: []
});

export const api = {
  createSale: async (sale: Sale) => {
    // Aplanamos items para que se guarde como string en Sheets
    const payload = {
        ...sale,
        items: JSON.stringify(sale.items)
    };
    return sendRequest('create', 'Sales', payload);
  },
  createPurchase: async (purchase: Purchase) => {
    const payload = {
        ...purchase,
        items: JSON.stringify(purchase.items)
    };
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