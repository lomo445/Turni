export interface Operator {
  id: string;
  coordinatorId?: string; // ID del coordinatore proprietario
  nome: string;
  cognome: string;
  matricola?: string;
  qualifica: 'TSRM' | 'Coordinatore' | 'Altro';
  unitaOperativa: string;
  stato: 'attivo' | 'sospeso' | 'ferie_prolungate';
  legge104: boolean;
  oreContrattualiMensili: number;
  escludiNotti?: boolean;   // Limitazione: no turni notturni (N1, N2)
  soloMattina?: boolean;    // Limitazione: solo turni mattutini (M1, M2, M3, MC)
  escludiWeekend?: boolean; // Limitazione: no weekend e festivi
  bancaOreIniziale?: number; // Saldo iniziale banca ore (positivo o negativo)
}

export type ShiftCategory = 'mattina' | 'pomeriggio' | 'notte' | 'riposo' | 'ferie' | 'reperibilita' | 'assenza';

export interface ShiftType {
  codice: string;
  coordinatorId?: string; // ID del coordinatore proprietario
  descrizione: string;
  orarioInizio: string; // "HH:MM" or "-"
  orarioFine: string; // "HH:MM" or "-"
  durataOre: number;
  colore: string; // Hex color code
  categoria: ShiftCategory;
}

export interface DailySchedule {
  id: string; // operatorId_date
  coordinatorId?: string; // ID del coordinatore proprietario
  operatoreId: string;
  data: string; // "YYYY-MM-DD"
  codiceTurno: string; // ShiftType.codice
}

export interface Holiday {
  data: string; // "YYYY-MM-DD"
  nome: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}
