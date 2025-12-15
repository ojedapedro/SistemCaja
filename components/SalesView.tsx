import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, Customer } from '../types';
import { 
    Search, ShoppingCart, Smartphone, CheckCircle, CreditCard, 
    Smartphone as PhoneIcon, Printer, Share2, Download, 
    RefreshCw, Calendar, Edit2, FileText, User, DollarSign, X,
    Barcode
} from 'lucide-react';

interface SalesViewProps {
  products: Product[];
  customers: Customer[];
  onSale: (sale: Sale, customer?: Customer) => void;
}

// Helper para calcular fechas de pago (15 y 30)
const calculatePaymentDates = (startDate: Date, installments: number) => {
    const dates: string[] = [];
    let current = new Date(startDate);
    
    if (current.getDate() < 15) {
        current.setDate(15);
    } else if (current.getDate() < 30) {
        current.setDate(30); 
    } else {
        current.setMonth(current.getMonth() + 1);
        current.setDate(15);
    }

    for (let i = 0; i < installments; i++) {
        const y = current.getFullYear();
        const m = current.getMonth();
        const d = current.getDate();
        
        if (d > 28) {
             const lastDay = new Date(y, m + 1, 0).getDate();
             if (d > lastDay) current.setDate(lastDay);
        }

        dates.push(current.toLocaleDateString('es-ES'));

        if (current.getDate() <= 15) {
            const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
            current.setDate(lastDayOfMonth >= 30 ? 30 : lastDayOfMonth); 
        } else {
            current.setMonth(current.getMonth() + 1);
            current.setDate(15);
        }
    }
    return dates;
};

const SalesView: React.FC<SalesViewProps> = ({ products, customers, onSale }) => {
    // Estado Global de Venta
    const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer>>({ id: '', name: '', phone: '' });
    const [exchangeRate, setExchangeRate] = useState<number>(260.00);
    const [isEditingRate, setIsEditingRate] = useState(false);
    
    // Estado de Pago
    const [paymentTab, setPaymentTab] = useState<'contado' | 'credito'>('contado');
    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo $');
    const [observation, setObservation] = useState('');

    // Estado Post-Venta (Recibo)
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filtrado visual (solo para mostrar en pantalla, NO afecta la lógica de escaneo)
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(p.sku).includes(searchTerm)
    );

    // --- CÁLCULOS ---
    const totalUSD = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const totalBs = totalUSD * exchangeRate;

    // Lógica de Financiamiento
    const creditPlan = React.useMemo(() => {
        if (paymentTab !== 'credito') return null;
        const initialPayment = totalUSD * 0.40; // 40% Inicial
        const remaining = totalUSD - initialPayment;
        const installmentsCount = 6;
        const installmentAmount = remaining / installmentsCount;
        const dates = calculatePaymentDates(new Date(), installmentsCount);

        return {
            initialPayment,
            remaining,
            installmentAmount,
            dates
        };
    }, [totalUSD, paymentTab]);
    
    // --- ACCIONES ---

    const addToCart = (product: Product) => {
        const availableStock = Number(product.stock || 0);
        const productSku = String(product.sku).trim(); // Normalizamos SKU

        if (availableStock <= 0) {
            alert(`El producto "${product.name}" no tiene stock disponible.`);
            setSearchTerm(''); 
            return;
        }

        // CAMBIO CRÍTICO: Buscar existencia por SKU (IMEI), NO por ID.
        // Esto permite que productos con diferente ID pero mismo SKU se agrupen (Accesorios)
        // Y productos con diferente SKU pero mismo ID/Nombre se traten distinto (Teléfonos/SIMs)
        const existingIndex = cart.findIndex(i => String(i.product.sku).trim() === productSku);
        
        if (existingIndex >= 0) {
            // El SKU ya está en el carrito (Ej: Un accesorio escaneado 2 veces)
            const currentQty = cart[existingIndex].qty;

            // Verificamos stock
            if (currentQty + 1 > availableStock) {
                 alert(`Límite de stock alcanzado para este ítem (IMEI/SKU: ${productSku}).\n\nEn carrito: ${currentQty}\nDisponible: ${availableStock}`);
                 setSearchTerm('');
                 return;
            }

            // Actualizamos cantidad de ESE sku específico
            const newCart = [...cart];
            newCart[existingIndex].qty += 1;
            setCart(newCart);
        } else {
            // Es un SKU nuevo en el carrito (Ej: Un IMEI diferente, aunque sea el mismo modelo de teléfono)
            setCart([...cart, {product, qty: 1}]);
        }
    };

    const removeFromCart = (productSku: string) => {
        // CAMBIO: Remover basado en SKU para ser consistente
        setCart(cart.filter(i => i.product.sku !== productSku));
    };

    // --- LÓGICA DE ESCANEO ESTRICTA ---
    const processSearch = () => {
        const term = searchTerm.trim();
        if (!term) return;

        // 1. BÚSQUEDA EXACTA POR SKU (IMEI)
        const exactImeiMatch = products.find(p => String(p.sku).trim() === term);

        if (exactImeiMatch) {
            addToCart(exactImeiMatch);
            setSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 10);
            return;
        }
        
        // 2. BÚSQUEDA EXACTA POR ID (Fallback)
        const exactIdMatch = products.find(p => String(p.id).trim() === term);
        if (exactIdMatch) {
            addToCart(exactIdMatch);
            setSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 10);
            return;
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        processSearch();
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            processSearch();
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        
        if (paymentTab === 'credito' && (!selectedCustomer.name || !selectedCustomer.phone)) {
            alert("Para ventas a crédito es obligatorio el nombre y teléfono del cliente.");
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
            paymentMethod: paymentTab === 'credito' ? 'Financiamiento' : paymentMethod,
            paymentType: paymentTab,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name || 'Cliente Casual',
            exchangeRate: exchangeRate
        };

        let customerData: Customer | undefined;
        if (selectedCustomer.id && selectedCustomer.name) {
            customerData = {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                phone: selectedCustomer.phone || '',
                email: '',
                address: ''
            };
        }

        onSale(sale, customerData);
        setCompletedSale(sale);
        setShowReceipt(true);
    };

    const handleNewSale = () => {
        setCart([]);
        setSelectedCustomer({ id: '', name: '', phone: '' });
        setObservation('');
        setCompletedSale(null);
        setShowReceipt(false);
        setPaymentTab('contado');
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handleCustomerIdChange = (id: string) => {
        const existing = customers.find(c => c.id === id || c.id.includes(id));
        if (existing) {
            setSelectedCustomer({
                id: existing.id,
                name: existing.name,
                phone: existing.phone
            });
        } else {
            setSelectedCustomer(prev => ({ ...prev, id }));
        }
    };

    // --- UTILS ---
    const handlePrint = () => window.print();

    const handleWhatsApp = () => {
        if (!completedSale) return;
        
        const isCredit = completedSale.paymentType === 'credito';
        let msg = `*COMPROBANTE DE PAGO - ACI MOVILNET*\n`;
        msg += `📅 Fecha: ${new Date(completedSale.date).toLocaleDateString()}\n`;
        msg += `🧾 N° Recibo: ${completedSale.id.slice(-6)}\n`;
        msg += `👤 Cliente: ${completedSale.customerName}\n\n`;
        
        msg += `*DETALLE DE COMPRA:*\n`;
        completedSale.items.forEach(item => {
            msg += `• ${item.quantity}x ${item.name} - $${item.priceAtSale}\n`;
        });
        
        msg += `\n💰 *TOTAL: $${completedSale.total.toFixed(2)}*\n`;
        msg += `💵 Tasa Cambio: Bs. ${completedSale.exchangeRate?.toFixed(2)}\n`;
        
        if (isCredit && creditPlan) {
            msg += `\n*PLAN DE FINANCIAMIENTO:*\n`;
            msg += `🔹 Inicial (40%): $${creditPlan.initialPayment.toFixed(2)}\n`;
            msg += `🔹 Restante en 6 cuotas de: $${creditPlan.installmentAmount.toFixed(2)}\n`;
            msg += `📅 Fechas de pago: 15 y 30 de cada mes.\n`;
        } else {
             msg += `💳 Método: ${completedSale.paymentMethod}\n`;
        }
        msg += `\n¡Gracias por su compra!`;

        const phone = selectedCustomer.phone?.replace(/\D/g, '') || '';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    // --- COMPONENTS ---

    const PaymentButton = ({ name, label }: { name: string, label: string }) => (
        <button 
            type="button" 
            onClick={() => setPaymentMethod(name)}
            className={`flex flex-col items-center justify-center py-3 rounded-lg border text-xs font-semibold transition-all duration-200
            ${paymentMethod === name 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'}`}
        >
            <span className="truncate w-full text-center">{label}</span>
        </button>
    );

    // --- MODAL RECIBO ---
    if (showReceipt && completedSale) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-green-600 p-4 text-white text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle size={28} />
                        </div>
                        <h2 className="font-bold text-lg">¡Venta Exitosa!</h2>
                        <p className="text-sm opacity-90">Recibo generado correctamente</p>
                    </div>

                    {/* Receipt Preview */}
                    <div className="p-6 overflow-y-auto bg-gray-50 flex-1 custom-scrollbar">
                        <div id="printable-receipt" className="bg-white p-4 shadow-sm border border-gray-200 text-center text-gray-800 font-mono text-sm leading-relaxed">
                            <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                                <h1 className="text-xl font-bold uppercase tracking-wider">ACI Movilnet</h1>
                                <p className="text-xs text-gray-500">RIF: J-12345678-9</p>
                                <p className="text-xs">Centro Comercial, Local 5</p>
                            </div>

                            <div className="text-left space-y-1 mb-4 text-xs">
                                <p><span className="font-bold">Recibo:</span> #{completedSale.id.slice(-6)}</p>
                                <p><span className="font-bold">Fecha:</span> {new Date(completedSale.date).toLocaleDateString()}</p>
                                <p><span className="font-bold">Cliente:</span> {completedSale.customerName}</p>
                            </div>

                            <table className="w-full text-xs text-left border-t border-b border-dashed border-gray-300 mb-4">
                                <thead className="font-bold">
                                    <tr>
                                        <th className="py-2">Cant</th>
                                        <th>Item</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dashed divide-gray-200">
                                    {completedSale.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-1">{item.quantity}</td>
                                            <td className="py-1 truncate max-w-[120px]">{item.name}</td>
                                            <td className="py-1 text-right">${(item.priceAtSale * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="text-right space-y-1">
                                <p className="text-xl font-bold">TOTAL: ${completedSale.total.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Tasa: Bs. {completedSale.exchangeRate?.toFixed(2)}</p>
                                <p className="font-bold text-gray-700">Bs. {(completedSale.total * (completedSale.exchangeRate || 0)).toLocaleString('es-VE')}</p>
                            </div>

                             {/* Detalle Financiamiento en Recibo */}
                             {completedSale.paymentType === 'credito' && creditPlan && (
                                <div className="mt-4 text-left bg-gray-50 p-2 rounded border border-dashed border-gray-300 text-xs">
                                    <h4 className="font-bold uppercase mb-1">Financiamiento</h4>
                                    <div className="flex justify-between">
                                        <span>Inicial (40%):</span>
                                        <span>${creditPlan.initialPayment.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold mt-1">
                                        <span>Cuotas (x6):</span>
                                        <span>${creditPlan.installmentAmount.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 text-center">Fechas: 15 y 30 de cada mes</p>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <p className="text-[10px] text-gray-400">Gracias por su compra</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-white border-t space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handlePrint}
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                            >
                                <Printer size={18} /> Imprimir
                            </button>
                            <button 
                                onClick={handleWhatsApp}
                                className="bg-green-100 text-green-700 hover:bg-green-200 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                            >
                                <Share2 size={18} /> WhatsApp
                            </button>
                        </div>
                        <button 
                            onClick={handleNewSale}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} /> Nueva Venta
                        </button>
                    </div>
                </div>
                 {/* Print Styles (Hidden in UI) */}
                 <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-receipt, #printable-receipt * { visibility: visible; }
                        #printable-receipt { 
                            position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 10px; border: none; box-shadow: none; 
                        }
                    }
                `}</style>
            </div>
        );
    }

    // --- MAIN LAYOUT ---
    return (
        <div className="h-full flex flex-col -m-4 md:-m-8 bg-slate-100">
            {/* 1. TOP BAR (Floating style) */}
            <div className="px-6 py-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            ACI
                        </div>
                        <div className="hidden md:block">
                            <h1 className="font-bold text-slate-800 text-lg leading-tight">Punto de Venta</h1>
                            <p className="text-xs text-slate-400">Caja Principal</p>
                        </div>
                    </div>

                    {/* Tasa de Cambio (Centrada) */}
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa BCV</span>
                        <div className="flex items-center gap-1">
                            <span className="text-orange-500 font-bold text-xl">Bs.</span>
                            {isEditingRate ? (
                                <input 
                                    type="number" 
                                    className="w-24 bg-white border border-orange-300 rounded px-2 py-0.5 text-right font-bold text-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                    value={exchangeRate}
                                    onChange={e => setExchangeRate(Number(e.target.value))}
                                    onBlur={() => setIsEditingRate(false)}
                                    autoFocus
                                />
                            ) : (
                                <span 
                                    className="text-xl font-bold text-slate-800 cursor-pointer hover:text-orange-600 transition-colors"
                                    onClick={() => setIsEditingRate(true)}
                                >
                                    {exchangeRate.toFixed(2)}
                                </span>
                            )}
                            <Edit2 size={14} className="text-slate-300 hover:text-orange-400 cursor-pointer transition-colors" onClick={() => setIsEditingRate(true)}/>
                        </div>
                    </div>

                    <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400">Usuario</p>
                        <p className="text-sm font-bold text-slate-700">Vendedor</p>
                    </div>
                </div>
            </div>

            {/* 2. WORKSPACE (2 Columns, Centered Layout) */}
            <div className="flex-1 overflow-hidden px-6 pb-6 pt-2 flex gap-6">
                
                {/* LEFT PANEL: PRODUCTS */}
                <div className="flex-[2] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Search Header */}
                    <div className="p-4 border-b border-slate-100 bg-white z-10">
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            
                            {/* FORMULARIO CRÍTICO: Previene el reload por defecto al presionar ENTER en escáneres */}
                            <form onSubmit={handleSearchSubmit}>
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Escanear IMEI o buscar producto..."
                                    className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none font-medium"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    autoComplete="off"
                                    autoFocus
                                />
                            </form>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden"
                                >
                                    {/* Stock Badge */}
                                    <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {product.stock} un.
                                    </div>

                                    <div className="flex flex-col items-center text-center mt-2 mb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors mb-3">
                                            <Smartphone size={24} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="font-bold text-slate-700 text-sm leading-snug line-clamp-2">{product.name}</h3>
                                        <p className="text-xs text-slate-400 font-mono mt-1 break-all">{product.sku}</p>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-slate-50">
                                        <div className="flex justify-between items-end">
                                            <div className="text-left">
                                                <p className="text-lg font-bold text-blue-600">${product.price}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 font-medium">Bs.</p>
                                                <p className="text-xs font-bold text-slate-600">{(product.price * exchangeRate).toLocaleString('es-VE', {maximumFractionDigits: 0})}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: CART (Sidebar Style) */}
                <div className="flex-1 max-w-md flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
                    
                    {/* CART HEADER: TOTALS */}
                    <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShoppingCart size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium mb-1">Total a Pagar</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold tracking-tight">${totalUSD.toFixed(2)}</span>
                                <span className="text-sm text-slate-400">USD</span>
                            </div>
                            <p className="text-lg text-emerald-400 font-medium mt-1">
                                Bs. {totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                    </div>

                    {/* CART BODY: ITEMS & INPUTS */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        
                        {/* 1. Items List */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carrito ({cart.length})</h3>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 font-medium">Limpiar</button>
                                )}
                            </div>
                            
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                    <ShoppingCart className="mx-auto mb-2 opacity-50" size={24} />
                                    <p className="text-sm">Escanea o selecciona productos</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {cart.map((item, idx) => (
                                        <div key={item.product.sku} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="bg-white text-slate-700 w-6 h-6 flex items-center justify-center rounded text-xs font-bold border border-slate-200 shadow-sm">{item.qty}</span>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{item.product.name}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        ${item.product.price}/u <span className="text-gray-400">| <span className="font-mono">{item.product.sku}</span></span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-700 text-sm">${(item.product.price * item.qty).toFixed(2)}</span>
                                                <button onClick={() => removeFromCart(item.product.sku)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Customer Info */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</h3>
                            <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                                <div className="flex items-center border-b border-slate-100">
                                    <div className="p-2 text-slate-400"><CreditCard size={16}/></div>
                                    <input 
                                        type="text" 
                                        placeholder="Cédula / RIF"
                                        className="w-full p-2 text-sm outline-none text-slate-700 font-medium placeholder:font-normal"
                                        value={selectedCustomer.id}
                                        onChange={e => handleCustomerIdChange(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center border-b border-slate-100">
                                    <div className="p-2 text-slate-400"><User size={16}/></div>
                                    <input 
                                        type="text" 
                                        placeholder="Nombre del Cliente"
                                        className="w-full p-2 text-sm outline-none text-slate-700 font-medium placeholder:font-normal"
                                        value={selectedCustomer.name}
                                        onChange={e => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <div className="p-2 text-slate-400"><PhoneIcon size={16}/></div>
                                    <input 
                                        type="text" 
                                        placeholder="Teléfono"
                                        className="w-full p-2 text-sm outline-none text-slate-700 font-medium placeholder:font-normal"
                                        value={selectedCustomer.phone}
                                        onChange={e => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment Method */}
                        <div className="space-y-3">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setPaymentTab('contado')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentTab === 'contado' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Contado
                                </button>
                                <button 
                                    onClick={() => setPaymentTab('credito')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${paymentTab === 'credito' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Crédito
                                </button>
                            </div>

                            {paymentTab === 'contado' ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <PaymentButton name="Efectivo $" label="Efec. $" />
                                    <PaymentButton name="Efectivo Bs" label="Efec. Bs" />
                                    <PaymentButton name="Pago Móvil" label="Pago Móvil" />
                                    <PaymentButton name="Tarjeta" label="Tarjeta" />
                                    <PaymentButton name="Zelle" label="Zelle" />
                                    <PaymentButton name="Binance" label="Binance" />
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-blue-800">Inicial (40%):</span>
                                        <span className="text-sm font-bold text-blue-900">${creditPlan?.initialPayment.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-blue-700 mb-2">
                                        Saldo a financiar: <span className="font-bold">${creditPlan?.remaining.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-blue-200">
                                        <p className="text-[10px] text-blue-600 font-bold mb-1">6 Cuotas Quincenales de:</p>
                                        <p className="text-lg font-bold text-blue-900">${creditPlan?.installmentAmount.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input 
                            type="text"
                            placeholder="Observaciones..."
                            className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-blue-500 bg-transparent text-slate-600"
                            value={observation}
                            onChange={e => setObservation(e.target.value)}
                        />
                    </div>

                    {/* FOOTER BUTTON */}
                    <div className="p-5 bg-white border-t border-slate-100">
                        <button 
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-3 transition-all transform active:scale-95"
                        >
                            <CheckCircle size={20} className="text-blue-200" />
                            {paymentTab === 'contado' ? 'Cobrar Total' : 'Procesar Crédito'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesView;