import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, KeyRound, Mail, ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp } = useApp();
  
  const [isRegister, setIsRegister] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UX States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore durante l\'accesso. Verifica le credenziali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-slate-950 font-sans p-6 overflow-hidden select-none">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15)_0%,transparent_50%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />

      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl z-10 transition-all duration-300">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-400 mb-3 shadow-inner relative group cursor-default">
            <Activity className="w-10 h-10 animate-pulse text-sky-400 group-hover:scale-110 transition-all duration-300" />
            <div className="absolute -inset-0.5 bg-sky-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Care<span className="text-sky-400">Flow</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
            Gestione Turni Intelligente
          </p>
        </div>



        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-start space-x-2.5 animate-shake">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indirizzo Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="coordinatore@azienda.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Toggle Register / Login */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              {isRegister ? 'Hai già un account? Accedi' : 'Nuovo coordinatore? Registrati'}
            </button>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-sky-500/10 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Caricamento...</span>
              </>
            ) : (
              <span>
                {isRegister ? 'Registra e Inizializza' : 'Accedi come Coordinatore'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
