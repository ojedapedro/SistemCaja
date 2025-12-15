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
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
                <p className="text-gray-500">Control de acceso y roles del personal.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
                <Plus size={20} /> Nuevo Usuario
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Nombre</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                    <UserCircle size={18} />
                                </div>
                                <span className="font-medium text-gray-800">{user.username}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                                    user.role === 'warehouse' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                    'bg-green-100 text-green-600 border-green-200'
                                }`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{user.name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Nuevo Usuario</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Nombre Completo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Nombre de Usuario (Login)" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                        <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Rol de Acceso</label>
                            <select 
                                className="w-full border p-2 rounded" 
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
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Crear Usuario</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UsersView;