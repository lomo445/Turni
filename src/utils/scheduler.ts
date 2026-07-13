import type { Operator, ShiftType, DailySchedule } from '../types';
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
  fullHistory?: DailySchedule[]
): { schedule: DailySchedule[]; errors: GenerationError[] } {
  if (fullHistory) { /* ignore to prevent TS error */ }

  const numDays = new Date(year, month, 0).getDate();
  const activeOperators = operators.filter(o => o.stato === 'attivo').sort((a, b) => a.cognome.localeCompare(b.cognome));
  
  if (activeOperators.length === 0) {
    return { schedule: [], errors: [{ tipo: 'critico', giorno: 1, messaggio: 'Nessun operatore attivo in reparto!' }] };
  }

  const errors: GenerationError[] = [];

  const getShiftCategory = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  const getShiftHours = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.durataOre : 0;
  };

  const preassigned: Record<string, Record<string, string>> = {};
  currentMonthLeaves.forEach(s => {
    if (!preassigned[s.data]) preassigned[s.data] = {};
    preassigned[s.data][s.operatoreId] = s.codiceTurno;
  });

  // Il ciclo base di 15 giorni richiesto dal coordinatore
  const CYCLE = ['P', 'M', 'N', 'L', 'L', 'P', 'M', 'N', 'L', 'L', 'J', 'J', 'J', 'J', 'J'];

  // 1. Deducere gli Offset dallo storico precedente (auto-sync con il file Excel)
  const opHistory: Record<string, {date: string, code: string, cat: string}[]> = {};
  activeOperators.forEach(op => opHistory[op.id] = []);
  
  if (previousSchedule && previousSchedule.length > 0) {
    [...previousSchedule].sort((a, b) => a.data.localeCompare(b.data)).forEach(s => {
      if (opHistory[s.operatoreId]) {
        opHistory[s.operatoreId].push({ date: s.data, code: s.codiceTurno, cat: getShiftCategory(s.codiceTurno) });
      }
    });
  }

  const offsets: Record<string, number> = {};
  const unassignedOps: string[] = [];
  const targetDate = new Date(year, month - 1, 1);

  activeOperators.forEach(op => {
    const hist = opHistory[op.id];
    let detectedOffset = -1;
    
    if (hist && hist.length > 0) {
      // Cerchiamo l'ultima notte nello storico per sincronizzare la ruota
      for (let i = hist.length - 1; i >= 0; i--) {
        if (hist[i].cat === 'notte') {
          const nDate = new Date(hist[i].date);
          const diffTime = targetDate.getTime() - nDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
          
          if (diffDays <= 0) continue; // Ignora turni futuri

          let isFirstN = false;
          // Controlliamo se 5 giorni prima c'era un'altra notte per capire se è la prima (index 2) o la seconda (index 7)
          for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
             if (hist[j].cat === 'notte') {
                 const priorDate = new Date(hist[j].date);
                 const daysBetween = Math.round((nDate.getTime() - priorDate.getTime()) / (1000*3600*24));
                 if (daysBetween === 5) {
                     isFirstN = false; // È la seconda
                     break;
                 } else if (daysBetween === 10 || daysBetween === 11) {
                     isFirstN = true; // È la prima
                     break;
                 }
             }
          }
          
          // Se non lo capiamo, presumiamo sia la seconda (index 7)
          const cycleIndexOfN = isFirstN ? 2 : 7;
          detectedOffset = (cycleIndexOfN + diffDays) % 15;
          break;
        }
      }
    }
    
    if (detectedOffset >= 0) {
      offsets[op.id] = detectedOffset;
    } else {
      unassignedOps.push(op.id);
    }
  });

  // Assegna gli offset mancanti per riempire tutti i 15 slot in modo unico (se possibile)
  const usedOffsets = new Set(Object.values(offsets));
  const availableOffsets: number[] = [];
  for (let i = 0; i < 15; i++) {
    if (!usedOffsets.has(i)) availableOffsets.push(i);
  }
  
  unassignedOps.forEach(opId => {
    if (availableOffsets.length > 0) {
      offsets[opId] = availableOffsets.shift()!;
    } else {
      offsets[opId] = 0; // Se ci sono più di 15 operatori, ricicla gli offset
    }
  });

  const finalSchedule: DailySchedule[] = [];
  const hours: Record<string, number> = {};
  const weekends: Record<string, number> = {};
  activeOperators.forEach(op => { hours[op.id] = 0; weekends[op.id] = 0; });

  // 2. Generazione del mese
  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const preassignedOnDay = preassigned[dateStr] || {};
    
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const isSunday = dayOfWeek === 0;
    const isFestivo = isSunday || isHoliday(year, month, d);

    let mNeeded = isFestivo ? 2 : 3;
    let pNeeded = isFestivo ? 2 : 3;
    let nNeeded = 2;

    const jollies: string[] = [];
    const dayAssignments: Record<string, string> = {};

    // 2a. Assegnazioni Fisse dal Ciclo + Preassegnati (Ferie)
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

    // 2b. Ordinamento Jolly per equità
    jollies.sort((a, b) => {
      if (isFestivo && weekends[a] !== weekends[b]) {
        return weekends[a] - weekends[b]; // Priorità a chi ha fatto meno festivi
      }
      return hours[a] - hours[b]; // Priorità a chi ha meno ore
    });

    // 2c. Copertura delle mancanze con i Jolly
    // Notti
    while (nNeeded > 0 && jollies.length > 0) {
      const opId = jollies.shift()!;
      const codes = ['N1', 'N2'];
      const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'N1';
      dayAssignments[opId] = assignedCode;
      nNeeded--;
      hours[opId] += 11;
      if (isFestivo) weekends[opId]++;
    }

    // Pomeriggi
    while (pNeeded > 0 && jollies.length > 0) {
      const opId = jollies.shift()!;
      const codes = isFestivo ? ['P1', 'P2'] : ['P1', 'P2', 'P3'];
      const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'P1';
      dayAssignments[opId] = assignedCode;
      pNeeded--;
      hours[opId] += 6.5;
      if (isFestivo) weekends[opId]++;
    }

    // Mattine
    while (mNeeded > 0 && jollies.length > 0) {
      const opId = jollies.shift()!;
      const codes = isFestivo ? ['M1', 'M2'] : ['M1', 'M2', 'M3'];
      const assignedCode = codes.find(c => !Object.values(dayAssignments).includes(c)) || 'M1';
      dayAssignments[opId] = assignedCode;
      mNeeded--;
      hours[opId] += 6.5;
      if (isFestivo) weekends[opId]++;
    }

    // I Jolly rimanenti vanno a Riposo
    jollies.forEach(opId => {
      dayAssignments[opId] = 'L';
    });

    if (nNeeded > 0) errors.push({ tipo: 'critico', giorno: d, messaggio: `Mancano ${nNeeded} turni di Notte e nessun Jolly disponibile.` });
    if (pNeeded > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${pNeeded} turni di Pomeriggio.` });
    if (mNeeded > 0) errors.push({ tipo: 'warning', giorno: d, messaggio: `Mancano ${mNeeded} turni di Mattina.` });

    Object.keys(dayAssignments).forEach(opId => {
      finalSchedule.push({
        id: `${opId}_${dateStr}`,
        operatoreId: opId,
        data: dateStr,
        codiceTurno: dayAssignments[opId]
      });
    });
  }

  // Check monte ore fine mese
  activeOperators.forEach(op => {
    if (hours[op.id] > op.oreContrattualiMensili) {
      errors.push({
        tipo: 'warning',
        giorno: numDays,
        operatoreId: op.id,
        messaggio: `${op.cognome} supera il monte ore mensile (${Math.round(hours[op.id])}/${op.oreContrattualiMensili} ore)`
      });
    }
  });

  return { schedule: finalSchedule, errors: errors.sort((a, b) => a.giorno - b.giorno) };
}

// Function to validate any existing schedule grid and check for errors
export function validateSchedule(
  year: number,
  month: number,
  schedule: DailySchedule[],
  operators: Operator[],
  shiftTypes: ShiftType[]
): GenerationError[] {
  const errors: GenerationError[] = [];
  const numDays = new Date(year, month, 0).getDate();
  
  // Helper to get category of shift code
  const getShiftCategory = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  const getShiftHours = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.durataOre : 0;
  };

  // Map of operatorId -> date string -> shiftCode
  const scheduleMap: Record<string, Record<string, string>> = {};
  
  schedule.forEach(s => {
    if (!scheduleMap[s.operatoreId]) {
      scheduleMap[s.operatoreId] = {};
    }
    scheduleMap[s.operatoreId][s.data] = s.codiceTurno;
  });

  // Check coverage per day
  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let mCount = 0;
    let pCount = 0;
    let nCount = 0;

    let fCount = 0;
    operators.forEach(op => {
      if (op.stato !== 'attivo') return;
      const code = scheduleMap[op.id]?.[dateStr] || 'L';
      const cat = getShiftCategory(code);
      if (cat === 'mattina') mCount++;
      else if (cat === 'pomeriggio') pCount++;
      else if (cat === 'notte') nCount++;
      else if (cat === 'ferie' || cat === 'assenza') fCount++;
    });

    if (fCount > 3) {
      errors.push({ tipo: 'warning', giorno: d, messaggio: `Giorno ${d}: Rilevate troppe ferie/assenze contemporanee (${fCount}/3 consentite)` });
    }

    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const isSunday = dayOfWeek === 0;
    const isHol = isHoliday(year, month, d);
    const isFestivoForCoverage = isSunday || isHol;

    const mTarget = isFestivoForCoverage ? 2 : 3;
    const pTarget = isFestivoForCoverage ? 2 : 3;
    const nTarget = 2;

    if (mCount < mTarget) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura mattina insufficiente (${mCount}/${mTarget})` });
    }
    if (pCount < pTarget) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura pomeriggio insufficiente (${pCount}/${pTarget})` });
    }
    if (nCount < nTarget) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura notte insufficiente (${nCount}/${nTarget})` });
    }
  }

  // Check operator constraints
  operators.forEach(op => {
    let opTotalHours = 0;

    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const code = scheduleMap[op.id]?.[dateStr] || 'L';
      opTotalHours += getShiftHours(code);

      // Check limitations violations
      const cat = getShiftCategory(code);
      const isFest = isWeekend(year, month, d) || isHoliday(year, month, d);
      
      if (op.escludiNotti && cat === 'notte') {
        errors.push({ tipo: 'critico', giorno: d, operatoreId: op.id, messaggio: `${op.cognome} fa notte ma ha la limitazione "No Notti"` });
      }
      if (op.soloMattina && cat !== 'mattina' && cat !== 'riposo' && cat !== 'ferie' && cat !== 'assenza') {
        errors.push({ tipo: 'critico', giorno: d, operatoreId: op.id, messaggio: `${op.cognome} fa turno non-mattina (${code}) ma ha la limitazione "Solo Mattina"` });
      }
      if (op.escludiWeekend && isFest && cat !== 'riposo' && cat !== 'ferie' && cat !== 'assenza') {
        errors.push({ tipo: 'critico', giorno: d, operatoreId: op.id, messaggio: `${op.cognome} lavora nel festivo/weekend (${code}) ma ha la limitazione "No Weekend"` });
      }

      if (getShiftCategory(code) === 'notte') {
        // Check consecutive night
        if (d < numDays) {
          const tomorrowStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
          const tomorrowCode = scheduleMap[op.id]?.[tomorrowStr] || 'L';
          if (getShiftCategory(tomorrowCode) === 'notte') {
            errors.push({ tipo: 'critico', giorno: d, operatoreId: op.id, messaggio: `${op.cognome} ha turni di notte consecutivi (giorni ${d} e ${d+1})` });
          }
        }

        // Check smonto (next day must be L)
        if (d < numDays) {
          const tomorrowStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
          const tomorrowCode = scheduleMap[op.id]?.[tomorrowStr] || 'L';
          if (getShiftCategory(tomorrowCode) !== 'riposo' && tomorrowCode !== 'L') {
            errors.push({ tipo: 'critico', giorno: d + 1, operatoreId: op.id, messaggio: `${op.cognome} lavora il giorno dopo la notte (giorno ${d+1}, turno ${tomorrowCode})` });
          }
        }

        // Check riposo (two days later must be off)
        if (d < numDays - 1) {
          const twoDaysLaterStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 2).padStart(2, '0')}`;
          const twoDaysLaterCode = scheduleMap[op.id]?.[twoDaysLaterStr] || 'L';
          if (getShiftCategory(twoDaysLaterCode) !== 'riposo' && getShiftCategory(twoDaysLaterCode) !== 'ferie' && getShiftCategory(twoDaysLaterCode) !== 'assenza') {
            errors.push({ tipo: 'warning', giorno: d + 2, operatoreId: op.id, messaggio: `${op.cognome} non ha riposo il secondo giorno dopo la notte (giorno ${d+2}, turno ${twoDaysLaterCode})` });
          }
        }
      }
    }

    if (opTotalHours > op.oreContrattualiMensili) {
      errors.push({
        tipo: 'warning',
        giorno: numDays,
        operatoreId: op.id,
        messaggio: `${op.cognome} supera il monte ore mensile (${opTotalHours}/${op.oreContrattualiMensili} ore)`
      });
    }
  });

  return errors.sort((a, b) => a.giorno - b.giorno);
}
