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
  CreditCard,
  Users,
  UserCircle,
  Loader2,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { Product, Sale, Purchase, ViewState, ExternalApp, Customer, User, Role } from './types';
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
const ReturnsView = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        <RotateCcw className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Devoluciones</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">Escanea el ticket de venta para iniciar garantía.</p>
    </div>
);

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
        // Solo actualizamos si hay datos válidos, para no borrar el estado local con vacíos por error
        if (data.products.length > 0) setProducts(data.products);
        if (data.sales.length > 0) setSales(data.sales);
        if (data.customers.length > 0) setCustomers(data.customers);
        if (data.users.length > 0) setUsers(data.users);
        if (data.apps.length > 0) setApps(data.apps);
    } catch (e) {
        console.error("Error cargando datos (usando local)", e);
    } finally {
        setIsLoading(false);
        setIsSyncing(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'warehouse') setCurrentView('inventory');
    else if (user.role === 'seller') setCurrentView('sales');
    else setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- CORE TRANSACTION LOGIC ---
  const handleNewSale = async (sale: Sale, customer?: Customer) => {
    console.log("🚀 Procesando Venta:", sale.id);

    // 1. Calcular el nuevo inventario en MEMORIA
    const updatedProducts = products.map(p => {
        const itemSold = sale.items.find(i => i.productId === p.id);
        if (itemSold) {
            // Protección contra NaN y números negativos
            const currentStock = typeof p.stock === 'number' ? p.stock : 0;
            return { ...p, stock: Math.max(0, currentStock - itemSold.quantity) };
        }
        return p;
    });

    // 2. Actualizar UI React Instántaneamente
    setProducts(updatedProducts);
    setSales(prev => [...prev, sale]);
    
    if (customer && customer.id) {
         if (!customers.find(c => c.id === customer.id)) {
             setCustomers(prev => [...prev, customer]);
         }
    }

    // 3. Enviar transacción al servicio API (Background)
    // Pasamos los productos YA actualizados para que la API sepa qué stock guardar
    await api.processSaleTransaction(sale, updatedProducts);
    
    if (customer) {
        api.createCustomer(customer);
    }
  };
  
  const handleNewPurchase = async (purchase: Purchase) => {
      await api.createPurchase(purchase);
      // En una app real, aquí también actualizaríamos el stock sumando
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
      setProducts(products.map(p => p.id === id ? {...p, stock: newStock} : p));
      await api.updateStockManual(id, newStock);
  };

  const handleAddCustomer = async (customer: Customer) => {
      setCustomers(prev => [...prev, customer]);
      await api.createCustomer(customer);
  };

  const handleAddUser = async (user: User) => {
      setUsers(prev => [...prev, user]);
      await api.createUser(user);
  };

  const handleAddApp = async (app: ExternalApp) => {
      setApps(prev => [...prev, app]);
      await api.createApp(app);
  };
  
  const handleRemoveApp = async (id: string) => {
      setApps(prev => prev.filter(a => a.id !== id));
      await api.deleteApp(id);
  };

  // --- RENDER ---
  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-700">Iniciando SistemCaja</h2>
              <p className="text-gray-400 mt-2">Cargando módulos...</p>
          </div>
      );
  }

  if (!currentUser) {
    // Si no hay usuarios cargados (primera vez offline), crear admin por defecto
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

  if (currentView === 'sales') {
    return (
        <div className="h-screen bg-gray-50 flex font-sans overflow-hidden">
             <div className="w-16 bg-slate-900 text-white flex flex-col items-center py-4 z-50">
                <div className="mb-6 font-bold text-blue-400">SC</div>
                <div className="space-y-4 flex-1">
                    <button onClick={() => setCurrentView('dashboard')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Volver"><LayoutDashboard size={20}/></button>
                    <button onClick={() => setCurrentView('sales')} className="p-2 bg-blue-600 text-white rounded shadow-lg" title="Ventas"><ShoppingCart size={20}/></button>
                    <button onClick={() => setCurrentView('inventory')} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Inventario"><Package size={20}/></button>
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
                {sidebarOpen ? <h1 className="text-xl font-bold text-white">SistemCaja</h1> : <div className="font-bold">SC</div>}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-slate-400"><Menu size={18} /></button>
            </div>
            
            <div className="p-4 border-b border-slate-800">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                         {currentUser.name.charAt(0)}
                     </div>
                     {sidebarOpen && <div className="text-sm font-medium truncate">{currentUser.name}</div>}
                 </div>
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

            <div className="p-4">
                <button onClick={loadData} className="flex items-center gap-2 text-slate-400 hover:text-white w-full p-2 mb-2">
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/>
                    {sidebarOpen && (isSyncing ? 'Sincronizando...' : 'Recargar')}
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 w-full p-2">
                    <LogOut size={18} />
                    {sidebarOpen && 'Salir'}
                </button>
            </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto h-screen p-4 bg-slate-100">
            {currentView === 'dashboard' && <Dashboard sales={sales} />}
            {currentView === 'inventory' && <InventoryView products={products} onUpdateStock={handleUpdateStock} />}
            {currentView === 'apps' && <AppLauncher apps={apps} onAddApp={handleAddApp} onRemoveApp={handleRemoveApp} />}
            {currentView === 'customers' && <CustomersView customers={customers} onAddCustomer={handleAddCustomer} />}
            {currentView === 'users' && <UsersView users={users} onAddUser={handleAddUser} />}
            {currentView === 'returns' && <ReturnsView />}
            {currentView === 'purchases' && <PurchasesView onPurchase={handleNewPurchase} />}
        </main>
        
        <ChatBot />
    </div>
  );
};

export default App;