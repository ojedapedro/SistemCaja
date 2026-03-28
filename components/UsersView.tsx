import React, { useState } from 'react';
import { User, Role } from '../types';
import { Plus, UserCircle, Shield, Key } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  onAddUser: (user: User) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onAddUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
      name: '',
      username: '',
      password: '',
      role: 'seller'
  });

  const handleSubmit = () => {
      if (!newUser.username || !newUser.password) return;
      onAddUser({
          id: Date.now().toString(),
          ...newUser
      });
      setNewUser({ name: '', username: '', password: '', role: 'seller' });
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Gestión de Usuarios</h2>
                <p className="text-gray-500 dark:text-slate-400">Control de acceso y roles del personal.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
                <Plus size={20} /> Nuevo Usuario
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Nombre</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center transition-colors">
                                    <UserCircle size={18} />
                                </div>
                                <span className="font-medium text-gray-800 dark:text-slate-200">{user.username}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border transition-colors ${
                                    user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' :
                                    user.role === 'warehouse' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                                    'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                }`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{user.name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 transition-colors">
                    <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Nuevo Usuario</h3>
                    <div className="space-y-3">
                        <input className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded outline-none focus:border-blue-500 dark:text-slate-100 transition-colors" placeholder="Nombre Completo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        <input className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded outline-none focus:border-blue-500 dark:text-slate-100 transition-colors" placeholder="Nombre de Usuario (Login)" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                        <input className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded outline-none focus:border-blue-500 dark:text-slate-100 transition-colors" type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-slate-400">Rol de Acceso</label>
                            <select 
                                className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded outline-none focus:border-blue-500 dark:text-slate-100 transition-colors" 
                                value={newUser.role} 
                                onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                            >
                                <option value="admin">Administrador (Acceso Total)</option>
                                <option value="seller">Vendedor (Ventas y Clientes)</option>
                                <option value="warehouse">Almacén (Inventario)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors">Cancelar</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95">Crear Usuario</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UsersView;