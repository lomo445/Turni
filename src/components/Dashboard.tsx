import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  AlertTriangle, 
  CalendarDays, 
  Award, 
  CheckCircle2, 
  Flame,
  ArrowRight,
  TrendingUp,
  Trash2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    year, 
    month, 
    setYear, 
    setMonth, 
    operators, 
    errors, 
    schedule, 
    setActiveView,
    setHighlightedDay,
    clearMonthSchedule,
    userRole
  } = useApp();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const activeOps = operators.filter(o => o.stato === 'attivo');
  
  // Calculate shifts assigned in current month
  const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthlySchedules = schedule.filter(s => s.data.startsWith(currentPrefix));
  const workedShiftsCount = monthlySchedules.filter(s => s.codiceTurno !== 'L').length;

  const criticalErrors = errors.filter(e => e.tipo === 'critico');
  const warningErrors = errors.filter(e => e.tipo === 'warning');

  // Year options around the current selection
  const years = [2025, 2026, 2027];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">PANNELLO DI CONTROLLO</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">Dashboard Reparto</h2>
        </div>
        
        {/* Month/Year selector */}
        <div className="flex items-center space-x-3 mt-4 md:mt-0 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent border-0 text-slate-800 text-sm font-semibold focus:ring-0 focus:outline-none cursor-pointer pr-8"
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <div className="w-[1px] h-6 bg-slate-200"></div>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent border-0 text-slate-800 text-sm font-semibold focus:ring-0 focus:outline-none cursor-pointer pr-8"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        {/* Card 1: Operatori */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operatori Attivi</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{activeOps.length} / {operators.length}</h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Servizio H24 coperto
            </span>
          </div>
          <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Turni Assegnati */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Turni Assegnati</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{workedShiftsCount}</h3>
            <span className="text-xs text-slate-500 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 text-sky-500" /> Nel mese di {monthNames[month - 1]}
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Errori Critici */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Errori Critici</span>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">{criticalErrors.length}</h3>
            <span className="text-xs text-rose-500 font-medium flex items-center mt-1">
              {criticalErrors.length > 0 ? '⚠️ Richiede correzione immediata' : '✓ Nessuna violazione rigida'}
            </span>
          </div>
          <div className={`p-4 rounded-2xl border ${
            criticalErrors.length > 0 
              ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' 
              : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}>
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Avvisi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avvisi e Warning</span>
            <h3 className="text-3xl font-bold text-amber-600 mt-1">{warningErrors.length}</h3>
            <span className="text-xs text-amber-500 font-medium flex items-center mt-1">
              {warningErrors.length > 0 ? '⚠ Ottimizzazioni consigliate' : '✓ Rotazione equa e regolare'}
            </span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Errors and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left/Middle Column: Errors List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 m-0">Anomalie e Controllo Qualità</h3>
              <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
                {errors.length} totali
              </span>
            </div>
            <button 
              onClick={() => setActiveView('calendario')}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
            >
              <span>Vedi Calendario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto max-h-[450px] space-y-4">
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Tutti i turni sono in regola!</h4>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  La pianificazione del mese rispetta tutti i vincoli contrattuali e la copertura minima di sicurezza.
                </p>
              </div>
            ) : (
              errors.map((err, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all hover:translate-x-1 ${
                    err.tipo === 'critico' 
                      ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50' 
                      : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className={`p-2 rounded-lg mt-0.5 ${
                      err.tipo === 'critico' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{err.messaggio}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Giorno {err.giorno} {monthNames[month - 1]} {year}
                        {err.operatoreId && ` • Operatore ID: ${err.operatoreId}`}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setHighlightedDay(err.giorno);
                      setActiveView('calendario');
                    }}
                    className={`text-xs font-bold hover:underline shrink-0 ml-4 ${
                      err.tipo === 'critico' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    Risolvi
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Azioni Rapide</h4>
            <div className="space-y-3">
              {userRole === 'coordinatore' && (
                <button 
                  onClick={() => setActiveView('generazione')}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all hover:scale-[1.01]"
                >
                  <span>Generatore Automatico</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <button 
                onClick={() => setActiveView('calendario')}
                className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all"
              >
                <span>{userRole === 'coordinatore' ? 'Gestione Manuale' : 'Visualizza Calendario'}</span>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </button>

              {userRole === 'coordinatore' && (
                <>
                  <button 
                    onClick={() => setActiveView('importa')}
                    className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all"
                  >
                    <span>Importa Storico Excel</span>
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler azzerare tutti i turni di questo mese (${month}/${year})? L'operazione non è annullabile.`)) {
                        clearMonthSchedule(year, month);
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-all border border-rose-100"
                  >
                    <span>Azzera Turni del Mese</span>
                    <Trash2 className="w-5 h-5 text-rose-500" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Department Coverage Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Stato della Rotazione</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Copertura Minima Mattina</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">3 TSRM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Copertura Minima Pomeriggio</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">3 TSRM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 font-medium">Copertura Minima Notte</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">2 TSRM</span>
              </div>
              <div className="w-full h-[1px] bg-slate-100"></div>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <Award className="w-5 h-5 text-sky-500 shrink-0" />
                <span>La turnazione è H24 in rotazione continua con smonto e riposo obbligatori.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
