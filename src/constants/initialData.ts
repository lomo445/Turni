import type { Operator, ShiftType, DailySchedule } from '../types';

export const INITIAL_OPERATORS: Operator[] = [
  { id: '1', nome: 'DANIELE', cognome: 'FEDELI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '2', nome: 'GABRIELE', cognome: 'GUERRINI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '3', nome: 'PIETRO', cognome: 'FERRANTE', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '4', nome: 'SARA', cognome: 'GUERRINI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '5', nome: 'IVANO', cognome: 'TENTI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '6', nome: 'ANTONELLO', cognome: 'DONATI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '7', nome: 'LUCA', cognome: 'MORANO', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '8', nome: 'MARTINA', cognome: 'PERUZZI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '9', nome: 'CHIARA', cognome: 'TESTI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '10', nome: 'TOMMASO', cognome: 'MANCINI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '11', nome: 'LETIZIA', cognome: 'MONDANELLI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '12', nome: 'BARBARA', cognome: 'ARRAIS', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '13', nome: 'GIULIA', cognome: 'DEGL\'INNOCENTI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '14', nome: 'SANDRO', cognome: 'CAMISA', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '15', nome: 'MARTINA', cognome: 'GATTARI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'attivo', legge104: false, oreContrattualiMensili: 144 },
  { id: '16', nome: 'FRANCESCA', cognome: 'NOCENTINI', qualifica: 'TSRM', unitaOperativa: 'Radiologia DEU', stato: 'ferie_prolungate', legge104: false, oreContrattualiMensili: 144 },
];

export const DEFAULT_SHIFTS: ShiftType[] = [
  { codice: 'M1', descrizione: 'Mattina Diagnostica', orarioInizio: '07:00', orarioFine: '13:00', durataOre: 6, colore: '#ef4444', categoria: 'mattina' },
  { codice: 'M2', descrizione: 'Mattina Diagnostica Toraci a Letto', orarioInizio: '07:00', orarioFine: '13:00', durataOre: 6, colore: '#f97316', categoria: 'mattina' },
  { codice: 'M3', descrizione: 'Mattina TC', orarioInizio: '08:00', orarioFine: '14:00', durataOre: 6, colore: '#f59e0b', categoria: 'mattina' },
  { codice: 'MC', descrizione: 'Mattina Radiologia centrale', orarioInizio: '07:00', orarioFine: '13:00', durataOre: 6, colore: '#ec4899', categoria: 'mattina' },
  
  { codice: 'P1', descrizione: 'Pomeriggio Diagnostica', orarioInizio: '13:00', orarioFine: '20:00', durataOre: 7, colore: '#0ea5e9', categoria: 'pomeriggio' },
  { codice: 'P2', descrizione: 'Pomeriggio Diagnostica Toraci a Letto', orarioInizio: '13:00', orarioFine: '20:00', durataOre: 7, colore: '#3b82f6', categoria: 'pomeriggio' },
  { codice: 'P3', descrizione: 'Pomeriggio TC', orarioInizio: '14:00', orarioFine: '20:00', durataOre: 6, colore: '#8b5cf6', categoria: 'pomeriggio' },
  { codice: 'PC', descrizione: 'Pomeriggio Radiologia centrale', orarioInizio: '13:00', orarioFine: '20:00', durataOre: 7, colore: '#6366f1', categoria: 'pomeriggio' },
  
  { codice: 'N1', descrizione: 'Turno Notte 1', orarioInizio: '20:00', orarioFine: '07:00', durataOre: 11, colore: '#15803d', categoria: 'notte' },
  { codice: 'N2', descrizione: 'Turno Notte 2', orarioInizio: '20:00', orarioFine: '07:00', durataOre: 11, colore: '#10b981', categoria: 'notte' },
  
  { codice: 'L', descrizione: 'Libero / Riposo', orarioInizio: '-', orarioFine: '-', durataOre: 0, colore: '#ffffff', categoria: 'riposo' },
  { codice: 'F', descrizione: 'Ferie', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#fdba74', categoria: 'ferie' },
  { codice: 'F ap', descrizione: 'Ferie Anno Precedente', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#fed7aa', categoria: 'ferie' },
  { codice: 'REP', descrizione: 'Reperibilità', orarioInizio: '-', orarioFine: '-', durataOre: 0, colore: '#eab308', categoria: 'reperibilita' },
  
  { codice: 'MAL', descrizione: 'Malattia', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#9ca3af', categoria: 'assenza' },
  { codice: '104', descrizione: 'Permesso Legge 104', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#4b5563', categoria: 'assenza' },
  { codice: 'MATERNITA\'', descrizione: 'Maternità', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#d9f99d', categoria: 'assenza' },
  { codice: 'ART', descrizione: 'Articolo / Recupero Ore', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#e2e8f0', categoria: 'assenza' },
  { codice: 'BLSD', descrizione: 'Corso BLSD', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#fbcfe8', categoria: 'assenza' },
  { codice: 'CORSO', descrizione: 'Corso Formazione', orarioInizio: '-', orarioFine: '-', durataOre: 6, colore: '#ddd6fe', categoria: 'assenza' },
];

export function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Mar, 4 = Apr
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getItalianHolidays(year: number): Record<string, string> {
  const holidays: Record<string, string> = {
    [`${year}-01-01`]: 'Capodanno',
    [`${year}-01-06`]: 'Epifania',
    [`${year}-04-25`]: 'Liberazione',
    [`${year}-05-01`]: 'Festa del Lavoro',
    [`${year}-06-02`]: 'Festa della Repubblica',
    [`${year}-08-07`]: 'Santo Patrono (Arezzo)',
    [`${year}-08-15`]: 'Ferragosto',
    [`${year}-11-01`]: 'Tutti i Santi',
    [`${year}-12-08`]: 'Immacolata Concezione',
    [`${year}-12-25`]: 'Natale',
    [`${year}-12-26`]: 'Santo Stefano',
  };

  const easter = getEaster(year);
  const easterKey = easter.toISOString().split('T')[0];
  holidays[easterKey] = 'Pasqua';
  
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  const easterMondayKey = easterMonday.toISOString().split('T')[0];
  holidays[easterMondayKey] = 'Pasquetta';

  holidays[`${year}-10-04`] = 'San Francesco d\'Assisi';

  return holidays;
}

// Raw historical shifts list for Luglio 2026 (July 2026) as per coordinator screenshot
const rawJulyData: Record<string, string[]> = {
  '1': ['L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M1', 'M1', 'M1', 'P3', 'P2', 'M1', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M1', 'M2', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'P3'],
  '2': ['F', 'P3', 'M1', 'P2', 'L', 'F', 'F', 'M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M1', 'REP', 'P3', 'M2', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M3', 'N1', 'L', 'L'],
  '3': ['L', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'L', 'P1', 'M2', 'P3', 'M1', 'P2', 'P3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M2', 'N2', 'L', 'L'],
  '4': ['F', 'F', 'F', 'M2', 'N1', 'L', 'L', '104', 'F', 'N2', 'L', 'L', '104', 'M2', 'N1', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', '104', 'M1', 'N2', 'L', 'L', 'P3', 'M1', 'M2', 'L'],
  '5': ['L', 'L', 'P2', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'M1', 'N2', 'L', 'L', 'P2', 'M3', 'P2', 'L', 'L', 'M1', 'P1', 'M2', 'N1'],
  '6': ['L', 'L', 'P1', 'M3', 'N2', 'L', 'L', 'P3', 'M2', 'N1', 'L', 'L', 'P2', 'M1', 'N2', 'L', 'L', 'P2', 'L', 'M2', 'P3', 'M2', 'P1', 'M2', 'N1', 'L', 'L', 'P2', 'M3', 'N2', 'L'],
  '7': ['M1', 'M2', 'P3', 'P1', 'M2', 'N1', 'L', 'L', 'L', 'P2', 'M3', 'N2', 'L', 'L', 'P3', 'P2', 'M3', 'M1', 'M3', 'P1', 'M2', 'N2', 'L', 'L', 'P2', 'M3', 'N2', 'L', 'L', 'P3', 'P2'],
  '8': ['N2', 'L', 'L', 'F', 'L', 'M3', 'P2', 'P2', 'P1', 'M2', 'N1', 'L', 'L', 'P2', 'M3', 'N2', 'L', 'L', 'L', 'P2', 'M3', 'M1', 'P3', 'P1', 'M2', 'N1', 'L', 'L', 'P2', 'M1', 'M3'],
  '9': ['N1', 'L', 'L', 'P3', 'M1', 'N2', 'L', 'L', 'P3', 'M3', 'P2', 'L', 'P3', 'M3', 'M2', 'N1', 'L', 'L', 'P2', 'M1', 'N2', 'L', 'L', 'P3', 'M1', 'REP', 'P2', 'M1', 'P1', 'M3', 'N1'],
  '10': ['M2', 'N1', 'L', 'L', 'REP', 'P3', 'M1', 'P1', 'M3', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M1', 'N2', 'L', 'L', 'P1', 'M2'],
  '11': ['M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'P3', 'M1', 'REP', 'M3', 'P1', 'M1', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'N2'],
  '12': ['P1', 'M1', '104', 'M1', 'P2', 'M1', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', '104', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', '104'],
  '13': ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'P1', 'M2', 'N1', 'L', 'L', 'M1', 'N2', 'L', 'L', 'M2', 'P2', 'M3', 'N2', 'L', 'L', 'P1'],
  '14': ['P3', 'M2', 'N1', 'L', 'L', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M1', 'N2', 'L', 'L', 'P3', 'N2', 'L', 'L', 'M3', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'F'],
  '15': ['P2', 'M3', 'N2', 'L', 'L', 'P1', 'M2', 'N1', 'L', 'L', 'F', 'M2', 'N1', 'L', 'L', 'P2', 'M3', 'N2', 'L', 'L', 'P1', 'M3', 'N1', 'L', 'L', 'L', 'F', 'F', 'F', 'F', 'P2']
};

export const JULY_2026_SCHEDULE: DailySchedule[] = [];
Object.entries(rawJulyData).forEach(([opId, shiftsList]) => {
  shiftsList.forEach((code, index) => {
    const day = index + 1;
    const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
    JULY_2026_SCHEDULE.push({
      id: `${opId}_${dateStr}`,
      operatoreId: opId,
      data: dateStr,
      codiceTurno: code
    });
  });
});
