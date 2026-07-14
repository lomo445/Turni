import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Operator, ShiftType, DailySchedule, SupabaseConfig, Department, ShiftRequest } from '../types';
import { generateSchedule, validateSchedule } from '../utils/scheduler';
import type { GenerationError } from '../utils/scheduler';
import { importExcel, exportToExcel } from '../utils/excel';
import { useAppState } from '../hooks/useAppState';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

interface AppContextType {
  year: number;
  month: number;
  activeView: string;
  highlightedDay: number | null;
  departments: Department[];
  currentDepartmentId: string | null;
  operators: Operator[];
  shifts: ShiftType[];
  schedule: DailySchedule[];
  shiftRequests: ShiftRequest[];
  errors: GenerationError[];
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  setActiveView: (view: string) => void;
  setHighlightedDay: (d: number | null) => void;
  setCurrentDepartmentId: (id: string | null) => void;
  setDepartments: (deps: Department[]) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  addOperator: (op: Operator) => void;
  updateOperator: (op: Operator) => void;
  deleteOperator: (id: string) => void;
  addRequest: (req: ShiftRequest) => void;
  updateRequestStatus: (id: string, stato: 'approvato' | 'rifiutato') => void;
  addShiftType: (s: ShiftType) => void;
  updateShiftType: (s: ShiftType) => void;
  deleteShiftType: (code: string) => void;
  assignShift: (opId: string, dateStr: string, shiftCode: string) => void;
  assignMultipleShifts: (schedulesToAdd: DailySchedule[]) => void;
  runAutoGeneration: (prevMonthSchedule: DailySchedule[]) => void;
  clearMonthSchedule: (y: number, m: number) => void;
  importHistoricalExcel: (fileData: ArrayBuffer) => string;
  exportExcelFile: () => void;
  user: any;
  userRole: 'coordinatore' | 'operatore' | null;
  isDataLoaded: boolean;
  supabaseConfig: SupabaseConfig;
  saveSupabaseSettings: (url: string, key: string) => Promise<boolean>;
  syncData: () => Promise<void>;
  signUp: (email: string, password: string, role: 'coordinatore' | 'operatore') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appState = useAppState();
  const syncState = useSupabaseSync(appState);
  
  const {
    year, setYear, month, setMonth, activeView, setActiveView,
    highlightedDay, setHighlightedDay, departments, setDepartments,
    currentDepartmentId, setCurrentDepartmentId,
    operators, setOperators, shifts, setShifts, schedule, setSchedule,
    shiftRequests, setShiftRequests
  } = appState;
  
  const {
    user, userRole, isDataLoaded, supabaseConfig, currentCoordinatorId,
    saveSupabaseSettings, syncData, signUp, signIn, logout
  } = syncState;

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    appState.setDepartments((prev: Department[]) => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const [errors, setErrors] = useState<GenerationError[]>([]);
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(() => localStorage.getItem('tsrm_gemini_api_key') || null);

  const setGeminiApiKey = (key: string | null) => {
    setGeminiApiKeyState(key);
    if (key) localStorage.setItem('tsrm_gemini_api_key', key);
    else localStorage.removeItem('tsrm_gemini_api_key');
  };

  useEffect(() => {
    const errs = validateSchedule(year, month, schedule, operators, shifts);
    setErrors(errs);
  }, [year, month, schedule, operators, shifts]);

  const addOperator = (op: Operator) => {
    const opWithDept = { ...op, departmentId: currentDepartmentId || undefined };
    setOperators((prev: Operator[]) => [...prev, opWithDept]);
  };

  const updateOperator = (op: Operator) => {
    setOperators((prev: Operator[]) => prev.map(o => o.id === op.id ? op : o));
  };

  const deleteOperator = async (id: string) => {
    setOperators((prev: Operator[]) => prev.filter(o => o.id !== id));
    setSchedule((prev: DailySchedule[]) => prev.filter(s => s.operatoreId !== id));
    if (supabaseConfig.connected && supabaseConfig.url && supabaseConfig.anonKey && currentCoordinatorId) {
      const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
      await supabase.from('operators').delete().eq('id', id).eq('coordinatorId', currentCoordinatorId);
      await supabase.from('schedule').delete().eq('operatoreId', id).eq('coordinatorId', currentCoordinatorId);
    }
  };

  const addRequest = (req: ShiftRequest) => setShiftRequests((prev: ShiftRequest[]) => [...prev, req]);
  const updateRequestStatus = (id: string, stato: 'approvato' | 'rifiutato') => {
    setShiftRequests((prev: ShiftRequest[]) => prev.map((r: ShiftRequest) => r.id === id ? { ...r, stato } : r));
  };

  const addShiftType = (s: ShiftType) => {
    const sWithDept = { ...s, departmentId: currentDepartmentId || undefined };
    setShifts((prev: ShiftType[]) => [...prev, sWithDept]);
  };

  const updateShiftType = (s: ShiftType) => {
    setShifts((prev: ShiftType[]) => prev.map(st => st.codice === s.codice ? s : st));
  };

  const deleteShiftType = async (code: string) => {
    setShifts((prev: ShiftType[]) => prev.filter(st => st.codice !== code));
    if (supabaseConfig.connected && supabaseConfig.url && supabaseConfig.anonKey && currentCoordinatorId) {
      const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
      await supabase.from('shifts').delete().eq('codice', code).eq('coordinatorId', currentCoordinatorId);
    }
  };

  const assignShift = async (opId: string, dateStr: string, shiftCode: string) => {
    setSchedule((prev: DailySchedule[]) => {
      const filtered = prev.filter(s => !(s.operatoreId === opId && s.data === dateStr));
      if (!shiftCode) return filtered;
      return [...filtered, {
        id: `${opId}_${dateStr}`,
        departmentId: currentDepartmentId || undefined,
        operatoreId: opId,
        data: dateStr,
        codiceTurno: shiftCode
      }];
    });
  };

  const assignMultipleShifts = (schedulesToAdd: DailySchedule[]) => {
    setSchedule((prev: DailySchedule[]) => {
      const keysToRemove = new Set(schedulesToAdd.map(s => `${s.operatoreId}_${s.data}`));
      const filtered = prev.filter(s => !keysToRemove.has(`${s.operatoreId}_${s.data}`));
      return [...filtered, ...schedulesToAdd];
    });
  };

  const runAutoGeneration = (prevMonthSchedule: DailySchedule[]) => {
    const targetMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const targetMonthLeaves = schedule.filter(s => s.data.startsWith(targetMonthPrefix) && s.codiceTurno !== 'L');

    let prevMonthScheduleMerged = prevMonthSchedule;
    if (prevMonthScheduleMerged.length === 0) {
      const prevDate = new Date(year, month - 2, 1);
      const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      prevMonthScheduleMerged = schedule.filter(s => s.data.startsWith(prevPrefix));
    }

    const currentDept = departments.find(d => d.id === currentDepartmentId);
    const ruleSettings = currentDept?.settings || {
      turnationApproach: 'arezzo_15',
      maxConsecutiveDays: 5,
      minRestDaysAfterCycle: 2,
      allowNightForJolly: false,
      requireRestAfterNight: true,
      openOnWeekends: true,
      openOnNights: true,
      dailyCoverage: { morning: 3, afternoon: 3, night: 2 }
    };

    const { schedule: newMonthSched, errors: genErrors } = generateSchedule(
      year, month, operators, shifts, prevMonthScheduleMerged, targetMonthLeaves, schedule, ruleSettings
    );

    if (newMonthSched.length > 0) {
      setSchedule((prev: DailySchedule[]) => {
        const filtered = prev.filter(s => !s.data.startsWith(targetMonthPrefix));
        const schedulesWithDept = newMonthSched.map(s => ({ ...s, departmentId: currentDepartmentId || undefined }));
        return [...filtered, ...schedulesWithDept];
      });
      setErrors(genErrors);
    }
  };

  const clearMonthSchedule = async (y: number, m: number) => {
    const targetMonthPrefix = `${y}-${String(m).padStart(2, '0')}`;
    setSchedule((prev: DailySchedule[]) => prev.filter(s => !s.data.startsWith(targetMonthPrefix)));
    
    if (supabaseConfig.connected && supabaseConfig.url && supabaseConfig.anonKey && currentCoordinatorId) {
      const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
      await supabase.from('schedule').delete().like('data', `${targetMonthPrefix}%`).eq('coordinatorId', currentCoordinatorId);
    }
  };

  const importHistoricalExcel = (fileData: ArrayBuffer): string => {
    try {
      const results = importExcel(fileData, operators, shifts);
      const allNewOps: Operator[] = [];
      const allNewScheds: DailySchedule[] = [];

      results.forEach(res => {
        res.operatorsParsed.forEach(op => {
          if (!allNewOps.some(o => o.id === op.id) && !operators.some(o => o.id === op.id)) {
            allNewOps.push({ ...op, departmentId: currentDepartmentId || undefined } as Operator);
          }
        });
        const schedulesWithDept = res.schedules.map(s => ({ ...s, departmentId: currentDepartmentId || undefined }));
        allNewScheds.push(...schedulesWithDept);
      });

      if (allNewOps.length > 0) setOperators((prev: Operator[]) => [...prev, ...allNewOps]);
      
      if (allNewScheds.length > 0) {
        setSchedule((prev: DailySchedule[]) => {
          const keysToRemove = new Set(allNewScheds.map(s => `${s.operatoreId}_${s.data}`));
          const filtered = prev.filter(s => !keysToRemove.has(`${s.operatoreId}_${s.data}`));
          return [...filtered, ...allNewScheds];
        });
      }

      if (results[0]) {
        setYear(results[0].year);
        setMonth(results[0].month);
      }
      return `Importati ${results.length} mesi, ${allNewOps.length} nuovi operatori e ${allNewScheds.length} turni.`;
    } catch (e: any) {
      return `Errore durante l'importazione: ${e.message}`;
    }
  };

  const exportExcelFile = () => {
    const currentPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const currentMonthSchedule = schedule.filter(s => s.data.startsWith(currentPrefix));
    exportToExcel(year, month, operators, shifts, currentMonthSchedule);
  };


  return (
    <AppContext.Provider value={{
      year, setYear, month, setMonth, activeView, setActiveView,
      highlightedDay, setHighlightedDay, departments, setDepartments,
      currentDepartmentId, setCurrentDepartmentId, updateDepartment,
      operators, shifts, schedule, shiftRequests, errors,
      addOperator, updateOperator, deleteOperator,
      addRequest, updateRequestStatus,
      addShiftType, updateShiftType, deleteShiftType,
      assignShift, assignMultipleShifts, runAutoGeneration, clearMonthSchedule,
      importHistoricalExcel, exportExcelFile,
      user, userRole, isDataLoaded, supabaseConfig, saveSupabaseSettings, syncData,
      signUp, signIn, logout, geminiApiKey, setGeminiApiKey
    }}>
      {children}
    </AppContext.Provider>
  );
};
