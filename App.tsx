import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  RotateCcw, 
  Grid, 
  Menu, 
  X, 
  LogOut, 
  Archive,
  CreditCard,
  Users,
  UserCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Product, Sale, Purchase, Return, ViewState, ExternalApp, Customer, User, Role } from './types';
import Dashboard from './components/Dashboard';
import AppLauncher from './components/AppLauncher';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import UsersView from './components/UsersView';
import CustomersView from './components/CustomersView';
import SalesView from './components/SalesView';
import PurchasesView from './components/PurchasesView';
import InventoryView from './components/InventoryView';
import { fetchAllData, api } from './services/api';

// -- INLINE COMPONENTS --

// --- Returns View ---
const ReturnsView = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <RotateCcw className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Devoluciones</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">Escanea el ticket de venta o ingresa el ID de la transacción para iniciar el proceso de garantía.</p>
        <div className="flex max-w-sm mx-auto gap-2">
            <input type="text" placeholder="ID de Venta" className="flex-1 border p-2 rounded-lg" />
            <button className="bg-gray-800 text-white px-4 py-2 rounded-lg">Buscar</button>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apps, setApps] = useState<ExternalApp[]>([]);

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
        const data = await fetchAllData();
        // Defensive coding: ensure arrays are arrays
        setProducts(data.products || []);
        setSales(data.sales || []);
        setCustomers(data.customers || []);
        setUsers(data.users || []);
        setApps(data.apps || []);
    } catch (e) {
        console.error("Critical Failure in loadData", e);
    } finally {
        setIsLoading(false);
        setIsSyncing(false);
    }
  };

  // Auth Handler
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'warehouse') setCurrentView('inventory');
    else if (user.role === 'seller') setCurrentView('sales');
    else setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Handlers
  const handleNewSale = (sale: Sale, customer?: Customer) => {
    console.log("Procesando nueva venta...", sale.id);

    // --- 1. OPTIMISTIC UPDATE (UI) ---
    // This updates the React state IMMEDIATELY so the user sees the stock go down.
    
    // 1.1 Update Customer State
    if (customer && customer.id) {
        const existing = customers.find(c => c.id === customer.id);
        if (!existing) setCustomers(prev => [...prev, customer]);
    }

    // 1.2 Update Products Stock
    // We create a new array to force React re-render, ensuring math is safe
    const newProducts = products.map(p => {
        const soldItem = sale.items.find(i => i.productId === p.id);
        if (soldItem) {
            const currentStock = Number(p.stock) || 0; // Force number
            const soldQty = Number(soldItem.quantity) || 0; // Force number
            const newStock = Math.max(0, currentStock - soldQty);
            return { ...p, stock: newStock };
        }
        return p;
    });
    setProducts(newProducts);

    // 1.3 Update Sales History
    setSales(prev => [...prev, sale]);

    // --- 2. BACKGROUND SYNC (QUEUE) ---
    // We call the API wrapper which now handles queueing internally.
    // We do NOT await these calls to block the UI. They run in background.

    // 2.1 Sync Customer
    if (customer && customer.id && !customers.find(c => c.id === customer.id)) {
        api.createCustomer(customer);
    }

    // 2.2 Sync Stock (For each item)
    sale.items.forEach(item => {
        // Find the calculated stock from our safe newProducts array
        const updatedProduct = newProducts.find(p => p.id === item.productId);
        if (updatedProduct) {
             api.updateStock(updatedProduct.id, updatedProduct.stock);
        }
    });

    // 2.3 Sync Sale
    api.createSale(sale);
    
    console.log("Venta encolada para sincronización.");
  };
  
  const handleNewPurchase = async (purchase: Purchase) => {
      // Logic to handle new purchase
      await api.createPurchase(purchase);
      alert("Recepción guardada en cola de sincronización");
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
      setProducts(products.map(p => p.id === id ? {...p, stock: newStock} : p));
      api.updateStock(id, newStock);
  };

  const handleAddCustomer = async (customer: Customer) => {
      setCustomers([...customers, customer]);
      api.createCustomer(customer);
  };

  const handleAddUser = async (user: User) => {
      setUsers([...users, user]);
      api.createUser(user);
  };

  const handleAddApp = async (app: ExternalApp) => {
      setApps([...apps, app]);
      api.createApp(app);
  };
  
  const handleRemoveApp = async (id: string) => {
      setApps(apps.filter(a => a.id !== id));
      api.deleteApp(id);
  };

  // Render Logic
  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 animate-pulse">Conectando con SistemCaja...</p>
              <p className="text-xs text-gray-400 mt-2">Si tarda mucho, activaremos modo offline.</p>
          </div>
      );
  }

  if (!currentUser) {
    const authUsers = users.length > 0 ? users : [{id:'admin', name:'Admin Local', username:'admin', role:'admin' as Role, password:'123'}];
    return <Login onLogin={handleLogin} users={authUsers} />;
  }

  const NavItem = ({ view, icon: Icon, label, allowedRoles }: { view: ViewState, icon: any, label: string, allowedRoles: Role[] }) => {
    if (!allowedRoles.includes(currentUser.role)) return null;
    return (
        <button 
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
            ${currentView === view ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <Icon size={20} className={`${currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
            {sidebarOpen && <span className="font-medium">{label}</span>}
        </button>
    );
  };

  // Special layout for sales view to maximize space
  if (currentView === 'sales') {
    return (
        <div className="h-screen bg-gray-50 flex font-sans overflow-hidden">
             <div className="w-16 bg-slate-900 text-white flex flex-col items-center py-4 z-50">
                <div className="mb-6 font-bold text-blue-400">SC</div>
                <div className="space-y-4 flex-1">
                    <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Volver"><LayoutDashboard size={20}/></button>
                    <button onClick={() => setCurrentView('sales')} className="p-2 bg-blue-600 text-white rounded shadow-lg" title="Ventas"><ShoppingCart size={20}/></button>
                    <button onClick={() => setCurrentView('inventory')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Inventario"><Package size={20}/></button>
                    <button onClick={() => setCurrentView('apps')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Apps"><Grid size={20}/></button>
                </div>
                <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-slate-800 rounded"><LogOut size={20}/></button>
             </div>
             <div className="flex-1 overflow-hidden relative">
                <SalesView products={products} customers={customers} onSale={handleNewSale} />
             </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
        
        {/* Sidebar */}
        <div className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                {sidebarOpen ? <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SistemCaja</h1> : <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">SC</div>}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded-md text-slate-400">
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {currentUser.name.substring(0,2).toUpperCase()}
                </div>
                {sidebarOpen && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 uppercase">{currentUser.role}</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <NavItem view="dashboard" icon={LayoutDashboard} label="Panel Principal" allowedRoles={['admin']} />
                <NavItem view="sales" icon={ShoppingCart} label="Caja / Ventas" allowedRoles={['admin', 'seller']} />
                <NavItem view="purchases" icon={CreditCard} label="Compras" allowedRoles={['admin']} />
                <NavItem view="inventory" icon={Package} label="Inventario" allowedRoles={['admin', 'warehouse']} />
                <NavItem view="returns" icon={RotateCcw} label="Devoluciones" allowedRoles={['admin', 'seller']} />
                <NavItem view="customers" icon={Users} label="Clientes" allowedRoles={['admin', 'seller']} />
                <NavItem view="apps" icon={Grid} label="Aplicaciones" allowedRoles={['admin', 'seller', 'warehouse']} />
                <NavItem view="users" icon={UserCircle} label="Usuarios" allowedRoles={['admin']} />
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={loadData} 
                    className={`flex items-center gap-3 text-slate-400 hover:text-blue-400 transition-colors w-full px-4 py-2 mb-2 ${isSyncing ? 'animate-pulse' : ''}`}
                    title="Recargar datos de Sheets"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    {sidebarOpen && <span>{isSyncing ? 'Sincronizando...' : 'Recargar Datos'}</span>}
                </button>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2"
                >
                    <LogOut size={20} />
                    {sidebarOpen && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto h-full">
                {currentView === 'dashboard' && <Dashboard sales={sales} />}
                {currentView === 'inventory' && <InventoryView products={products} onUpdateStock={handleUpdateStock} />}
                {currentView === 'apps' && (
                    <AppLauncher 
                        apps={apps} 
                        onAddApp={handleAddApp}
                        onRemoveApp={handleRemoveApp}
                    />
                )}
                {currentView === 'customers' && <CustomersView customers={customers} onAddCustomer={handleAddCustomer} />}
                {currentView === 'users' && <UsersView users={users} onAddUser={handleAddUser} />}
                {currentView === 'returns' && <ReturnsView />}
                {currentView === 'purchases' && <PurchasesView onPurchase={handleNewPurchase} />}
            </div>
        </main>

        <ChatBot />
    </div>
  );
};

export default App;