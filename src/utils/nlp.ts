import type { Operator, ShiftType, DailySchedule } from '../types';

export interface ParsedAction {
  operatoreId: string;
  operatoreNome: string;
  data: string;
  giorno: number;
  nuovoTurno: string;
  vecchioTurno: string;
  descrizione: string;
}

export function parseCommand(
  command: string,
  year: number,
  month: number,
  operators: Operator[],
  shifts: ShiftType[],
  currentSchedule: DailySchedule[]
): { actions: ParsedAction[]; message: string } {
  const cleanCmd = command.trim().toLowerCase();
  if (!cleanCmd) return { actions: [], message: '' };

  const numDays = new Date(year, month, 0).getDate();
  const getOpName = (op: Operator) => `${op.cognome} ${op.nome}`;

  // Helper to find operator by name/surname match
  const findOperator = (nameQuery: string): Operator | null => {
    const q = nameQuery.toUpperCase().trim();
    return operators.find(op => 
      op.cognome.startsWith(q) || 
      op.nome.startsWith(q) || 
      `${op.cognome} ${op.nome}`.includes(q)
    ) || null;
  };

  // Helper to find shift code
  const findShift = (codeQuery: string): ShiftType | null => {
    const q = codeQuery.toUpperCase().trim();
    return shifts.find(s => s.codice === q) || null;
  };

  // Helper to get current shift code of operator on a specific day
  const getCurrentShift = (opId: string, day: number): string => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const match = currentSchedule.find(s => s.operatoreId === opId && s.data === dateStr);
    return match ? match.codiceTurno : 'L';
  };

  const actions: ParsedAction[] = [];

  // 1. REGEX FOR SWAP: "scambia FEDELI e GUERRINI il 12" o "scambio FEDELI con GUERRINI il 12"
  const swapRegex = /(?:scambia|scambio|swap)\s+(\w+)\s+(?:e|con)\s+(\w+)\s+(?:il|giorno)?\s*(\d+)/i;
  const swapMatch = cleanCmd.match(swapRegex);
  if (swapMatch) {
    const op1 = findOperator(swapMatch[1]);
    const op2 = findOperator(swapMatch[2]);
    const day = parseInt(swapMatch[3]);

    if (!op1) return { actions: [], message: `Operatore "${swapMatch[1]}" non trovato.` };
    if (!op2) return { actions: [], message: `Operatore "${swapMatch[2]}" non trovato.` };
    if (isNaN(day) || day < 1 || day > numDays) return { actions: [], message: `Giorno ${swapMatch[3]} non valido per questo mese.` };

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shift1 = getCurrentShift(op1.id, day);
    const shift2 = getCurrentShift(op2.id, day);

    if (shift1 === shift2) {
      return { actions: [], message: `Entrambi gli operatori hanno lo stesso turno (${shift1}) il giorno ${day}. Scambio non necessario.` };
    }

    actions.push({
      operatoreId: op1.id,
      operatoreNome: getOpName(op1),
      data: dateStr,
      giorno: day,
      nuovoTurno: shift2,
      vecchioTurno: shift1,
      descrizione: `Imposta turno ${shift2} (era ${shift1})`
    });

    actions.push({
      operatoreId: op2.id,
      operatoreNome: getOpName(op2),
      data: dateStr,
      giorno: day,
      nuovoTurno: shift1,
      vecchioTurno: shift2,
      descrizione: `Imposta turno ${shift1} (era ${shift2})`
    });

    return { 
      actions, 
      message: `Scambio pianificato il giorno ${day} tra ${getOpName(op1)} (${shift1} ⇄ ${shift2}) e ${getOpName(op2)} (${shift2} ⇄ ${shift1}).` 
    };
  }

  // 2. REGEX FOR LEAVES/FERIE RANGE: "ferie FEDELI dal 10 al 15" o "ferie FEDELI 10-15"
  const ferieRegex = /(?:ferie|f|leave)\s+(\w+)\s+(?:dal)?\s*(\d+)\s*(?:al|-)\s*(\d+)/i;
  const ferieMatch = cleanCmd.match(ferieRegex);
  if (ferieMatch) {
    const op = findOperator(ferieMatch[1]);
    const startDay = parseInt(ferieMatch[2]);
    const endDay = parseInt(ferieMatch[3]);

    if (!op) return { actions: [], message: `Operatore "${ferieMatch[1]}" non trovato.` };
    if (isNaN(startDay) || startDay < 1 || startDay > numDays) return { actions: [], message: `Giorno di inizio ${ferieMatch[2]} non valido.` };
    if (isNaN(endDay) || endDay < 1 || endDay > numDays || endDay < startDay) return { actions: [], message: `Giorno di fine ${ferieMatch[3]} non valido.` };

    for (let d = startDay; d <= endDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const old = getCurrentShift(op.id, d);
      actions.push({
        operatoreId: op.id,
        operatoreNome: getOpName(op),
        data: dateStr,
        giorno: d,
        nuovoTurno: 'F',
        vecchioTurno: old,
        descrizione: `Imposta Ferie (era ${old})`
      });
    }

    return {
      actions,
      message: `Impostazione ferie dal giorno ${startDay} al giorno ${endDay} per ${getOpName(op)}.`
    };
  }

  // 3. REGEX FOR SINGLE DAY ASSIGNMENT: "metti FEDELI in M1 il 5" o "FEDELI M1 il 5"
  const assignRegex = /(?:metti|imposta|turno|set)?\s*(\w+)\s+(?:in|a)?\s*(\w{1,3})\s+(?:il|giorno)?\s*(\d+)/i;
  const assignMatch = cleanCmd.match(assignRegex);
  if (assignMatch) {
    const op = findOperator(assignMatch[1]);
    const shift = findShift(assignMatch[2]);
    const day = parseInt(assignMatch[3]);

    if (op && shift && !isNaN(day) && day >= 1 && day <= numDays) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const old = getCurrentShift(op.id, day);

      actions.push({
        operatoreId: op.id,
        operatoreNome: getOpName(op),
        data: dateStr,
        giorno: day,
        nuovoTurno: shift.codice,
        vecchioTurno: old,
        descrizione: `Assegna turno ${shift.codice} (era ${old})`
      });

      return {
        actions,
        message: `Assegnazione turno ${shift.codice} per ${getOpName(op)} il giorno ${day}.`
      };
    }
  }

  // 4. REGEX FOR SINGLE DAY REST: "riposo FEDELI il 8" o "libero FEDELI il 8"
  const restRegex = /(?:riposo|libero|l|cancella|pulisci)\s+(\w+)\s+(?:il|giorno)?\s*(\d+)/i;
  const restMatch = cleanCmd.match(restRegex);
  if (restMatch) {
    const op = findOperator(restMatch[1]);
    const day = parseInt(restMatch[2]);

    if (!op) return { actions: [], message: `Operatore "${restMatch[1]}" non trovato.` };
    if (isNaN(day) || day < 1 || day > numDays) return { actions: [], message: `Giorno ${restMatch[2]} non valido.` };

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const old = getCurrentShift(op.id, day);

    actions.push({
      operatoreId: op.id,
      operatoreNome: getOpName(op),
      data: dateStr,
      giorno: day,
      nuovoTurno: 'L',
      vecchioTurno: old,
      descrizione: `Imposta Libero/Riposo (era ${old})`
    });

    return {
      actions,
      message: `Impostazione Riposo/Libero il giorno ${day} per ${getOpName(op)}.`
    };
  }

  return { 
    actions: [], 
    message: 'Comando non riconosciuto. Esempi: "scambia Fedeli e Guerrini il 12", "ferie Fedeli dal 10 al 15", "metti Peruzzi in M3 il 5".' 
  };
}
