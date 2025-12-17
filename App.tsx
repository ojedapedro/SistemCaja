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
  Users,
  UserCircle,
  Loader2,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { Product, Sale, Purchase, ViewState, ExternalApp, Customer, User } from './types';
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
        
        if (data) {
             setProducts(data.products || []);
             setSales(data.sales || []);
             setCustomers(data.customers || []);
             setUsers(data.users || []);
             setApps(data.apps || []);
        }
    } catch (e) {
        console.error("Error crítico cargando datos", e);
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

  // --- LOGICA PRINCIPAL DE VENTA ---
  const handleNewSale = async (sale: Sale, customer?: Customer) => {
    console.log("🚀 Procesando Venta:", sale.id);

    // 1. ACTUALIZACIÓN OPTIMISTA (UI INSTANTÁNEA)
    const updatedProducts = products.map(p => {
        const itemSold = sale.items.find(i => i.productId === p.id);
        if (itemSold) {
            const currentStock = typeof p.stock === 'number' ? p.stock : 0;
            return { ...p, stock: Math.max(0, currentStock - itemSold.quantity) };
        }
        return p;
    });

    setProducts(updatedProducts);
    setSales(prev => [...prev, sale]);
    
    // Si hay cliente nuevo, lo agregamos localmente
    if (customer && customer.id) {
         if (!customers.find(c => c.id === customer.id)) {
             setCustomers(prev => [...prev, customer]);
         }
    }

    // 2. SINCRONIZACIÓN BACKGROUND (NO BLOQUEANTE)
    
    // a. Registrar Venta
    api.createSale(sale).catch(e => console.error("Error sync venta", e));

    // b. Registrar Cliente
    if (customer) {
        api.createCustomer(customer).catch(e => console.error("Error sync cliente", e));
    }

    // c. Actualizar Stock en Nube
    sale.items.forEach(item => {
        const p = updatedProducts.find(prod => prod.id === item.productId);
        if (p) {
             api.updateStock(p.id, p.stock).catch(e => console.error("Error stock sync", e));
        }
    });
  };

  const handlePurchase = async (purchase: Purchase) => {
      // 1. Optimistic Stock Update
      const updatedProducts = [...products];
      purchase.items.forEach(item => {
          const idx = updatedProducts.findIndex(p => p.id === item.productId);
          if (idx >= 0) {
              const currentStock = updatedProducts[idx].stock || 0;
              const newStock = currentStock + item.quantity;
              updatedProducts[idx] = { ...updatedProducts[idx], stock: newStock };
              
              // Sync Stock
              api.updateStock(updatedProducts[idx].id, newStock).catch(console.error);
          } else {
              // Create temp product if not exists
              const newProduct: Product = {
                  id: item.productId,
                  name: item.name,
                  price: item.cost * 1.3, // Dummy markup
                  stock: item.quantity,
                  sku: 'N/A', 
                  category: 'General'
              };
              updatedProducts.push(newProduct);
          }
      });
      setProducts(updatedProducts);

      // 2. Sync Purchase
      api.createPurchase(purchase).catch(console.error);
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
      api.updateStock(id, newStock).catch(console.error);
  };

  const handleAddCustomer = (customer: Customer) => {
      setCustomers(prev => [...prev, customer]);
      api.createCustomer(customer).catch(console.error);
  };

  const handleAddUser = (user: User) => {
      setUsers(prev => [...prev, user]);
      api.createUser(user).catch(console.error);
  };

  const handleAddApp = (app: ExternalApp) => {
      setApps(prev => [...prev, app]);
      api.createApp(app).catch(console.error);
  };

  const handleRemoveApp = (id: string) => {
      setApps(prev => prev.filter(a => a.id !== id));
      api.deleteApp(id).catch(console.error);
  };

  // --- RENDERING ---

  if (isLoading) {
      return (
          <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
              <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
              <p className="text-gray-500 font-medium">Cargando Sistema...</p>
          </div>
      );
  }

  if (!currentUser) {
      return <Login onLogin={handleLogin} users={users} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'seller'] },
    { id: 'purchases', label: 'Compras', icon: Package, roles: ['admin', 'warehouse'] },
    { id: 'inventory', label: 'Inventario', icon: Grid, roles: ['admin', 'warehouse'] },
    { id: 'returns', label: 'Devoluciones', icon: RotateCcw, roles: ['admin', 'seller'] },
    { id: 'customers', label: 'Clientes', icon: Users, roles: ['admin', 'seller'] },
    { id: 'users', label: 'Usuarios', icon: UserCircle, roles: ['admin'] },
    { id: 'apps', label: 'Aplicaciones', icon: Grid, roles: ['admin', 'seller', 'warehouse'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  const renderContent = () => {
      switch (currentView) {
          case 'dashboard': return <Dashboard sales={sales} />;
          case 'sales': return <SalesView products={products} customers={customers} onSale={handleNewSale} />;
          case 'purchases': return <PurchasesView onPurchase={handlePurchase} />;
          case 'inventory': return <InventoryView products={products} onUpdateStock={handleUpdateStock} />;
          case 'customers': return <CustomersView customers={customers} onAddCustomer={handleAddCustomer} />;
          case 'users': return <UsersView users={users} onAddUser={handleAddUser} />;
          case 'apps': return <AppLauncher apps={apps} onAddApp={handleAddApp} onRemoveApp={handleRemoveApp} />;
          case 'returns': return <ReturnsView />;
          default: return <Dashboard sales={sales} />;
      }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* SIDEBAR */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
                {sidebarOpen && <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SistemCaja</h1>}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
            
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                {filteredMenu.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as ViewState)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                            currentView === item.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <item.icon size={22} className={`${currentView === item.id ? 'animate-pulse' : ''}`} />
                        {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        
                        {!sidebarOpen && (
                            <div className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {currentUser ? currentUser.username.substring(0,2).toUpperCase() : 'US'}
                    </div>
                    {sidebarOpen && currentUser && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{currentUser.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleLogout}
                    className={`mt-4 w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!sidebarOpen && 'mt-6'}`}
                >
                    <LogOut size={18} />
                    {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
            {/* Top Bar for Sync Status */}
            <div className="bg-white border-b border-gray-200 px-6 py-2 flex justify-between items-center h-14 shrink-0">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    {isSyncing ? (
                        <>
                            <Loader2 size={14} className="animate-spin text-blue-500" />
                            <span>Sincronizando...</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={14} className="text-green-500" />
                            <span>Sistema Actualizado</span>
                        </>
                    )}
                </div>
                {!isSyncing && !isLoading && products.length === 0 && (
                     <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">
                        <WifiOff size={12} />
                        Modo Offline / Sin Datos
                     </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                {renderContent()}
            </div>
            
            <ChatBot />
        </main>
    </div>
  );
};

export default App;