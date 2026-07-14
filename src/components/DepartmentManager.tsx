import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Plus, Edit2, Trash2, Cpu, Sparkles, ShieldAlert } from 'lucide-react';
import type { Department, RuleSettings } from '../types';

export const DepartmentManager: React.FC = () => {
  const { departments, updateDepartment, deleteDepartment, addDepartment, user, setCurrentDepartmentId } = useApp();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEngine, setNewEngine] = useState<'custom' | 'arezzo_15'>('custom');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleEditSave = (id: string) => {
    if (editName.trim()) {
      updateDepartment(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleAddSave = () => {
    if (!newName.trim()) return;

    const rules: RuleSettings = newEngine === 'custom' 
      ? { turnationApproach: 'custom', maxConsecutiveDays: 5, minRestDaysAfterCycle: 2, allowNightForJolly: false, requireRestAfterNight: true, openOnWeekends: true, openOnNights: true, dailyCoverage: { morning: 2, afternoon: 2, night: 1 } }
      : { turnationApproach: 'arezzo_15', maxConsecutiveDays: 6, minRestDaysAfterCycle: 1, allowNightForJolly: false, requireRestAfterNight: true, openOnWeekends: true, openOnNights: true, dailyCoverage: { morning: 1, afternoon: 1, night: 1 } };

    const newDept: Department = {
      id: `dept_${Date.now()}`,
      coordinatorId: user?.id || 'coord_unknown',
      name: newName.trim(),
      settings: rules
    };

    addDepartment(newDept);
    setCurrentDepartmentId(newDept.id);
    setIsAdding(false);
    setNewName('');
  };

  const handleDelete = async (dept: Department) => {
    if (deleteConfirmText.toLowerCase() === dept.name.toLowerCase()) {
      await deleteDepartment(dept.id);
      setDeletingId(null);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestione Reparti</h2>
            <p className="text-slate-500 mt-1">Crea, rinomina o elimina le unità operative sotto la tua supervisione.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Nuovo Reparto
          </button>
        </div>

        {/* Form Aggiunta Nuovo Reparto */}
        {isAdding && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Crea Nuova Unità Operativa</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nome Reparto</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Es. Ortopedia"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Motore Algoritmico</label>
                <select 
                  value={newEngine}
                  onChange={(e: any) => setNewEngine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="custom">Motore Dinamico a Vincoli</option>
                  <option value="arezzo_15">Ciclo Fisso (Arezzo 15)</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={handleAddSave} disabled={!newName.trim()} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50">Salva</button>
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Annulla</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map(dept => {
            const isDeleting = deletingId === dept.id;
            const isEditing = editingId === dept.id;

            return (
              <div key={dept.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${isDeleting ? 'border-rose-500 ring-4 ring-rose-500/10 scale-[1.02]' : 'border-slate-200 hover:shadow-md'}`}>
                
                {isDeleting ? (
                  <div className="p-6 bg-rose-50/50">
                    <div className="flex items-center gap-3 text-rose-600 mb-4">
                      <ShieldAlert className="w-6 h-6" />
                      <h3 className="font-bold text-lg">Zona Pericolosa</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      L'eliminazione di <strong>{dept.name}</strong> è irreversibile. Verranno eliminati tutti i turni, le richieste e le preferenze associate.
                    </p>
                    <label className="text-xs font-bold text-slate-500 block mb-2">Scrivi il nome esatto del reparto per confermare:</label>
                    <input 
                      type="text" 
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder={dept.name}
                      className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleDelete(dept)} 
                        disabled={deleteConfirmText.toLowerCase() !== dept.name.toLowerCase()}
                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Elimina Definitivamente
                      </button>
                      <button onClick={() => {setDeletingId(null); setDeleteConfirmText('');}} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Annulla</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          {isEditing ? (
                            <div className="flex gap-2 mb-1">
                              <input 
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="border border-sky-500 rounded-lg px-2 py-1 text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                autoFocus
                              />
                              <button onClick={() => handleEditSave(dept.id)} className="bg-slate-800 text-white text-xs font-bold px-3 rounded-lg">Salva</button>
                            </div>
                          ) : (
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{dept.name}</h3>
                          )}
                          <p className="text-xs text-slate-500 font-mono mt-1">ID: {dept.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(dept.id); setEditName(dept.name); }} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeletingId(dept.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                          {dept.settings.turnationApproach === 'custom' ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motore</p>
                          <p className="text-sm font-bold text-slate-700">{dept.settings.turnationApproach === 'custom' ? 'Dinamico' : 'Ciclo Fisso'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff</p>
                          <p className="text-sm font-bold text-slate-700">Attivo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
