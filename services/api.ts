import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

// ¡IMPORTANTE! Reemplaza esta URL con la que obtuviste al desplegar tu Google Apps Script
// La URL debe terminar en /exec y tener permisos de "Anyone" (Cualquiera).
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 

// VALIDACIÓN: Evita intentar conectar si la URL es el ejemplo (placeholder) o no es HTTP.
const isConfigured = SHEETS_API_URL.startsWith('http') && !SHEETS_API_URL.includes('AKfycbx...');

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

// --- HELPERS DE LIMPIEZA DE DATOS ---

// Convierte "$5.00", "5,00", o 5 a un número válido
const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Eliminar símbolos de moneda y espacios, cambiar coma por punto si es necesario
    const cleanStr = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

// "Traductor": Convierte las columnas de tu hoja (Español) a los tipos de la App (Inglés)
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

// Asegura que la venta se envíe con las claves en el orden exacto de las columnas de la hoja
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

// --- API ---

export const fetchAllData = async (): Promise<AppData> => {
  if (!isConfigured) {
    console.warn("API URL no configurada correctamente. Usando datos de prueba.");
    return getMockData();
  }

  try {
    // GET request: No enviar headers personalizados para evitar Preflight CORS (OPTIONS) que falla en GAS.
    const response = await fetch(SHEETS_API_URL, {
        method: 'GET',
        redirect: 'follow'
    });
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Conexión exitosa. Datos recibidos:", data);

    const products = Array.isArray(data.products) 
        ? data.products.map(mapProductFromSheet) 
        : [];

    const sales = data.sales || [];
    const customers = data.customers || [];
    const users = data.users || [];
    const apps = data.apps || [];

    return { products, sales, customers, users, apps };

  } catch (error) {
    console.error("Error conectando con Google Sheets. Verifique URL y despliegue como 'Anyone'.", error);
    // Retornamos mock data para que la app no se rompa visualmente
    return getMockData();
  }
};

const sendRequest = async (action: string, sheet: string, data: any) => {
  if (!isConfigured) {
      console.warn("No se puede guardar: API no configurada.");
      return;
  }
  
  console.log(`Enviando a ${sheet}...`);

  try {
    // POST request: Usamos no-cors o text/plain para evitar errores complejos de CORS en escrituras
    // Google Apps Script recibe esto en e.postData.contents
    await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, sheet, data }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });
    console.log("Guardado exitoso.");
  } catch (error) {
    console.error(`Error guardando datos en ${sheet}:`, error);
  }
};

// Datos de prueba (Fallback)
const getMockData = (): AppData => ({
    products: [
        { id: '1', name: 'DEMO: HONOR PLAY 10', price: 80.00, stock: 15, sku: '865573084579937', category: 'Telefonos' },
        { id: '2', name: 'DEMO: iPhone 14 Pro', price: 990.00, stock: 3, sku: '12345678998745600', category: 'Telefonos' },
        { id: '3', name: 'DEMO: Funda Silicona', price: 5.00, stock: 50, sku: 'ACC-CASE-001', category: 'Accesorios' },
    ],
    sales: [],
    customers: [{ id: '12345678', name: 'Cliente Demo', phone: '555-0000', email: '', address: '' }],
    users: [{ id: 'admin', name: 'Admin Local', username: 'admin', role: 'admin', password: '123' }],
    apps: []
});

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