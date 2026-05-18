import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('test.otaona');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md shadow-xl border-t-4 border-t-blue-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/40">
            <span className="text-3xl font-black text-white">E</span>
          </div>
          <h1 className="text-4xl font-black text-indigo-600 tracking-widest uppercase">EduCore</h1>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Welcome Back</h2>
          <p className="text-slate-500 mt-1 font-medium">Please sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all"
                placeholder="Login kiriting"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 pl-10 pr-4 py-3 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 text-[15px] font-semibold text-slate-700 transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 mt-4">
            <LogIn size={20} /> Sign In
          </button>
        </form>

        {/* <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">Default Admin: <span className="font-bold text-slate-600"></span></p>
        </div> */}
      </div>
    </div>
  );
}
