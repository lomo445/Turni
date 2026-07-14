import type { Operator, ShiftType, DailySchedule, RuleSettings, OperatorPreferences } from '../types';
import { getItalianHolidays } from '../constants/initialData';

export interface GenerationError {
  tipo: 'critico' | 'warning';
  giorno: number;
  operatoreId?: string;
  messaggio: string;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function isHoliday(year: number, month: number, day: number): boolean {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const holidays = getItalianHolidays(year);
  return dateStr in holidays;
}

export function generateSchedule(
  year: number,
  month: number,
  operators: Operator[],
  shiftTypes: ShiftType[],
  previousSchedule: DailySchedule[],
  currentMonthLeaves: DailySchedule[],
  fullHistory: DailySchedule[],
  rules: RuleSettings
): { schedule: DailySchedule[]; errors: GenerationError[] } {
  
  if (rules.turnationApproach === 'arezzo_15') {
    return generateArezzo15Cycle(year, month, operators, shiftTypes, currentMonthLeaves);
  } else {
    return generateDynamicGreedy(year, month, operators, shiftTypes, previousSchedule, currentMonthLeaves, fullHistory, rules);
  }
}

function generateArezzo15Cycle(
  year: number,
  month: number,
  operators: Operator[],
  shiftTypes: ShiftType[],
  currentMonthLeaves: DailySchedule[]
): { schedule: DailySchedule[]; errors: GenerationError[] } {
  const numDays = new Date(year, month, 0).getDate();
  const activeOperators = operators.filter(o => o.stato === 'attivo').sort((a, b) => a.cognome.localeCompare(b.cognome));
  
  if (activeOperators.length === 0) return { schedule: [], errors: [{ tipo: 'critico', giorno: 1, messaggio: 'Nessun operatore attivo in reparto!' }] };

  const errors: GenerationError[] = [];
  const getShiftCategory = (code: string) => shiftTypes.find(s => s.codice === code)?.categoria || 'riposo';
  const getShiftHours = (code: string) => shiftTypes.find(s => s.codice === code)?.durataOre || 0;

  const preassigned: Record<string, Record<string, string>> = {};
  currentMonthLeaves.forEach(s => {
    if (!preassigned[s.data]) preassigned[s.data] = {};
    preassigned[s.data][s.operatoreId] = s.codiceTurno;
  });

  const CYCLE = ['P', 'M', 'N', 'L', 'L', 'P', 'M', 'N', 'L', 'L', 'J', 'J', 'J', 'J', 'J'];
  const EPOCH_DATE = new Date(2026, 7, 1);
  const OPERATOR_EPOCH_OFFSETS: Record<string, number> = {
    'fedeli': 5, 'ferrante': 0, 'guerrini g': 10, 'guerrini g.': 10,
    'tenti': 4, 'donati': 9, 'guerrini s': 14, 'guerrini s.': 14,
    'peruzzi': 3, 'testi': 8, 'morano': 13,
    'mondanelli': 2, 'mancini': 7, 'arrais': 12,
    'degl\'innocenti': 6, 'degl innocenti': 6, 'camisa': 11, 'gattari': 1
  };

  const targetDate = new Date(year, month - 1, 1);
  const diffTime = targetDate.getTime() - EPOCH_DATE.getTime();
  const daysSinceEpoch = Math.round(diffTime / (1000 * 3600 * 24));

  const offsets: Record<string, number> = {};
  const unassignedOps: string[] = [];

  activeOperators.forEach(op => {
    const cognomeNorm = op.cognome.toLowerCase().trim();
    let epochOffset = OPERATOR_EPOCH_OFFSETS[cognomeNorm];
    if (epochOffset === undefined) {
      const match = Object.keys(OPERATOR_EPOCH_OFFSETS).find(k => cognomeNorm.includes(k));
      if (match) epochOffset = OPERATOR_EPOCH_OFFSETS[match];
    }
    if (epochOffset !== undefined) {
      offsets[op.id] = (epochOffset + daysSinceEpoch + 1500000) % 15;
    } else {
      unassignedOps.push(op.id);
    }
  });

  const usedOffsets = new Set(Object.values(offsets));
  const availableOffsets: number[] = [];
  for (let i = 0; i < 15; i++) {
    if (!usedOffsets.has(i)) availableOffsets.push(i);
  }
  
  unassignedOps.forEach(opId => {
    if (availableOffsets.length > 0) offsets[opId] = availableOffsets.shift()!;
    else offsets[opId] = 0;
  });

  const finalSchedule: DailySchedule[] = [];
  const hours: Record<string, number> = {};
  const weekends: Record<string, number> = {};
  activeOperators.forEach(op => { hours[op.id] = 0; weekends[op.id] = 0; });

  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const preassignedOnDay = preassigned[dateStr] || {};
    
    const isSunday = new Date(year, month - 1, d).getDay() === 0;
    const isFestivo = isSunday || isHoliday(year, month, d);

    let mNeeded = isFestivo ? 2 : 3;
    let pNeeded = isFestivo ? 2 : 3;
    let nNeeded = 2;

    const jollies: string[] = [];
    const dayAssignments: Record<string, string> = {};

    activeOperators.forEach(op => {
      const pre = preassignedOnDay[op.id];
      if (pre) {
        dayAssignments[op.id] = pre;
        const cat = getShiftCategory(pre);
        if (cat === 'mattina') mNeeded--;
        else if (cat === 'pomeriggio') pNeeded--;
        else if (cat === 'notte') nNeeded--;
        
        hours[op.id] += getShiftHours(pre);
        if (isFestivo && cat !== 'riposo' && cat !== 'ferie') weekends[op.id]++;
        return;
      }

      const cycleIndex = (offsets[op.id] + d - 1) % 15;
      const baseShift = CYCLE[cycleIndex];

      if (baseShift === 'P') {
        const codes = isFestivo ? ['P1', 'P2'] : ['P1', 'P2', 'P3'];
        const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'P1';
        dayAssignments[op.id] = assignedCode;
        pNeeded--;
        hours[op.id] += 6.5;
        if (isFestivo) weekends[op.id]++;
      } else if (baseShift === 'M') {
        const codes = isFestivo ? ['M1', 'M2'] : ['M1', 'M2', 'M3'];
        const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'M1';
        dayAssignments[op.id] = assignedCode;
        mNeeded--;
        hours[op.id] += 6.5;
        if (isFestivo) weekends[op.id]++;
      } else if (baseShift === 'N') {
        const codes = ['N1', 'N2'];
        const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'N1';
        dayAssignments[op.id] = assignedCode;
        nNeeded--;
        hours[op.id] += 11;
        if (isFestivo) weekends[op.id]++;
      } else if (baseShift === 'L') {
        dayAssignments[op.id] = 'L';
      } else if (baseShift === 'J') {
        jollies.push(op.id);
      }
    });

    jollies.sort((a, b) => {
      if (isFestivo && weekends[a] !== weekends[b]) return weekends[a] - weekends[b];
      return hours[a] - hours[b];
    });

    while (pNeeded > 0 && jollies.length > 0) {
      const opId = jollies.shift()!;
      const codes = isFestivo ? ['P1', 'P2'] : ['P1', 'P2', 'P3'];
      const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'P1';
      dayAssignments[opId] = assignedCode;
      pNeeded--;
      hours[opId] += 6.5;
      if (isFestivo) weekends[opId]++;
    }

    while (mNeeded > 0 && jollies.length > 0) {
      const opId = jollies.shift()!;
      const codes = isFestivo ? ['M1', 'M2'] : ['M1', 'M2', 'M3'];
      const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'M1';
      dayAssignments[opId] = assignedCode;
      mNeeded--;
      hours[opId] += 6.5;
      if (isFestivo) weekends[opId]++;
    }

    jollies.forEach(opId => { dayAssignments[opId] = 'L'; });

    if (nNeeded > 0) errors.push({ tipo: 'critico', giorno: d, messaggio: `Mancano ${nNeeded} turni di Notte e nessun Jolly disponibile.` });
    if (pNeeded > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${pNeeded} turni di Pomeriggio.` });
    if (mNeeded > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${mNeeded} turni di Mattina.` });

    Object.keys(dayAssignments).forEach(opId => {
      finalSchedule.push({ id: `${opId}_${dateStr}`, operatoreId: opId, data: dateStr, codiceTurno: dayAssignments[opId] });
    });
  }

  activeOperators.forEach(op => {
    if (hours[op.id] > op.oreContrattualiMensili) {
      errors.push({ tipo: 'warning', giorno: numDays, operatoreId: op.id, messaggio: `${op.cognome} supera il monte ore mensile (${Math.round(hours[op.id])}/${op.oreContrattualiMensili} ore)` });
    }
  });

  return { schedule: finalSchedule, errors: errors.sort((a, b) => a.giorno - b.giorno) };
}

function generateDynamicGreedy(
  year: number,
  month: number,
  operators: Operator[],
  shiftTypes: ShiftType[],
  previousSchedule: DailySchedule[],
  currentMonthLeaves: DailySchedule[],
  fullHistory: DailySchedule[],
  rules: RuleSettings
): { schedule: DailySchedule[]; errors: GenerationError[] } {
  if (fullHistory) { /* no-op */ }
  
  const numDays = new Date(year, month, 0).getDate();
  const activeOperators = operators.filter(o => o.stato === 'attivo').sort((a, b) => a.cognome.localeCompare(b.cognome));
  
  if (activeOperators.length === 0) return { schedule: [], errors: [{ tipo: 'critico', giorno: 1, messaggio: 'Nessun operatore attivo in reparto!' }] };

  const errors: GenerationError[] = [];
  const getShiftCategory = (code: string) => shiftTypes.find(s => s.codice === code)?.categoria || 'riposo';
  const getShiftHours = (code: string) => shiftTypes.find(s => s.codice === code)?.durataOre || 0;

  const preassigned: Record<string, Record<string, string>> = {};
  currentMonthLeaves.forEach(s => {
    if (!preassigned[s.data]) preassigned[s.data] = {};
    preassigned[s.data][s.operatoreId] = s.codiceTurno;
  });

  // Inject user preferences (Ferie & Date Non Disponibili)
  activeOperators.forEach(op => {
    if (op.preferences?.ferieProgrammate) {
      op.preferences.ferieProgrammate.forEach(dateStr => {
        if (!preassigned[dateStr]) preassigned[dateStr] = {};
        if (!preassigned[dateStr][op.id]) preassigned[dateStr][op.id] = 'F';
      });
    }
    if (op.preferences?.dateNonDisponibili) {
      op.preferences.dateNonDisponibili.forEach(dateStr => {
        if (!preassigned[dateStr]) preassigned[dateStr] = {};
        if (!preassigned[dateStr][op.id]) preassigned[dateStr][op.id] = 'L';
      });
    }
  });

  const finalSchedule: DailySchedule[] = [];
  const hours: Record<string, number> = {};
  const assignmentsByOp: Record<string, DailySchedule[]> = {};
  
  activeOperators.forEach(op => { 
    hours[op.id] = 0; 
    assignmentsByOp[op.id] = previousSchedule.filter(s => s.operatoreId === op.id);
  });

  const addAssignment = (opId: string, dateStr: string, code: string) => {
    const sched = { id: `${opId}_${dateStr}`, operatoreId: opId, data: dateStr, codiceTurno: code };
    finalSchedule.push(sched);
    assignmentsByOp[opId].push(sched);
    hours[opId] += getShiftHours(code);
  };

  const hasWorkedNightYesterday = (opId: string, dateStr: string) => {
    const yesterday = new Date(dateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    
    const pre = preassigned[yesterdayStr]?.[opId];
    if (pre && getShiftCategory(pre) === 'notte') return true;

    const hist = assignmentsByOp[opId].find(s => s.data === yesterdayStr);
    return hist && getShiftCategory(hist.codiceTurno) === 'notte';
  };

  const getConsecutiveWorkDays = (opId: string, dateStr: string) => {
    let cons = 0;
    const curr = new Date(dateStr);
    curr.setDate(curr.getDate() - 1);
    while (true) {
      const dStr = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
      const hist = assignmentsByOp[opId].find(s => s.data === dStr);
      if (!hist) break;
      const cat = getShiftCategory(hist.codiceTurno);
      if (cat === 'riposo' || cat === 'ferie' || cat === 'assenza') break;
      cons++;
      curr.setDate(curr.getDate() - 1);
    }
    return cons;
  };

  const availableShifts = shiftTypes.reduce((acc, curr) => {
    if (!acc[curr.categoria]) acc[curr.categoria] = [];
    acc[curr.categoria].push(curr.codice);
    return acc;
  }, {} as Record<string, string[]>);

  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const preassignedOnDay = preassigned[dateStr] || {};
    
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const isSunday = dayOfWeek === 0;
    const isFestivo = isSunday || isHoliday(year, month, d);

    if (isFestivo && !rules.openOnWeekends) {
      activeOperators.forEach(op => {
        if (!preassignedOnDay[op.id]) addAssignment(op.id, dateStr, 'L');
        else addAssignment(op.id, dateStr, preassignedOnDay[op.id]);
      });
      continue;
    }

    let { morning: mNeeded, afternoon: pNeeded, night: nNeeded } = rules.dailyCoverage;
    if (!rules.openOnNights) nNeeded = 0;
    
    const dayAssignments: Record<string, string> = {};
    const availableOps = [...activeOperators];

    // Handle preassigned (Leaves/Holidays)
    availableOps.forEach((op, index) => {
      const pre = preassignedOnDay[op.id];
      if (pre) {
        dayAssignments[op.id] = pre;
        addAssignment(op.id, dateStr, pre);
        
        const cat = getShiftCategory(pre);
        if (cat === 'mattina') mNeeded--;
        else if (cat === 'pomeriggio') pNeeded--;
        else if (cat === 'notte') nNeeded--;
        availableOps[index] = null as any;
      }
    });

    const opsPool = availableOps.filter(Boolean);
    // Sort pool by least hours worked to balance load
    opsPool.sort((a, b) => hours[a.id] - hours[b.id]);

    const assignCategory = (needed: number, category: string, fallbackCode: string, restrictionKey?: keyof OperatorPreferences) => {
      let count = needed;
      for (const op of opsPool) {
        if (count <= 0) break;
        if (dayAssignments[op.id]) continue;
        if (restrictionKey && op.preferences?.[restrictionKey]) continue; // E.g., escludiNotti, soloMattina, etc.
        
        // Esclusioni Festivi e Weekend
        if (isFestivo && op.preferences?.escludiWeekend) continue;
        if (isFestivo && op.preferences?.escludiFestivi) continue;

        // Esclusioni giorni della settimana
        const dayOfWeek = new Date(year, month - 1, d).getDay(); // 0 is Sunday
        if (op.preferences?.giorniSettimanaNonDisponibili?.includes(dayOfWeek)) continue;

        // Rules Check
        if (rules.requireRestAfterNight && hasWorkedNightYesterday(op.id, dateStr)) continue;
        if (getConsecutiveWorkDays(op.id, dateStr) >= (op.preferences?.maxGiorniConsecutivi || rules.maxConsecutiveDays)) continue;
        
        const codes = availableShifts[category] || [fallbackCode];
        const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || codes[0] || fallbackCode;
        
        dayAssignments[op.id] = assignedCode;
        addAssignment(op.id, dateStr, assignedCode);
        count--;
      }
      return count; // remaining unassigned
    };

    const nRem = assignCategory(nNeeded, 'notte', 'N1', 'escludiNotti');
    const mRem = assignCategory(mNeeded, 'mattina', 'M1');
    const pRem = assignCategory(pNeeded, 'pomeriggio', 'P1', 'soloMattina');

    if (nRem > 0) errors.push({ tipo: 'critico', giorno: d, messaggio: `Mancano ${nRem} turni di Notte (potrebbero mancare operatori idonei o vincoli violati).` });
    if (mRem > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${mRem} turni di Mattina.` });
    if (pRem > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${pRem} turni di Pomeriggio.` });

    // Rest for everyone else
    opsPool.forEach(op => {
      if (!dayAssignments[op.id]) {
        dayAssignments[op.id] = 'L';
        addAssignment(op.id, dateStr, 'L');
      }
    });
  }

  activeOperators.forEach(op => {
    if (hours[op.id] > op.oreContrattualiMensili) {
      errors.push({ tipo: 'warning', giorno: numDays, operatoreId: op.id, messaggio: `${op.cognome} supera il monte ore mensile (${Math.round(hours[op.id])}/${op.oreContrattualiMensili} ore)` });
    }
  });

  return { schedule: finalSchedule, errors: errors.sort((a, b) => a.giorno - b.giorno) };
}

export function validateSchedule(
  year: number,
  month: number,
  schedule: DailySchedule[],
  operators: Operator[],
  shiftTypes: ShiftType[]
): GenerationError[] {
  const errors: GenerationError[] = [];
  const numDays = new Date(year, month, 0).getDate();
  
  const getShiftCategory = (code: string) => shiftTypes.find(s => s.codice === code)?.categoria || 'riposo';
  const getShiftHours = (code: string) => shiftTypes.find(s => s.codice === code)?.durataOre || 0;

  const scheduleMap: Record<string, Record<string, string>> = {};
  
  schedule.forEach(s => {
    if (!scheduleMap[s.operatoreId]) scheduleMap[s.operatoreId] = {};
    scheduleMap[s.operatoreId][s.data] = s.codiceTurno;
  });

  const activeOperators = operators.filter(o => o.stato === 'attivo');

  // We are not validating against dynamic rules here because this is just grid validation
  // It checks basic coverage and missing shifts.
  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let mCount = 0; let pCount = 0; let nCount = 0;

    activeOperators.forEach(op => {
      const code = scheduleMap[op.id]?.[dateStr];
      if (!code) {
        errors.push({ tipo: 'warning', giorno: d, operatoreId: op.id, messaggio: `Turno mancante per ${op.cognome}` });
      } else {
        const cat = getShiftCategory(code);
        if (cat === 'mattina') mCount++;
        else if (cat === 'pomeriggio') pCount++;
        else if (cat === 'notte') nCount++;
      }
    });

    const isSunday = new Date(year, month - 1, d).getDay() === 0;
    const isFestivo = isSunday || isHoliday(year, month, d);
    
    // Fallback coverage check (warning level) since we don't have RuleSettings here easily
    const targetM = isFestivo ? 2 : 3;
    const targetP = isFestivo ? 2 : 3;
    const targetN = 2;

    if (nCount < targetN && nCount > 0) errors.push({ tipo: 'critico', giorno: d, messaggio: `Copertura notturna insufficiente (${nCount}/${targetN})` });
    if (mCount < targetM && mCount > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Copertura mattina bassa (${mCount}/${targetM})` });
    if (pCount < targetP && pCount > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Copertura pomeriggio bassa (${pCount}/${targetP})` });
  }

  activeOperators.forEach(op => {
    let monthlyHours = 0;
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const code = scheduleMap[op.id]?.[dateStr];
      if (code) monthlyHours += getShiftHours(code);
    }
    
    if (monthlyHours > op.oreContrattualiMensili) {
      errors.push({ tipo: 'warning', giorno: numDays, operatoreId: op.id, messaggio: `${op.cognome} supera il monte ore (${Math.round(monthlyHours)}/${op.oreContrattualiMensili})` });
    }
  });

  return errors.sort((a, b) => a.giorno - b.giorno);
}
