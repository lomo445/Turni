import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Operator } from '../types';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const OperatorManager: React.FC = () => {
  const { operators, addOperator, updateOperator, deleteOperator } = useApp();

  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');
  const [editingOp, setEditingOp] = useState<Operator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [matricola, setMatricola] = useState('');
  const [qualifica, setQualifica] = useState<'TSRM' | 'Coordinatore' | 'Altro'>('TSRM');
  const [unitaOperativa, setUnitaOperativa] = useState('Radiologia DEU');
  const [stato, setStato] = useState<'attivo' | 'sospeso' | 'ferie_prolungate'>('attivo');
  const [legge104, setLegge104] = useState(false);
  const [oreContrattuali, setOreContrattuali] = useState(144);
  
  // Limitations form states
  const [escludiNotti, setEscludiNotti] = useState(false);
  const [soloMattina, setSoloMattina] = useState(false);
  const [escludiWeekend, setEscludiWeekend] = useState(false);
  const [bancaOreIniziale, setBancaOreIniziale] = useState(0);

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
    setEscludiNotti(false);
    setSoloMattina(false);
    setEscludiWeekend(false);
    setBancaOreIniziale(0);
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
    setEscludiNotti(!!op.escludiNotti);
    setSoloMattina(!!op.soloMattina);
    setEscludiWeekend(!!op.escludiWeekend);
    setBancaOreIniziale(op.bancaOreIniziale || 0);
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
      escludiNotti,
      soloMattina,
      escludiWeekend,
      bancaOreIniziale: Number(bancaOreIniziale)
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
              <th className="px-6 py-4">Unità Operativa</th>
              <th className="px-6 py-4">Ore Mensili</th>
              <th className="px-6 py-4">Legge 104</th>
              <th className="px-6 py-4">Stato</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {filteredOps.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                  Nessun operatore corrisponde ai filtri di ricerca.
                </td>
              </tr>
            ) : (
              filteredOps.map(op => (
                <tr key={op.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-slate-900">
                    <div className="font-bold">{op.cognome} {op.nome}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {op.escludiNotti && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold">
                          No Notti
                        </span>
                      )}
                      {op.soloMattina && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-bold">
                          Solo Mattina
                        </span>
                      )}
                      {op.escludiWeekend && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold">
                          No Weekend
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
                  <td className="px-6 py-4 text-slate-500">
                    {op.unitaOperativa}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {op.oreContrattualiMensili} ore
                  </td>
                  <td className="px-6 py-4">
                    {op.legge104 ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 rounded-lg">
                        Sì
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
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
                        if (confirm(`Sei sicuro di voler eliminare l'operatore ${op.cognome} ${op.nome}? Questo eliminerà anche tutti i suoi turni.`)) {
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
                {editingOp ? `Modifica Operatore: ${editingOp.cognome}` : 'Nuovo Operatore Reparto'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Inputs grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cognome</label>
                <input 
                  type="text" 
                  required
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. FEDELI"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
                <input 
                  type="text" 
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. DANIELE"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Matricola (Opzionale)</label>
                <input 
                  type="text" 
                  value={matricola}
                  onChange={(e) => setMatricola(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="Codice dipendente"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualifica</label>
                <select
                  value={qualifica}
                  onChange={(e) => setQualifica(e.target.value as any)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="TSRM">TSRM</option>
                  <option value="Coordinatore">Coordinatore Sanitario</option>
                  <option value="Altro">Altro operatore</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unità Operativa</label>
                <input 
                  type="text" 
                  required
                  value={unitaOperativa}
                  onChange={(e) => setUnitaOperativa(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ore Mensili Contrattuali</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={oreContrattuali}
                  onChange={(e) => setOreContrattuali(Number(e.target.value))}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Saldo Iniziale Banca Ore</label>
                <input 
                  type="number" 
                  required
                  value={bancaOreIniziale}
                  onChange={(e) => setBancaOreIniziale(Number(e.target.value))}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  placeholder="es. +10 o -5"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stato Operatore</label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as any)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="attivo">Attivo H24</option>
                  <option value="sospeso">Sospeso temporaneamente</option>
                  <option value="ferie_prolungate">Ferie prolungate / Maternità</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input 
                  type="checkbox" 
                  id="legge104"
                  checked={legge104}
                  onChange={(e) => setLegge104(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500/20"
                />
                <label htmlFor="legge104" className="text-sm text-slate-700 font-semibold cursor-pointer">
                  Beneficia di Legge 104
                </label>
              </div>

              {/* LIMITATIONS TITLE */}
              <div className="col-span-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Limitazioni di Turnazione</h4>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="escludiNotti"
                  checked={escludiNotti}
                  onChange={(e) => setEscludiNotti(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500/20"
                />
                <label htmlFor="escludiNotti" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  No turni di NOTTE
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="soloMattina"
                  checked={soloMattina}
                  onChange={(e) => setSoloMattina(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                />
                <label htmlFor="soloMattina" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Solo turni di MATTINA
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="escludiWeekend"
                  checked={escludiWeekend}
                  onChange={(e) => setEscludiWeekend(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                />
                <label htmlFor="escludiWeekend" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  No WEEKEND e festivi
                </label>
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
