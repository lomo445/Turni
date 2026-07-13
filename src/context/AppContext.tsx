import React, { createContext, useContext, useState, useEffect } from 'react';
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
          const hasJuly = parsed.some((s: any) => s && s.data && typeof s.data === 'string' && s.data.startsWith('2026-07'));
          if (!hasJuly) {
            const merged = [...parsed, ...JULY_2026_SCHEDULE];
            localStorage.setItem('tsrm_schedule', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      } catch (e) {
        console.error("Errore nel caricamento dello storico calendario da localStorage:", e);
      }
    }
    localStorage.setItem('tsrm_schedule', JSON.stringify(JULY_2026_SCHEDULE));
    return JULY_2026_SCHEDULE;
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem('tsrm_supabase');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.error("Errore nel caricamento della config Supabase da localStorage:", e);
      }
    }
    return { url: '', anonKey: '', connected: false };
  });

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
      targetMonthLeaves
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
    // In a real environment, we'd test the connection here.
    // For now, we simulate a successful connection.
    if (url && key) {
      setSupabaseConfig({ url, anonKey: key, connected: true });
      return true;
    } else {
      setSupabaseConfig({ url: '', anonKey: '', connected: false });
      return false;
    }
  };

  // Sync data with Supabase (mock cloud sync)
  const syncData = async (): Promise<void> => {
    if (!supabaseConfig.connected) {
      throw new Error('Supabase non è configurato o connesso.');
    }
    // Simulate API network call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Syncing database tables with Supabase...');
    // In a real application, we would use:
    // const { error } = await supabase.from('schedules').upsert(schedule);
    // and similarly for operators and shifts.
  };

  const resetDatabase = () => {
    localStorage.removeItem('tsrm_operators');
    localStorage.removeItem('tsrm_shifts');
    localStorage.removeItem('tsrm_schedule');
    localStorage.removeItem('tsrm_supabase');
    setOperators(INITIAL_OPERATORS);
    setShifts(DEFAULT_SHIFTS);
    setSchedule([]);
    setSupabaseConfig({ url: '', anonKey: '', connected: false });
    setYear(2026);
    setMonth(1);
  };

  return (
    <AppContext.Provider value={{
      year, month, activeView, operators, shifts, schedule, errors, supabaseConfig, highlightedDay,
      setYear, setMonth, setActiveView, setHighlightedDay,
      addOperator, updateOperator, deleteOperator,
      addShiftType, updateShiftType, deleteShiftType,
      assignShift, assignMultipleShifts, runAutoGeneration, clearMonthSchedule,
      importHistoricalExcel, exportExcelFile, saveSupabaseSettings, syncData, resetDatabase
    }}>
      {children}
    </AppContext.Provider>
  );
};
