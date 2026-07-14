export interface Operator {
  id: string;
  coordinatorId?: string; // ID del coordinatore proprietario (Legacy)
  departmentId?: string;  // ID del reparto a cui appartiene
  nome: string;
  cognome: string;
  email?: string; // Indirizzo email per il login dipendente
  matricola?: string;
  qualifica: 'TSRM' | 'Coordinatore' | 'Altro';
  unitaOperativa: string;
  stato: 'attivo' | 'sospeso' | 'ferie_prolungate';
  legge104: boolean;
  oreContrattualiMensili: number;
  bancaOreIniziale?: number; // Saldo iniziale banca ore (positivo o negativo)
  preferences?: OperatorPreferences;
}

export interface OperatorPreferences {
  // Esclusioni Totali
  escludiNotti: boolean;
  escludiWeekend: boolean;
  escludiFestivi: boolean;
  
  // Turni Obbligati
  soloMattina: boolean;
  soloPomeriggio: boolean;
  soloNotte: boolean;
  
  // Limiti Mensili (override dei valori di reparto)
  maxNottiMensili?: number;
  maxWeekendMensili?: number;
  maxGiorniConsecutivi?: number;
  minGiorniRiposo?: number;
  
  // Calendario Indisponibilità
  giorniSettimanaNonDisponibili: number[]; // es: [0] per domeniche
  dateNonDisponibili: string[]; // es: ['2026-08-15']
  
  // Ferie e Permessi
  ferieProgrammate: string[];
  permessiProgrammati: string[];
  
  // Scoring
  prioritaDistribuzione: number; // 1-5
}

export type ShiftCategory = 'mattina' | 'pomeriggio' | 'notte' | 'riposo' | 'ferie' | 'reperibilita' | 'assenza';

export interface ShiftType {
  codice: string;
  coordinatorId?: string; // Legacy
  departmentId?: string;  // ID del reparto
  descrizione: string;
  orarioInizio: string; // "HH:MM" or "-"
  orarioFine: string; // "HH:MM" or "-"
  durataOre: number;
  colore: string; // Hex color code
  categoria: ShiftCategory;
}

export interface DailySchedule {
  id: string; // operatorId_date
  coordinatorId?: string; // Legacy
  departmentId?: string;  // ID del reparto
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

// ---- Nuovi Tipi per Motore SaaS ----

export interface RuleSettings {
  turnationApproach: 'arezzo_15' | 'dinamico_5_2' | 'continuativo_6_1' | 'custom';
  maxConsecutiveDays: number; // Es: 5
  minRestDaysAfterCycle: number; // Es: 2
  allowNightForJolly: boolean; // Es: false
  requireRestAfterNight: boolean; // Es: true
  openOnWeekends: boolean; // Es: true
  openOnNights: boolean; // Es: true
  dailyCoverage: {
    morning: number; // Es: 3
    afternoon: number; // Es: 3
    night: number; // Es: 2
  };
}

export interface GenerationError {
  tipo: 'critico' | 'warning' | 'info';
  giorno: number;
  operatoreId?: string;
  messaggio: string;
}

export interface ShiftRequest {
  id: string;
  departmentId: string;
  operatoreId: string; // Chi fa la richiesta
  tipo: 'cambio_turno' | 'ferie' | 'permesso';
  dataRichiesta: string; // Data di creazione della richiesta
  dataInteressata: string; // Data (YYYY-MM-DD) su cui applicare la modifica
  dettagli: string;
  stato: 'in_attesa' | 'approvato' | 'rifiutato';
  
  // Per i cambi turno:
  turnoOriginale?: string; // Es. M1
  turnoRichiesto?: string; // Es. P1
  operatoreSostitutoId?: string; // Con chi vuole scambiare (opzionale)
}

export interface Department {
  id: string;
  coordinatorId: string;
  name: string;
  settings: RuleSettings;
}
