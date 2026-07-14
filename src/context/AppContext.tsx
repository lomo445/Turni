import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Operator, ShiftType, DailySchedule, SupabaseConfig } from '../types';
import { INITIAL_OPERATORS, DEFAULT_SHIFTS, JULY_2026_SCHEDULE } from '../constants/initialData';
import { generateSchedule, validateSchedule } from '../utils/scheduler';
import type { GenerationError } from '../utils/scheduler';
import { importExcel, exportToExcel } from '../utils/excel';

interface AppContextType {
  year: number;
  month: number;
  activeView: string;
  operators: Operator[];
  shifts: ShiftType[];
  schedule: DailySchedule[];
  errors: GenerationError[];
  supabaseConfig: SupabaseConfig;
  highlightedDay: number | null;
  user: any;
  userRole: 'coordinatore' | 'operatore' | null;
  setHighlightedDay: (d: number | null) => void;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  setActiveView: (view: string) => void;
  addOperator: (op: Operator) => void;
  updateOperator: (op: Operator) => void;
  deleteOperator: (id: string) => void;
  addShiftType: (s: ShiftType) => void;
  updateShiftType: (s: ShiftType) => void;
  deleteShiftType: (code: string) => void;
  assignShift: (opId: string, dateStr: string, shiftCode: string) => void;
  assignMultipleShifts: (schedulesToAdd: DailySchedule[]) => void;
  runAutoGeneration: (prevMonthSchedule: DailySchedule[]) => void;
  clearMonthSchedule: (y: number, m: number) => void;
  importHistoricalExcel: (fileData: ArrayBuffer) => string;
  exportExcelFile: () => void;
  saveSupabaseSettings: (url: string, key: string) => Promise<boolean>;
  syncData: () => Promise<void>;
  resetDatabase: () => void;
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsOperator: (coordinatorEmail: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('tsrm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userRole, setUserRole] = useState<'coordinatore' | 'operatore' | null>(() => {
    const saved = localStorage.getItem('tsrm_user_role');
    return saved ? (saved as 'coordinatore' | 'operatore') : null;
  });

  const [currentCoordinatorId, setCurrentCoordinatorId] = useState<string | null>(() => {
    return localStorage.getItem('tsrm_coordinator_id');
  });

  const currentDate = new Date();
  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem('tsrm_year');
    return saved ? Number(saved) : currentDate.getFullYear();
  });
  const [month, setMonth] = useState<number>(() => {
    const saved = localStorage.getItem('tsrm_month');
    return saved ? Number(saved) : (currentDate.getMonth() + 1);
  });
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Load state from localStorage or use defaults
  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem('tsrm_operators');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Errore nel caricamento degli operatori da localStorage:", e);
      }
    }
    return INITIAL_OPERATORS;
  });

  const [shifts, setShifts] = useState<ShiftType[]>(() => {
    const saved = localStorage.getItem('tsrm_shifts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Errore nel caricamento dei tipi turno da localStorage:", e);
      }
    }
    return DEFAULT_SHIFTS;
  });

  const [schedule, setSchedule] = useState<DailySchedule[]>(() => {
    const saved = localStorage.getItem('tsrm_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validParsed = parsed.filter((s: any) => s && s.data && typeof s.data === 'string' && s.operatoreId && s.codiceTurno);
          const hasJuly = validParsed.some((s: any) => s.data.startsWith('2026-07'));
          if (!hasJuly) {
            const merged = [...validParsed, ...JULY_2026_SCHEDULE];
            localStorage.setItem('tsrm_schedule', JSON.stringify(merged));
            return merged;
          }
          return validParsed;
        }
      } catch (e) {
        console.error("Errore nel caricamento dello storico calendario da localStorage:", e);
      }
    }
    localStorage.setItem('tsrm_schedule', JSON.stringify(JULY_2026_SCHEDULE));
    return JULY_2026_SCHEDULE;
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: 'https://oqglyzmfbtgznybccpnf.supabase.co',
    anonKey: 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr',
    connected: true
  });

  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem('tsrm_gemini_api_key') || null;
  });

  const setGeminiApiKey = (key: string | null) => {
    setGeminiApiKeyState(key);
    if (key) {
      localStorage.setItem('tsrm_gemini_api_key', key);
    } else {
      localStorage.removeItem('tsrm_gemini_api_key');
    }
  };

  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);

  const [errors, setErrors] = useState<GenerationError[]>([]);

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem('tsrm_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('tsrm_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('tsrm_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('tsrm_supabase', JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  useEffect(() => {
    localStorage.setItem('tsrm_year', String(year));
  }, [year]);

  useEffect(() => {
    localStorage.setItem('tsrm_month', String(month));
  }, [month]);

  // Run validation automatically when schedule or metadata changes
  useEffect(() => {
    const errs = validateSchedule(year, month, schedule, operators, shifts);
    setErrors(errs);
  }, [year, month, schedule, operators, shifts]);

  // Operators Actions
  const addOperator = (op: Operator) => {
    setOperators(prev => [...prev, op]);
  };

  const updateOperator = (op: Operator) => {
    setOperators(prev => prev.map(o => o.id === op.id ? op : o));
  };

  const deleteOperator = (id: string) => {
    setOperators(prev => prev.filter(o => o.id !== id));
    // Remove their scheduled shifts
    setSchedule(prev => prev.filter(s => s.operatoreId !== id));
  };

  // Shifts Actions
  const addShiftType = (s: ShiftType) => {
    setShifts(prev => [...prev, s]);
  };

  const updateShiftType = (s: ShiftType) => {
    setShifts(prev => prev.map(st => st.codice === s.codice ? s : st));
  };

  const deleteShiftType = (code: string) => {
    setShifts(prev => prev.filter(st => st.codice !== code));
  };

  // Calendar editing Actions
  const assignShift = (opId: string, dateStr: string, shiftCode: string) => {
    setSchedule(prev => {
      const filtered = prev.filter(s => !(s.operatoreId === opId && s.data === dateStr));
      return [...filtered, {
        id: `${opId}_${dateStr}`,
        operatoreId: opId,
        data: dateStr,
        codiceTurno: shiftCode
      }];
    });
  };

  const assignMultipleShifts = (schedulesToAdd: DailySchedule[]) => {
    setSchedule(prev => {
      const keysToRemove = new Set(schedulesToAdd.map(s => `${s.operatoreId}_${s.data}`));
      const filtered = prev.filter(s => !keysToRemove.has(`${s.operatoreId}_${s.data}`));
      return [...filtered, ...schedulesToAdd];
    });
  };

  // Run Automatic generation for the selected year & month
  const runAutoGeneration = (prevMonthSchedule: DailySchedule[]) => {
    // Collect current leaves/ferie and pre-assigned working shifts for the target month (everything that is not 'L')
    const targetMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const targetMonthLeaves = schedule.filter(s => 
      s.data.startsWith(targetMonthPrefix) && s.codiceTurno !== 'L'
    );

    // Merge previous month data provided or read from schedule state
    let prevMonthScheduleMerged = prevMonthSchedule;
    if (prevMonthScheduleMerged.length === 0) {
      // Find in state
      const prevDate = new Date(year, month - 2, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth() + 1;
      const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      prevMonthScheduleMerged = schedule.filter(s => s.data.startsWith(prevPrefix));
    }

    const { schedule: newMonthSched, errors: genErrors } = generateSchedule(
      year,
      month,
      operators,
      shifts,
      prevMonthScheduleMerged,
      targetMonthLeaves,
      schedule
    );

    if (newMonthSched.length > 0) {
      // Keep other months' schedules, overwrite the target month
      setSchedule(prev => {
        const filtered = prev.filter(s => !s.data.startsWith(targetMonthPrefix));
        return [...filtered, ...newMonthSched];
      });
      setErrors(genErrors);
    }
  };

  const clearMonthSchedule = (y: number, m: number) => {
    const targetMonthPrefix = `${y}-${String(m).padStart(2, '0')}`;
    setSchedule(prev => prev.filter(s => !s.data.startsWith(targetMonthPrefix)));
  };

  // Import historical Excel
  const importHistoricalExcel = (fileData: ArrayBuffer): string => {
    try {
      const results = importExcel(fileData, operators, shifts);
      if (results.length === 0) return 'Nessun foglio mensile riconosciuto nel file.';

      // Extract new operators found in Excel
      const allNewOps: Operator[] = [];
      const allNewScheds: DailySchedule[] = [];

      results.forEach(res => {
        // Collect new operators
        res.operatorsParsed.forEach(op => {
          if (!allNewOps.some(o => o.id === op.id) && !operators.some(o => o.id === op.id)) {
            allNewOps.push(op as Operator);
          }
        });
        // Collect schedules
        allNewScheds.push(...res.schedules);
      });

      // Insert new operators
      if (allNewOps.length > 0) {
        setOperators(prev => [...prev, ...allNewOps]);
      }

      // Merge schedules (overwrite matching days)
      if (allNewScheds.length > 0) {
        setSchedule(prev => {
          const keysToRemove = new Set(allNewScheds.map(s => `${s.operatoreId}_${s.data}`));
          const filtered = prev.filter(s => !keysToRemove.has(`${s.operatoreId}_${s.data}`));
          return [...filtered, ...allNewScheds];
        });
      }

      // Set view to loaded year/month of the first parsed result
      if (results[0]) {
        setYear(results[0].year);
        setMonth(results[0].month);
      }

      return `Importazione completata: caricati ${results.length} mesi, inseriti ${allNewOps.length} nuovi operatori e ${allNewScheds.length} record turni.`;
    } catch (err: any) {
      console.error(err);
      return `Errore durante l'importazione: ${err.message || 'formato non supportato'}`;
    }
  };

  // Export current month to Excel file
  const exportExcelFile = () => {
    const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const currentMonthSchedule = schedule.filter(s => s.data.startsWith(currentPrefix));
    
    exportToExcel(year, month, operators, shifts, currentMonthSchedule);
  };

  // Supabase mock / settings setup
  const saveSupabaseSettings = async (url: string, key: string): Promise<boolean> => {
    if (!url || !key) {
      setSupabaseConfig({ url: '', anonKey: '', connected: false });
      localStorage.removeItem('tsrm_supabase');
      return false;
    }

    try {
      const supabase = createClient(url, key);
      const { error } = await supabase.from('operators').select('id').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          // Le tabelle non esistono ancora, ma le credenziali sono valide!
          setSupabaseConfig({ url, anonKey: key, connected: true });
          localStorage.setItem('tsrm_supabase', JSON.stringify({ url, anonKey: key, connected: true }));
          return true;
        }
        // Per qualsiasi altro tipo di errore (credenziali errate, CORS, ecc.)
        setSupabaseConfig({ url: '', anonKey: '', connected: false });
        return false;
      }

      setSupabaseConfig({ url, anonKey: key, connected: true });
      localStorage.setItem('tsrm_supabase', JSON.stringify({ url, anonKey: key, connected: true }));
      return true;
    } catch (e) {
      console.error('Errore durante il test di connessione:', e);
      setSupabaseConfig({ url: '', anonKey: '', connected: false });
      return false;
    }
  };

  // Sincronizzazione reale multi-tenant con Supabase
  const syncData = async (): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !currentCoordinatorId) {
      throw new Error('Supabase non è configurato o l\'utente non è loggato.');
    }
    
    try {
      const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

      // 1. Legge lo stato sul cloud filtrato per questo coordinatore
      const { data: cloudOps, error: errOps } = await supabase
        .from('operators')
        .select('*')
        .eq('coordinatorId', currentCoordinatorId);

      if (errOps) {
        if (errOps.code === '42P01') {
          throw new Error("Le tabelle non esistono ancora in Supabase. Per favore, esegui lo script SQL fornito nelle istruzioni prima di procedere.");
        }
        throw new Error(`Errore di connessione Supabase: ${errOps.message}`);
      }

      const opsToUpsert = operators.map(o => ({ ...o, coordinatorId: currentCoordinatorId }));
      const shiftsToUpsert = shifts.map(s => ({ ...s, coordinatorId: currentCoordinatorId }));
      const scheduleToUpsert = schedule.map(sc => ({ ...sc, coordinatorId: currentCoordinatorId }));

      // 2. Se il cloud è vuoto per questo coordinatore, invia (PUSH) i dati locali
      if (!cloudOps || cloudOps.length === 0) {
        const { error: opErr } = await supabase.from('operators').upsert(opsToUpsert);
        if (opErr) throw new Error(`Errore caricamento operatori: ${opErr.message}`);
        
        const { error: shErr } = await supabase.from('shifts').upsert(shiftsToUpsert);
        if (shErr) throw new Error(`Errore caricamento turni: ${shErr.message}`);
        
        if (scheduleToUpsert.length > 0) {
          const { error: scErr } = await supabase.from('schedule').upsert(scheduleToUpsert);
          if (scErr) throw new Error(`Errore caricamento calendario: ${scErr.message}`);
        }
        return;
      }

      // 3. Se il cloud contiene dati, esegui l'unione (UPSERT locale -> cloud e poi PULL cloud -> locale)
      const { error: opErr } = await supabase.from('operators').upsert(opsToUpsert);
      if (opErr) throw new Error(`Errore sincronizzazione operatori: ${opErr.message}`);

      const { error: shErr } = await supabase.from('shifts').upsert(shiftsToUpsert);
      if (shErr) throw new Error(`Errore sincronizzazione turni: ${shErr.message}`);

      if (scheduleToUpsert.length > 0) {
        const { error: scErr } = await supabase.from('schedule').upsert(scheduleToUpsert);
        if (scErr) throw new Error(`Errore sincronizzazione calendario: ${scErr.message}`);
      }

      // Riscarica i dati finali consolidati
      const { data: finalOps } = await supabase.from('operators').select('*').eq('coordinatorId', currentCoordinatorId);
      const { data: finalShifts } = await supabase.from('shifts').select('*').eq('coordinatorId', currentCoordinatorId);
      const { data: finalSchedule } = await supabase.from('schedule').select('*').eq('coordinatorId', currentCoordinatorId);

      if (finalOps && finalOps.length > 0) {
        setOperators(finalOps);
        localStorage.setItem('tsrm_operators', JSON.stringify(finalOps));
      }
      if (finalShifts && finalShifts.length > 0) {
        setShifts(finalShifts);
        localStorage.setItem('tsrm_shifts', JSON.stringify(finalShifts));
      }
      if (finalSchedule) {
        setSchedule(finalSchedule);
        localStorage.setItem('tsrm_schedule', JSON.stringify(finalSchedule));
      }
    } catch (e: any) {
      alert(`Errore Sincronizzazione Cloud: ${e.message}`);
      console.error(e);
    }
  };

  // Debounced Auto-Sync in background (attivo solo se connesso e con coordinatore autenticato)
  useEffect(() => {
    if (!supabaseConfig.connected || !supabaseConfig.url || !supabaseConfig.anonKey || !currentCoordinatorId || userRole !== 'coordinatore') return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
        const opsToUpsert = operators.map(o => ({ ...o, coordinatorId: currentCoordinatorId }));
        const shiftsToUpsert = shifts.map(s => ({ ...s, coordinatorId: currentCoordinatorId }));
        const scheduleToUpsert = schedule.map(sc => ({ ...sc, coordinatorId: currentCoordinatorId }));

        const { error: err1 } = await supabase.from('operators').upsert(opsToUpsert);
        if (err1) throw new Error('Operators: ' + err1.message);
        
        const { error: err2 } = await supabase.from('shifts').upsert(shiftsToUpsert);
        if (err2) throw new Error('Shifts: ' + err2.message);
        
        if (scheduleToUpsert.length > 0) {
          const { error: err3 } = await supabase.from('schedule').upsert(scheduleToUpsert);
          if (err3) throw new Error('Schedule: ' + err3.message);
        }
        console.log('Salvataggio automatico cloud completato con successo.');
      } catch (e: any) {
        console.error('Errore salvataggio automatico cloud (Probabilmente mancano le tabelle nel database!):', e.message);
      }
    }, 2500);

    return () => clearTimeout(delayDebounceFn);
  }, [operators, shifts, schedule, supabaseConfig.connected, currentCoordinatorId, userRole]);

  // Autenticazione Supabase
  const signUp = async (email: string, password: string): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error("Supabase non configurato.");
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    
    const authUser = data?.user;
    if (authUser) {
      // Registra associazione coordinatore
      const { error: assocErr } = await supabase
        .from('coordinators')
        .upsert({ id: authUser.id, email: email.trim().toLowerCase() });
      if (assocErr) throw new Error(`Associazione coordinatore fallita: ${assocErr.message}`);

      // Invia dati locali come seed per l'account
      const opsToUpsert = operators.map(o => ({ ...o, coordinatorId: authUser.id }));
      const shiftsToUpsert = shifts.map(s => ({ ...s, coordinatorId: authUser.id }));
      const scheduleToUpsert = schedule.map(sc => ({ ...sc, coordinatorId: authUser.id }));

      await supabase.from('operators').upsert(opsToUpsert);
      await supabase.from('shifts').upsert(shiftsToUpsert);
      if (scheduleToUpsert.length > 0) {
        await supabase.from('schedule').upsert(scheduleToUpsert);
      }

      setUser(authUser);
      setUserRole('coordinatore');
      setCurrentCoordinatorId(authUser.id);
      localStorage.setItem('tsrm_user', JSON.stringify(authUser));
      localStorage.setItem('tsrm_user_role', 'coordinatore');
      localStorage.setItem('tsrm_coordinator_id', authUser.id);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error("Supabase non configurato.");
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    const authUser = data?.user;
    if (authUser) {
      await supabase.from('coordinators').upsert({ id: authUser.id, email: email.trim().toLowerCase() });

      setUser(authUser);
      setUserRole('coordinatore');
      setCurrentCoordinatorId(authUser.id);
      localStorage.setItem('tsrm_user', JSON.stringify(authUser));
      localStorage.setItem('tsrm_user_role', 'coordinatore');
      localStorage.setItem('tsrm_coordinator_id', authUser.id);

      // Scarica dati coordinatore dal cloud
      const { data: ops } = await supabase.from('operators').select('*').eq('coordinatorId', authUser.id);
      const { data: shs } = await supabase.from('shifts').select('*').eq('coordinatorId', authUser.id);
      const { data: sched } = await supabase.from('schedule').select('*').eq('coordinatorId', authUser.id);

      if (ops && ops.length > 0) {
        setOperators(ops);
        localStorage.setItem('tsrm_operators', JSON.stringify(ops));
      } else {
        const opsToUpsert = INITIAL_OPERATORS.map(o => ({ ...o, coordinatorId: authUser.id }));
        await supabase.from('operators').upsert(opsToUpsert);
        setOperators(INITIAL_OPERATORS);
        localStorage.setItem('tsrm_operators', JSON.stringify(INITIAL_OPERATORS));
      }

      if (shs && shs.length > 0) {
        setShifts(shs);
        localStorage.setItem('tsrm_shifts', JSON.stringify(shs));
      } else {
        const shiftsToUpsert = DEFAULT_SHIFTS.map(s => ({ ...s, coordinatorId: authUser.id }));
        await supabase.from('shifts').upsert(shiftsToUpsert);
        setShifts(DEFAULT_SHIFTS);
        localStorage.setItem('tsrm_shifts', JSON.stringify(DEFAULT_SHIFTS));
      }

      if (sched) {
        setSchedule(sched);
        localStorage.setItem('tsrm_schedule', JSON.stringify(sched));
      } else {
        setSchedule([]);
        localStorage.setItem('tsrm_schedule', '[]');
      }
    }
  };

  const signInAsOperator = async (coordinatorEmail: string): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error("Supabase non configurato.");
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

    const { data, error } = await supabase
      .from('coordinators')
      .select('id')
      .eq('email', coordinatorEmail.trim().toLowerCase())
      .single();

    if (error || !data) {
      throw new Error("Nessun coordinatore registrato con questa email. Controlla l'indirizzo.");
    }

    const coordId = data.id;
    setUser(null);
    setUserRole('operatore');
    setCurrentCoordinatorId(coordId);
    localStorage.setItem('tsrm_user_role', 'operatore');
    localStorage.setItem('tsrm_coordinator_id', coordId);

    // Scarica i dati dell'operatore in sola lettura
    const { data: ops } = await supabase.from('operators').select('*').eq('coordinatorId', coordId);
    const { data: shs } = await supabase.from('shifts').select('*').eq('coordinatorId', coordId);
    const { data: sched } = await supabase.from('schedule').select('*').eq('coordinatorId', coordId);

    if (ops && ops.length > 0) {
      setOperators(ops);
      localStorage.setItem('tsrm_operators', JSON.stringify(ops));
    }
    if (shs && shs.length > 0) {
      setShifts(shs);
      localStorage.setItem('tsrm_shifts', JSON.stringify(shs));
    }
    if (sched) {
      setSchedule(sched);
      localStorage.setItem('tsrm_schedule', JSON.stringify(sched));
    }
    setActiveView('calendario');
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setUserRole(null);
    setCurrentCoordinatorId(null);
    localStorage.removeItem('tsrm_user');
    localStorage.removeItem('tsrm_user_role');
    localStorage.removeItem('tsrm_coordinator_id');

    setOperators(INITIAL_OPERATORS);
    setShifts(DEFAULT_SHIFTS);
    setSchedule([]);
  };

  const resetDatabase = () => {
    localStorage.removeItem('tsrm_operators');
    localStorage.removeItem('tsrm_shifts');
    localStorage.removeItem('tsrm_schedule');
    localStorage.removeItem('tsrm_supabase');
    localStorage.removeItem('tsrm_user');
    localStorage.removeItem('tsrm_user_role');
    localStorage.removeItem('tsrm_coordinator_id');
    setOperators(INITIAL_OPERATORS);
    setShifts(DEFAULT_SHIFTS);
    setSchedule([]);
    setSchedule([]);
    setUser(null);
    setUserRole(null);
    setCurrentCoordinatorId(null);
    setYear(2026);
    setMonth(1);
  };

  return (
    <AppContext.Provider value={{
      year, month, activeView, operators, shifts, schedule, errors, supabaseConfig, highlightedDay,
      user, userRole, geminiApiKey, setGeminiApiKey,
      setYear, setMonth, setActiveView, setHighlightedDay,
      addOperator, updateOperator, deleteOperator,
      addShiftType, updateShiftType, deleteShiftType,
      assignShift, assignMultipleShifts, runAutoGeneration, clearMonthSchedule,
      importHistoricalExcel, exportExcelFile, saveSupabaseSettings, syncData, resetDatabase,
      signUp, signIn, signInAsOperator, logout
    }}>
      {children}
    </AppContext.Provider>
  );
};
