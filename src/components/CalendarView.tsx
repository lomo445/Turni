import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isWeekend, isHoliday } from '../utils/scheduler';
import { parseCommand } from '../utils/nlp';
import type { ParsedAction } from '../utils/nlp';
import { 
  Printer, 
  Copy, 
  Paintbrush, 
  Check, 
  Info,
  Wand2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bot,
  HelpCircle,
  Play,
  CalendarDays,
  ArrowLeftRight,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DailySchedule } from '../types';

export const CalendarView: React.FC = () => {
  const { 
    year, 
    month, 
    setYear,
    setMonth,
    operators, 
    shifts, 
    schedule, 
    assignShift, 
    assignMultipleShifts,
    exportExcelFile,
    runAutoGeneration,
    clearMonthSchedule,
    highlightedDay,
    setHighlightedDay,
    userRole
  } = useApp();

  const [selectedCell, setSelectedCell] = useState<{ opId: string; dateStr: string; currentCode: string } | null>(null);
  const [paintModeCode, setPaintModeCode] = useState<string | null>(null); // "Pennello" mode shift code
  const [loading, setLoading] = useState(false);

  // Assistant UI States
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantTab, setAssistantTab] = useState<'chat' | 'form'>('form'); // Default to visual form for ease of use
  const [commandText, setCommandText] = useState('');
  const [parsedActions, setParsedActions] = useState<ParsedAction[]>([]);
  const [assistantMessage, setAssistantMessage] = useState('');

  // Quick Form States (Ferie)
  const [formOpId, setFormOpId] = useState('');
  const [formShiftCode, setFormShiftCode] = useState('F');
  const [formStartDay, setFormStartDay] = useState(1);
  const [formEndDay, setFormEndDay] = useState(1);
  const [autoHeal, setAutoHeal] = useState(true);

  // Quick Form States (Scambio)
  const [swapOpId1, setSwapOpId1] = useState('');
  const [swapOpId2, setSwapOpId2] = useState('');
  const [swapDay, setSwapDay] = useState(1);

  const numDays = new Date(year, month, 0).getDate();
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  const weekdaysMap = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

  const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthlySchedules = schedule.filter(s => s.data.startsWith(currentPrefix));
  const workedShiftsCount = monthlySchedules.filter(s => s.codiceTurno !== 'L').length;

  const activeOps = operators.filter(op => op.stato === 'attivo');

  // Map of operatorId -> dateStr -> shiftCode
  const scheduleMap: Record<string, Record<string, string>> = {};
  schedule.forEach(s => {
    if (!scheduleMap[s.operatoreId]) {
      scheduleMap[s.operatoreId] = {};
    }
    scheduleMap[s.operatoreId][s.data] = s.codiceTurno;
  });

  const getShiftColor = (code: string) => {
    const shift = shifts.find(s => s.codice === code);
    return shift ? shift.colore : '#ffffff';
  };

  const getShiftCategory = (code: string) => {
    const shift = shifts.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  const getShiftHours = (code: string) => {
    const shift = shifts.find(s => s.codice === code);
    return shift ? shift.durataOre : 0;
  };

  const getShiftTextContrastColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'text-slate-900' : 'text-white';
  };

  // Helper to get current shift code of operator on a specific day
  const getCurrentShift = (opId: string, day: number): string => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduleMap[opId]?.[dateStr] || 'L';
  };

  // Handle cell click
  const handleCellClick = (opId: string, dateStr: string, currentCode: string) => {
    if (userRole === 'operatore') return; // Sola lettura
    if (highlightedDay) setHighlightedDay(null); // Clear highlight when starting manual edits

    if (paintModeCode) {
      assignShift(opId, dateStr, paintModeCode);
    } else {
      setSelectedCell({ opId, dateStr, currentCode });
    }
  };

  // Bottom stats calculations
  const getDailyStats = (d: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let mCount = 0;
    let pCount = 0;
    let nCount = 0;
    let tcCount = 0;
    let fCount = 0;

    operators.forEach(op => {
      if (op.stato !== 'attivo') return;
      const code = scheduleMap[op.id]?.[dateStr] || 'L';
      const cat = getShiftCategory(code);

      if (cat === 'mattina') mCount++;
      if (cat === 'pomeriggio') pCount++;
      if (cat === 'notte') nCount++;
      if (code.includes('TC')) tcCount++;
      if (cat === 'ferie') fCount++;
    });

    return { mCount, pCount, nCount, tcCount, fCount };
  };

  // Month navigation
  const handlePrevMonth = () => {
    setHighlightedDay(null);
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    setHighlightedDay(null);
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Render cell element
  const renderCell = (opId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const code = scheduleMap[opId]?.[dateStr] || 'L';
    const bgColor = getShiftColor(code);
    const textContrast = getShiftTextContrastColor(bgColor);
    const isWk = isWeekend(year, month, day);
    const isHol = isHoliday(year, month, day);
    const isHighlighted = day === highlightedDay;

    let cellBorder = 'border-slate-200';
    if (isWk) cellBorder = 'border-slate-300';
    if (isHighlighted) cellBorder = 'border-rose-500 border-2';

    return (
      <td 
        key={day}
        onClick={() => handleCellClick(opId, dateStr, code)}
        style={{ backgroundColor: code !== 'L' ? bgColor : undefined }}
        className={`w-10 h-10 border text-center font-bold text-xs select-none transition-all ${
          userRole === 'operatore' ? 'cursor-default' : 'cursor-pointer hover:brightness-90'
        } ${cellBorder} ${
          isHighlighted ? 'ring-2 ring-rose-500 ring-inset animate-pulse' : ''
        } ${
          code !== 'L' ? textContrast : (isWk || isHol ? 'bg-amber-50/70 hover:bg-amber-100' : 'bg-white hover:bg-slate-100')
        }`}
      >
        {code !== 'L' ? code : ''}
      </td>
    );
  };

  // Run generator for the current month
  const handleGenerateCurrentMonth = async () => {
    setLoading(true);
    setHighlightedDay(null);
    await new Promise(resolve => setTimeout(resolve, 850));
    runAutoGeneration([]);
    setLoading(false);
    
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // NLP chat Assistant command parser
  const handleCommandChange = (text: string) => {
    setCommandText(text);
    const { actions, message } = parseCommand(text, year, month, operators, shifts, schedule);
    setParsedActions(actions);
    setAssistantMessage(message);
  };

  const handleApplyAssistant = () => {
    if (parsedActions.length === 0) return;
    
    const schedulesToApply = parsedActions.map(a => ({
      id: `${a.operatoreId}_${a.data}`,
      operatoreId: a.operatoreId,
      data: a.data,
      codiceTurno: a.nuovoTurno
    }));

    assignMultipleShifts(schedulesToApply);
    
    setCommandText('');
    setParsedActions([]);
    setAssistantMessage('Modifiche applicate con successo!');
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    setTimeout(() => {
      setAssistantMessage('');
    }, 3000);
  };

  // Apply Quick Ferie Form with Auto Healing
  const handleApplyFerieForm = () => {
    if (!formOpId) {
      setAssistantMessage('Seleziona un dipendente.');
      return;
    }

    if (formStartDay > formEndDay) {
      setAssistantMessage('Il giorno di inizio deve precedere o essere uguale a quello di fine.');
      return;
    }

    const updates: DailySchedule[] = [];
    const logs: string[] = [];

    // Track hours mapped in current state to balance replacements
    const workingHours: Record<string, number> = {};
    operators.forEach(op => {
      let sum = 0;
      for (let d = 1; d <= numDays; d++) {
        sum += getShiftHours(getCurrentShift(op.id, d));
      }
      workingHours[op.id] = sum;
    });

    for (let d = formStartDay; d <= formEndDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isFest = isWeekend(year, month, d) || isHoliday(year, month, d);
      
      const prevShiftCode = getCurrentShift(formOpId, d);
      const prevShiftCat = getShiftCategory(prevShiftCode);

      // 1. Assign Ferie to selected operator
      updates.push({
        id: `${formOpId}_${dateStr}`,
        operatoreId: formOpId,
        data: dateStr,
        codiceTurno: formShiftCode
      });

      // 2. Auto-heal: If the operator was assigned a working shift, find a substitute
      if (autoHeal && ['mattina', 'pomeriggio', 'notte'].includes(prevShiftCat)) {
        // Find available colleagues for day d
        const candidates = activeOps.filter(op => {
          if (op.id === formOpId) return false;
          
          // Must not already have a working shift on day d (must be L)
          const currentDayShift = getCurrentShift(op.id, d);
          if (currentDayShift !== 'L') return false;

          // Must satisfy limitations
          if (prevShiftCat === 'notte' && op.escludiNotti) return false;
          if (prevShiftCat !== 'mattina' && op.soloMattina) return false;
          if (isFest && op.escludiWeekend) return false;

          // Must satisfy rest constraints
          const yesterdayShift = d === 1 ? 'L' : getCurrentShift(op.id, d - 1);
          if (getShiftCategory(yesterdayShift) === 'notte') return false; // Must be smonto today

          const twoDaysAgoShift = d <= 2 ? 'L' : getCurrentShift(op.id, d - 2);
          if (getShiftCategory(twoDaysAgoShift) === 'notte') {
            // Yesterday was smonto, today must be riposo
            const yesterdayCode = d === 1 ? 'L' : getCurrentShift(op.id, d - 1);
            if (yesterdayCode === 'L') return false;
          }

          return true;
        });

        if (candidates.length > 0) {
          // Sort by total worked hours ascending to keep balance
          candidates.sort((a, b) => workingHours[a.id] - workingHours[b.id]);
          const selectedColleague = candidates[0];

          updates.push({
            id: `${selectedColleague.id}_${dateStr}`,
            operatoreId: selectedColleague.id,
            data: dateStr,
            codiceTurno: prevShiftCode
          });

          // Update local counter
          workingHours[selectedColleague.id] += getShiftHours(prevShiftCode);
          logs.push(`Giorno ${d}: ${selectedColleague.cognome} sostituisce ${operators.find(o => o.id === formOpId)?.cognome} (${prevShiftCode})`);
        } else {
          logs.push(`Giorno ${d}: Nessun sostituto idoneo trovato per il turno ${prevShiftCode}`);
        }
      }
    }

    assignMultipleShifts(updates);
    setAssistantMessage(`Assegnato ${formShiftCode}. ${logs.length > 0 ? `Sostituzioni: ${logs.join('; ')}` : ''}`);
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    setTimeout(() => {
      setAssistantMessage('');
    }, 4500);
  };

  // Apply Quick Swap Form
  const handleApplySwapForm = () => {
    if (!swapOpId1 || !swapOpId2) {
      setAssistantMessage('Seleziona entrambi i colleghi.');
      return;
    }
    if (swapOpId1 === swapOpId2) {
      setAssistantMessage('Seleziona due dipendenti diversi.');
      return;
    }
    if (swapDay < 1 || swapDay > numDays) {
      setAssistantMessage(`Giorno ${swapDay} non valido.`);
      return;
    }

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(swapDay).padStart(2, '0')}`;
    const shift1 = getCurrentShift(swapOpId1, swapDay);
    const shift2 = getCurrentShift(swapOpId2, swapDay);

    if (shift1 === shift2) {
      setAssistantMessage(`Entrambi hanno lo stesso turno (${shift1}). Scambio annullato.`);
      return;
    }

    const op1 = operators.find(o => o.id === swapOpId1);
    const op2 = operators.find(o => o.id === swapOpId2);

    const updates = [
      { id: `${swapOpId1}_${dateStr}`, operatoreId: swapOpId1, data: dateStr, codiceTurno: shift2 },
      { id: `${swapOpId2}_${dateStr}`, operatoreId: swapOpId2, data: dateStr, codiceTurno: shift1 }
    ];

    assignMultipleShifts(updates);
    setAssistantMessage(`Scambiati i turni il giorno ${swapDay} tra ${op1?.cognome} (${shift1} ⇄ ${shift2}) e ${op2?.cognome} (${shift2} ⇄ ${shift1}).`);
    
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.8 }
    });

    setTimeout(() => {
      setAssistantMessage('');
    }, 4000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      
      {/* Top action bar */}
      <div className="p-6 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between no-print gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Tabellone Turni</span>
            <div className="flex items-center space-x-2 mt-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all border border-slate-200"
                title="Mese Precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0 select-none">
                {monthNames[month - 1]} {year}
              </h2>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all border border-slate-200"
                title="Mese Successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'coordinatore' && (
            <>
              {/* AI Assistant Button */}
              <button
                onClick={() => setShowAssistant(!showAssistant)}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm border transition-all ${
                  showAssistant 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-600/15' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bot className={`w-4 h-4 ${showAssistant ? 'text-white' : 'text-indigo-600'}`} />
                <span>Assistente Smart</span>
              </button>

              {/* Quick Generate Button */}
              <button
                onClick={handleGenerateCurrentMonth}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{loading ? 'Generazione...' : 'Genera Turni'}</span>
              </button>

              {workedShiftsCount > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler azzerare tutti i turni del mese di ${monthNames[month - 1]} ${year}?`)) {
                      clearMonthSchedule(year, month);
                    }
                  }}
                  className="px-4 py-2 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-all"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Azzera Mese</span>
                </button>
              )}

              {/* Paintbrush tool */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPaintModeCode(paintModeCode ? null : 'L')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    paintModeCode 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>{paintModeCode ? `Pennello: ${paintModeCode}` : 'Pennello Turni'}</span>
                </button>
                {paintModeCode && (
                  <select
                    value={paintModeCode}
                    onChange={(e) => setPaintModeCode(e.target.value)}
                    className="bg-transparent border-0 text-slate-800 text-xs font-bold focus:ring-0 focus:outline-none cursor-pointer pl-1 py-0.5"
                  >
                    {shifts.map(s => (
                      <option key={s.codice} value={s.codice}>{s.codice}</option>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}

          <button 
            onClick={exportExcelFile}
            className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-all"
          >
            <Copy className="w-4 h-4 text-emerald-600" />
            <span>Esporta Excel</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-md transition-all"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Stampa A4</span>
          </button>
        </div>
      </div>

      {/* Grid and Assistant layout wrapper */}
      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        
        {/* Main Grid View */}
        <div className="flex-1 overflow-auto p-6 min-w-0 min-h-0">
          
          {/* Empty state Call To Action */}
          {workedShiftsCount === 0 && !loading && userRole === 'coordinatore' && (
            <div className="mb-6 p-6 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col md:flex-row items-center justify-between no-print gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-3 bg-sky-100 text-sky-600 rounded-full">
                  <Wand2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 m-0">Questo mese è vuoto!</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Non ci sono turni programmati per il mese di <strong>{monthNames[month - 1]} {year}</strong>. 
                    Avvia la generazione automatica per riempire il mese rispettando tutti i riposi in 3 secondi.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateCurrentMonth}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/10 transition-all hover:scale-[1.02] shrink-0"
              >
                Genera Turni Ora
              </button>
            </div>
          )}

          {/* PRINT ONLY HEADER */}
          <div className="hidden print-only mb-6 text-center">
            <div className="flex items-center justify-between border-b border-black pb-4">
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-tight text-black m-0">AZIENDA USL Toscana sud est AREZZO</h3>
                <p className="text-xs text-black m-0 mt-0.5">U.O. PROFESSIONALE DIAGNOSTICA PER IMMAGINI</p>
                <p className="text-xs text-black font-semibold m-0">T.S.R.M. RADIOLOGIA DEU</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-black text-black uppercase m-0">{monthNames[month - 1]} {year}</h2>
              </div>
            </div>
          </div>

          {/* Scrollable table grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="table-fixed border-collapse select-none" style={{ width: `${224 + numDays * 40}px` }}>
              <thead>
                <tr className="bg-slate-50 text-slate-700 select-none">
                  <th className="w-56 px-4 py-3 text-left font-bold text-xs border-b border-slate-200 bg-slate-50 sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    Operatore
                  </th>
                  {Array.from({ length: numDays }).map((_, i) => {
                    const day = i + 1;
                    const isWk = isWeekend(year, month, day);
                    const isHol = isHoliday(year, month, day);
                    const isHighlighted = day === highlightedDay;
                    return (
                      <th 
                        key={day} 
                        className={`w-10 py-2 text-center font-bold text-xs border-b border-slate-200 border-r transition-all ${
                          isHighlighted
                            ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_10px_#ef4444] z-20'
                            : (isWk ? 'bg-amber-100/50 text-amber-900' : (isHol ? 'bg-rose-100 text-rose-950' : 'bg-slate-50'))
                        }`}
                      >
                        {String(day).padStart(2, '0')}
                      </th>
                    );
                  })}
                </tr>
                <tr className="bg-slate-50 text-slate-500 select-none">
                  <th className="px-4 py-1 text-left font-semibold text-[10px] border-b border-slate-200 bg-slate-50 sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]"></th>
                  {Array.from({ length: numDays }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month - 1, day);
                    const label = weekdaysMap[date.getDay()];
                    const isWk = isWeekend(year, month, day);
                    const isHol = isHoliday(year, month, day);
                    const isHighlighted = day === highlightedDay;
                    return (
                      <th 
                        key={day} 
                        className={`py-1 text-center font-bold text-[9px] uppercase border-b border-slate-200 border-r transition-all ${
                          isHighlighted
                            ? 'bg-rose-400 text-white animate-pulse'
                            : (isWk ? 'bg-amber-100/30 text-amber-700' : (isHol ? 'bg-rose-100/60 text-rose-800' : 'bg-slate-50'))
                        }`}
                      >
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operators.map(op => {
                  const isInactive = op.stato !== 'attivo';
                  return (
                    <tr 
                      key={op.id} 
                      className={`hover:bg-slate-50/50 ${isInactive ? 'opacity-50 bg-slate-100/30' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-semibold text-xs text-slate-900 border-b border-slate-100 border-r bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div>
                          {op.cognome} {op.nome}
                          {isInactive && (
                            <span className="ml-1.5 px-1 py-0.5 bg-slate-200 text-[8px] text-slate-600 rounded">
                              {op.stato === 'sospeso' ? 'Sospeso' : 'Ferie AP'}
                            </span>
                          )}
                        </div>
                      </td>
                      {Array.from({ length: numDays }).map((_, i) => renderCell(op.id, i + 1))}
                    </tr>
                  );
                })}

                <tr className="bg-slate-100 h-2 select-none print:hidden">
                  <td colSpan={numDays + 1} className="p-0 border-y border-slate-200"></td>
                </tr>

                {['M', 'P', 'N', 'TC', 'F'].map(statType => {
                  return (
                    <tr key={statType} className="bg-slate-50 select-none">
                      <td className="px-4 py-1.5 font-bold text-xs text-slate-700 border-r border-slate-200 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-left">
                        {statType === 'M' && 'M (Min. 3)'}
                        {statType === 'P' && 'P (Min. 3)'}
                        {statType === 'N' && 'N (Min. 2)'}
                        {statType === 'TC' && 'TC (Diagnostica/TAC)'}
                        {statType === 'F' && 'F (Ferie in corso)'}
                      </td>
                      {Array.from({ length: numDays }).map((_, i) => {
                        const day = i + 1;
                        const stats = getDailyStats(day);
                        let count = 0;
                        let isViolated = false;

                        if (statType === 'M') {
                          count = stats.mCount;
                          isViolated = count < 3;
                        } else if (statType === 'P') {
                          count = stats.pCount;
                          isViolated = count < 3;
                        } else if (statType === 'N') {
                          count = stats.nCount;
                          isViolated = count < 2;
                        } else if (statType === 'TC') {
                          count = stats.tcCount;
                        } else if (statType === 'F') {
                          count = stats.fCount;
                        }

                        return (
                          <td 
                            key={day}
                            className={`text-center font-bold text-xs border-r border-slate-200 py-1.5 transition-all ${
                              isViolated 
                                ? 'bg-rose-100 text-rose-800 font-extrabold' 
                                : (statType === 'M' || statType === 'P' || statType === 'N' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600')
                            }`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PRINT ONLY FOOTER SIGNATURES */}
          <div className="hidden print-only mt-8 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <p className="font-semibold text-black">IL COORDINATORE DI SETTORE</p>
              <p className="mt-8 text-black border-t border-black border-dotted pt-1 max-w-[200px] mx-auto">ELPIDIO MONACO</p>
            </div>
            <div>
              <p className="font-semibold text-black">IL DIRETTORE U.O. DIAGNOSTICA PER IMMAGINI</p>
              <p className="mt-8 text-black border-t border-black border-dotted pt-1 max-w-[200px] mx-auto">IVANO ROSSI</p>
            </div>
          </div>

          {/* PRINT ONLY LEGENDA AT THE VERY END */}
          <div className="hidden print-only mt-6 border-t border-black pt-4">
            <p className="font-bold text-[10px] text-black tracking-wider uppercase mb-2">LEGENDA CODICI TURNO</p>
            <div className="grid grid-cols-4 gap-x-6 gap-y-1 text-[8px] text-black">
              {shifts.map(s => (
                <div key={s.codice} className="flex items-center space-x-2">
                  <span className="font-bold border border-black px-1.5 py-0.5 rounded w-8 text-center">{s.codice}</span>
                  <span>{s.descrizione} {s.orarioInizio !== '-' ? `(${s.orarioInizio}-${s.orarioFine})` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paint mode instructions banner */}
          {paintModeCode && (
            <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center space-x-3 no-print">
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <span className="text-xs text-sky-800 font-medium">
                <strong>Modalità Pennello Attiva</strong>: Clicca su una cella qualsiasi per assegnare immediatamente il turno <strong>{paintModeCode}</strong>. Clicca di nuovo sul pulsante in alto per disattivare la modalità copia.
              </span>
            </div>
          )}

        </div>

        {/* AI Assistant & Quick Form Sidebar Panel (No-Print) */}
        {showAssistant && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col no-print animate-in slide-in-from-right duration-250 shrink-0 select-none">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800 m-0">Assistente Turni</h3>
              </div>
              <button 
                onClick={() => setShowAssistant(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setAssistantTab('form')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                  assistantTab === 'form' 
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Modifiche Veloci
              </button>
              <button
                onClick={() => setAssistantTab('chat')}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                  assistantTab === 'chat' 
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Comandi Chat
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              
              {/* TAB 1: QUICK VISUAL FORM */}
              {assistantTab === 'form' && (
                <div className="space-y-5">
                  {/* Quick Ferie Section */}
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5 m-0">
                      <CalendarDays className="w-4 h-4 text-sky-500" />
                      <span>Inserimento Ferie / Assenza</span>
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Dipendente</label>
                        <select
                          value={formOpId}
                          onChange={(e) => setFormOpId(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option value="">Seleziona...</option>
                          {operators.map(op => (
                            <option key={op.id} value={op.id}>{op.cognome} {op.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Dal giorno</label>
                          <input
                            type="number"
                            min={1}
                            max={numDays}
                            value={formStartDay}
                            onChange={(e) => setFormStartDay(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Al giorno</label>
                          <input
                            type="number"
                            min={1}
                            max={numDays}
                            value={formEndDay}
                            onChange={(e) => setFormEndDay(Number(e.target.value))}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Tipo Assenza</label>
                        <select
                          value={formShiftCode}
                          onChange={(e) => setFormShiftCode(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option value="F">F - Ferie</option>
                          <option value="F ap">F ap - Ferie Anno Precedente</option>
                          <option value="MAL">MAL - Malattia</option>
                          <option value="104">104 - Permesso Legge 104</option>
                          <option value="MATERNITA'">MATERNITÀ</option>
                          <option value="L">L - Libero / Annulla Turno</option>
                        </select>
                      </div>

                      {/* Auto healing toggle */}
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="checkbox"
                          id="autoHeal"
                          checked={autoHeal}
                          onChange={(e) => setAutoHeal(e.target.checked)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/20"
                        />
                        <label htmlFor="autoHeal" className="text-[10px] text-slate-600 font-bold cursor-pointer">
                          Trova sostituti automatici per i turni scoperti
                        </label>
                      </div>

                      <button
                        onClick={handleApplyFerieForm}
                        className="w-full mt-2 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Applica Ferie e Sostituisci
                      </button>
                    </div>
                  </div>

                  {/* Quick Swap Section */}
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5 m-0">
                      <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                      <span>Scambio Turni Veloce</span>
                    </h4>

                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Collega A</label>
                        <select
                          value={swapOpId1}
                          onChange={(e) => setSwapOpId1(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option value="">Seleziona...</option>
                          {activeOps.map(op => (
                            <option key={op.id} value={op.id}>{op.cognome} {op.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Collega B</label>
                        <select
                          value={swapOpId2}
                          onChange={(e) => setSwapOpId2(e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option value="">Seleziona...</option>
                          {activeOps.map(op => (
                            <option key={op.id} value={op.id}>{op.cognome} {op.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Giorno</label>
                        <input
                          type="number"
                          min={1}
                          max={numDays}
                          value={swapDay}
                          onChange={(e) => setSwapDay(Number(e.target.value))}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleApplySwapForm}
                        className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Esegui Scambio Turni
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHAT COMMAND INTERFACE */}
              {assistantTab === 'chat' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-xs text-slate-700 flex items-center space-x-1.5 mb-2">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                      <span>Comandi Consigliati</span>
                    </h4>
                    <div className="text-[11px] text-slate-500 space-y-2">
                      <button 
                        onClick={() => handleCommandChange("scambia Fedeli e Guerrini il 12")}
                        className="w-full text-left p-1.5 bg-white border border-slate-200/50 rounded hover:bg-slate-100 transition-all font-mono"
                      >
                        scambia Fedeli e Guerrini il 12
                      </button>
                      <button 
                        onClick={() => handleCommandChange("ferie Fedeli dal 10 al 15")}
                        className="w-full text-left p-1.5 bg-white border border-slate-200/50 rounded hover:bg-slate-100 transition-all font-mono"
                      >
                        ferie Fedeli dal 10 al 15
                      </button>
                      <button 
                        onClick={() => handleCommandChange("metti Peruzzi in M3 il 5")}
                        className="w-full text-left p-1.5 bg-white border border-slate-200/50 rounded hover:bg-slate-100 transition-all font-mono"
                      >
                        metti Peruzzi in M3 il 5
                      </button>
                      <button 
                        onClick={() => handleCommandChange("riposo Tenti il 8")}
                        className="w-full text-left p-1.5 bg-white border border-slate-200/50 rounded hover:bg-slate-100 transition-all font-mono"
                      >
                        riposo Tenti il 8
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Digita Comando</label>
                    <textarea 
                      rows={3}
                      value={commandText}
                      onChange={(e) => handleCommandChange(e.target.value)}
                      placeholder="Scrivi qui per operare cambi o ferie..."
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none font-medium text-slate-800"
                    />
                  </div>

                  {parsedActions.length > 0 && (
                    <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50 animate-in fade-in zoom-in-95 duration-150">
                      <h4 className="font-bold text-xs text-slate-700 m-0 uppercase tracking-wider">Anteprima cambi:</h4>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pt-1">
                        {parsedActions.map((act, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] bg-white border border-slate-100 p-2 rounded-lg">
                            <div>
                              <span className="font-bold text-slate-900">{act.operatoreNome}</span>
                              <p className="text-slate-500 m-0 mt-0.5">Giorno {act.giorno} • {act.descrizione}</p>
                            </div>
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold shrink-0 font-mono ml-2">
                              {act.nuovoTurno}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleApplyAssistant}
                        className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Applica Modifiche</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status/Feedback message box */}
              {assistantMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold animate-in fade-in duration-200 ${
                  parsedActions.length > 0 || (assistantTab === 'form' && assistantMessage.includes('Assegnato'))
                    ? 'bg-sky-50 border border-sky-100 text-sky-800' 
                    : (commandText ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800')
                }`}>
                  {assistantMessage}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
              Motore NLP offline attivo H24
            </div>
          </div>
        )}

      </div>

      {/* EDITING POPUP MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Assegnazione Turno</span>
                <h3 className="text-lg font-black text-slate-800 mt-0.5">
                  Seleziona Turno del {new Date(selectedCell.dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[350px]">
              <div className="grid grid-cols-2 gap-3">
                {shifts.map(s => {
                  const isCurrent = s.codice === selectedCell.currentCode;
                  const bg = s.colore;
                  const text = getShiftTextContrastColor(bg);

                  return (
                    <button
                      key={s.codice}
                      onClick={() => {
                        assignShift(selectedCell.opId, selectedCell.dateStr, s.codice);
                        setSelectedCell(null);
                      }}
                      style={{ borderLeftColor: bg }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border border-l-4 text-left hover:bg-slate-50 transition-all ${
                        isCurrent 
                          ? 'border-sky-600/30 bg-sky-50/30 shadow-inner' 
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                          <span 
                            style={{ backgroundColor: bg }} 
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${text}`}
                          >
                            {s.codice}
                          </span>
                          <span>{s.codice}</span>
                        </span>
                        <span className="text-xs text-slate-500 mt-1 truncate max-w-[140px]">
                          {s.descrizione}
                        </span>
                      </div>
                      {isCurrent && <Check className="w-5 h-5 text-sky-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button 
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
