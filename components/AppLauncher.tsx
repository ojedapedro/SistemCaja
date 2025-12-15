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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Aplicaciones Externas</h2>
            <p className="text-gray-500 mt-1">Acceso rápido a tus herramientas web favoritas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
        >
          <Plus size={20} />
          Agregar App
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apps.map((app) => (
          <div key={app.id} className="bg-white group hover:shadow-lg transition-all duration-300 rounded-xl border border-gray-200 overflow-hidden relative">
            <button 
                onClick={() => onRemoveApp(app.id)}
                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Eliminar acceso directo"
            >
                <Trash2 size={16} />
            </button>
            
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="block p-6 h-full flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {getIcon(app.iconName)}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{app.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{app.description}</p>
              <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir aplicación <ExternalLink size={12} />
              </div>
            </a>
          </div>
        ))}
        
        {/* Placeholder if empty */}
        {apps.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <Layout size={48} className="mb-4 opacity-50" />
                <p>No tienes aplicaciones configuradas.</p>
            </div>
        )}
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Nueva Aplicación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newApp.name}
                  onChange={e => setNewApp({...newApp, name: e.target.value})}
                  placeholder="Ej. Gmail, SAT, Banco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (Link)</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newApp.url}
                  onChange={e => setNewApp({...newApp, url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newApp.description}
                  onChange={e => setNewApp({...newApp, description: e.target.value})}
                  placeholder="Gestión de correos"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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