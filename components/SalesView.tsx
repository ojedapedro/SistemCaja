import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, Customer } from '../types';
import { 
    Search, ShoppingCart, Smartphone, CheckCircle, CreditCard, 
    Smartphone as PhoneIcon, Printer, Share2, 
    RefreshCw, Edit2, User, X, AlertCircle
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
    const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer>>({ id: '', name: '', phone: '' });
    const [exchangeRate, setExchangeRate] = useState<number>(260.00);
    const [isEditingRate, setIsEditingRate] = useState(false);
    
    // Pago
    const [paymentTab, setPaymentTab] = useState<'contado' | 'credito'>('contado');
    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo $');
    const [observation, setObservation] = useState('');

    // Post-Venta
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- CÁLCULOS ---
    const totalUSD = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const totalBs = totalUSD * exchangeRate;

    // --- ACCIONES ---

    const addToCart = (product: Product) => {
        // Validación de Stock
        const existingItem = cart.find(i => i.product.id === product.id);
        const currentQtyInCart = existingItem ? existingItem.qty : 0;

        if (currentQtyInCart + 1 > product.stock) {
            alert("⚠️ Stock insuficiente para agregar más unidades.");
            return;
        }

        if (existingItem) {
            setCart(cart.map(i => i.product.id === product.id ? {...i, qty: i.qty + 1} : i));
        } else {
            setCart([...cart, {product, qty: 1}]);
        }
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const term = searchTerm.trim().toLowerCase();
            if(!term) return;

            // Búsqueda exacta primero (IMEI/SKU)
            const exact = products.find(p => p.sku.toLowerCase() === term || p.id === term);
            if (exact) {
                addToCart(exact);
                setSearchTerm('');
                return;
            }
            // Si no es exacta, no hacemos nada con Enter para no agregar items random
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
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
            customerId: selectedCustomer.id || 'GENERICO',
            customerName: selectedCustomer.name || 'Cliente Casual',
            exchangeRate: exchangeRate
        };

        const customerToSave = selectedCustomer.id && selectedCustomer.name ? {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone || '',
            email: '',
            address: ''
        } : undefined;

        onSale(sale, customerToSave);
        setCompletedSale(sale);
        setShowReceipt(true);
    };

    const resetSale = () => {
        setCart([]);
        setSelectedCustomer({ id: '', name: '', phone: '' });
        setSearchTerm('');
        setCompletedSale(null);
        setShowReceipt(false);
        if(searchInputRef.current) searchInputRef.current.focus();
    };

    // --- RENDERIZADO DEL MODAL RECIBO ---
    const renderReceiptModal = () => (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-green-600 p-4 text-center text-white">
                    <CheckCircle size={40} className="mx-auto mb-2"/>
                    <h2 className="text-xl font-bold">¡Venta Exitosa!</h2>
                </div>
                <div className="p-6 bg-gray-50 text-center space-y-4">
                    <div className="bg-white p-4 border border-dashed border-gray-300 rounded text-sm">
                        <p className="font-bold text-gray-800 text-lg mb-2">ACI MOVILNET</p>
                        <p>Total: <span className="font-bold text-xl">${completedSale?.total.toFixed(2)}</span></p>
                        <p className="text-gray-500">Bs. {(completedSale?.total || 0 * exchangeRate).toFixed(2)}</p>
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

    // Filter products for grid
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 bg-slate-100">
            {showReceipt && renderReceiptModal()}

            {/* IZQUIERDA: CATÁLOGO */}
            <div className="flex-[2] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Search */}
                <div className="p-4 border-b border-slate-100 flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                        <input 
                            ref={searchInputRef}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Buscar producto o escanear IMEI..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-gray-400">TASA BCV</span>
                        {isEditingRate ? (
                            <input 
                                className="w-16 bg-white border border-blue-300 rounded px-1 text-right font-bold"
                                autoFocus
                                onBlur={() => setIsEditingRate(false)}
                                value={exchangeRate}
                                onChange={e => setExchangeRate(Number(e.target.value))}
                            />
                        ) : (
                            <span onClick={() => setIsEditingRate(true)} className="font-bold text-lg cursor-pointer">Bs. {exchangeRate}</span>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => {
                            const noStock = p.stock <= 0;
                            return (
                                <button 
                                    key={p.id} 
                                    disabled={noStock}
                                    onClick={() => addToCart(p)}
                                    className={`relative flex flex-col items-center p-4 bg-white rounded-xl border transition-all
                                        ${noStock ? 'opacity-60 grayscale border-gray-100' : 'hover:border-blue-400 hover:shadow-md border-gray-200'}
                                    `}
                                >
                                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${noStock ? 'bg-gray-200' : 'bg-green-100 text-green-700'}`}>
                                        {p.stock}
                                    </span>
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                        <Smartphone size={24}/>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 text-center line-clamp-2 leading-tight">{p.name}</p>
                                    <p className="mt-2 text-lg font-bold text-blue-600">${p.price}</p>
                                    {noStock && <div className="absolute inset-0 flex items-center justify-center bg-white/50 font-bold text-red-500 text-xs">AGOTADO</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* DERECHA: CARRITO */}
            <div className="flex-1 max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
                <div className="bg-slate-900 text-white p-6">
                    <p className="text-slate-400 text-xs font-bold uppercase">Total a Pagar</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">${totalUSD.toFixed(2)}</span>
                        <span className="text-sm">USD</span>
                    </div>
                    <p className="text-emerald-400 font-mono mt-1">Bs. {totalBs.toLocaleString('es-VE')}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Lista Items */}
                    <div className="space-y-2">
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-300 border-2 border-dashed rounded-xl">
                                <ShoppingCart className="mx-auto mb-2"/>
                                <p>Carrito Vacío</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="w-6 h-6 bg-white border flex items-center justify-center text-xs font-bold rounded">{item.qty}</span>
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">${item.product.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">${item.product.price * item.qty}</span>
                                        <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cliente */}
                    <div className="bg-white border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <User size={16} className="text-gray-400"/>
                            <input 
                                className="flex-1 text-sm outline-none" 
                                placeholder="Cédula / ID Cliente"
                                value={selectedCustomer.id}
                                onChange={e => {
                                    const val = e.target.value;
                                    setSelectedCustomer(prev => ({...prev, id: val}));
                                    const found = customers.find(c => c.id === val);
                                    if(found) setSelectedCustomer(found);
                                }}
                            />
                        </div>
                        <input 
                            className="w-full text-sm outline-none px-6" 
                            placeholder="Nombre Cliente" 
                            value={selectedCustomer.name}
                            onChange={e => setSelectedCustomer(prev => ({...prev, name: e.target.value}))}
                        />
                    </div>

                    {/* Metodo Pago */}
                    <div className="grid grid-cols-3 gap-2">
                        {['Efectivo $', 'Pago Movil', 'Zelle', 'Tarjeta', 'Binance', 'Otro'].map(m => (
                            <button 
                                key={m}
                                onClick={() => setPaymentMethod(m)}
                                className={`py-2 text-xs font-bold rounded border ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-white border-t">
                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20}/> COBRAR TOTAL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesView;