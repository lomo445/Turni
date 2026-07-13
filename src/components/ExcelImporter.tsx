import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export const ExcelImporter: React.FC = () => {
  const { importHistoricalExcel, setActiveView } = useApp();
  
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    setStatus({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        const msg = importHistoricalExcel(arrayBuffer);
        if (msg.includes('completata')) {
          setStatus({ type: 'success', text: msg });
        } else {
          setStatus({ type: 'error', text: msg });
        }
      } else {
        setStatus({ type: 'error', text: 'Impossibile leggere il file selezionato.' });
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setStatus({ type: 'error', text: 'Errore durante la lettura del file.' });
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerClickInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Migrazione Dati</span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0">Importa Storico Excel</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Side: Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 m-0">Upload File Spreadsheet (.xlsx, .xls)</h3>
            
            {/* Drag and Drop Container */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerClickInput}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragActive 
                  ? 'border-sky-500 bg-sky-50/50 scale-[1.01]' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls"
                onChange={handleChange}
              />
              
              <div className="p-4 bg-sky-50 text-sky-600 rounded-full border border-sky-100 mb-4">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>

              <h4 className="text-base font-bold text-slate-800">
                {loading ? 'Lettura file in corso...' : 'Trascina qui il tuo file Excel storico'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Oppure <span className="text-sky-600 font-bold hover:underline">sfoglia i file</span> sul tuo dispositivo.
                Supporta fogli singoli o multipli con griglia mensile.
              </p>
            </div>

            {/* Status alerts */}
            {status.text && (
              <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                status.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
                <div>
                  <span className="font-bold">{status.type === 'success' ? 'Importazione Riuscita!' : 'Errore:'}</span> {status.text}
                  {status.type === 'success' && (
                    <button
                      onClick={() => setActiveView('calendario')}
                      className="mt-2 block px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                    >
                      Vai al Calendario Turni
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Format Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-800">
            <HelpCircle className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider m-0">Specifiche Formato</h3>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            Per consentire una corretta migrazione del file storico, assicurati che il file Excel rispetti le seguenti regole organizzative:
          </p>

          <ul className="text-xs text-slate-600 space-y-2.5 pl-4 list-disc font-medium">
            <li>Il nome del foglio (tab) deve contenere il nome del mese in italiano (es: "GENNAIO", "FEBBRAIO 2026").</li>
            <li>La riga superiore deve contenere i numeri dei giorni del mese (01, 02, ..., 31).</li>
            <li>La colonna A deve elencare i dipendenti nel formato <span className="font-bold">COGNOME NOME</span>.</li>
            <li>Le celle interne devono contenere codici turno validi (es: M1, M2, N1, L, F, REP). Se vuote verranno considerate come riposo (L).</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
