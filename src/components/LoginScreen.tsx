import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, KeyRound, Mail, ShieldAlert, Eye, EyeOff, Loader2, Building2, User } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp } = useApp();
  
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'coordinatore' | 'operatore'>('operatore');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
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
        await signUp(
          email, 
          password, 
          selectedRole, 
          selectedRole === 'operatore' ? departmentId : undefined,
          selectedRole === 'operatore' ? nome : undefined,
          selectedRole === 'operatore' ? cognome : undefined
        );
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

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 relative z-20">
          <button
            onClick={() => { setIsRegister(false); setErrorMsg(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${!isRegister ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setIsRegister(true); setErrorMsg(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${isRegister ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Registrati
          </button>
        </div>

        {/* Form Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-400 font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-20">
          
          {isRegister && (
            <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Seleziona il tuo ruolo</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('coordinatore')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selectedRole === 'coordinatore' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                >
                  <Building2 className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Coordinatore</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('operatore')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selectedRole === 'operatore' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dipendente</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="nome@ospedale.it"
              />
            </div>
          </div>

          {isRegister && selectedRole === 'operatore' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-3">
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold text-sky-400 uppercase tracking-wider pl-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all placeholder:text-slate-600"
                    placeholder="Es. Mario"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-bold text-sky-400 uppercase tracking-wider pl-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all placeholder:text-slate-600"
                    placeholder="Es. Rossi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-sky-400 uppercase tracking-wider pl-1">Codice Reparto</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-500">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-sky-500/5 border border-sky-500/50 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all placeholder:text-slate-500"
                    placeholder="Richiedi il codice al Coordinatore"
                  />
                </div>
                <p className="text-[10px] text-slate-500 pl-1">Esempio: dept_168892345</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-500 transition-colors">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isRegister && (
              <p className="text-[10px] text-slate-500 pl-1">Minimo 6 caratteri.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl bg-sky-500 text-white font-bold text-sm tracking-wide py-3.5 transition-all hover:bg-sky-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Elaborazione...
              </span>
            ) : (
              <span className="relative z-10">{isRegister ? 'Crea Account' : 'Accedi a CareFlow'}</span>
            )}
          </button>
        </form>

        {isRegister && (
           <div className="mt-6 text-center text-xs text-slate-500">
             Potrebbe essere necessario verificare l'email dopo la registrazione.
           </div>
        )}
      </div>

      <div className="absolute bottom-6 text-slate-600 text-xs font-medium text-center w-full z-0">
        &copy; {new Date().getFullYear()} TSRM DEU. Tutti i diritti riservati.
      </div>
    </div>
  );
};
