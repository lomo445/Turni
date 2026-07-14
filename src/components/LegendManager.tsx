import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ShiftType, ShiftCategory } from '../types';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { SupabaseSettings } from './SupabaseSettings';

export const LegendManager: React.FC = () => {
  const { shifts, addShiftType, updateShiftType, deleteShiftType } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);

  // Form State
  const [codice, setCodice] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [orarioInizio, setOrarioInizio] = useState('');
  const [orarioFine, setOrarioFine] = useState('');
  const [durataOre, setDurataOre] = useState(6);
  const [colore, setColore] = useState('#3b82f6');
  const [categoria, setCategoria] = useState<ShiftCategory>('mattina');

  const openAddModal = () => {
    setEditingShift(null);
    setCodice('');
    setDescrizione('');
    setOrarioInizio('');
    setOrarioFine('');
    setDurataOre(6);
    setColore('#3b82f6');
    setCategoria('mattina');
    setIsModalOpen(true);
  };

  const openEditModal = (s: ShiftType) => {
    setEditingShift(s);
    setCodice(s.codice);
    setDescrizione(s.descrizione);
    setOrarioInizio(s.orarioInizio);
    setOrarioFine(s.orarioFine);
    setDurataOre(s.durataOre);
    setColore(s.colore);
    setCategoria(s.categoria);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codice.trim() || !descrizione.trim()) return;

    const shiftData: ShiftType = {
      codice: codice.trim().toUpperCase(),
      descrizione: descrizione.trim(),
      orarioInizio: orarioInizio.trim() || '-',
      orarioFine: orarioFine.trim() || '-',
      durataOre,
      colore,
      categoria
    };

    if (editingShift) {
      updateShiftType(shiftData);
    } else {
      addShiftType(shiftData);
    }
    setIsModalOpen(false);
  };


  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      
      {/* Top Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Impostazioni Applicazione</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">Codici Turno & Configurazione</h2>
        </div>
        
        <button
          onClick={openAddModal}
          className="mt-4 md:mt-0 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md shadow-sky-600/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-5 h-5" />
          <span>Aggiungi Codice Turno</span>
        </button>
      </div>

      {/* Roster & Cloud sync wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Side: Legend Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 m-0">Legenda Codici Turno</h3>
            <span className="text-xs font-semibold text-slate-500">{shifts.length} codici registrati</span>
          </div>

          <div className="p-6 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {shifts.map(s => (
              <div key={s.codice} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/40 px-2 rounded-lg transition-all">
                <div className="flex items-center space-x-3.5">
                  <span 
                    style={{ backgroundColor: s.colore }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm border border-slate-200/20"
                  >
                    <span className="text-white mix-blend-difference">{s.codice}</span>
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 m-0">{s.codice} - {s.descrizione}</h4>
                    <p className="text-xs text-slate-500 m-0 mt-1">
                      Orario: <span className="font-medium text-slate-700">{s.orarioInizio} - {s.orarioFine}</span>
                      {' '}• Ore: <span className="font-semibold text-sky-600">{s.durataOre}h</span>
                      {' '}• Categoria: <span className="capitalize font-medium text-slate-600">{s.categoria}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditModal(s)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-all"
                    title="Modifica"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler eliminare il codice turno ${s.codice}?`)) {
                        deleteShiftType(s.codice);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cloud settings and Factory Reset */}
        <div className="space-y-6">
          {/* Cloud Database (Supabase) */}
          <SupabaseSettings />

        </div>
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 m-0">
                {editingShift ? `Modifica Codice: ${editingShift.codice}` : 'Nuovo Codice Turno'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Codice Turno</label>
                <input 
                  type="text" 
                  required
                  disabled={!!editingShift} // Can't rename code after creation
                  value={codice}
                  onChange={(e) => setCodice(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="es. M1"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoria Turno</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as any)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="mattina">Mattina</option>
                  <option value="pomeriggio">Pomeriggio</option>
                  <option value="notte">Notte</option>
                  <option value="riposo">Libero / Riposo</option>
                  <option value="ferie">Ferie</option>
                  <option value="reperibilita">Reperibilità</option>
                  <option value="assenza">Assenza (Malattia/104/Maternità)</option>
                </select>
              </div>

              <div className="flex col-span-2 flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrizione Completa</label>
                <input 
                  type="text" 
                  required
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. Mattina Diagnostica"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Orario Inizio</label>
                <input 
                  type="text" 
                  value={orarioInizio}
                  onChange={(e) => setOrarioInizio(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. 07:00 o -"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Orario Fine</label>
                <input 
                  type="text" 
                  value={orarioFine}
                  onChange={(e) => setOrarioFine(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. 13:00 o -"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Durata Ore Effettive</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  max={24}
                  value={durataOre}
                  onChange={(e) => setDurataOre(Number(e.target.value))}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Colore di Visualizzazione</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color" 
                    value={colore}
                    onChange={(e) => setColore(e.target.value)}
                    className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-semibold text-slate-500 uppercase">{colore}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all"
              >
                Annulla
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Salva</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
