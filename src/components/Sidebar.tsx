import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Wand2, 
  BarChart3, 
  FileSpreadsheet, 
  Settings,
  Sliders,
  Activity,
  AlertTriangle,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Send,
  Building2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, errors, shiftRequests, supabaseConfig, syncData, userRole, logout, departments, currentDepartmentId, setCurrentDepartmentId } = useApp();
  const [syncing, setSyncing] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const handleSync = async () => {
    if (!supabaseConfig.connected) {
      setActiveView('impostazioni');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      await syncData();
    } catch (e: any) {
      setSyncError(e.message || 'Errore');
    } finally {
      setSyncing(false);
    }
  };

  const rawMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendario', label: 'Calendario Turni', icon: Calendar },
    { id: 'richieste', label: 'Richieste Dipendenti', icon: Send },
    { id: 'reparti', label: 'Gestione Reparti', icon: Building2 },
    { id: 'operatori', label: 'Operatori', icon: Users },
    { id: 'regole', label: 'Regole Motore', icon: Sliders },
    { id: 'generazione', label: 'Generazione Automatica', icon: Wand2 },
    { id: 'statistiche', label: 'Statistiche', icon: BarChart3 },
    { id: 'importa', label: 'Importa Excel', icon: FileSpreadsheet },
    { id: 'impostazioni', label: 'Impostazioni & Legenda', icon: Settings },
  ];

  const menuItems = rawMenuItems.filter(item => {
    if (userRole === 'operatore') {
      return ['calendario'].includes(item.id);
    }
    return true;
  });

  const criticalErrors = errors.filter(e => e.tipo === 'critico');
  const pendingRequests = shiftRequests.filter(r => r.stato === 'in_attesa');

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col no-print">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">CareFlow</h1>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mt-1">SaaS Planner</p>
          </div>
        </div>

        {/* Department Switcher */}
        {userRole === 'coordinatore' && departments && departments.length > 0 && (
          <div className="px-2 mb-8">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Reparto Attivo</label>
            <div className="relative">
              <select
                value={currentDepartmentId || ''}
                onChange={(e) => setCurrentDepartmentId(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-800 text-white rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            
            {/* Show department ID as small badge for operators to copy */}
            <div className="mt-2 bg-slate-950/50 rounded-lg p-2 flex items-center justify-between border border-slate-800/50 group">
              <span className="text-[10px] text-slate-500 font-medium truncate pr-2">ID: {currentDepartmentId}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(currentDepartmentId || '')}
                className="text-[10px] text-sky-400 hover:text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copia ID Reparto per inviti"
              >
                COPIA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Options */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
              {item.id === 'dashboard' && criticalErrors.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-bounce">
                  {criticalErrors.length}
                </span>
              )}

              {item.id === 'richieste' && pendingRequests.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow shadow-amber-500/50">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Warning Alert in Sidebar if errors exist (only visible for coordinators) */}
      {userRole === 'coordinatore' && errors.length > 0 && (
        <div className="p-4 m-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <p className="font-semibold text-amber-400">Rilevati anomalie</p>
            <p className="mt-1 text-slate-400">Ci sono {errors.length} errori/avvisi nel mese corrente.</p>
          </div>
        </div>
      )}

      {/* Cloud Sync Status Box (only visible for coordinators) */}
      {userRole === 'coordinatore' && (
        <div className="px-4 py-2 border-t border-slate-800">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all border ${
              supabaseConfig.connected
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center space-x-2">
              {syncing ? (
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
              ) : supabaseConfig.connected ? (
                <Cloud className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <CloudOff className="w-4 h-4 text-slate-500" />
              )}
              <div className="text-left">
                <p className="font-bold text-white">
                  {syncing ? 'Sincronizzazione...' : supabaseConfig.connected ? 'Cloud Attivo' : 'Cloud Disconnesso'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {supabaseConfig.connected ? 'Clicca per allineare' : 'Configura in Impostazioni'}
                </p>
              </div>
            </div>
            {supabaseConfig.connected && !syncing && (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-all" />
            )}
          </button>
          {syncError && (
            <p className="text-[9px] text-rose-500 mt-1 font-semibold text-center">{syncError}</p>
          )}
        </div>
      )}

      {/* Logout button */}
      <div className="px-4 pb-4 border-t border-slate-800/40 pt-4">
        <button
          onClick={() => {
            logout();
            setActiveView('dashboard');
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Esci dall'Account</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        CareFlow Cloud Sync • v2.2.0<br />
        © 2026 U.O. Professionale
      </div>
    </aside>
  );
};
