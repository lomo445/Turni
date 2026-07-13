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
  Activity,
  AlertTriangle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, errors } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendario', label: 'Calendario Turni', icon: Calendar },
    { id: 'operatori', label: 'Operatori', icon: Users },
    { id: 'generazione', label: 'Generazione Automatica', icon: Wand2 },
    { id: 'statistiche', label: 'Statistiche', icon: BarChart3 },
    { id: 'importa', label: 'Importa Excel', icon: FileSpreadsheet },
    { id: 'impostazioni', label: 'Impostazioni & Legenda', icon: Settings },
  ];

  const criticalErrors = errors.filter(e => e.tipo === 'critico');

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col no-print">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
        <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400 shadow-inner">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-wide text-white m-0 p-0 uppercase">TSRM Planner</h1>
          <p className="text-[10px] text-slate-400 font-bold m-0 tracking-wider">RADIOLOGIA DEU • USL8</p>
        </div>
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
            </button>
          );
        })}
      </nav>

      {/* Warning Alert in Sidebar if errors exist */}
      {errors.length > 0 && (
        <div className="p-4 m-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <p className="font-semibold text-amber-400">Rilevati anomalie</p>
            <p className="mt-1 text-slate-400">Ci sono {errors.length} errori/avvisi nel mese corrente.</p>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        PWA Installabile H24<br />
        © 2026 U.O. Professionale
      </div>
    </aside>
  );
};
