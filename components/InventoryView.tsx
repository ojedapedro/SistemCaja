import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { 
    Search, Barcode, CheckCircle, AlertTriangle, 
    Package, XCircle, History, Trash2, ScanLine
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onUpdateStock: (id: string, qty: number) => void;
}

type ScanSessionItem = {
    timestamp: number;
    sku: string;
    product?: Product;
    status: 'found' | 'not_found';
};

const InventoryView: React.FC<InventoryViewProps> = ({ products, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastScan, setLastScan] = useState<ScanSessionItem | null>(null);
  const [sessionHistory, setSessionHistory] = useState<ScanSessionItem[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Mantener foco siempre en el input
  useEffect(() => {
    const focusInterval = setInterval(() => {
        if (document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
        }
    }, 500);
    return () => clearInterval(focusInterval);
  }, []);

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          const code = searchTerm.trim();
          if (!code) return;

          // Buscar producto exacto por IMEI/SKU o ID
          const product = products.find(p => 
              String(p.sku).toLowerCase() === code.toLowerCase() || 
              String(p.id) === code
          );

          const scanResult: ScanSessionItem = {
              timestamp: Date.now(),
              sku: code,
              product: product,
              status: product ? 'found' : 'not_found'
          };

          setLastScan(scanResult);
          setSessionHistory(prev => [scanResult, ...prev]);
          setSearchTerm(''); // Limpiar para el siguiente
      }
  };

  const clearSession = () => {
      setSessionHistory([]);
      setLastScan(null);
      setSearchTerm('');
      inputRef.current?.focus();
  };

  // Renderizado del resultado principal (Tarjeta Grande)
  const renderResultCard = () => {
      if (!lastScan) {
          return (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <ScanLine size={64} className="mb-4 opacity-20" />
                  <h3 className="text-xl font-bold text-gray-500">Esperando Escaneo...</h3>
                  <p className="text-sm">Escanea un código de barras o IMEI para ver detalles</p>
              </div>
          );
      }

      if (lastScan.status === 'not_found') {
          return (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-8 text-center animate-in zoom-in duration-200">
                  <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-red-700 mb-2">Producto No Encontrado</h2>
                  <p className="text-red-500 font-mono text-lg">Código escaneado: {lastScan.sku}</p>
              </div>
          );
      }

      const p = lastScan.product!;
      const isLowStock = p.stock <= 2;
      
      return (
          <div className="bg-white border border-blue-100 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-start">
                  <div>
                      <h2 className="text-2xl font-bold leading-tight">{p.name}</h2>
                      <p className="text-blue-100 mt-1 opacity-90">{p.category}</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Package size={32} className="text-white" />
                  </div>
              </div>
              
              <div className="p-8">
                  <div className="grid grid-cols-2 gap-8">
                      <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Precio Unitario</p>
                          <p className="text-4xl font-black text-slate-800">${p.price}</p>
                      </div>
                      
                      <div className={`text-center p-4 rounded-xl border ${isLowStock ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                          <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isLowStock ? 'text-red-500' : 'text-green-600'}`}>
                              Stock Disponible
                          </p>
                          <div className="flex items-center justify-center gap-2">
                              {isLowStock && <AlertTriangle className="text-red-500" />}
                              <p className={`text-4xl font-black ${isLowStock ? 'text-red-600' : 'text-green-700'}`}>
                                  {p.stock}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-center gap-3">
                      <Barcode className="text-slate-400" />
                      <div className="flex-1">
                          <p className="text-xs text-slate-500 font-bold uppercase">IMEI / Identificador</p>
                          <p className="text-lg font-mono text-slate-700 font-medium tracking-wide">{p.sku}</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 h-full flex flex-col">
        {/* Header Compacto */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-800">Verificador de Precios e Inventario</h1>
            <p className="text-slate-500">Escanea el código del producto para consultar su estatus.</p>
        </div>

        {/* Barra de Escaneo Gigante */}
        <div className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Barcode className="h-6 w-6 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
                ref={inputRef}
                type="text"
                className="block w-full pl-12 pr-4 py-4 text-xl border-2 border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm font-medium"
                placeholder="ESCANEA EL CÓDIGO AQUÍ..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleScan}
                autoFocus
                autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
               <span className="text-xs font-bold text-slate-300 border border-slate-200 px-2 py-1 rounded bg-slate-50">ENTER</span>
            </div>
        </div>

        {/* Área de Resultados */}
        <div className="flex-1 flex flex-col md:flex-row gap-6">
            
            {/* Tarjeta Principal */}
            <div className="flex-1">
                {renderResultCard()}
            </div>

            {/* Historial de Sesión (Sidebar) */}
            <div className="w-full md:w-80 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden max-h-[500px]">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History size={16} className="text-gray-500" />
                        <span className="text-sm font-bold text-gray-600">Historial Reciente</span>
                    </div>
                    {sessionHistory.length > 0 && (
                        <button onClick={clearSession} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
                            <Trash2 size={12} /> Limpiar
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {sessionHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs">
                            No hay escaneos recientes
                        </div>
                    ) : (
                        sessionHistory.map((item, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between animate-in slide-in-from-left-2 duration-200 ${item.status === 'found' ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="overflow-hidden">
                                    <p className={`text-sm font-bold truncate ${item.status === 'found' ? 'text-gray-800' : 'text-red-600'}`}>
                                        {item.status === 'found' ? item.product?.name : 'Desconocido'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">{item.sku}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {item.status === 'found' ? (
                                        <>
                                            <p className="text-xs font-bold text-blue-600">${item.product?.price}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</p>
                                        </>
                                    ) : (
                                        <AlertTriangle size={16} className="text-red-400" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {sessionHistory.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                        {sessionHistory.length} ítems escaneados
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default InventoryView;