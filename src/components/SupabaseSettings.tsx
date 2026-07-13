import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cloud, CloudOff, CloudLightning, RefreshCw, KeyRound } from 'lucide-react';

export const SupabaseSettings: React.FC = () => {
  const { supabaseConfig, syncData, geminiApiKey, setGeminiApiKey } = useApp();
  
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });

  const handleSync = async () => {
    setSyncing(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await syncData();
      setStatusMsg({ type: 'success', text: 'Sincronizzazione completata! Tabelle cloud aggiornate.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Errore durante la sincronizzazione.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider m-0">Cloud Database (Supabase)</h4>
        {supabaseConfig.connected ? (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-lg flex items-center">
            <Cloud className="w-3.5 h-3.5 mr-1" /> Connesso
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold rounded-lg flex items-center">
            <CloudOff className="w-3.5 h-3.5 mr-1" /> Offline
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        Il database cloud è configurato e connesso automaticamente in background. Tutti i dati sono isolati e protetti sul server aziendale.
      </p>

      <div className="flex space-x-2 pt-2">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center transition-all disabled:opacity-50"
          title="Sincronizza Tabelle"
        >
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
          ) : (
            <CloudLightning className="w-3.5 h-3.5 mr-1.5" />
          )}
          <span>{syncing ? 'Sincronizzazione in corso...' : 'Sincronizza Dati Cloud'}</span>
        </button>
      </div>

      {statusMsg.text && (
        <div className={`mt-3 p-3 rounded-lg text-[11px] font-semibold ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border border-rose-100 text-rose-800'
        }`}>
          {statusMsg.text}
        </div>
      )}
    </div>
      
      {/* GEMINI AI SETTINGS CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider m-0">Motore Intelligenza Artificiale</h4>
          {geminiApiKey ? (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-lg flex items-center">
              <Cloud className="w-3.5 h-3.5 mr-1" /> Attivo
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold rounded-lg flex items-center">
              <CloudOff className="w-3.5 h-3.5 mr-1" /> Disattivato
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Inserisci la tua API Key di Google Gemini per attivare l'Assistente Smart avanzato. Il modello AI sarà in grado di analizzare i turni in linguaggio naturale. (Ottienila gratis su Google AI Studio).
        </p>

        <div className="flex flex-col mb-3.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gemini API Key</label>
          <div className="relative flex items-center">
            <KeyRound className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="password"
              placeholder="AIzaSy..."
              value={geminiApiKey || ''}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </>
  );
};
