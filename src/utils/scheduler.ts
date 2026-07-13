import type { Operator, ShiftType, DailySchedule } from '../types';
import { getItalianHolidays } from '../constants/initialData';

interface OperatorStats {
  id: string;
  notti: number;
  weekends: number;
  ore: number;
  lastNightDay: number; // Day of the month of the last night shift (can be negative for previous month)
  history: string[]; // Shift codes indexed by day (0-based)
}

export interface GenerationError {
  tipo: 'critico' | 'warning';
  giorno: number;
  operatoreId?: string;
  messaggio: string;
}

// Helper to check if a day is a weekend (Saturday or Sunday)
export function isWeekend(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

// Helper to check if a day is a holiday
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
  currentMonthLeaves: DailySchedule[]
): { schedule: DailySchedule[]; errors: GenerationError[] } {
  
  const numDays = new Date(year, month, 0).getDate();
  const activeOperators = operators.filter(o => o.stato === 'attivo');
  
  if (activeOperators.length === 0) {
    return { schedule: [], errors: [{ tipo: 'critico', giorno: 1, messaggio: 'Nessun operatore attivo in reparto!' }] };
  }

  // Parse previous month shifts to find night constraints for the beginning of the month
  // Previous month year and month:
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const prevNumDays = new Date(prevYear, prevMonth, 0).getDate();

  // Map of operatorId -> shift on last day (prevNumDays) and second to last day (prevNumDays - 1)
  const prevLastDayShift: Record<string, string> = {};
  const prevSecondLastDayShift: Record<string, string> = {};

  previousSchedule.forEach(s => {
    const sDate = new Date(s.data);
    if (sDate.getFullYear() === prevYear && sDate.getMonth() + 1 === prevMonth) {
      const sDay = sDate.getDate();
      if (sDay === prevNumDays) {
        prevLastDayShift[s.operatoreId] = s.codiceTurno;
      } else if (sDay === prevNumDays - 1) {
        prevSecondLastDayShift[s.operatoreId] = s.codiceTurno;
      }
    }
  });

  // Helper to get category of shift code
  const getShiftCategory = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  const getShiftHours = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.durataOre : 0;
  };

  // Map of date string -> operatorId -> preassigned shift
  const preassigned: Record<string, Record<string, string>> = {};
  currentMonthLeaves.forEach(s => {
    if (!preassigned[s.data]) {
      preassigned[s.data] = {};
    }
    preassigned[s.data][s.operatoreId] = s.codiceTurno;
  });

  let bestSchedule: DailySchedule[] = [];
  let bestFitness = -Infinity;
  let bestRunErrors: GenerationError[] = [];

  const RUNS = 50; // Try 50 times and pick the best one

  for (let run = 0; run < RUNS; run++) {
    const runScheduleMap: Record<string, string> = {}; // key: "operatoreId_YYYY-MM-DD" -> shiftCode
    
    // Initialize stats
    const stats: Record<string, OperatorStats> = {};
    activeOperators.forEach(op => {
      let lastNightDay = -10; // default far away
      if (prevLastDayShift[op.id] && getShiftCategory(prevLastDayShift[op.id]) === 'notte') {
        lastNightDay = 0; // day 0 of current month is yesterday
      } else if (prevSecondLastDayShift[op.id] && getShiftCategory(prevSecondLastDayShift[op.id]) === 'notte') {
        lastNightDay = -1; // day -1 is two days ago
      }

      stats[op.id] = {
        id: op.id,
        notti: 0,
        weekends: 0,
        ore: 0,
        lastNightDay,
        history: new Array(numDays).fill('L')
      };
    });

    let runViolations = 0;
    const runErrors: GenerationError[] = [];

    // Schedule day-by-day
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isWknd = isWeekend(year, month, d);
      const isHol = isHoliday(year, month, d);
      const isFestivo = isWknd || isHol;

      // 1. Identify forced off-duty (due to night shift yesterday or two days ago, or pre-assigned leaves)
      const forcedOff: Record<string, { code: string; reason: string }> = {};
      
      activeOperators.forEach(op => {
        const pre = preassigned[dateStr]?.[op.id];
        if (pre) {
          // Has a preassigned shift (ferie, 104, etc.)
          forcedOff[op.id] = { code: pre, reason: 'preassigned' };
          stats[op.id].history[d - 1] = pre;
          stats[op.id].ore += getShiftHours(pre);
          if (getShiftCategory(pre) === 'notte') {
            stats[op.id].notti++;
            stats[op.id].lastNightDay = d;
          }
          if (isFestivo && getShiftCategory(pre) !== 'riposo' && getShiftCategory(pre) !== 'ferie' && getShiftCategory(pre) !== 'assenza') {
            stats[op.id].weekends++;
          }
          return;
        }

        // Night constraint: check yesterday (d-1)
        let yesterdayShift = '';
        if (d === 1) {
          yesterdayShift = prevLastDayShift[op.id] || '';
        } else {
          yesterdayShift = stats[op.id].history[d - 2];
        }

        if (yesterdayShift && getShiftCategory(yesterdayShift) === 'notte') {
          forcedOff[op.id] = { code: 'L', reason: 'smonto' }; // Smonto Notte
          stats[op.id].history[d - 1] = 'L';
          return;
        }

        // Night constraint: check two days ago (d-2)
        let twoDaysAgoShift = '';
        if (d === 1) {
          twoDaysAgoShift = prevSecondLastDayShift[op.id] || '';
        } else if (d === 2) {
          twoDaysAgoShift = prevLastDayShift[op.id] || '';
        } else {
          twoDaysAgoShift = stats[op.id].history[d - 3];
        }

        if (twoDaysAgoShift && getShiftCategory(twoDaysAgoShift) === 'notte') {
          // If they worked night 2 days ago, and yesterday was L (smonto), today they must have the second L (riposo)
          forcedOff[op.id] = { code: 'L', reason: 'riposo' }; // Riposo post-notte
          stats[op.id].history[d - 1] = 'L';
          return;
        }
      });

      // 2. Schedule shifts for this day:
      // We need exactly:
      // - 2 Nights (N1, N2)
      // - 3 Afternoons (P1, P2, P3)
      // - 3 Mornings (M1, M2, M3)
      
      const preassignedOnDay = preassigned[dateStr] || {};
      const preassignedCodes = Object.values(preassignedOnDay);
      
      const shiftsToFill: { code: string; cat: string }[] = [];
      
      let mNeeded = 3;
      let pNeeded = 3;
      let nNeeded = 2;

      preassignedCodes.forEach(code => {
        const cat = getShiftCategory(code);
        if (cat === 'mattina') mNeeded--;
        else if (cat === 'pomeriggio') pNeeded--;
        else if (cat === 'notte') nNeeded--;
      });

      // Nights:
      if (nNeeded > 0) {
        const availableN = ['N1', 'N2'].filter(c => !preassignedCodes.includes(c));
        for (let i = 0; i < Math.min(nNeeded, availableN.length); i++) {
          shiftsToFill.push({ code: availableN[i], cat: 'notte' });
        }
      }
      // Afternoons:
      if (pNeeded > 0) {
        const availableP = ['P1', 'P2', 'P3'].filter(c => !preassignedCodes.includes(c));
        for (let i = 0; i < Math.min(pNeeded, availableP.length); i++) {
          shiftsToFill.push({ code: availableP[i], cat: 'pomeriggio' });
        }
      }
      // Mornings:
      if (mNeeded > 0) {
        const availableM = ['M1', 'M2', 'M3'].filter(c => !preassignedCodes.includes(c));
        for (let i = 0; i < Math.min(mNeeded, availableM.length); i++) {
          shiftsToFill.push({ code: availableM[i], cat: 'mattina' });
        }
      }

      // Keep track of who is already assigned on this day
      const assignedThisDay = new Set<string>();
      
      // Mark forced off-duty operators as assigned (they get L or their pre-assigned leave)
      Object.keys(forcedOff).forEach(opId => {
        assignedThisDay.add(opId);
        runScheduleMap[`${opId}_${dateStr}`] = forcedOff[opId].code;
      });

      // Process shifts group by group (Nights first, then Afternoons, then Mornings)
      for (const shift of shiftsToFill) {
        // Find available operators
        const basePool = activeOperators.filter(op => !assignedThisDay.has(op.id));
        
        // Filter pool by limitations
        let filteredPool = [...basePool];
        if (shift.cat === 'notte') {
          filteredPool = filteredPool.filter(op => !op.escludiNotti);
        }
        if (shift.cat !== 'mattina') {
          filteredPool = filteredPool.filter(op => !op.soloMattina);
        }
        if (isFestivo) {
          filteredPool = filteredPool.filter(op => !op.escludiWeekend);
        }

        // Fallback to base pool if limitations make the coverage impossible
        const pool = filteredPool.length > 0 ? filteredPool : basePool;
        
        if (pool.length === 0) {
          // No operators available!
          runViolations += 1000; // Heavy penalty
          continue;
        }

        // Score available operators
        const scoredPool = pool.map(op => {
          let score = stats[op.id].ore; // Base score on worked hours to balance workload
          
          // Night balancing
          if (shift.cat === 'notte') {
            score += stats[op.id].notti * 80; // Highly penalize if already has many nights
            
            // Distance from last night
            const daysSinceLastNight = d - stats[op.id].lastNightDay;
            if (daysSinceLastNight < 4) {
              score += (4 - daysSinceLastNight) * 150; // Heavy penalty for consecutive/near nights
            }
          }

          // Alternanza Mattina / Pomeriggio (Evita sequenze monotone dello stesso turno)
          const yesterdayShift = d === 1 ? (prevLastDayShift[op.id] || '') : stats[op.id].history[d - 2];
          const yesterdayCat = yesterdayShift ? getShiftCategory(yesterdayShift) : 'riposo';
          
          const twoDaysAgoShift = d === 1 
            ? (prevSecondLastDayShift[op.id] || '') 
            : (d === 2 ? (prevLastDayShift[op.id] || '') : stats[op.id].history[d - 3]);
          const twoDaysAgoCat = twoDaysAgoShift ? getShiftCategory(twoDaysAgoShift) : 'riposo';

          if (shift.cat === 'mattina') {
            if (yesterdayCat === 'mattina') {
              score += 120; // Penalizza fortemente due mattine di fila
            } else if (yesterdayCat === 'riposo' && twoDaysAgoCat === 'mattina') {
              score += 50;  // Preferisci alternare anche dopo un giorno di riposo
            }
          }
          
          if (shift.cat === 'pomeriggio') {
            if (yesterdayCat === 'pomeriggio') {
              score += 120; // Penalizza fortemente due pomeriggi di fila
            } else if (yesterdayCat === 'riposo' && twoDaysAgoCat === 'pomeriggio') {
              score += 50;  // Preferisci alternare anche dopo un giorno di riposo
            }
          }

          // Weekend and holiday balancing
          if (isFestivo) {
            score += stats[op.id].weekends * 50;
          }

          // Add a small random noise to explore search space
          score += Math.random() * 8;

          return { op, score };
        });

        // Sort by score ascending (lowest score = best fit)
        scoredPool.sort((a, b) => a.score - b.score);

        // Assign shift
        const selected = scoredPool[0].op;
        assignedThisDay.add(selected.id);
        runScheduleMap[`${selected.id}_${dateStr}`] = shift.code;
        
        // Update stats
        stats[selected.id].history[d - 1] = shift.code;
        stats[selected.id].ore += getShiftHours(shift.code);
        if (shift.cat === 'notte') {
          stats[selected.id].notti++;
          stats[selected.id].lastNightDay = d;
        }
        if (isFestivo) {
          stats[selected.id].weekends++;
        }
      }

      // Assign 'L' to remaining available operators who were not selected
      activeOperators.forEach(op => {
        if (!assignedThisDay.has(op.id)) {
          runScheduleMap[`${op.id}_${dateStr}`] = 'L';
          stats[op.id].history[d - 1] = 'L';
        }
      });
    }

    // 3. Evaluate Fitness of the generated run schedule
    let runFitnessScore = 0;
    
    // Evaluate coverage errors
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      let mCount = 0;
      let pCount = 0;
      let nCount = 0;

      activeOperators.forEach(op => {
        const code = runScheduleMap[`${op.id}_${dateStr}`] || 'L';
        const cat = getShiftCategory(code);
        if (cat === 'mattina') mCount++;
        else if (cat === 'pomeriggio') pCount++;
        else if (cat === 'notte') nCount++;
      });

      if (mCount < 3) {
        runFitnessScore -= (3 - mCount) * 1000;
        runErrors.push({ tipo: 'critico', giorno: d, messaggio: `Copertura mattina insufficiente: ${mCount}/3 operatori` });
      }
      if (pCount < 3) {
        runFitnessScore -= (3 - pCount) * 1000;
        runErrors.push({ tipo: 'critico', giorno: d, messaggio: `Copertura pomeriggio insufficiente: ${pCount}/3 operatori` });
      }
      if (nCount < 2) {
        runFitnessScore -= (2 - nCount) * 1000;
        runErrors.push({ tipo: 'critico', giorno: d, messaggio: `Copertura notte insufficiente: ${nCount}/2 operatori` });
      }
    }

    // Evaluate operator constraints & fairness
    const totalHoursList: number[] = [];
    const totalNightsList: number[] = [];
    const totalWeekendsList: number[] = [];

    activeOperators.forEach(op => {
      const opStats = stats[op.id];
      totalHoursList.push(opStats.ore);
      totalNightsList.push(opStats.notti);
      totalWeekendsList.push(opStats.weekends);

      // Check for night violations
      for (let d = 1; d <= numDays; d++) {
        const currentShift = opStats.history[d - 1];
        
        if (getShiftCategory(currentShift) === 'notte') {
          // Check consecutive night
          if (d < numDays) {
            const tomorrowShift = opStats.history[d];
            if (getShiftCategory(tomorrowShift) === 'notte') {
              runFitnessScore -= 2000;
              runErrors.push({ tipo: 'critico', giorno: d, operatoreId: op.id, messaggio: `${op.cognome} ha turni di notte consecutivi` });
            }
          }

          // Check smonto
          if (d < numDays) {
            const tomorrowShift = opStats.history[d];
            if (getShiftCategory(tomorrowShift) !== 'riposo' && tomorrowShift !== 'L') {
              runFitnessScore -= 1500;
              runErrors.push({ tipo: 'critico', giorno: d + 1, operatoreId: op.id, messaggio: `${op.cognome} lavora il giorno dopo la notte (mancato smonto)` });
            }
          }

          // Check riposo after smonto (N -> L -> L)
          if (d < numDays - 1) {
            const twoDaysLaterShift = opStats.history[d + 1];
            if (getShiftCategory(twoDaysLaterShift) !== 'riposo' && getShiftCategory(twoDaysLaterShift) !== 'ferie' && getShiftCategory(twoDaysLaterShift) !== 'assenza') {
              runFitnessScore -= 500; // Warning level
              runErrors.push({ tipo: 'warning', giorno: d + 2, operatoreId: op.id, messaggio: `${op.cognome} non riposa il secondo giorno dopo la notte (mancata sequenza N -> L -> L)` });
            }
          }
        }
      }

      // Check max hours limit
      if (opStats.ore > op.oreContrattualiMensili) {
        runFitnessScore -= (opStats.ore - op.oreContrattualiMensili) * 10;
        runErrors.push({ tipo: 'warning', giorno: numDays, operatoreId: op.id, messaggio: `${op.cognome} supera il monte ore mensile (${opStats.ore}/${op.oreContrattualiMensili} ore)` });
      }
    });

    // Workload balancing metrics (minimize standard deviation)
    const avgHours = totalHoursList.reduce((a, b) => a + b, 0) / totalHoursList.length;
    const hourVariance = totalHoursList.reduce((acc, h) => acc + Math.pow(h - avgHours, 2), 0) / totalHoursList.length;
    runFitnessScore -= Math.sqrt(hourVariance) * 5; // Penalize unequal hours

    const avgNights = totalNightsList.reduce((a, b) => a + b, 0) / totalNightsList.length;
    const nightVariance = totalNightsList.reduce((acc, n) => acc + Math.pow(n - avgNights, 2), 0) / totalNightsList.length;
    runFitnessScore -= Math.sqrt(nightVariance) * 10; // Penalize unequal nights

    // Compare and store the best run
    if (runFitnessScore > bestFitness) {
      bestFitness = runFitnessScore;
      bestRunErrors = runErrors;
      
      // Convert runScheduleMap to array of DailySchedule
      bestSchedule = [];
      activeOperators.forEach(op => {
        for (let d = 1; d <= numDays; d++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const code = runScheduleMap[`${op.id}_${dateStr}`] || 'L';
          bestSchedule.push({
            id: `${op.id}_${dateStr}`,
            operatoreId: op.id,
            data: dateStr,
            codiceTurno: code
          });
        }
      });
      
      // Also add any other operators who were not active (keep their L or preassigned values)
      operators.forEach(op => {
        if (op.stato !== 'attivo') {
          for (let d = 1; d <= numDays; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const pre = preassigned[dateStr]?.[op.id] || 'L';
            bestSchedule.push({
              id: `${op.id}_${dateStr}`,
              operatoreId: op.id,
              data: dateStr,
              codiceTurno: pre
            });
          }
        }
      });
    }
  }

  // Final check of the best schedule to return any error messages (sorted by day)
  bestRunErrors.sort((a, b) => a.giorno - b.giorno);

  return {
    schedule: bestSchedule,
    errors: bestRunErrors
  };
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

    if (mCount < 3) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura mattina insufficiente (${mCount}/3)` });
    }
    if (pCount < 3) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura pomeriggio insufficiente (${pCount}/3)` });
    }
    if (nCount < 2) {
      errors.push({ tipo: 'critico', giorno: d, messaggio: `Giorno ${d}: Copertura notte insufficiente (${nCount}/2)` });
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

      // Rimossa la verifica P -> Mattina (ammessa dal coordinatore)
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
