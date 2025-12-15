import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Database } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Normalizar entradas (quitar espacios y convertir a string)
    const inputUser = username.trim(); 
    const inputPass = password.trim();

    console.log("Intentando login con:", inputUser, inputPass);
    console.log("Usuarios disponibles:", users);

    // 2. Búsqueda robusta (Maneja si Sheets devuelve números en vez de texto)
    const user = users.find(u => {
        // Convertir valores de BD a String y limpiar espacios
        const dbUser = String(u.username || '').trim();
        const dbPass = String(u.password || '').trim();
        
        // Comparación (Usuario es case-insensitive, Password es sensible)
        const isUserMatch = dbUser.toLowerCase() === inputUser.toLowerCase();
        const isPassMatch = dbPass === inputPass;

        return isUserMatch && isPassMatch;
    });
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales incorrectas. Verifique usuario y contraseña.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SistemCaja</h1>
            <p className="text-gray-500 mt-2">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ingrese su usuario"
                        autoFocus
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
                Entrar
            </button>
        </form>
        
        {/* Debug Info */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <div className="flex items-center gap-1">
                <Database size={12} />
                <span>Base de Datos: {users.length > 0 ? 'Conectada' : 'Local'}</span>
            </div>
            <p>Usuarios cargados: {users.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;