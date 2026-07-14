import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '../types';

export const useSupabaseSync = (appState: any) => {
  const {
    departments, shiftRequests, operators, shifts, schedule, 
    _setDepartments, _setShiftRequests, _setOperators, _setShifts, _setSchedule,
    hasLocalChanges, setHasLocalChanges
  } = appState;

  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('tsrm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(!localStorage.getItem('tsrm_user'));

  const [userRole, setUserRole] = useState<'coordinatore' | 'operatore' | null>(() => {
    const saved = localStorage.getItem('tsrm_user_role');
    return saved ? (saved as 'coordinatore' | 'operatore') : null;
  });

  const [currentCoordinatorId, setCurrentCoordinatorId] = useState<string | null>(() => {
    return localStorage.getItem('tsrm_coordinator_id');
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem('tsrm_supabase');
    const defaultConfig = {
      url: 'https://oqglyzmfbtgznybccpnf.supabase.co',
      anonKey: 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr',
      connected: true
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return parsed;
        }
      } catch(e) {}
    }
    
    return defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('tsrm_supabase', JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  // Auth Functions
  const signUp = async (email: string, password: string, role: 'coordinatore' | 'operatore', departmentId?: string): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error("Supabase non configurato.");
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    
    const authUser = data?.user;
    if (authUser) {
      if (role === 'coordinatore') {
        const { error: assocErr } = await supabase
          .from('coordinators')
          .upsert({ id: authUser.id, email: email.trim().toLowerCase() });
        if (assocErr) throw new Error(`Associazione coordinatore fallita: ${assocErr.message}`);
        setCurrentCoordinatorId(authUser.id);
        localStorage.setItem('tsrm_coordinator_id', authUser.id);
      } else if (role === 'operatore' && departmentId) {
        // Cerca il coordinatorId associato a questo departmentId
        const { data: depData, error: depErr } = await supabase
          .from('departments')
          .select('"coordinatorId"')
          .eq('id', departmentId)
          .single();
          
        if (depErr || !depData) throw new Error("Codice Reparto non valido o inesistente.");
        
        const coordId = depData.coordinatorId;
        
        // Crea l'operatore base. Il login avverrà come operatore.
        const newOp = {
          id: authUser.id, // usiamo l'ID utente come ID operatore
          coordinatorId: coordId,
          nome: email.split('@')[0], // placeholder
          cognome: 'Nuovo',
          qualifica: 'TSRM',
          unitaOperativa: departmentId, // o il nome del dipartimento, usiamo l'id per tracciarlo
          stato: 'attivo',
          legge104: false,
          oreContrattualiMensili: 144
        };
        const { error: opErr } = await supabase.from('operators').upsert(newOp);
        if (opErr) throw new Error(`Creazione profilo operatore fallita: ${opErr.message}`);
        
        setCurrentCoordinatorId(coordId);
        localStorage.setItem('tsrm_coordinator_id', coordId);
      }

      setUser(authUser);
      setUserRole(role);
      localStorage.setItem('tsrm_user', JSON.stringify(authUser));
      localStorage.setItem('tsrm_user_role', role);
      setIsDataLoaded(true); // Nessun dato da caricare per i nuovi utenti
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error("Supabase non configurato.");
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    const authUser = data?.user;
    if (authUser) {
      // Determina il ruolo controllando la tabella coordinators
      const { data: coordData, error: coordErr } = await supabase
        .from('coordinators')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      const role = (coordData && !coordErr) ? 'coordinatore' : 'operatore';
      
      setUser(authUser);
      setUserRole(role);
      if (role === 'coordinatore') {
        setCurrentCoordinatorId(authUser.id);
        localStorage.setItem('tsrm_coordinator_id', authUser.id);
      }
      localStorage.setItem('tsrm_user', JSON.stringify(authUser));
      localStorage.setItem('tsrm_user_role', role);
      
      setIsDataLoaded(false); // Inizializza il caricamento dati
      await syncData(); // Forza la sync dopo il login
    }
  };

  const logout = () => {
    setUserRole(null);
    setUser(null);
    setCurrentCoordinatorId(null);
    // Non resettiamo supabaseConfig qui, altrimenti disconnettiamo l'app per i futuri login!
    
    _setOperators([]);
    _setShifts([]);
    _setSchedule([]);
    setHasLocalChanges(false);
    
    localStorage.removeItem('tsrm_user');
    localStorage.removeItem('tsrm_user_role');
    localStorage.removeItem('tsrm_coordinator_id');
    localStorage.removeItem('tsrm_operators');
    localStorage.removeItem('tsrm_shifts');
    localStorage.removeItem('tsrm_schedule');
    // localStorage.removeItem('tsrm_supabase'); -> Manteniamo la configurazione
  };

  const connectSupabase = async (url: string, key: string): Promise<boolean> => {
    try {
      if (!url || !key) {
        setSupabaseConfig({ url: '', anonKey: '', connected: false });
        return false;
      }
      const supabase = createClient(url, key);
      const { error } = await supabase.from('operators').select('id').limit(1);
      if (error && error.code !== '42P01') {
        setSupabaseConfig({ url: '', anonKey: '', connected: false });
        return false;
      }
      setSupabaseConfig({ url, anonKey: key, connected: true });
      return true;
    } catch (e) {
      return false;
    }
  };

  // Sync Logic (Manual Force Push)
  const syncData = async (): Promise<void> => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !currentCoordinatorId) {
      throw new Error('Supabase non configurato o utente non loggato.');
    }
    try {
      const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

      const depsToUpsert = departments.map((d: any) => ({ ...d, coordinatorId: currentCoordinatorId }));
      const opsToUpsert = operators.map((o: any) => ({ ...o, coordinatorId: currentCoordinatorId }));
      const shiftsToUpsert = shifts.map((s: any) => ({ ...s, coordinatorId: currentCoordinatorId }));
      const scheduleToUpsert = schedule.map((sc: any) => ({ ...sc, coordinatorId: currentCoordinatorId }));
      
      if (depsToUpsert.length > 0) {
        const { error: depErr } = await supabase.from('departments').upsert(depsToUpsert);
        if (depErr) throw new Error(depErr.message);
      }

      if (opsToUpsert.length > 0) {
        const { error: opErr } = await supabase.from('operators').upsert(opsToUpsert);
        if (opErr) throw new Error(opErr.message);
      }

      if (shiftsToUpsert.length > 0) {
        const { error: shErr } = await supabase.from('shifts').upsert(shiftsToUpsert);
        if (shErr) throw new Error(shErr.message);
      }

      if (scheduleToUpsert.length > 0) {
        const { error: scErr } = await supabase.from('schedule').upsert(scheduleToUpsert);
        if (scErr) throw new Error(scErr.message);
      }

      // Sync shift_requests: Only if any exist. We don't need coordinatorId because it uses departmentId, but let's upsert what we have
      if (shiftRequests.length > 0) {
        const { error: reqErr } = await supabase.from('shift_requests').upsert(shiftRequests);
        if (reqErr) throw new Error(reqErr.message);
      }
      
      setHasLocalChanges(false);
      setIsDataLoaded(true); // Dati caricati!
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  // Initial Pull on Mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (supabaseConfig.connected && supabaseConfig.url && supabaseConfig.anonKey && currentCoordinatorId) {
      const pullInitialData = async () => {
        try {
          const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
          
          let finalDeps = [], finalOps = [], finalShifts = [], finalSchedule = [], finalReqs = [];
          
          if (userRole === 'coordinatore') {
            const { data: d } = await supabase.from('departments').select('*').eq('coordinatorId', currentCoordinatorId);
            const { data: o } = await supabase.from('operators').select('*').eq('coordinatorId', currentCoordinatorId);
            const { data: s } = await supabase.from('shifts').select('*').eq('coordinatorId', currentCoordinatorId);
            const { data: sc } = await supabase.from('schedule').select('*').eq('coordinatorId', currentCoordinatorId);
            
            finalDeps = d || [];
            finalOps = o || [];
            finalShifts = s || [];
            finalSchedule = sc || [];

            // Fetch requests for all departments of this coordinator
            if (finalDeps.length > 0) {
              const depIds = finalDeps.map((dep: any) => dep.id);
              const { data: r } = await supabase.from('shift_requests').select('*').in('departmentId', depIds);
              finalReqs = r || [];
            }
          } else {
             // For operator: we would need to fetch data based on their department.
             // We'll implement this later, for now we pull everything based on the department they belong to.
             // We need to fetch their profile first to get the department ID.
             // This logic will be added below.
          }

          if (finalDeps && finalDeps.length > 0) {
            _setDepartments(finalDeps);
            localStorage.setItem('tsrm_departments', JSON.stringify(finalDeps));
          }
          if (finalOps && finalOps.length > 0) {
            _setOperators(finalOps);
            localStorage.setItem('tsrm_operators', JSON.stringify(finalOps));
          }
          if (finalShifts && finalShifts.length > 0) {
            _setShifts(finalShifts);
            localStorage.setItem('tsrm_shifts', JSON.stringify(finalShifts));
          }
          if (finalSchedule && finalSchedule.length > 0) {
            _setSchedule(finalSchedule);
            localStorage.setItem('tsrm_schedule', JSON.stringify(finalSchedule));
          }
          if (finalReqs && finalReqs.length > 0) {
            _setShiftRequests(finalReqs);
            localStorage.setItem('tsrm_requests', JSON.stringify(finalReqs));
          }
          setIsDataLoaded(true);
        } catch (e) {
          console.error("Errore nel pull iniziale:", e);
        }
      };
      pullInitialData();
    }
  }, [supabaseConfig.connected, currentCoordinatorId]);

  // Debounced Auto-Sync
  useEffect(() => {
    if (!supabaseConfig.connected || !supabaseConfig.url || !supabaseConfig.anonKey || !currentCoordinatorId || userRole !== 'coordinatore') return;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!hasLocalChanges) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
        const opsToUpsert = operators.map((o: any) => ({ ...o, coordinatorId: currentCoordinatorId }));
        const shiftsToUpsert = shifts.map((s: any) => ({ ...s, coordinatorId: currentCoordinatorId }));
        const scheduleToUpsert = schedule.map((sc: any) => ({ ...sc, coordinatorId: currentCoordinatorId }));

        const { error: err1 } = await supabase.from('operators').upsert(opsToUpsert);
        if (err1) throw new Error(err1.message);
        
        const { error: err2 } = await supabase.from('shifts').upsert(shiftsToUpsert);
        if (err2) throw new Error(err2.message);
        
        if (scheduleToUpsert.length > 0) {
          const { error: err3 } = await supabase.from('schedule').upsert(scheduleToUpsert);
          if (err3) throw new Error(err3.message);
        }
        console.log('Salvataggio automatico cloud completato con successo.');
      } catch (e: any) {
        console.error(e);
      }
    }, 2500);

    return () => clearTimeout(delayDebounceFn);
  }, [operators, shifts, schedule, supabaseConfig.connected, currentCoordinatorId, userRole]);

  return {
    user,
    userRole,
    supabaseConfig,
    currentCoordinatorId,
    saveSupabaseSettings: connectSupabase,
    syncData,
    signUp,
    signIn,
    logout,
    isDataLoaded
  };
};
