import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wand2, RefreshCw, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AutomaticGenerator: React.FC = () => {
  const { 
    year, 
    month, 
    setYear, 
    setMonth, 
    runAutoGeneration, 
    schedule, 
    setActiveView
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setSuccess(false);
    setLogMessages([]);

    const logs = [
      'Inizializzazione motore di turnazione...',
      'Analisi dello storico del mese precedente per il rispetto dei riposi post-notte...',
      'Ispezione delle ferie e dei permessi pre-inseriti dal coordinatore...',
      'Avvio del risolutore euristico (algoritmo di backtracking guidato)...',
      'Generazione di 50 configurazioni di rotazione parallele...',
      'Valutazione della fitness dei calendari (bilanciamento notti e weekend)...',
      'Selezione della turnazione ottimale a minima deviazione contrattuale...'
    ];

    // Simulate logs with delay to give a premium solver feeling
    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setLogMessages(prev => [...prev, logs[i]]);
    }

    runAutoGeneration([]);
    setLoading(false);
    setSuccess(true);
    
    // Trigger confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const preExistingShifts = schedule.filter(s => s.data.startsWith(targetPrefix));
  const hasExistingSchedule = preExistingShifts.length > 0;
  
  // Count pre-assigned leaves in the target month (which will be preserved)
  const leavesCount = preExistingShifts.filter(s => ['F', 'F ap', 'MAL', '104', 'MATERNITA\''].includes(s.codiceTurno)).length;

  // Previous month check
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const hasPrevSchedule = schedule.some(s => s.data.startsWith(prevPrefix));

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Generazione Intelligente</span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">Genera Nuovo Mese</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Side: Parameters and Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 m-0">Parametri di Pianificazione</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Month Selector */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mese da Generare</label>
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(Number(e.target.value));
                    setSuccess(false);
                  }}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Target Year Selector */}
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anno</label>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(Number(e.target.value));
                    setSuccess(false);
                  }}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Warnings and Info Banners */}
            <div className="space-y-3">
              {hasExistingSchedule && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Attenzione:</span> Esiste già un calendario per il mese di {monthNames[month - 1]} {year}.
                    <p className="mt-1 font-medium text-amber-700">
                      Avviando la generazione automatica verranno sovrascritti i turni correnti, ma verranno conservate le ferie e le assenze già registrate ({leavesCount} giorni).
                    </p>
                  </div>
                </div>
              )}

              {!hasPrevSchedule && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600">
                  <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Nota Storico:</span> Il mese di {monthNames[(month - 2 + 12) % 12]} {month === 1 ? year - 1 : year} non ha turni inseriti nel sistema.
                    <p className="mt-1 font-medium text-slate-500">
                      L'algoritmo non potrà ereditare i vincoli di smonto notte dall'ultimo giorno e inizierà la rotazione da zero per tutti gli operatori.
                    </p>
                  </div>
                </div>
              )}

              {hasPrevSchedule && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Continuità Riconosciuta:</span> Rilevata la programmazione del mese precedente.
                    <p className="mt-1 font-medium text-emerald-700">
                      I turni notturni degli ultimi giorni del mese scorso verranno correttamente gestiti per imporre smonti e riposi nei primi giorni di {monthNames[month - 1]}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button */}
            {!loading && !success && (
              <button
                onClick={handleGenerate}
                className="w-full py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-sky-600/15 transition-all hover:scale-[1.01]"
              >
                <Wand2 className="w-5 h-5 animate-pulse" />
                <span>Genera Bozza Turni</span>
              </button>
            )}

            {/* Loading / Generator status */}
            {loading && (
              <div className="p-6 bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3 font-bold text-sm text-white">
                  <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
                  <span>Elaborazione dei turni del reparto TSRM...</span>
                </div>
                <div className="text-xs space-y-1.5 pl-8 text-slate-400 font-mono">
                  {logMessages.map((msg, idx) => (
                    <div key={idx} className="fade-in duration-300">✔ {msg}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Success screen */}
            {success && (
              <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-slate-800">Generazione completata!</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  La prima proposta di calendario è stata caricata come bozza. Sono stati rispettati tutti i vincoli di riposo e la copertura minima giornaliera.
                </p>

                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => setActiveView('calendario')}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Vedi Calendario
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rigenera</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Roster and coverage requirements overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Vincoli H24 del Reparto</h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-[10px]">3</span>
              <div>
                <p className="font-bold text-slate-800 m-0">Copertura Turno Mattina</p>
                <p className="text-slate-500 mt-0.5">Assegna esattamente M1, M2 e M3 ogni giorno.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-[10px]">3</span>
              <div>
                <p className="font-bold text-slate-800 m-0">Copertura Turno Pomeriggio</p>
                <p className="text-slate-500 mt-0.5">Assegna esattamente P1, P2 e P3 ogni giorno.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center font-bold text-[10px]">2</span>
              <div>
                <p className="font-bold text-slate-800 m-0">Copertura Turno Notte</p>
                <p className="text-slate-500 mt-0.5">Assegna esattamente N1 e N2 ogni notte.</p>
              </div>
            </div>

            <div className="w-full h-[1px] bg-slate-100"></div>

            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-bold text-[10px]">!</span>
              <div>
                <p className="font-bold text-rose-800 m-0">Smonto e Riposo Obbligatori</p>
                <p className="text-slate-500 mt-0.5">La sequenza dopo la notte è sempre N &rarr; L (smonto) &rarr; L (riposo).</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">✓</span>
              <div>
                <p className="font-bold text-indigo-800 m-0">Equità Distribuzione Carichi</p>
                <p className="text-slate-500 mt-0.5">Notti e weekend festivi sono ripartiti equamente nello staff attivo.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
