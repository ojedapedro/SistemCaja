import { Product, Sale, Customer, User, ExternalApp, Purchase } from '../types';

// NOTA: Si esta URL da 404, la app funcionará en modo OFFLINE automáticamente.
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzBpTxHOEPqvul1rdyGUESuG8WRcsHhmmDqphIVKRlwTefkeBSYyssPE7javZgLGmA_/exec'; 

export interface AppData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  users: User[];
  apps: ExternalApp[];
}

// --- INITIAL MOCK DATA (Datos iniciales para que la app no arranque vacía) ---
let localData: AppData = {
    products: [
        { id: '1', name: 'IPHONE 14 PRO MAX', price: 1200.00, stock: 10, sku: 'PROD-001', category: 'Celulares' },
        { id: '2', name: 'CARGADOR 20W ORIGINAL', price: 25.00, stock: 50, sku: 'ACC-001', category: 'Accesorios' },
        { id: '3', name: 'FORRO SILICONE CASE', price: 10.00, stock: 100, sku: 'ACC-002', category: 'Accesorios' },
        { id: '4', name: 'REDMI NOTE 12', price: 180.00, stock: 15, sku: 'PROD-002', category: 'Celulares' },
        { id: '5', name: 'MICA CERAMICA', price: 5.00, stock: 200, sku: 'ACC-003', category: 'Accesorios' }
    ],
    sales: [],
    customers: [
        { id: 'V-12345678', name: 'Cliente Mostrador', phone: '000-0000000', email: '', address: '' }
    ],
    users: [
        { id: 'admin', name: 'Administrador', username: 'admin', role: 'admin', password: '123' },
        { id: 'vendedor', name: 'Vendedor 1', username: 'vendedor', role: 'seller', password: '123' }
    ],
    apps: []
};

// State flags
let isOfflineMode = false;

// --- HELPERS ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Normalizador seguro de números
const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Elimina todo lo que no sea numero, punto o signo menos. Convierte coma en punto.
    const cleanStr = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

// Mapeador de datos de Google Sheets a nuestra estructura
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

// --- API CORE ---

// Función genérica segura para peticiones
const safeFetch = async (action: string, sheet: string, data: any) => {
    if (isOfflineMode) {
        console.log(`[Offline Mode] Acción simulada: ${action} en ${sheet}`);
        return true;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout corto de 5s

        // Usamos no-cors porque Google Scripts no devuelve CORS headers en POST simples
        await fetch(SHEETS_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action, sheet, data }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        console.warn(`[Network] Falló sync con nube (${action}).`, error);
        // No lanzamos error para no romper la UI. Asumimos éxito local.
        return false;
    }
};

export const fetchAllData = async (): Promise<AppData> => {
  if (isOfflineMode) return localData;

  console.log("📥 Sincronizando datos...");
  try {
    const response = await fetch(SHEETS_API_URL, { method: 'GET', redirect: 'follow' });
    
    // Si la URL da 404 o 500, activamos modo offline
    if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status}. Activando MODO OFFLINE.`);
        isOfflineMode = true;
        return localData;
    }
    
    const data = await response.json();
    
    // Validación básica de estructura
    if (!data || typeof data !== 'object') throw new Error("Respuesta inválida JSON");

    // Actualizamos caché local
    localData = {
        products: Array.isArray(data.products) ? data.products.map(mapProductFromSheet) : localData.products,
        sales: Array.isArray(data.sales) ? data.sales : localData.sales,
        customers: Array.isArray(data.customers) ? data.customers : localData.customers,
        users: Array.isArray(data.users) ? data.users : localData.users,
        apps: Array.isArray(data.apps) ? data.apps : localData.apps
    };

    console.log("✅ Datos sincronizados correctamente.");
    return localData;

  } catch (error) {
    console.warn("⚠️ No se pudo conectar a Google Sheets. Usando datos locales.", error);
    return localData;
  }
};

// --- API EXPORTS (Operations) ---

export const api = {
  // Operaciones de Venta (Actualizan local y envían a nube)
  processSaleTransaction: async (sale: Sale, updatedProducts: Product[]) => {
      // 1. Actualizar Localmente (Instantáneo)
      localData.sales.push(sale);
      localData.products = updatedProducts; // Reemplazamos el inventario con el ya calculado

      // 2. Enviar a Nube (Fuego y Olvido)
      // Enviamos la venta
      safeFetch('create', 'Sales', formatSaleForSheet(sale));
      
      // Enviamos actualización de stock por cada producto vendido
      // Pequeño delay entre peticiones para no saturar GAS
      for (const item of sale.items) {
          const product = updatedProducts.find(p => p.id === item.productId);
          if (product) {
              safeFetch('updateStock', 'Products', { id: product.id, stock: product.stock });
              await wait(100); 
          }
      }
      return true;
  },

  createPurchase: async (purchase: Purchase) => {
      return safeFetch('create', 'Purchases', { ...purchase, items: JSON.stringify(purchase.items) });
  },

  createCustomer: async (customer: Customer) => {
      // Check local duplicate
      if (!localData.customers.find(c => c.id === customer.id)) {
          localData.customers.push(customer);
          return safeFetch('create', 'Customers', customer);
      }
      return true;
  },

  createUser: async (user: User) => {
      localData.users.push(user);
      return safeFetch('create', 'Users', user);
  },

  createApp: async (app: ExternalApp) => {
      localData.apps.push(app);
      return safeFetch('create', 'Apps', app);
  },
  
  deleteApp: async (id: string) => {
      localData.apps = localData.apps.filter(a => a.id !== id);
      return safeFetch('delete', 'Apps', { id });
  },

  updateStockManual: async (id: string, newStock: number) => {
      const p = localData.products.find(x => x.id === id);
      if (p) p.stock = newStock;
      return safeFetch('updateStock', 'Products', { id, stock: newStock });
  }
};