import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, Customer } from '../types';
import { 
    ShoppingCart, Smartphone, CheckCircle, CreditCard, 
    Smartphone as PhoneIcon, Printer, Share2, 
    User, X, MapPin, Mail, Barcode, ScanBarcode, Package
} from 'lucide-react';

interface SalesViewProps {
  products: Product[];
  customers: Customer[];
  onSale: (sale: Sale, customer?: Customer) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ products, customers, onSale }) => {
    // --- ESTADO ---
    const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Datos Completos del Cliente
    const [customerData, setCustomerData] = useState<Customer>({
        id: '',
        name: '',
        phone: '',
        email: '',
        address: ''
    });
    
    const [exchangeRate, setExchangeRate] = useState<number>(260.00);
    const [isEditingRate, setIsEditingRate] = useState(false);
    
    // Pago
    const [paymentTab, setPaymentTab] = useState<'contado' | 'credito'>('contado');
    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo $');

    // Post-Venta
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- EFECTOS DE FOCO ---
    // Mantiene el foco en el buscador a menos que estemos editando datos de cliente
    useEffect(() => {
        if (!showReceipt && !isEditingRate) {
            const timer = setTimeout(() => {
                // Solo enfocar si el usuario no está escribiendo en campos de cliente
                const activeEl = document.activeElement;
                const isCustomerInput = activeEl?.tagName === 'INPUT' && activeEl.getAttribute('placeholder') !== 'Buscar producto o escanear IMEI...';
                
                if (!isCustomerInput && searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [cart, showReceipt]); // Re-enfocar cuando el carrito cambia

    // --- CÁLCULOS ---
    const totalUSD = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const totalBs = totalUSD * exchangeRate;

    // --- ACCIONES ---

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existingItem = prev.find(i => i.product.id === product.id);
            const currentQtyInCart = existingItem ? existingItem.qty : 0;
            const availableStock = Number(product.stock) || 0;

            if (currentQtyInCart + 1 > availableStock) {
                // Usamos alert nativo para bloquear momentáneamente y avisar
                alert(`⚠️ Stock insuficiente para ${product.name}. Disponible: ${availableStock}`);
                return prev;
            }

            if (existingItem) {
                return prev.map(i => i.product.id === product.id ? {...i, qty: i.qty + 1} : i);
            } else {
                return [...prev, {product, qty: 1}];
            }
        });

        // Limpiar búsqueda y recuperar foco inmediatamente
        setSearchTerm('');
        if(searchInputRef.current) searchInputRef.current.focus();
    };

    const removeFromCart = (index: number) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart.splice(index, 1);
            return newCart;
        });
        if(searchInputRef.current) searchInputRef.current.focus();
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evitar comportamientos extraños del navegador
            const term = searchTerm.trim().toLowerCase();
            if(!term) return;

            // 1. Buscar coincidencia exacta (Escáner de Barras / IMEI)
            const exact = products.find(p => 
                String(p.sku).toLowerCase() === term || 
                String(p.id) === term
            );
            
            if (exact) {
                addToCart(exact);
                return;
            }
            
            // 2. Buscar por coincidencia de nombre si no es exacto
            const visible = products.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.sku.toLowerCase().includes(term)
            );
            
            if (visible.length === 1) {
                addToCart(visible[0]);
            } else if (visible.length > 1) {
                alert(`Se encontraron ${visible.length} productos. Por favor escanee el código específico.`);
            } else {
                alert("Producto no encontrado.");
            }
        }
    };

    // Búsqueda de Cliente existente
    const handleCustomerSearch = (id: string) => {
        setCustomerData(prev => ({...prev, id}));
        const existing = customers.find(c => c.id === id);
        if (existing) {
            setCustomerData(existing);
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
        if (paymentTab === 'credito' && !customerData.name) {
            alert("Para ventas a crédito debe registrar el nombre del cliente.");
            return;
        }

        const sale: Sale = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            items: cart.map(i => ({
                productId: i.product.id,
                name: i.product.name,
                quantity: i.qty,
                priceAtSale: i.product.price
            })),
            total: totalUSD,
            paymentMethod: paymentTab === 'credito' ? 'Crédito' : paymentMethod,
            paymentType: paymentTab,
            customerId: customerData.id || 'GENERICO',
            customerName: customerData.name || 'Cliente Casual',
            exchangeRate: exchangeRate
        };

        const customerToSave: Customer | undefined = customerData.name ? {
            ...customerData,
            id: customerData.id || `C-${Date.now()}`
        } : undefined;

        onSale(sale, customerToSave);
        setCompletedSale(sale);
        setShowReceipt(true);
    };

    const resetSale = () => {
        setCart([]);
        setCustomerData({ id: '', name: '', phone: '', email: '', address: '' });
        setSearchTerm('');
        setCompletedSale(null);
        setShowReceipt(false);
        // Forzar foco al reiniciar
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    // --- RENDERIZADO DEL MODAL RECIBO ---
    const renderReceiptModal = () => (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="bg-green-600 p-4 text-center text-white">
                    <CheckCircle size={40} className="mx-auto mb-2"/>
                    <h2 className="text-xl font-bold">¡Venta Registrada!</h2>
                </div>
                <div className="p-6 bg-gray-50 text-center space-y-4">
                    <div className="bg-white p-4 border border-dashed border-gray-300 rounded text-sm text-left">
                        <p className="font-bold text-gray-800 text-center mb-2 text-lg">TICKET DE VENTA</p>
                        <p className="flex justify-between"><span>Cliente:</span> <span className="font-bold">{completedSale?.customerName}</span></p>
                        <p className="flex justify-between"><span>Monto USD:</span> <span className="font-bold">${completedSale?.total.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Monto Bs:</span> <span>Bs. {(completedSale?.total || 0 * exchangeRate).toFixed(2)}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => window.print()} className="py-3 bg-gray-200 rounded-lg font-bold flex items-center justify-center gap-2"><Printer size={18}/> Imprimir</button>
                        <button className="py-3 bg-green-100 text-green-700 rounded-lg font-bold flex items-center justify-center gap-2"><Share2 size={18}/> WhatsApp</button>
                    </div>
                    <button onClick={resetSale} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">Nueva Venta</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 bg-slate-100">
            {showReceipt && renderReceiptModal()}

            {/* IZQUIERDA: ESCANER (SIN CATALOGO) */}
            <div className="flex-[2] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                {/* Header Search */}
                <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
                    <div className="relative flex-1">
                        <ScanBarcode className="absolute left-3 top-3 text-blue-500" size={20}/>
                        <input 
                            ref={searchInputRef}
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all font-medium text-lg placeholder:text-slate-400"
                            placeholder="ESCANEAR IMEI O CÓDIGO AQUÍ..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-500">TASA BCV</span>
                        {isEditingRate ? (
                            <input 
                                className="w-20 bg-gray-50 border border-blue-300 rounded px-2 py-1 text-right font-bold text-lg"
                                autoFocus
                                onBlur={() => setIsEditingRate(false)}
                                value={exchangeRate}
                                onChange={e => setExchangeRate(Number(e.target.value))}
                            />
                        ) : (
                            <button onClick={() => setIsEditingRate(true)} className="font-bold text-xl text-slate-800 hover:text-blue-600">
                                Bs. {exchangeRate}
                            </button>
                        )}
                    </div>
                </div>

                {/* AREA DE ESPERA / PLACEHOLDER (SIN GRID) */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300 bg-slate-50/50">
                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Barcode size={64} className="opacity-50" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-400 mb-2">Listo para Vender</h2>
                    <p className="max-w-md text-slate-400">
                        Use el escáner de código de barras o ingrese el IMEI del producto para agregarlo al carrito.
                    </p>
                    <div className="mt-8 flex gap-4 opacity-50">
                        <div className="flex flex-col items-center">
                            <div className="p-2 bg-white rounded border border-slate-200 mb-1"><Smartphone size={20} /></div>
                            <span className="text-xs font-bold">Escanear</span>
                        </div>
                        <div className="h-px w-10 bg-slate-300 self-center"></div>
                        <div className="flex flex-col items-center">
                            <div className="p-2 bg-white rounded border border-slate-200 mb-1"><ShoppingCart size={20} /></div>
                            <span className="text-xs font-bold">Vender</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DERECHA: CARRITO Y DATOS CLIENTE */}
            <div className="flex-1 max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden h-full">
                
                {/* Total Header */}
                <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total a Pagar</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-bold">${totalUSD.toFixed(2)}</span>
                        <span className="text-sm font-medium opacity-80">USD</span>
                    </div>
                    <p className="text-emerald-400 font-mono mt-1 text-sm font-bold">Bs. {totalBs.toLocaleString('es-VE')}</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* Lista de Items */}
                    <div className="p-4 space-y-3 min-h-[150px]">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-xl py-8">
                                <ShoppingCart size={40} className="mb-2 opacity-50"/>
                                <p className="text-sm font-medium">Carrito Vacío</p>
                                <p className="text-xs mt-1">Escanee un producto para comenzar</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="w-8 h-8 bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold rounded-lg text-slate-700 shrink-0">
                                            {item.qty}
                                        </span>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                                <Barcode size={10} /> {item.product.sku}
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium">${item.product.price} c/u</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pl-2">
                                        <span className="font-bold text-slate-800">${item.product.price * item.qty}</span>
                                        <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full">
                                            <X size={18}/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="h-2 bg-gray-50 border-t border-b border-gray-100 shrink-0"></div>

                    {/* Datos del Cliente Completo */}
                    <div className="p-4 space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos del Cliente</h3>
                        
                        <div className="flex gap-2">
                            <div className="relative flex-[1]">
                                <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input 
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Cédula / RIF"
                                    value={customerData.id}
                                    onChange={e => handleCustomerSearch(e.target.value)}
                                />
                            </div>
                            <div className="relative flex-[2]">
                                <input 
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Nombre Completo"
                                    value={customerData.name}
                                    onChange={e => setCustomerData({...customerData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <PhoneIcon className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input 
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Teléfono"
                                    value={customerData.phone}
                                    onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                                />
                            </div>
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input 
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Email"
                                    value={customerData.email}
                                    onChange={e => setCustomerData({...customerData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input 
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                placeholder="Dirección Fiscal"
                                value={customerData.address}
                                onChange={e => setCustomerData({...customerData, address: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Payment & Action */}
                <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0">
                    <div className="mb-3">
                         <div className="grid grid-cols-3 gap-2">
                            {['Efectivo $', 'Pago Movil', 'Zelle', 'Punto', 'Binance', 'Otro'].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`py-2 text-[10px] uppercase font-bold rounded-lg border transition-all ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20}/> PROCESAR VENTA
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesView;