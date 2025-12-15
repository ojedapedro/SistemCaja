import React, { useState, useRef } from 'react';
import { Purchase } from '../types';
import { Search, Plus, Trash2, Save, X, Printer, CheckCircle, FileText } from 'lucide-react';

interface PurchasesViewProps {
  onPurchase: (purchase: Purchase) => void;
}

interface PurchaseItem {
    id: string;
    imei: string;
    category: string;
    description: string;
    quantity: number;
    cost: number;
}

const PurchasesView: React.FC<PurchasesViewProps> = ({ onPurchase }) => {
  // Header Info
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Item Input State
  const [imei, setImei] = useState('');
  const [category, setCategory] = useState('Celular');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState('');

  // List State
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Post-Save State (Receipt)
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);

  // Refs for UX (Enter key navigation)
  const imeiRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    if (!description || !cost) {
        alert("Debe ingresar al menos la descripción y el costo del producto.");
        return;
    }

    const newItem: PurchaseItem = {
        id: Date.now().toString(),
        imei: imei || 'N/A',
        category,
        description,
        quantity: Number(quantity),
        cost: Number(cost)
    };

    setItems([...items, newItem]);
    
    // Reset inputs but keep category
    setImei('');
    setDescription('');
    setQuantity(1);
    setCost('');
    
    // Return focus to first input
    imeiRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (nextRef && nextRef.current) {
              nextRef.current.focus();
          } else {
              handleAddItem();
          }
      }
  };

  const handleRemoveItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
  };

  const total = items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  const handleSave = () => {
      if (items.length === 0 || !supplier || !invoiceNumber) {
          alert("Por favor complete los datos de Proveedor, N° Factura y agregue productos.");
          return;
      }

      const purchase: Purchase = {
          id: invoiceNumber, // Usamos el número de factura como ID visual o generamos uno único
          date: new Date().toISOString(),
          supplier,
          items: items.map(i => ({
              productId: i.id, 
              name: i.description,
              quantity: i.quantity,
              cost: i.cost
          })),
          total
      };

      onPurchase(purchase);
      setCompletedPurchase(purchase);
      setShowReceipt(true);
      
      // Clean internal state (modal is now open with the data)
      setItems([]);
      setSupplier('');
      setInvoiceNumber('');
  };

  const handlePrint = () => {
      window.print();
  };

  const handleCloseReceipt = () => {
      setShowReceipt(false);
      setCompletedPurchase(null);
  };

  // --- RENDER COMPROBANTE DE RECEPCIÓN (MODAL) ---
  if (showReceipt && completedPurchase) {
      return (
          <div className="fixed inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-300" />
                          <h2 className="font-bold text-lg">Recepción Registrada</h2>
                      </div>
                      <button onClick={handleCloseReceipt} className="text-blue-100 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Printable Area */}
                  <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">
                      <div id="reception-receipt" className="bg-white p-6 shadow-sm border border-gray-200 text-sm">
                          {/* Header Recibo */}
                          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                              <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-800">COMPROBANTE DE RECEPCIÓN</h1>
                              <p className="text-gray-500">ACI Movilnet - Control de Inventario</p>
                              <p className="text-xs text-gray-400 mt-1">Fecha: {new Date(completedPurchase.date).toLocaleString()}</p>
                          </div>

                          {/* Info Proveedor */}
                          <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700">
                              <div>
                                  <p className="font-bold text-xs uppercase text-gray-400">Proveedor</p>
                                  <p className="font-bold">{completedPurchase.supplier}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-xs uppercase text-gray-400">N° Factura / Ref</p>
                                  <p className="font-mono font-bold text-lg">{completedPurchase.id}</p>
                              </div>
                          </div>

                          {/* Tabla Items */}
                          <table className="w-full text-xs mb-6">
                              <thead>
                                  <tr className="border-b border-gray-300">
                                      <th className="text-left py-2">Cant</th>
                                      <th className="text-left py-2">Descripción</th>
                                      <th className="text-right py-2">Costo U.</th>
                                      <th className="text-right py-2">Total</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {completedPurchase.items.map((item, idx) => (
                                      <tr key={idx}>
                                          <td className="py-2">{item.quantity}</td>
                                          <td className="py-2 font-medium">{item.name}</td>
                                          <td className="py-2 text-right">${item.cost.toFixed(2)}</td>
                                          <td className="py-2 text-right">${(item.cost * item.quantity).toFixed(2)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                              <tfoot className="border-t-2 border-gray-800">
                                  <tr>
                                      <td colSpan={3} className="pt-2 text-right font-bold text-sm">TOTAL COSTO:</td>
                                      <td className="pt-2 text-right font-bold text-lg">${completedPurchase.total.toFixed(2)}</td>
                                  </tr>
                              </tfoot>
                          </table>

                          <div className="mt-8 pt-8 border-t border-dashed border-gray-300 flex justify-between text-xs text-gray-400">
                              <div className="text-center w-1/3">
                                  <div className="h-10 border-b border-gray-300 mb-2"></div>
                                  Firma Entregado
                              </div>
                              <div className="text-center w-1/3">
                                  <div className="h-10 border-b border-gray-300 mb-2"></div>
                                  Firma Recibido (Almacén)
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-white border-t flex gap-3">
                      <button 
                          onClick={handlePrint}
                          className="flex-1 bg-gray-800 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-900 font-bold"
                      >
                          <Printer size={18} /> Imprimir Comprobante
                      </button>
                      <button 
                          onClick={handleCloseReceipt}
                          className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200"
                      >
                          Cerrar
                      </button>
                  </div>
              </div>

              {/* Print Styles */}
              <style>{`
                  @media print {
                      body * { visibility: hidden; }
                      #reception-receipt, #reception-receipt * { visibility: visible; }
                      #reception-receipt { 
                          position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; border: none; 
                      }
                  }
              `}</style>
          </div>
      );
  }

  // --- VISTA PRINCIPAL (FORMULARIO) ---
  return (
    <div className="flex flex-col h-full bg-gray-50 -m-4 md:-m-8">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-tight">Recepción de Mercancía</h1>
                    <p className="text-xs text-slate-400">Ingreso de compras e inventario</p>
                </div>
            </div>
            <div className="bg-slate-800 text-slate-200 px-4 py-1.5 rounded-full font-medium text-xs border border-slate-700">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Invoice Data Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 
                    Datos de la Compra
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor / Empresa</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                            placeholder="Ej. Samsung Electronics"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Factura / Control</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono"
                            placeholder="Ej. FAC-001234"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Products Registration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Carga de Productos
                    </h3>
                    <div className="text-xs text-gray-400">
                        {items.length} ítems cargados
                    </div>
                </div>

                {/* Input Row */}
                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                    <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">IMEI / Serial</label>
                            <input 
                                ref={imeiRef}
                                type="text" 
                                placeholder="Opcional" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                value={imei}
                                onChange={e => setImei(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, descRef)}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                <option value="Celular">Celular</option>
                                <option value="Accesorio">Accesorio</option>
                                <option value="Repuesto">Repuesto</option>
                                <option value="Servicio">Servicio</option>
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Descripción <span className="text-red-500">*</span></label>
                            <input 
                                ref={descRef}
                                type="text" 
                                placeholder="Ej: iPhone 14 Pro 128GB" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, qtyRef)}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cant.</label>
                            <input 
                                ref={qtyRef}
                                type="number" 
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                                onKeyDown={e => handleKeyDown(e, costRef)}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Costo Unit. <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400">$</span>
                                <input 
                                    ref={costRef}
                                    type="number" 
                                    placeholder="0.00" 
                                    className="w-full pl-6 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={cost}
                                    onChange={e => setCost(e.target.value)}
                                    onKeyDown={e => handleKeyDown(e)} // Enter here submits
                                />
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-1">
                            <button 
                                onClick={handleAddItem}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center font-bold shadow-sm transition-transform active:scale-95 h-[38px]"
                                title="Agregar (Enter)"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-800 font-bold border-b border-gray-100 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="px-6 py-3 bg-gray-50">#</th>
                                <th className="px-6 py-3 bg-gray-50">IMEI / Serial</th>
                                <th className="px-6 py-3 bg-gray-50">Producto</th>
                                <th className="px-6 py-3 bg-gray-50 text-center">Cant.</th>
                                <th className="px-6 py-3 bg-gray-50 text-right">Costo U.</th>
                                <th className="px-6 py-3 bg-gray-50 text-right">Total</th>
                                <th className="px-6 py-3 bg-gray-50 text-center w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                            <Plus className="text-gray-300" size={32} />
                                        </div>
                                        <p>Lista vacía.</p> 
                                        <p className="text-xs">Complete los campos arriba y presione Enter.</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{item.imei}</td>
                                        <td className="px-6 py-3">
                                            <p className="font-medium text-gray-800">{item.description}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{item.category}</p>
                                        </td>
                                        <td className="px-6 py-3 text-center bg-gray-50/50 font-medium">{item.quantity}</td>
                                        <td className="px-6 py-3 text-right text-gray-600">${item.cost.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-800">${(item.cost * item.quantity).toFixed(2)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button 
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end items-center gap-4">
                    <span className="text-gray-500 text-sm font-medium">Total Factura:</span>
                    <span className="text-2xl font-bold text-slate-800">${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-4 pb-6">
                <button 
                    onClick={() => { setItems([]); setSupplier(''); setInvoiceNumber(''); }}
                    className="px-6 py-3 border border-red-200 text-red-600 bg-white hover:bg-red-50 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                    <X size={18} /> Limpiar Todo
                </button>
                <button 
                    onClick={handleSave}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Save size={18} /> Guardar Compra
                </button>
            </div>

        </div>
    </div>
  );
};

export default PurchasesView;