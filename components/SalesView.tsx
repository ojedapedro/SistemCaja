import React, { useState, useEffect } from 'react';
import { Product, Sale, Customer } from '../types';
import { Search, ShoppingCart, Smartphone, CheckCircle, CreditCard, Banknote, Smartphone as PhoneIcon, Wallet } from 'lucide-react';

interface SalesViewProps {
  products: Product[];
  customers: Customer[];
  onSale: (sale: Sale, customer?: Customer) => void;
}

const EXCHANGE_RATE = 260.00; // Tasa fija basada en la imagen, podría ser dinámica

const SalesView: React.FC<SalesViewProps> = ({ products, customers, onSale }) => {
    const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer>>({ id: '', name: '', phone: '' });
    const [paymentTab, setPaymentTab] = useState<'contado' | 'credito'>('contado');
    const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo $');
    const [observation, setObservation] = useState('');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.includes(searchTerm)
    );
    
    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        const existing = cart.find(i => i.product.id === product.id);
        if (existing) {
            if (existing.qty >= product.stock) return;
            setCart(cart.map(i => i.product.id === product.id ? {...i, qty: i.qty + 1} : i));
        } else {
            setCart([...cart, {product, qty: 1}]);
        }
    };

    const totalUSD = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const totalBs = totalUSD * EXCHANGE_RATE;

    const handleCheckout = () => {
        if (cart.length === 0) return;

        // 1. Prepare Sale Object
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
            paymentMethod: paymentMethod,
            paymentType: paymentTab,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            exchangeRate: EXCHANGE_RATE
        };

        // 2. Prepare Customer Object (if data is provided)
        let customerData: Customer | undefined;
        if (selectedCustomer.id && selectedCustomer.name) {
            customerData = {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                phone: selectedCustomer.phone || '',
                email: '', // Not collected in quick checkout
                address: '' // Not collected in quick checkout
            };
        }

        // 3. Trigger Action
        onSale(sale, customerData);
        
        // 4. Cleanup
        setCart([]);
        setSelectedCustomer({ id: '', name: '', phone: '' });
        setObservation('');
    };

    // Auto-fill customer if ID matches existing
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

    const PaymentButton = ({ name, label }: { name: string, label: string }) => (
        <button 
            onClick={() => setPaymentMethod(name)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all
            ${paymentMethod === name 
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
            <span className="truncate w-full text-center">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-screen max-h-[calc(100vh-2rem)] overflow-hidden bg-gray-50 -m-4 md:-m-8">
            {/* Top Bar */}
            <div className="bg-white px-6 py-3 border-b flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">ACI</div>
                    <div>
                        <h1 className="text-sm font-bold text-blue-800 leading-tight">ACI Movilnet</h1>
                        <p className="text-xs text-gray-500">Punto de Venta v1.0</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Tasa del día</p>
                    <p className="text-xl font-bold text-orange-500">Bs. {EXCHANGE_RATE.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: Product Grid */}
                <div className="w-2/3 p-4 flex flex-col gap-4 overflow-hidden">
                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                        <Search className="text-gray-400 ml-2" size={20} />
                        <input 
                            type="text"
                            placeholder="Escanear Código de Barras / IMEI o Buscar Producto..."
                            className="flex-1 outline-none text-gray-700 text-sm py-1"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-20">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-full"
                                >
                                    <div className="flex justify-center mb-3">
                                        <Smartphone className="w-12 h-12 text-gray-300 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mb-3 truncate">{product.sku}</p>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-400">Precio</p>
                                                <p className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mb-1">Bs.S {(product.price * EXCHANGE_RATE).toLocaleString('es-VE')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Checkout / Cart */}
                <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
                    {/* Header Cart */}
                    <div className="bg-blue-800 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={20} />
                            <h2 className="font-bold">Carrito de Compra</h2>
                        </div>
                        <span className="bg-blue-700 px-2 py-0.5 rounded-full text-xs">{cart.length} Ítems</span>
                    </div>

                    {/* Cart Content Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        
                        {/* Empty State */}
                        {cart.length === 0 && (
                            <div className="text-center py-4 text-gray-400 text-sm border-b border-gray-100 pb-6">
                                El carrito está vacío
                            </div>
                        )}

                        {/* List Items (Small) */}
                        {cart.length > 0 && (
                             <div className="space-y-2 max-h-40 overflow-y-auto mb-4 border-b border-gray-100 pb-2">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                                        <span className="truncate flex-1">{item.product.name}</span>
                                        <span className="font-bold ml-2">${(item.product.price * item.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                             </div>
                        )}

                        {/* Totals */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal USD</span>
                                <span>${totalUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-800 font-bold text-lg">Total a Pagar USD</span>
                                <span className="text-blue-600 font-bold text-2xl">${totalUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Equivalente en Bolívares</span>
                                <span className="font-semibold text-gray-700">Bs.S {totalBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Customer Data */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Datos del Cliente</h3>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <CreditCard className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="123456789"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        value={selectedCustomer.id}
                                        onChange={e => handleCustomerIdChange(e.target.value)}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <PhoneIcon className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        placeholder="Teléfono"
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        value={selectedCustomer.phone}
                                        onChange={e => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">👤</span>
                                <input 
                                    type="text" 
                                    placeholder="Nombre del cliente"
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                    value={selectedCustomer.name}
                                    onChange={e => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Método de Pago</h3>
                            
                            {/* Tabs */}
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setPaymentTab('contado')}
                                    className={`flex-1 py-2 text-sm font-bold ${paymentTab === 'contado' ? 'bg-blue-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Contado
                                </button>
                                <button 
                                    onClick={() => setPaymentTab('credito')}
                                    className={`flex-1 py-2 text-sm font-bold ${paymentTab === 'credito' ? 'bg-blue-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Crédito / Financiamiento
                                </button>
                            </div>

                            {/* Grid Buttons */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <PaymentButton name="Efectivo $" label="Efectivo $" />
                                <PaymentButton name="Efectivo Bs" label="Efectivo Bs" />
                                <PaymentButton name="Efectivo Euro" label="Efectivo Euro" />
                                <PaymentButton name="Pago Móvil" label="Pago Móvil" />
                                <PaymentButton name="Transferencia" label="Transferencia" />
                                <PaymentButton name="Tarjeta Débito" label="Tarjeta Débito" />
                                <PaymentButton name="Tarjeta Crédito" label="Tarjeta Crédito" />
                                <PaymentButton name="Zelle" label="Zelle" />
                                <PaymentButton name="Binance" label="Binance" />
                            </div>
                        </div>

                        {/* Observations */}
                        <input 
                            type="text"
                            placeholder="Observaciones (Opcional)"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                            value={observation}
                            onChange={e => setObservation(e.target.value)}
                        />
                    </div>

                    {/* Footer Button */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                        <button 
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={20} />
                            Procesar Venta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesView;