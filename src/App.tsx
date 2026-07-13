import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { OperatorManager } from './components/OperatorManager';
import { LegendManager } from './components/LegendManager';
import { AutomaticGenerator } from './components/AutomaticGenerator';
import { StatsDashboard } from './components/StatsDashboard';
import { ExcelImporter } from './components/ExcelImporter';

const MainLayout: React.FC = () => {
  const { activeView } = useApp();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'calendario' && <CalendarView />}
        {activeView === 'operatori' && <OperatorManager />}
        {activeView === 'generazione' && <AutomaticGenerator />}
        {activeView === 'statistiche' && <StatsDashboard />}
        {activeView === 'importa' && <ExcelImporter />}
        {activeView === 'impostazioni' && <LegendManager />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
