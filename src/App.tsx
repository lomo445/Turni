import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { OperatorManager } from './components/OperatorManager';
import { LegendManager } from './components/LegendManager';
import { RuleSettingsScreen } from './components/RuleSettingsScreen';
import { AutomaticGenerator } from './components/AutomaticGenerator';
import { StatsDashboard } from './components/StatsDashboard';
import { ExcelImporter } from './components/ExcelImporter';
import { LoginScreen } from './components/LoginScreen';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { RequestsManager } from './components/RequestsManager';
import { WizardScreen } from './components/WizardScreen';
import { RefreshCw, Activity, Wrench } from 'lucide-react';

// Declare global build time injected by Vite config
declare const __BUILD_TIME__: number;

const MainLayout: React.FC = () => {
  const { activeView, userRole, departments } = useApp();
  const isCoordinatore = userRole === 'coordinatore';

  if (isCoordinatore && departments.length === 0) {
    return <WizardScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {activeView === 'dashboard' && isCoordinatore && <Dashboard />}
        {activeView === 'dashboard' && !isCoordinatore && <EmployeeDashboard />}
        {activeView === 'calendario' && <CalendarView />}
        {activeView === 'operatori' && isCoordinatore && <OperatorManager />}
        {activeView === 'richieste' && isCoordinatore && <RequestsManager />}
        {activeView === 'generazione' && isCoordinatore && <AutomaticGenerator />}
        {activeView === 'regole' && isCoordinatore && <RuleSettingsScreen />}
        {activeView === 'statistiche' && isCoordinatore && <StatsDashboard />}
        {activeView === 'importa' && isCoordinatore && <ExcelImporter />}
        {activeView === 'impostazioni' && isCoordinatore && <LegendManager />}
      </main>
    </div>
  );
};

const MaintenanceScreen: React.FC<{ remainingMs: number; onComplete: () => void }> = ({ remainingMs, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(remainingMs / 1000));

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-white font-sans p-6 relative">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-md w-full text-center space-y-8 z-10 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-400 relative">
            <Wrench className="w-10 h-10 animate-bounce" style={{ animationDuration: '3s' }} />
            <Activity className="w-5 h-5 absolute bottom-2 right-2 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight uppercase text-sky-400">
            Work in Progress
          </h2>
          <h3 className="text-2xl font-black tracking-tight text-white mt-1 leading-tight">
            Non ti arrabbiare, stiamo lavorando per te!
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed pt-1">
            Stiamo caricando le ultime novità e ottimizzando il Planner. Questione di pochi secondi e saremo di nuovo operativi.
          </p>
        </div>

        {/* Live Countdown Circle */}
        <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
          <div className="text-5xl font-black text-white tracking-tight flex items-baseline">
            <span>{timeLeft}</span>
            <span className="text-xs font-bold text-slate-500 ml-1">secondi</span>
          </div>
          <span className="text-xs text-sky-400/80 font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Ottimizzazione in corso...
          </span>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { userRole } = useApp();

  if (!userRole) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

function App() {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => {
    let buildTime = Date.now();
    try {
      if (typeof __BUILD_TIME__ === 'number') {
        buildTime = __BUILD_TIME__;
      }
    } catch (e) {}

    const elapsed = Date.now() - buildTime;
    const maintenanceDuration = 1 * 60 * 1000; // 1 minute
    return elapsed > 0 && elapsed < maintenanceDuration;
  });

  const [customRemainingMs, setCustomRemainingMs] = useState(0);

  // Poll per rilevare i deploy a caldo
  useEffect(() => {
    let localBuildTime = Date.now();
    try {
      if (typeof __BUILD_TIME__ === 'number') {
        localBuildTime = __BUILD_TIME__;
      }
    } catch (e) {}

    const checkForUpdates = async () => {
      try {
        const res = await fetch(`/build-time.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.time === 'number' && data.time > localBuildTime) {
            const newElapsed = Date.now() - data.time;
            const newRemaining = (1 * 60 * 1000) - newElapsed;
            if (newRemaining > 0) {
              setCustomRemainingMs(newRemaining);
              setIsMaintenanceActive(true);
            } else {
              // Se è già passato più di un minuto, ricarica subito
              window.location.reload();
            }
          }
        }
      } catch (e) {
        console.error("Errore nel controllo aggiornamenti:", e);
      }
    };

    // Controlla ogni 20 secondi
    const interval = setInterval(checkForUpdates, 20000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = (() => {
    if (customRemainingMs > 0) return customRemainingMs;
    
    let buildTime = Date.now();
    try {
      if (typeof __BUILD_TIME__ === 'number') {
        buildTime = __BUILD_TIME__;
      }
    } catch (e) {}
    const elapsed = Date.now() - buildTime;
    return (1 * 60 * 1000) - elapsed;
  })();

  const handleMaintenanceComplete = () => {
    setIsMaintenanceActive(false);
    // Ricarica la pagina per caricare il nuovo codice
    window.location.reload();
  };

  if (isMaintenanceActive && remainingMs > 0) {
    return (
      <MaintenanceScreen 
        remainingMs={remainingMs} 
        onComplete={handleMaintenanceComplete} 
      />
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
