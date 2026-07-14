import React from 'react';
import { useApp } from '../context/AppContext';
import type { ShiftRequest } from '../types';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle
} from 'lucide-react';

export const RequestsManager: React.FC = () => {
  const { shiftRequests, updateRequestStatus, operators, updateOperator } = useApp();

  const getOperatorName = (id: string) => {
    const op = operators.find(o => o.id === id);
    return op ? `${op.cognome} ${op.nome}` : 'Sconosciuto';
  };

  const handleApprove = (req: ShiftRequest) => {
    // Se è una richiesta ferie, inietta le ferie nelle preferenze operatore
    if (req.tipo === 'ferie' || req.tipo === 'permesso') {
      const op = operators.find(o => o.id === req.operatoreId);
      if (op) {
        const currentFerie = op.preferences?.ferieProgrammate || [];
        if (!currentFerie.includes(req.dataInteressata)) {
          updateOperator({
            ...op,
            preferences: {
              ...op.preferences!,
              ferieProgrammate: [...currentFerie, req.dataInteressata].sort()
            }
          });
        }
      }
    }
    // Per i cambi turno, si potrebbe fare l'assegnazione automatica nella grid
    // ma in questa V1 per sicurezza cambiamo solo lo stato.
    
    updateRequestStatus(req.id, 'approvato');
  };

  const handleReject = (req: ShiftRequest) => {
    updateRequestStatus(req.id, 'rifiutato');
  };

  const pendingRequests = shiftRequests.filter(r => r.stato === 'in_attesa').sort((a, b) => b.dataRichiesta.localeCompare(a.dataRichiesta));
  const historyRequests = shiftRequests.filter(r => r.stato !== 'in_attesa').sort((a, b) => b.dataRichiesta.localeCompare(a.dataRichiesta));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Gestione Personale</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0 flex items-center gap-3">
            <Send className="w-8 h-8 text-sky-500" />
            Richieste e Approvazioni
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Da Approvare */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> In Attesa di Risposta
            {pendingRequests.length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{pendingRequests.length}</span>
            )}
          </h3>
          
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Nessuna richiesta in sospeso.</p>
                <p className="text-slate-400 text-sm">Tutti gli operatori sono soddisfatti.</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-sky-600 bg-sky-50 px-2 py-1 rounded">
                        {req.tipo.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-slate-900 text-lg mt-2">
                        {getOperatorName(req.operatoreId)}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Per il giorno</div>
                      <div className="text-sm font-black text-slate-800">{new Date(req.dataInteressata).toLocaleDateString('it-IT')}</div>
                    </div>
                  </div>
                  
                  {req.dettagli && (
                    <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-700 italic border border-slate-100 mb-4">
                      "{req.dettagli}"
                    </div>
                  )}

                  {req.tipo === 'ferie' && (
                    <div className="mb-4 flex items-start gap-2 p-2 bg-sky-50 text-sky-800 rounded-lg text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Accettando questa richiesta, il giorno di ferie verrà aggiunto automaticamente al profilo dell'operatore. Il generatore dinamico lo salterà in automatico.</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(req)}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white font-bold rounded-xl transition-all border border-emerald-200 hover:border-emerald-500 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approva
                    </button>
                    <button 
                      onClick={() => handleReject(req)}
                      className="flex-1 py-2 bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all border border-rose-200 hover:border-rose-500 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Rifiuta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cronologia Approvazioni */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-400" /> Storico Risposte
          </h3>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {historyRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Nessuna cronologia disponibile.</div>
            ) : (
              historyRequests.map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{getOperatorName(req.operatoreId)}</div>
                    <div className="text-xs text-slate-500">{req.tipo.replace('_', ' ')} per il {new Date(req.dataInteressata).toLocaleDateString('it-IT')}</div>
                  </div>
                  <div>
                    {req.stato === 'approvato' ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> Approvato</span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold"><XCircle className="w-3 h-3"/> Rifiutato</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
