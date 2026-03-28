import React, { useState } from 'react';
import { User as UserType } from '../types';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Shield, User, Briefcase } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserType) => void;
  users: UserType[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const inputUser = String(username || '').trim(); 
    const inputPass = String(password || '').trim();

    const user = users.find(u => {
        const dbUser = String(u.username || '').trim();
        const dbPass = String(u.password || '').trim();
        return dbUser.toLowerCase() === inputUser.toLowerCase() && dbPass === inputPass;
    });
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales incorrectas. Verifique usuario y contraseña.');
    }
  };

  const handleQuickLogin = (role: string) => {
    const user = users.find(u => u.role === role);
    if (user) {
      setUsername(String(user.username || ''));
      setPassword(String(user.password || ''));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-white overflow-hidden font-sans">
      
      {/* Left Side: Visuals & Glassmorphism */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#1e1b4b] to-[#312e81] p-12">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Main Character Image Container */}
          <div className="relative aspect-square bg-[#fef3c7] rounded-lg overflow-hidden shadow-2xl border-4 border-white/10">
            <img 
              src="https://picsum.photos/seed/manager/800/800" 
              alt="Character" 
              className="w-full h-full object-cover mix-blend-multiply opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Glassmorphism Card 1: Budget */}
          <div className="absolute -top-10 -left-10 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl w-48 animate-bounce-slow">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-white/60 uppercase">Presupuesto</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+12%</span>
            </div>
            <div className="text-2xl font-black mb-2">$624k</div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-3/4 rounded-full"></div>
            </div>
          </div>

          {/* Glassmorphism Card 2: Audited Payments */}
          <div className="absolute -bottom-6 -right-10 p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl w-56">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">Pagos</p>
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">Auditados</p>
              </div>
              <div className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Esta semana</div>
            </div>
            <div className="flex items-end gap-1.5 h-12 mb-3">
              <div className="flex-1 bg-white/20 h-1/2 rounded-sm"></div>
              <div className="flex-1 bg-white/20 h-3/4 rounded-sm"></div>
              <div className="flex-1 bg-blue-500 h-full rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <div className="flex-1 bg-white/20 h-2/3 rounded-sm"></div>
              <div className="flex-1 bg-white/20 h-1/2 rounded-sm"></div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
              <div className="w-3 h-3 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              </div>
              Todo en regla
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-[#111827]">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo & Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-blue-500">SistemCaja</h1>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-slate-400 font-medium">Ingrese sus credenciales para acceder al panel.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Correo Electrónico / Usuario</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="usuario@sistemcaja.com"
                  className="w-full pl-12 pr-4 py-4 bg-[#1f2937] border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-[#1f2937] border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">
                ¿Olvidó su contraseña?
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-[#5b5cf2] hover:bg-[#4a4be3] text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Iniciar Sesión
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Demo Access */}
          <div className="pt-8 border-t border-slate-800">
            <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Accesos Rápidos (Demo)</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => handleQuickLogin('admin')}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
              >
                <Shield size={14} /> Admin
              </button>
              <button 
                onClick={() => handleQuickLogin('warehouse')}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
              >
                <Briefcase size={14} /> Almacén
              </button>
              <button 
                onClick={() => handleQuickLogin('seller')}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
              >
                <User size={14} /> Vendedor
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;
