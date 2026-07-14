import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ShiftRequest } from '../types';
import { 
  CalendarDays, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User,
  Plus
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user, operators, schedule, shifts, shiftRequests, addRequest, deleteRequest, currentDepartmentId, isDataLoaded } = useApp();
  
  // Trova l'operatore corrispondente all'utente loggato tramite ID
  const myProfile = operators.find(o => o.id === user?.id);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoRichiesta, setTipoRichiesta] = useState<'cambio_turno' | 'ferie' | 'permesso'>('ferie');
  const [dataInteressata, setDataInteressata] = useState('');
  const [dettagli, setDettagli] = useState('');

  if (!myProfile) {
    return (
      <div className="p-8 space-y-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl">
          <h3 className="font-bold">Profilo dipendente non trovato nel database.</h3>
          <div className="mt-4 text-xs font-mono bg-white p-3 rounded border border-rose-100 overflow-auto">
            <div>User ID: {user?.id}</div>
            <div>User Email: {user?.email}</div>
            <div>Operators count: {operators.length}</div>
            <div>Operator IDs: {operators.map(o => o.id).join(', ')}</div>
            <div>IsDataLoaded: {isDataLoaded ? 'true' : 'false'}</div>
            <div>CurrentCoordinatorId: {currentDepartmentId /* wait this is wrong */}</div>
          </div>
        </div>
      </div>
    );
  }

  // Filtra turni del mese corrente
  const mySchedule = schedule
    .filter(s => s.operatoreId === myProfile.id)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Filtra le richieste dell'operatore
  const myRequests = shiftRequests
    .filter(r => r.operatoreId === myProfile.id)
    .sort((a, b) => b.dataRichiesta.localeCompare(a.dataRichiesta));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataInteressata || !currentDepartmentId) return;

    const newRequest: ShiftRequest = {
      id: `req_${Date.now()}`,
      departmentId: currentDepartmentId,
      operatoreId: myProfile.id,
      tipo: tipoRichiesta,
      dataRichiesta: new Date().toISOString(),
      dataInteressata,
      dettagli,
      stato: 'in_attesa'
    };

    addRequest(newRequest);
    setIsModalOpen(false);
    setDataInteressata('');
    setDettagli('');
  };

  const getShiftInfo = (code: string) => shifts.find(s => s.codice === code);

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'approvato': return <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> Approvato</span>;
      case 'rifiutato': return <span className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold"><XCircle className="w-3 h-3"/> Rifiutato</span>;
      default: return <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold"><Clock className="w-3 h-3"/> In Attesa</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 font-sans">
      
      {/* Header Profilo */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight m-0">Ciao, {myProfile.nome}</h1>
            <p className="text-sky-100 font-medium mt-1 opacity-90">{myProfile.qualifica} - {myProfile.unitaOperativa}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-white text-sky-700 hover:bg-sky-50 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuova Richiesta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* I Miei Turni */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-sky-500" /> Il mio calendario (Mese Corrente)
          </h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {mySchedule.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">Nessun turno assegnato in questo mese.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {mySchedule.map(s => {
                  const sInfo = getShiftInfo(s.codiceTurno);
                  const dObj = new Date(s.data);
                  const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                  
                  return (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 text-center ${isWeekend ? 'text-rose-500 font-bold' : 'text-slate-600 font-semibold'}`}>
                          <div className="text-xs uppercase">{dObj.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                          <div className="text-xl leading-none">{dObj.getDate()}</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            {s.codiceTurno}
                            {s.codiceTurno === 'L' && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase rounded">Riposo</span>}
                            {s.codiceTurno === 'F' && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] uppercase rounded">Ferie</span>}
                          </div>
                          <div className="text-xs text-slate-500">{sInfo?.descrizione || ''}</div>
                        </div>
                      </div>
                      
                      {s.codiceTurno !== 'L' && s.codiceTurno !== 'F' && (
                        <button 
                          onClick={() => {
                            setTipoRichiesta('cambio_turno');
                            setDataInteressata(s.data);
                            setIsModalOpen(true);
                          }}
                          className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Chiedi Cambio
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Le mie richieste */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-500" /> Le mie richieste
          </h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            {myRequests.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nessuna richiesta inviata.</p>
            ) : (
              myRequests.map(req => (
                <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        {req.tipo.replace('_', ' ')}
                      </span>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">
                        Per il {new Date(req.dataInteressata).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    {getStatusBadge(req.stato)}
                  </div>
                  <div className="flex justify-between items-end">
                    {req.dettagli ? <p className="text-xs text-slate-600 italic">"{req.dettagli}"</p> : <div/>}
                    
                    {req.stato === 'in_attesa' && (
                      <button 
                        onClick={() => deleteRequest(req.id)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Annulla
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal Nuova Richiesta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">Invia Richiesta al Coordinatore</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5">Tipo di Richiesta</label>
                <select 
                  value={tipoRichiesta} 
                  onChange={e => setTipoRichiesta(e.target.value as any)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                >
                  <option value="ferie">Richiesta Ferie</option>
                  <option value="permesso">Richiesta Permesso</option>
                  <option value="cambio_turno">Proposta Cambio Turno</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5">Data Interessata</label>
                <input 
                  type="date" 
                  required
                  value={dataInteressata}
                  onChange={e => setDataInteressata(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5">Dettagli / Motivazione</label>
                <textarea 
                  value={dettagli}
                  onChange={e => setDettagli(e.target.value)}
                  placeholder="Es. Visita medica specialistica..."
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-slate-50 min-h-[100px]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" /> Invia
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
