import React, { useState } from 'react';
import { Purchase, Product } from '../types';
import { Search, Plus, Trash2, Save, X } from 'lucide-react';

interface PurchasesViewProps {
  onPurchase: (purchase: Purchase) => void;
}

interface PurchaseItem {
    id: string; // Temporary ID for the list
    imei: string;
    category: string;
    description: string;
    quantity: number;
    cost: number;
}

const PurchasesView: React.FC<PurchasesViewProps> = ({ onPurchase }) => {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  
  // Header Info
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Item Input State
  const [imei, setImei] = useState('');
  const [category, setCategory] = useState('Celular');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(''); // String to handle empty state easily

  // List State
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const handleAddItem = () => {
    if (!description || !cost) return;

    const newItem: PurchaseItem = {
        id: Date.now().toString(),
        imei: imei || 'N/A',
        category,
        description,
        quantity: Number(quantity),
        cost: Number(cost)
    };

    setItems([...items, newItem]);
    
    // Reset inputs
    setImei('');
    setDescription('');
    setQuantity(1);
    setCost('');
  };

  const handleRemoveItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
  };

  const total = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  const handleSave = () => {
      if (items.length === 0 || !supplier || !invoiceNumber) {
          alert("Por favor complete los datos de factura y agregue al menos un producto.");
          return;
      }

      const purchase: Purchase = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          supplier,
          items: items.map(i => ({
              productId: i.id, // In a real scenario this might be linked to existing product ID
              name: i.description,
              quantity: i.quantity,
              cost: i.cost
          })),
          total
      };

      onPurchase(purchase);
      
      // Reset Form
      setItems([]);
      setSupplier('');
      setInvoiceNumber('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 -m-4 md:-m-8">
        {/* Top Header */}
        <div className="bg-[#0f172a] text-white px-6 py-3 border-b border-gray-800 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs">ACI</div>
                <div>
                    <h1 className="text-lg font-bold leading-tight">ACI Movilnet - Recepción</h1>
                </div>
            </div>
            <div className="bg-white text-gray-800 px-3 py-1 rounded font-bold text-sm">
                {new Date().toLocaleDateString('es-ES')}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Search Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-blue-600 font-bold mb-2">Actualizar Estado / Editar Recepción</h2>
                <div className="flex gap-0 mb-1">
                    <input 
                        type="text" 
                        placeholder="Ingresa N° Factura o ID..." 
                        className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 outline-none focus:border-blue-500"
                        value={invoiceSearch}
                        onChange={e => setInvoiceSearch(e.target.value)}
                    />
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-r-md font-medium flex items-center gap-2">
                        <Search size={18} /> Buscar
                    </button>
                </div>
                <p className="text-xs text-gray-500">Busca la factura, cambia el estado a "Procesado" y guarda.</p>
            </div>

            {/* Invoice Data */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700 text-sm">Datos de Factura (COMPRAS)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Proveedor</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Número de Factura</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Products Registration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Blue Header */}
                <div className="bg-blue-600 px-6 py-3 flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-white/50"></div>
                    <div className="w-0.5 h-4 bg-white/50"></div>
                    <div className="w-0.5 h-4 bg-white/50"></div>
                    <h3 className="font-bold text-white">Registro de Productos</h3>
                </div>

                {/* Input Row */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-3">
                            <label className="block text-xs font-bold text-gray-600 mb-1">IMEI / Serial</label>
                            <input 
                                type="text" 
                                placeholder="Escanea..." 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={imei}
                                onChange={e => setImei(e.target.value)}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                            <select 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="Celular">Celular</option>
                                <option value="Accesorio">Accesorio</option>
                                <option value="Repuesto">Repuesto</option>
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Producto / Descripción</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Samsung A12" 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cant.</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Precio Unit.</label>
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                value={cost}
                                onChange={e => setCost(e.target.value)}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-1">
                            <button 
                                onClick={handleAddItem}
                                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 rounded flex items-center justify-center font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-800 font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-10">#</th>
                                <th className="px-4 py-3">IMEI</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3 w-1/3">Producto</th>
                                <th className="px-4 py-3 text-center">Cant.</th>
                                <th className="px-4 py-3 text-right">Precio Unit.</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center w-10">X</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                        Escanea un producto para comenzar
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-gray-600">{item.imei}</td>
                                        <td className="px-4 py-3">{item.category}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.description}</td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">${item.cost.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold">${(item.cost * item.quantity).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                                <td colSpan={6} className="px-4 py-3 text-right font-bold text-gray-800">TOTAL FACTURA:</td>
                                <td className="px-4 py-3 text-right font-bold text-lg text-black">${total.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-4 pb-6">
                <button 
                    onClick={() => { setItems([]); setSupplier(''); setInvoiceNumber(''); }}
                    className="px-6 py-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded font-medium flex items-center gap-2"
                >
                    <X size={18} /> Cancelar / Limpiar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold shadow-sm flex items-center gap-2"
                >
                    <Save size={18} /> Guardar Recepción
                </button>
            </div>

        </div>
    </div>
  );
};

export default PurchasesView;