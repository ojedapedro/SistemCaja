import React, { useState } from 'react';
import { ExternalApp } from '../types';
import { ExternalLink, Plus, Trash2, Globe, Calculator, Mail, Layout } from 'lucide-react';

interface AppLauncherProps {
  apps: ExternalApp[];
  onAddApp: (app: ExternalApp) => void;
  onRemoveApp: (id: string) => void;
}

const AppLauncher: React.FC<AppLauncherProps> = ({ apps, onAddApp, onRemoveApp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', url: '', description: '' });

  const handleAdd = () => {
    if (!newApp.name || !newApp.url) return;
    onAddApp({
      id: Date.now().toString(),
      name: newApp.name,
      url: newApp.url.startsWith('http') ? newApp.url : `https://${newApp.url}`,
      description: newApp.description || 'Aplicación externa',
      iconName: 'Globe'
    });
    setNewApp({ name: '', url: '', description: '' });
    setIsModalOpen(false);
  };

  const getIcon = (name: string) => {
      // Simple icon mapping or default
      return <Globe className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Aplicaciones Externas</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Acceso rápido a tus herramientas web favoritas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus size={20} />
          Agregar App
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apps.map((app) => (
          <div key={app.id} className="bg-white dark:bg-slate-900 group hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative">
            <button 
                onClick={() => onRemoveApp(app.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Eliminar acceso directo"
            >
                <Trash2 size={18} />
            </button>
            
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="block p-8 h-full flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                {getIcon(app.iconName)}
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">{app.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{app.description}</p>
              <div className="mt-6 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir aplicación <ExternalLink size={14} />
              </div>
            </a>
          </div>
        ))}
        
        {/* Placeholder if empty */}
        {apps.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl transition-colors">
                <Layout size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes aplicaciones configuradas.</p>
            </div>
        )}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-2xl font-bold mb-6 dark:text-slate-100">Nueva Aplicación</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none dark:text-slate-100 transition-all"
                  value={newApp.name}
                  onChange={e => setNewApp({...newApp, name: e.target.value})}
                  placeholder="Ej. Gmail, SAT, Banco"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">URL (Link)</label>
                <input 
                  type="text" 
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none dark:text-slate-100 transition-all"
                  value={newApp.url}
                  onChange={e => setNewApp({...newApp, url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Descripción</label>
                <input 
                  type="text" 
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none dark:text-slate-100 transition-all"
                  value={newApp.description}
                  onChange={e => setNewApp({...newApp, description: e.target.value})}
                  placeholder="Gestión de correos"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAdd}
                className="px-8 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLauncher;