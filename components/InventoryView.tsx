import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Search, Barcode, CheckCircle, AlertTriangle, FileSpreadsheet, Printer, ArrowLeft, Package, AlertCircle } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onUpdateStock: (id: string, qty: number) => void;
}

type AuditItem = {
    sku: string;
    scannedQty: number;
    systemQty: number;
    product?: Product;
    status: 'matched' | 'missing' | 'surplus';
};

const InventoryView: React.FC<InventoryViewProps> = ({ products, onUpdateStock }) => {
  const [mode, setMode] = useState<'view' | 'audit'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Audit State
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC FOR VIEW MODE ---
  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOGIC FOR AUDIT MODE ---
  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const code = e.currentTarget.value.trim();
          if (!code) return;

          setScannedItems(prev => ({
              ...prev,
              [code]: (prev[code] || 0) + 1
          }));
          setLastScanned(code);
          e.currentTarget.value = '';
          
          // Sound effect hint (simulated)
          // const audio = new Audio('/beep.mp3'); audio.play().catch(e => {});
      }
  };

  const auditData = useMemo(() => {
      const report: AuditItem[] = [];
      const processedSkus = new Set<string>();

      // 1. Process items in system (Theoretical)
      products.forEach(p => {
          processedSkus.add(p.sku);
          const physical = scannedItems[p.sku] || 0;
          let status: AuditItem['status'] = 'matched';
          
          if (physical < p.stock) status = 'missing';
          if (physical > p.stock) status = 'surplus';

          report.push({
              sku: p.sku,
              product: p,
              systemQty: p.stock,
              scannedQty: physical,
              status
          });
      });

      // 2. Process items scanned but NOT in system (Surplus/New)
      Object.keys(scannedItems).forEach(sku => {
          if (!processedSkus.has(sku)) {
              report.push({
                  sku,
                  product: undefined,
                  systemQty: 0,
                  scannedQty: scannedItems[sku],
                  status: 'surplus'
              });
          }
      });

      // Sort: Surplus first, then Missing, then Matched
      return report.sort((a, b) => {
          const priority = { surplus: 0, missing: 1, matched: 2 };
          return priority[a.status] - priority[b.status];
      });
  }, [products, scannedItems]);

  const stats = {
      matched: auditData.filter(i => i.status === 'matched').length,
      missing: auditData.filter(i => i.status === 'missing').length,
      surplus: auditData.filter(i => i.status === 'surplus').length,
      progress: Math.round((auditData.filter(i => i.status !== 'missing').length / (products.length || 1)) * 100)
  };

  // --- EXPORT FUNCTIONS ---
  const downloadCSV = () => {
      const headers = ['IMEI/SKU', 'Producto', 'Categoría', 'Stock Teórico', 'Conteo Físico', 'Diferencia', 'Estado'];
      const rows = auditData.map(item => [
          item.sku,
          item.product?.name || 'Producto Desconocido',
          item.product?.category || 'N/A',
          item.systemQty,
          item.scannedQty,
          item.scannedQty - item.systemQty,
          item.status.toUpperCase()
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inventario_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handlePrint = () => {
      window.print();
  };

  // Focus input on audit mode
  useEffect(() => {
      if (mode === 'audit' && inputRef.current) {
          inputRef.current.focus();
      }
  }, [mode]);

  if (mode === 'audit') {
      return (
          <div className="h-full flex flex-col bg-gray-50 -m-4 md:-m-8">
              {/* Audit Header */}
              <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setMode('view')} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                          <ArrowLeft />
                      </button>
                      <div>
                          <h1 className="text-xl font-bold">Modo Auditoría / Toma Física</h1>
                          <p className="text-xs text-blue-200">Escanea cada producto para verificar existencias</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium print:hidden">
                          <Printer size={16} /> Imprimir PDF
                      </button>
                      <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium print:hidden">
                          <FileSpreadsheet size={16} /> Excel
                      </button>
                  </div>
              </div>

              {/* Audit Controls (Hidden on print) */}
              <div className="p-6 bg-white border-b border-gray-200 print:hidden">
                   <div className="max-w-3xl mx-auto w-full">
                       <div className="relative mb-6">
                           <Barcode className="absolute left-4 top-3.5 text-gray-400 w-6 h-6" />
                           <input 
                                ref={inputRef}
                                type="text" 
                                placeholder="ESCANEAR IMEI O CÓDIGO DE BARRAS AQUÍ..." 
                                className="w-full pl-12 pr-4 py-3 text-lg border-2 border-blue-500 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                onKeyDown={handleScan}
                                autoFocus
                           />
                           <p className="text-xs text-gray-400 mt-2 text-center">Presiona Enter después de escanear o escribir el código.</p>
                       </div>

                       {/* Stats Cards */}
                       <div className="grid grid-cols-4 gap-4">
                           <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                               <p className="text-xs text-gray-500 uppercase font-bold">Progreso</p>
                               <p className="text-xl font-bold text-gray-800">{stats.progress}%</p>
                           </div>
                           <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                               <p className="text-xs text-green-600 uppercase font-bold">Correctos</p>
                               <p className="text-xl font-bold text-green-700">{stats.matched}</p>
                           </div>
                           <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                               <p className="text-xs text-red-600 uppercase font-bold">Faltantes</p>
                               <p className="text-xl font-bold text-red-700">{stats.missing}</p>
                           </div>
                           <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                               <p className="text-xs text-yellow-600 uppercase font-bold">Sobrantes</p>
                               <p className="text-xl font-bold text-yellow-700">{stats.surplus}</p>
                           </div>
                       </div>
                   </div>
              </div>

              {/* Audit Table */}
              <div className="flex-1 overflow-y-auto p-6 print:p-0">
                  <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                              <tr>
                                  <th className="px-6 py-3">Estado</th>
                                  <th className="px-6 py-3">IMEI / SKU</th>
                                  <th className="px-6 py-3">Producto</th>
                                  <th className="px-6 py-3 text-center">Teórico</th>
                                  <th className="px-6 py-3 text-center">Físico</th>
                                  <th className="px-6 py-3 text-center">Diferencia</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {auditData.map((item) => (
                                  <tr key={item.sku} className={`
                                      ${item.status === 'matched' ? 'bg-white' : ''}
                                      ${item.status === 'missing' ? 'bg-red-50' : ''}
                                      ${item.status === 'surplus' ? 'bg-yellow-50' : ''}
                                  `}>
                                      <td className="px-6 py-3">
                                          {item.status === 'matched' && <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs border border-green-200 px-2 py-0.5 rounded-full bg-green-100"><CheckCircle size={12}/> OK</span>}
                                          {item.status === 'missing' && <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs border border-red-200 px-2 py-0.5 rounded-full bg-red-100"><AlertCircle size={12}/> FALTANTE</span>}
                                          {item.status === 'surplus' && <span className="inline-flex items-center gap-1 text-yellow-700 font-bold text-xs border border-yellow-200 px-2 py-0.5 rounded-full bg-yellow-100"><AlertTriangle size={12}/> SOBRANTE</span>}
                                      </td>
                                      <td className="px-6 py-3 font-mono text-gray-600">{item.sku}</td>
                                      <td className="px-6 py-3 font-medium">
                                          {item.product ? (
                                              <div>
                                                  <div className="text-gray-900">{item.product.name}</div>
                                                  <div className="text-xs text-gray-500">{item.product.category}</div>
                                              </div>
                                          ) : (
                                              <span className="text-gray-400 italic">Producto no registrado</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-3 text-center">{item.systemQty}</td>
                                      <td className="px-6 py-3 text-center font-bold">{item.scannedQty}</td>
                                      <td className={`px-6 py-3 text-center font-bold ${item.scannedQty - item.systemQty < 0 ? 'text-red-600' : item.scannedQty - item.systemQty > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                          {item.scannedQty - item.systemQty > 0 ? '+' : ''}{item.scannedQty - item.systemQty}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  // --- STANDARD VIEW ---
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Inventario General</h2>
                <p className="text-gray-500">Gestión de stock y productos.</p>
            </div>
            <div className="flex gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Buscar producto o SKU..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setMode('audit')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all hover:scale-105"
                >
                    <Barcode size={20} /> Toma de Inventario (Auditoría)
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">IMEI / SKU</th>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4 text-center">Stock</th>
                            <th className="px-6 py-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin productos.</td></tr>
                        ) : filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{p.category}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-800">${p.price}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button 
                                        onClick={() => onUpdateStock(p.id, p.stock + 1)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-2"
                                    >
                                        + Ajustar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default InventoryView;