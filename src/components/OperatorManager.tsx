import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Operator, OperatorPreferences } from '../types';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  ShieldAlert,
  UserCheck,
  CalendarDays,
  Sliders,
  CalendarOff,
  Plus,
  X
} from 'lucide-react';

const defaultPreferences: OperatorPreferences = {
  escludiNotti: false,
  escludiWeekend: false,
  escludiFestivi: false,
  soloMattina: false,
  soloPomeriggio: false,
  soloNotte: false,
  giorniSettimanaNonDisponibili: [],
  dateNonDisponibili: [],
  ferieProgrammate: [],
  permessiProgrammati: [],
  prioritaDistribuzione: 3
};

export const OperatorManager: React.FC = () => {
  const { operators, addOperator, updateOperator, deleteOperator } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [editingOp, setEditingOp] = useState<Operator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'anagrafica' | 'vincoli' | 'assenze'>('anagrafica');

  // Form State - Anagrafica
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [matricola, setMatricola] = useState('');
  const [qualifica, setQualifica] = useState<'TSRM' | 'Coordinatore' | 'Altro'>('TSRM');
  const [unitaOperativa, setUnitaOperativa] = useState('Radiologia DEU');
  const [stato, setStato] = useState<'attivo' | 'sospeso' | 'ferie_prolungate'>('attivo');
  const [legge104, setLegge104] = useState(false);
  const [oreContrattuali, setOreContrattuali] = useState(144);
  const [bancaOreIniziale, setBancaOreIniziale] = useState(0);

  // Form State - Preferenze
  const [preferences, setPreferences] = useState<OperatorPreferences>(defaultPreferences);
  const [newFerieDate, setNewFerieDate] = useState('');

  const openAddModal = () => {
    setEditingOp(null);
    setNome('');
    setCognome('');
    setMatricola('');
    setQualifica('TSRM');
    setUnitaOperativa('Radiologia DEU');
    setStato('attivo');
    setLegge104(false);
    setOreContrattuali(144);
    setBancaOreIniziale(0);
    setPreferences(defaultPreferences);
    setActiveTab('anagrafica');
    setIsModalOpen(true);
  };

  const openEditModal = (op: Operator) => {
    setEditingOp(op);
    setNome(op.nome);
    setCognome(op.cognome);
    setMatricola(op.matricola || '');
    setQualifica(op.qualifica);
    setUnitaOperativa(op.unitaOperativa);
    setStato(op.stato);
    setLegge104(op.legge104);
    setOreContrattuali(op.oreContrattualiMensili);
    setBancaOreIniziale(op.bancaOreIniziale || 0);
    setPreferences(op.preferences || defaultPreferences);
    setActiveTab('anagrafica');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) return;

    const opData: Operator = {
      id: editingOp ? editingOp.id : `op_${Date.now()}`,
      nome: nome.trim().toUpperCase(),
      cognome: cognome.trim().toUpperCase(),
      matricola: matricola.trim() || undefined,
      qualifica,
      unitaOperativa,
      stato,
      legge104,
      oreContrattualiMensili: oreContrattuali,
      bancaOreIniziale: Number(bancaOreIniziale),
      preferences
    };

    if (editingOp) {
      updateOperator(opData);
    } else {
      addOperator(opData);
    }
    setIsModalOpen(false);
  };

  const filteredOps = operators.filter(op => {
    const fullName = `${op.cognome} ${op.nome}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || op.matricola?.includes(search);
    const matchesFilter = filterStato === 'tutti' || op.stato === filterStato;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      {/* Top section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Anagrafica Dipendenti</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">Gestione Operatori</h2>
        </div>
        
        <button
          onClick={openAddModal}
          className="mt-4 md:mt-0 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md shadow-sky-600/10 transition-all hover:scale-[1.01]"
        >
          <UserPlus className="w-5 h-5" />
          <span>Aggiungi Operatore</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input 
            type="text"
            placeholder="Cerca per cognome, nome o matricola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 text-slate-800 placeholder-slate-400 text-sm focus:ring-0 focus:outline-none"
          />
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value)}
            className="w-full bg-transparent border-0 text-slate-700 text-sm font-semibold focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="attivo">Stato: Attivo</option>
            <option value="sospeso">Stato: Sospeso</option>
            <option value="ferie_prolungate">Stato: Ferie prolungate</option>
          </select>
        </div>

        <div className="flex items-center text-xs text-slate-500 font-medium px-2">
          Trovati {filteredOps.length} operatori nel reparto TSRM
        </div>
      </div>

      {/* Roster list */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-left text-xs font-bold uppercase">
              <th className="px-6 py-4">Dipendente</th>
              <th className="px-6 py-4">Matricola</th>
              <th className="px-6 py-4">Qualifica</th>
              <th className="px-6 py-4">Ore Mensili</th>
              <th className="px-6 py-4">Stato</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {filteredOps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                  Nessun operatore corrisponde ai filtri di ricerca.
                </td>
              </tr>
            ) : (
              filteredOps.map(op => (
                <tr key={op.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-slate-900">
                    <div className="font-bold">{op.cognome} {op.nome}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {op.preferences?.escludiNotti && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold">
                          No Notti
                        </span>
                      )}
                      {op.preferences?.soloMattina && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-bold">
                          Solo Mattina
                        </span>
                      )}
                      {op.preferences?.escludiWeekend && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold">
                          No Weekend
                        </span>
                      )}
                      {op.preferences?.ferieProgrammate && op.preferences.ferieProgrammate.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold">
                          Ferie Programmate ({op.preferences.ferieProgrammate.length})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {op.matricola || 'N/D'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                      {op.qualifica}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {op.oreContrattualiMensili} ore
                  </td>
                  <td className="px-6 py-4">
                    {op.stato === 'attivo' && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 rounded-full flex items-center w-max">
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Attivo
                      </span>
                    )}
                    {op.stato === 'sospeso' && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 rounded-full flex items-center w-max">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Sospeso
                      </span>
                    )}
                    {op.stato === 'ferie_prolungate' && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 rounded-full flex items-center w-max">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Ferie prolungate
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => openEditModal(op)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-all"
                      title="Modifica"
                    >
                      <Edit3 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler eliminare l'operatore ${op.cognome} ${op.nome}?`)) {
                          deleteOperator(op.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                      title="Elimina"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL WITH TABS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800 m-0">
                {editingOp ? `Profilo Operatore: ${editingOp.cognome} ${editingOp.nome}` : 'Nuovo Operatore Reparto'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('anagrafica')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex justify-center items-center gap-2 ${
                  activeTab === 'anagrafica' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Anagrafica Base
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vincoli')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex justify-center items-center gap-2 ${
                  activeTab === 'vincoli' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-4 h-4" /> Vincoli Turno
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assenze')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex justify-center items-center gap-2 ${
                  activeTab === 'assenze' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" /> Assenze & Ferie
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: ANAGRAFICA */}
              {activeTab === 'anagrafica' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cognome</label>
                    <input type="text" required value={cognome} onChange={(e) => setCognome(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" placeholder="es. ROSSI" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
                    <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" placeholder="es. MARIO" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Matricola (Opz.)</label>
                    <input type="text" value={matricola} onChange={(e) => setMatricola(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualifica</label>
                    <select value={qualifica} onChange={(e) => setQualifica(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm bg-white">
                      <option value="TSRM">TSRM</option>
                      <option value="Coordinatore">Coordinatore Sanitario</option>
                      <option value="Altro">Altro operatore</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ore Mensili</label>
                    <input type="number" required min={1} value={oreContrattuali} onChange={(e) => setOreContrattuali(Number(e.target.value))} className="px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stato Operatore</label>
                    <select value={stato} onChange={(e) => setStato(e.target.value as any)} className="px-3 py-2 border rounded-xl text-sm bg-white">
                      <option value="attivo">Attivo H24</option>
                      <option value="sospeso">Sospeso temporaneamente</option>
                      <option value="ferie_prolungate">Ferie prolungate / Maternità</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unità Operativa</label>
                    <input type="text" required value={unitaOperativa} onChange={(e) => setUnitaOperativa(e.target.value)} className="px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input type="checkbox" id="legge104" checked={legge104} onChange={(e) => setLegge104(e.target.checked)} className="rounded border-slate-300" />
                    <label htmlFor="legge104" className="text-sm font-semibold cursor-pointer">Beneficia di Legge 104</label>
                  </div>
                </div>
              )}

              {/* TAB 2: VINCOLI (PREFERENCES) */}
              {activeTab === 'vincoli' && (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800">Questi vincoli vengono applicati automaticamente solo se il reparto utilizza il <strong>Motore Dinamico Flessibile</strong>. Ignorati nel modello Legacy 15-Giorni.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-1">Limitazioni Totali</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={preferences.escludiNotti} onChange={e => setPreferences({...preferences, escludiNotti: e.target.checked})} className="rounded text-rose-600 focus:ring-rose-500" />
                          <span className="text-sm text-slate-700">Escludi dai turni di Notte</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={preferences.escludiWeekend} onChange={e => setPreferences({...preferences, escludiWeekend: e.target.checked})} className="rounded text-rose-600 focus:ring-rose-500" />
                          <span className="text-sm text-slate-700">Escludi dai Weekend (Sab/Dom)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={preferences.escludiFestivi} onChange={e => setPreferences({...preferences, escludiFestivi: e.target.checked})} className="rounded text-rose-600 focus:ring-rose-500" />
                          <span className="text-sm text-slate-700">Escludi dalle Festività (Rosse)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-1">Obblighi Turno</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={preferences.soloMattina} onChange={e => setPreferences({...preferences, soloMattina: e.target.checked})} className="rounded text-sky-600 focus:ring-sky-500" />
                          <span className="text-sm text-slate-700">Solo turni di Mattina</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={preferences.soloPomeriggio} onChange={e => setPreferences({...preferences, soloPomeriggio: e.target.checked})} className="rounded text-sky-600 focus:ring-sky-500" />
                          <span className="text-sm text-slate-700">Solo turni di Pomeriggio</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                     <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1">Max Notti Mensili (Override)</label>
                        <input type="number" min="0" value={preferences.maxNottiMensili || ''} onChange={e => setPreferences({...preferences, maxNottiMensili: e.target.value ? Number(e.target.value) : undefined})} className="px-3 py-2 border rounded-xl text-sm" placeholder="Es. 4 (Vuoto = usa Default)" />
                     </div>
                     <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1">Max Giorni Consecutivi (Override)</label>
                        <input type="number" min="1" value={preferences.maxGiorniConsecutivi || ''} onChange={e => setPreferences({...preferences, maxGiorniConsecutivi: e.target.value ? Number(e.target.value) : undefined})} className="px-3 py-2 border rounded-xl text-sm" placeholder="Es. 6 (Vuoto = usa Default)" />
                     </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ASSENZE E FERIE */}
              {activeTab === 'assenze' && (
                <div className="space-y-6">
                  
                  {/* Ferie Programmate */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><CalendarOff className="w-4 h-4" /> Ferie Programmate</h4>
                    <p className="text-xs text-slate-500 mb-4">Aggiungi le date di ferie in cui l'algoritmo non dovrà assegnare alcun turno.</p>
                    
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="date" 
                        value={newFerieDate}
                        onChange={e => setNewFerieDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-sky-500"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newFerieDate && !preferences.ferieProgrammate.includes(newFerieDate)) {
                            setPreferences(p => ({...p, ferieProgrammate: [...p.ferieProgrammate, newFerieDate].sort()}));
                            setNewFerieDate('');
                          }
                        }}
                        className="px-3 py-2 bg-sky-100 text-sky-700 rounded-lg font-bold hover:bg-sky-200 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Aggiungi
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {preferences.ferieProgrammate.length === 0 && <span className="text-xs text-slate-400 italic">Nessuna ferie inserita.</span>}
                      {preferences.ferieProgrammate.map(date => (
                        <span key={date} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-2">
                          {new Date(date).toLocaleDateString('it-IT')}
                          <button 
                            type="button" 
                            onClick={() => setPreferences(p => ({...p, ferieProgrammate: p.ferieProgrammate.filter(d => d !== date)}))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Giorni non disponibili ricorrenti */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Giorni della settimana vietati (Ricorrenti)</h4>
                    <p className="text-xs text-slate-500 mb-3">L'operatore non lavorerà mai in questi giorni.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'].map((dayName, idx) => {
                        const isSelected = preferences.giorniSettimanaNonDisponibili.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setPreferences(p => ({...p, giorniSettimanaNonDisponibili: p.giorniSettimanaNonDisponibili.filter(d => d !== idx)}));
                              } else {
                                setPreferences(p => ({...p, giorniSettimanaNonDisponibili: [...p.giorniSettimanaNonDisponibili, idx]}));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              isSelected ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
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
                <span>Salva Operatore</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
