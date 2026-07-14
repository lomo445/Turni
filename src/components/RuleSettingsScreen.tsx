import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Sliders, Check, ShieldAlert, Cpu } from 'lucide-react';
import type { RuleSettings } from '../types';

export const RuleSettingsScreen: React.FC = () => {
  const { currentDepartmentId, departments, updateDepartment } = useApp();
  const currentDept = departments.find(d => d.id === currentDepartmentId);

  const defaultSettings: RuleSettings = {
    turnationApproach: 'arezzo_15',
    maxConsecutiveDays: 5,
    minRestDaysAfterCycle: 2,
    allowNightForJolly: false,
    requireRestAfterNight: true,
    openOnWeekends: true,
    openOnNights: true,
    dailyCoverage: { morning: 3, afternoon: 3, night: 2 }
  };

  const [settings, setSettings] = useState<RuleSettings>(currentDept?.settings || defaultSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentDept?.settings) {
      setSettings(currentDept.settings);
    }
  }, [currentDept]);

  const handleSave = () => {
    if (currentDepartmentId) {
      updateDepartment(currentDepartmentId, { settings });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!currentDepartmentId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Nessun reparto selezionato.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Cervello del Sistema</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-sky-500" />
            Regole Motore di Generazione
          </h2>
        </div>
        
        <button
          onClick={handleSave}
          className={`mt-4 md:mt-0 px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md transition-all ${
            saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
          }`}
        >
          {saveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          <span>{saveSuccess ? 'Salvato!' : 'Salva Impostazioni'}</span>
        </button>
      </div>

      <div className="max-w-4xl mt-8 space-y-8">
        
        {/* Selettore Algoritmo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Approccio Algoritmico
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Seleziona la logica di base con cui l'intelligenza artificiale distribuirà i turni mensili agli operatori.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opzione 1: TSRM Arezzo 15gg */}
            <label className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all ${settings.turnationApproach === 'arezzo_15' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center space-x-3">
                <input 
                  type="radio" 
                  name="approach" 
                  value="arezzo_15"
                  checked={settings.turnationApproach === 'arezzo_15'}
                  onChange={() => setSettings({...settings, turnationApproach: 'arezzo_15'})}
                  className="w-5 h-5 text-sky-600" 
                />
                <span className="font-bold text-slate-900">Modello 15-Giorni (Legacy)</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 ml-8">
                Algoritmo basato su ciclo fisso di 15 giorni con sfalsamento per ogni operatore. Non rispetta la copertura dinamica, assegna turni seguendo il pattern matematico rigido.
              </p>
            </label>

            {/* Opzione 2: Motore Dinamico Greedy */}
            <label className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all ${settings.turnationApproach === 'custom' ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-center space-x-3">
                <input 
                  type="radio" 
                  name="approach" 
                  value="custom"
                  checked={settings.turnationApproach === 'custom'}
                  onChange={() => setSettings({...settings, turnationApproach: 'custom'})}
                  className="w-5 h-5 text-sky-600" 
                />
                <span className="font-bold text-slate-900">Motore Dinamico Flessibile</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 ml-8">
                Algoritmo moderno basato su vincoli (constraint-satisfaction). Rispetta la copertura desiderata, i vincoli di riposo e bilancia dinamicamente il monte ore degli operatori.
              </p>
            </label>
          </div>
        </div>

        {/* Impostazioni Dinamiche (solo se Custom) */}
        {settings.turnationApproach !== 'arezzo_15' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Copertura Giornaliera */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Copertura Operativa</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Operatori per Mattina</label>
                  <input 
                    type="number" min="0" max="10" 
                    value={settings.dailyCoverage.morning} 
                    onChange={e => setSettings({...settings, dailyCoverage: {...settings.dailyCoverage, morning: parseInt(e.target.value)||0}})}
                    className="w-20 px-3 py-2 bg-slate-100 border-none rounded-lg text-center font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Operatori per Pomeriggio</label>
                  <input 
                    type="number" min="0" max="10" 
                    value={settings.dailyCoverage.afternoon} 
                    onChange={e => setSettings({...settings, dailyCoverage: {...settings.dailyCoverage, afternoon: parseInt(e.target.value)||0}})}
                    className="w-20 px-3 py-2 bg-slate-100 border-none rounded-lg text-center font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Operatori per Notte</label>
                  <input 
                    type="number" min="0" max="10" 
                    value={settings.dailyCoverage.night} 
                    onChange={e => setSettings({...settings, dailyCoverage: {...settings.dailyCoverage, night: parseInt(e.target.value)||0}})}
                    className="w-20 px-3 py-2 bg-slate-100 border-none rounded-lg text-center font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Vincoli di Riposo e Lavoro */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Vincoli Sindacali</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Max Giorni Consecutivi</label>
                  <input 
                    type="number" min="1" max="14" 
                    value={settings.maxConsecutiveDays} 
                    onChange={e => setSettings({...settings, maxConsecutiveDays: parseInt(e.target.value)||1})}
                    className="w-20 px-3 py-2 bg-slate-100 border-none rounded-lg text-center font-bold text-slate-900"
                  />
                </div>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Riposo obbligatorio dopo Notte</span>
                  <input 
                    type="checkbox" 
                    checked={settings.requireRestAfterNight} 
                    onChange={e => setSettings({...settings, requireRestAfterNight: e.target.checked})}
                    className="w-5 h-5 text-sky-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Reparto aperto nei Weekend</span>
                  <input 
                    type="checkbox" 
                    checked={settings.openOnWeekends} 
                    onChange={e => setSettings({...settings, openOnWeekends: e.target.checked})}
                    className="w-5 h-5 text-sky-600 rounded"
                  />
                </label>
                
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium text-slate-700">Servizio Notturno Attivo</span>
                  <input 
                    type="checkbox" 
                    checked={settings.openOnNights} 
                    onChange={e => setSettings({...settings, openOnNights: e.target.checked})}
                    className="w-5 h-5 text-sky-600 rounded"
                  />
                </label>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Modalità Legacy Attiva</h4>
              <p className="text-xs text-amber-700 mt-1">
                Le impostazioni dinamiche (copertura, vincoli) non sono applicabili quando si utilizza il Modello a 15-Giorni (Arezzo). L'algoritmo genererà i turni seguendo esclusivamente lo schema matematico pre-impostato.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
