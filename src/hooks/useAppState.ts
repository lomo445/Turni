import { useState, useEffect } from 'react';
import type { Operator, ShiftType, DailySchedule, Department, ShiftRequest } from '../types';
import { INITIAL_OPERATORS, DEFAULT_SHIFTS, JULY_2026_SCHEDULE } from '../constants/initialData';

export const useAppState = () => {
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
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Departments State
  const [departments, _setDepartments] = useState<Department[]>(() => {
    try {
      const stored = localStorage.getItem('tsrm_departments');
      if (stored) return JSON.parse(stored);
    } catch (e) { console.error(e); }
    return [];
  });

  const [currentDepartmentId, setCurrentDepartmentId] = useState<string | null>(() => {
    return localStorage.getItem('tsrm_current_dept_id');
  });

  // Data State
  const [operators, _setOperators] = useState<Operator[]>(() => {
    try {
      const stored = localStorage.getItem('tsrm_operators');
      if (stored) return JSON.parse(stored);
    } catch (e) { console.error(e); }
    return INITIAL_OPERATORS;
  });

  const [shifts, _setShifts] = useState<ShiftType[]>(() => {
    try {
      const stored = localStorage.getItem('tsrm_shifts');
      if (stored) return JSON.parse(stored);
    } catch (e) { console.error(e); }
    return DEFAULT_SHIFTS;
  });

  const [schedule, _setSchedule] = useState<DailySchedule[]>(() => {
    try {
      const stored = localStorage.getItem('tsrm_schedule');
      if (stored) {
        const parsed = JSON.parse(stored);
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
      }
    } catch (e) {
      console.error(e);
    }
    return JULY_2026_SCHEDULE;
  });

  const [shiftRequests, _setShiftRequests] = useState<ShiftRequest[]>(() => {
    try {
      const stored = localStorage.getItem('tsrm_shift_requests');
      if (stored) return JSON.parse(stored);
    } catch (e) { console.error(e); }
    return [];
  });

  // Trackers
  const setDepartments = (val: any) => {
    if (typeof val === 'function') { _setDepartments((prev) => val(prev)); } 
    else { _setDepartments(val); }
    setHasLocalChanges(true);
  };

  const setOperators = (val: any) => {
    if (typeof val === 'function') { _setOperators((prev) => val(prev)); } 
    else { _setOperators(val); }
    setHasLocalChanges(true);
  };

  const setShifts = (val: any) => {
    if (typeof val === 'function') { _setShifts((prev) => val(prev)); } 
    else { _setShifts(val); }
    setHasLocalChanges(true);
  };

  const setSchedule = (val: any) => {
    if (typeof val === 'function') { _setSchedule((prev) => val(prev)); } 
    else { _setSchedule(val); }
    setHasLocalChanges(true);
  };

  const setShiftRequests = (val: any) => {
    if (typeof val === 'function') { _setShiftRequests((prev) => val(prev)); } 
    else { _setShiftRequests(val); }
    setHasLocalChanges(true);
  };

  // Local Storage Persistence
  useEffect(() => { localStorage.setItem('tsrm_year', String(year)); }, [year]);
  useEffect(() => { localStorage.setItem('tsrm_month', String(month)); }, [month]);
  useEffect(() => { localStorage.setItem('tsrm_operators', JSON.stringify(operators)); }, [operators]);
  useEffect(() => { localStorage.setItem('tsrm_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('tsrm_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('tsrm_shift_requests', JSON.stringify(shiftRequests)); }, [shiftRequests]);
  useEffect(() => { localStorage.setItem('tsrm_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { 
    if (currentDepartmentId) localStorage.setItem('tsrm_current_dept_id', currentDepartmentId);
    else localStorage.removeItem('tsrm_current_dept_id');
  }, [currentDepartmentId]);

  return {
    year, setYear,
    month, setMonth,
    activeView, setActiveView,
    highlightedDay, setHighlightedDay,
    hasLocalChanges, setHasLocalChanges,
    departments, setDepartments, _setDepartments,
    currentDepartmentId, setCurrentDepartmentId,
    operators, setOperators, _setOperators,
    shifts, setShifts, _setShifts,
    schedule, setSchedule, _setSchedule,
    shiftRequests, setShiftRequests, _setShiftRequests
  };
};
