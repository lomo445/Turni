import React from 'react';
import { useApp } from '../context/AppContext';
import { isWeekend, isHoliday } from '../utils/scheduler';
import { 
  BarChart, 
  TrendingUp, 
  Smile, 
  Frown, 
  ShieldCheck
} from 'lucide-react';

interface OperatorStatsSummary {
  id: string;
  name: string;
  ore: number;
  mattine: number;
  pomeriggi: number;
  notti: number;
  festivi: number;
  ferie: number;
  riposi: number;
  initialBalance: number;
  contractHours: number;
  monthDiff: number;
  finalBalance: number;
}

export const StatsDashboard: React.FC = () => {
  const { year, month, operators, shifts, schedule } = useApp();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const getShiftCategory = (code: string) => {
    const shift = shifts.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  const getShiftHours = (code: string) => {
    const shift = shifts.find(s => s.codice === code);
    return shift ? shift.durataOre : 0;
  };

  // Compile stats for each active operator
  const statsList: OperatorStatsSummary[] = operators.map(op => {
    const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const opSchedules = schedule.filter(s => s.operatoreId === op.id && s.data.startsWith(currentPrefix));
    
    let ore = 0;
    let mattine = 0;
    let pomeriggi = 0;
    let notti = 0;
    let festivi = 0;
    let ferie = 0;
    let riposi = 0;

    opSchedules.forEach(s => {
      const code = s.codiceTurno;
      const cat = getShiftCategory(code);
      const hours = getShiftHours(code);
      
      ore += hours;

      if (cat === 'mattina') mattine++;
      else if (cat === 'pomeriggio') pomeriggi++;
      else if (cat === 'notte') notti++;
      else if (cat === 'ferie') ferie++;
      else if (cat === 'riposo') riposi++;

      // Check if worked on weekend or holiday
      const dateParts = s.data.split('-');
      const d = parseInt(dateParts[2]);
      const isFest = isWeekend(year, month, d) || isHoliday(year, month, d);
      
      if (isFest && cat !== 'riposo' && cat !== 'ferie' && cat !== 'assenza') {
        festivi++;
      }
    });

    const initialBalance = op.bancaOreIniziale || 0;
    const contractHours = op.oreContrattualiMensili || 144;
    const monthDiff = ore - contractHours;
    const finalBalance = initialBalance + monthDiff;

    return {
      id: op.id,
      name: `${op.cognome} ${op.nome}`,
      ore,
      mattine,
      pomeriggi,
      notti,
      festivi,
      ferie,
      riposi,
      initialBalance,
      contractHours,
      monthDiff,
      finalBalance
    };
  });

  // Filter stats for active operators only for averages
  const activeStats = statsList.filter(s => {
    const op = operators.find(o => o.id === s.id);
    return op && op.stato === 'attivo';
  });

  // Calculate department averages
  const totalWorkedHours = activeStats.reduce((acc, curr) => acc + curr.ore, 0);
  const avgWorkedHours = activeStats.length > 0 ? (totalWorkedHours / activeStats.length).toFixed(1) : '0';
  
  const totalNights = activeStats.reduce((acc, curr) => acc + curr.notti, 0);
  const avgNights = activeStats.length > 0 ? (totalNights / activeStats.length).toFixed(1) : '0';

  // Find most loaded and least loaded operators (active only)
  let mostLoaded = { name: '-', ore: 0 };
  let leastLoaded = { name: '-', ore: 999 };

  activeStats.forEach(s => {
    if (s.ore > mostLoaded.ore) {
      mostLoaded = { name: s.name, ore: s.ore };
    }
    if (s.ore < leastLoaded.ore && s.ore > 0) {
      leastLoaded = { name: s.name, ore: s.ore };
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Statistiche Generali</span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">
          Analisi Carico di Lavoro • {monthNames[month - 1]} {year}
        </h2>
      </div>

      {/* Department Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        
        {/* Card 1: Media Ore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Media Ore TSRM</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{avgWorkedHours}h</h3>
            <span className="text-xs text-slate-500 font-medium">Contrattuali standard: 144h</span>
          </div>
          <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Media Notti */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Media Notti TSRM</span>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{avgNights}</h3>
            <span className="text-xs text-slate-500 font-medium">Notti lavorate nel mese</span>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <BarChart className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Operatore più carico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operatore più Carico</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1.5 truncate max-w-[130px]">{mostLoaded.name}</h4>
            <span className="text-xs text-rose-500 font-medium flex items-center mt-1">
              <Frown className="w-3.5 h-3.5 mr-1" /> {mostLoaded.ore} ore programmate
            </span>
          </div>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Frown className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Operatore meno carico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meno Carico (Attivo)</span>
            <h4 className="text-sm font-bold text-slate-900 mt-1.5 truncate max-w-[130px]">{leastLoaded.name}</h4>
            <span className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <Smile className="w-3.5 h-3.5 mr-1" /> {leastLoaded.ore === 999 ? '-' : `${leastLoaded.ore} ore`}
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Smile className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 m-0">Riepilogo Individuale TSRM</h3>
          <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1" /> Equità garantita
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-left text-xs font-bold uppercase">
              <th className="px-6 py-4">Dipendente</th>
              <th className="px-6 py-4 text-center">Ore Lavorate</th>
              <th className="px-6 py-4 text-center">Contratto</th>
              <th className="px-6 py-4 text-center">Banca Ore</th>
              <th className="px-6 py-4 text-center">Mattine</th>
              <th className="px-6 py-4 text-center">Pomeriggi</th>
              <th className="px-6 py-4 text-center">Notti</th>
              <th className="px-6 py-4 text-center">Festivi / Weekend</th>
              <th className="px-6 py-4 text-center">Ferie</th>
              <th className="px-6 py-4 text-center">Riposi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {statsList.map(s => {
              const op = operators.find(o => o.id === s.id);
              const isInactive = op ? op.stato !== 'attivo' : false;

              return (
                <tr key={s.id} className={`hover:bg-slate-50/30 ${isInactive ? 'bg-slate-100/30 opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-bold text-slate-950">
                    {s.name}
                    {isInactive && (
                      <span className="ml-1.5 px-1 py-0.5 bg-slate-200 text-[8px] text-slate-500 rounded">
                        Non attivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-slate-800">
                    {s.ore}h
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500">
                    {s.contractHours}h
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-extrabold text-sm ${
                        s.finalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {s.finalBalance >= 0 ? `+${s.finalBalance}` : s.finalBalance}h
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {s.monthDiff >= 0 ? `+${s.monthDiff}` : s.monthDiff}h questo mese
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600">{s.mattine}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600">{s.pomeriggi}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{s.notti}</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-700">{s.festivi}</td>
                  <td className="px-6 py-4 text-center font-medium text-amber-600">{s.ferie}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-500">{s.riposi}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
