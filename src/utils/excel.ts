import * as XLSX from 'xlsx';
import type { Operator, ShiftType, DailySchedule } from '../types';

// Map Italian month names to 1-based numbers
const MONTH_MAP: Record<string, number> = {
  'gennaio': 1, 'febbraio': 2, 'marzo': 3, 'aprile': 4,
  'maggio': 5, 'giugno': 6, 'luglio': 7, 'agosto': 8,
  'settembre': 9, 'ottobre': 10, 'novembre': 11, 'dicembre': 12
};

export interface ParseResult {
  year: number;
  month: number;
  schedules: DailySchedule[];
  operatorsParsed: Partial<Operator>[];
}

export function importExcel(
  fileData: ArrayBuffer,
  existingOperators: Operator[],
  shiftTypes: ShiftType[]
): ParseResult[] {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const results: ParseResult[] = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to 2D array representation
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

    if (rows.length === 0) return;

    // 1. Detect Month and Year
    let detectedMonth = 1;
    let detectedYear = new Date().getFullYear();
    let monthFound = false;

    // Search for month/year in the sheet name or first few cells
    const sheetNameClean = sheetName.toLowerCase().trim();
    for (const key in MONTH_MAP) {
      if (sheetNameClean.includes(key)) {
        detectedMonth = MONTH_MAP[key];
        monthFound = true;
        
        // Try to extract year from sheet name like "gen-26" or "dic-26" or "dic-2026"
        const yearMatch = sheetNameClean.match(/(?:-| |')(\d{2,4})$/);
        if (yearMatch) {
          const yr = parseInt(yearMatch[1]);
          detectedYear = yr < 100 ? 2000 + yr : yr;
        }
        break;
      }
    }

    // If month not found in sheet name, inspect the first few cells
    if (!monthFound) {
      for (let r = 0; r < Math.min(rows.length, 5); r++) {
        for (let c = 0; c < Math.min(rows[r].length, 5); c++) {
          const val = String(rows[r][c]).toLowerCase();
          for (const key in MONTH_MAP) {
            if (val.includes(key)) {
              detectedMonth = MONTH_MAP[key];
              monthFound = true;
              
              const yearMatch = val.match(/(?:-| |'|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|anno)(\d{2,4})/);
              if (yearMatch) {
                const yr = parseInt(yearMatch[1]);
                detectedYear = yr < 100 ? 2000 + yr : yr;
              } else {
                // Check if adjacent cells have year
                const adjVal = String(rows[r][c + 1] || '');
                const yearMatchAdj = adjVal.match(/(\d{2,4})/);
                if (yearMatchAdj) {
                  const yr = parseInt(yearMatchAdj[1]);
                  detectedYear = yr < 100 ? 2000 + yr : yr;
                }
              }
              break;
            }
          }
          if (monthFound) break;
        }
        if (monthFound) break;
      }
    }

    // 2. Find day headers row (e.g. contains 01, 02, ..., up to 28)
    let headerRowIdx = -1;
    let dayCols: Record<number, number> = {}; // map column index -> day of month (1-31)
    
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r];
      let has01 = false;
      let has02 = false;
      let tempDayCols: Record<number, number> = {};

      for (let c = 0; c < row.length; c++) {
        const valStr = String(row[c]).trim();
        const num = parseInt(valStr);
        if (num >= 1 && num <= 31) {
          tempDayCols[c] = num;
          if (num === 1) has01 = true;
          if (num === 2) has02 = true;
        }
      }

      if (has01 && has02) {
        headerRowIdx = r;
        dayCols = tempDayCols;
        break;
      }
    }

    if (headerRowIdx === -1) {
      console.warn(`Could not find header row in sheet: ${sheetName}`);
      return; // Skip this sheet if we can't find the calendar structure
    }

    // 3. Process operator rows (from headerRowIdx + 2 onwards)
    const schedules: DailySchedule[] = [];
    const operatorsParsed: Partial<Operator>[] = [];

    const numDays = new Date(detectedYear, detectedMonth, 0).getDate();

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const cellA = String(row[0] || '').trim();
      if (!cellA) continue;

      // Skip rows like totals "M", "P", "N", "TC", "F" or coordinators signatures
      if (['m', 'p', 'n', 'tc', 'f', 'il coordinatore', 'il direttore', 'maternita\''].some(term => cellA.toLowerCase().startsWith(term))) {
        continue;
      }

      // We have a potential operator name (e.g. "FEDELI DANIELE" or "GUERRINI GABRIELE")
      // Normalize name to see if we can match existing operators
      const parts = cellA.split(/\s+/);
      let cognome = parts[0] || '';
      let nome = parts.slice(1).join(' ') || '';

      // Clean up names
      cognome = cognome.toUpperCase();
      nome = nome.toUpperCase();

      // Find match in existing operators
      let op = existingOperators.find(o => 
        (o.cognome.toUpperCase() === cognome && o.nome.toUpperCase() === nome) ||
        (o.cognome.toUpperCase() === nome && o.nome.toUpperCase() === cognome) ||
        (o.cognome.toUpperCase() + ' ' + o.nome.toUpperCase()).includes(cellA.toUpperCase())
      );

      let opId = '';
      if (op) {
        opId = op.id;
      } else {
        // Create dynamic temp ID
        opId = `imported_${cognome}_${nome}`;
        operatorsParsed.push({
          id: opId,
          nome: nome || 'OPERATORE',
          cognome: cognome,
          qualifica: 'TSRM',
          unitaOperativa: 'Radiologia DEU',
          stato: 'attivo',
          legge104: false,
          oreContrattualiMensili: 144
        });
      }

      // Now map shift cells for each day
      for (let c = 1; c < row.length; c++) {
        const day = dayCols[c];
        if (!day || day > numDays) continue;

        let val = String(row[c]).trim();
        if (val === '') val = 'L'; // Default to rest if empty

        // Clean shift code (e.g., if contains linebreaks, normalize spaces)
        let normalizedCode = val.toUpperCase().replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');

        // Check if it matches any code in our legend
        let matchedShift = shiftTypes.find(s => s.codice.toUpperCase() === normalizedCode);
        
        // If not matched, try some common variations
        if (!matchedShift) {
          if (normalizedCode === '' || normalizedCode === 'L' || normalizedCode === 'RIPOSO') normalizedCode = 'L';
          else if (normalizedCode === 'FERIE' || normalizedCode === 'F') normalizedCode = 'F';
          else if (normalizedCode === 'REP' || normalizedCode === 'REPERIBILITÀ') normalizedCode = 'REP';
          else if (normalizedCode.startsWith('MAL') || normalizedCode.startsWith('MALATTIA')) normalizedCode = 'MAL';
          else if (normalizedCode === '104' || normalizedCode === 'L104' || normalizedCode === 'L.104') normalizedCode = '104';
          else if (normalizedCode.includes('MATER')) normalizedCode = 'MATERNITA\'';
        }

        const dateStr = `${detectedYear}-${String(detectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        schedules.push({
          id: `${opId}_${dateStr}`,
          operatoreId: opId,
          data: dateStr,
          codiceTurno: normalizedCode
        });
      }
    }

    results.push({
      year: detectedYear,
      month: detectedMonth,
      schedules,
      operatorsParsed
    });
  });

  return results;
}

export function exportToExcel(
  year: number,
  month: number,
  operators: Operator[],
  shiftTypes: ShiftType[],
  schedule: DailySchedule[]
): void {
  const numDays = new Date(year, month, 0).getDate();
  const monthNames = [
    'GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
    'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'
  ];
  const monthName = monthNames[month - 1];

  // Map of operatorId -> dateStr -> shiftCode
  const scheduleMap: Record<string, Record<string, string>> = {};
  schedule.forEach(s => {
    if (!scheduleMap[s.operatoreId]) scheduleMap[s.operatoreId] = {};
    scheduleMap[s.operatoreId][s.data] = s.codiceTurno;
  });

  // Build rows for SheetJS
  const dataRows: any[] = [];

  // Row 1: Header title
  dataRows.push([`${monthName} ${year}`, ...new Array(numDays).fill('')]);

  // Row 2: Day numbers (01, 02, ...)
  const dayHeader = ['Dipendente'];
  for (let d = 1; d <= numDays; d++) {
    dayHeader.push(String(d).padStart(2, '0'));
  }
  dataRows.push(dayHeader);

  // Row 3: Day of week (gio, ven, ...)
  const weekdaysMap = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const dayOfWeekHeader = [''];
  for (let d = 1; d <= numDays; d++) {
    const date = new Date(year, month - 1, d);
    dayOfWeekHeader.push(weekdaysMap[date.getDay()]);
  }
  dataRows.push(dayOfWeekHeader);

  // Operator rows
  operators.forEach(op => {
    const row = [`${op.cognome} ${op.nome}`];
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      row.push(scheduleMap[op.id]?.[dateStr] || 'L');
    }
    dataRows.push(row);
  });

  // Calculate bottom totals (M, P, N, TC, F)
  const totalsM: (string | number)[] = ['M'];
  const totalsP: (string | number)[] = ['P'];
  const totalsN: (string | number)[] = ['N'];
  const totalsTC: (string | number)[] = ['TC'];
  const totalsF: (string | number)[] = ['F'];

  const getShiftCategory = (code: string) => {
    const shift = shiftTypes.find(s => s.codice === code);
    return shift ? shift.categoria : 'riposo';
  };

  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let m = 0, p = 0, n = 0, tc = 0, f = 0;

    operators.forEach(op => {
      if (op.stato !== 'attivo') return;
      const code = scheduleMap[op.id]?.[dateStr] || 'L';
      const cat = getShiftCategory(code);

      if (cat === 'mattina') m++;
      if (cat === 'pomeriggio') p++;
      if (cat === 'notte') n++;
      if (code.includes('TC')) tc++;
      if (cat === 'ferie') f++;
    });

    totalsM.push(m);
    totalsP.push(p);
    totalsN.push(n);
    totalsTC.push(tc);
    totalsF.push(f);
  }

  dataRows.push([]); // blank row divider
  dataRows.push(totalsM);
  dataRows.push(totalsP);
  dataRows.push(totalsN);
  dataRows.push(totalsTC);
  dataRows.push(totalsF);

  // Add Legend Section at bottom
  dataRows.push([]);
  dataRows.push(['LEGENDA']);
  shiftTypes.forEach(s => {
    dataRows.push([s.codice, `${s.descrizione} (${s.orarioInizio} - ${s.orarioFine})`]);
  });

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  
  // Set column widths
  const wscols = [{ wch: 25 }]; // Operator column width
  for (let d = 1; d <= numDays; d++) {
    wscols.push({ wch: 4 }); // Day columns width
  }
  ws['!cols'] = wscols;

  // Create workbook and write
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${monthName}_${year}`);

  // Trigger download in browser
  XLSX.writeFile(wb, `Turni_Radiologia_DEU_${monthName}_${year}.xlsx`);
}
