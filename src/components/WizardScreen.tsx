import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Cpu, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Rocket
} from 'lucide-react';
import type { Department, RuleSettings, Operator } from '../types';

export const WizardScreen: React.FC = () => {
  const { setDepartments, setCurrentDepartmentId, user, addOperator, setActiveView } = useApp();
  
  const [step, setStep] = useState(1);
  
  // Step 1 State
  const [deptName, setDeptName] = useState('');
  
  // Step 2 State
  const [rules, setRules] = useState<RuleSettings>({
    turnationApproach: 'custom',
    maxConsecutiveDays: 5,
    minRestDaysAfterCycle: 2,
    allowNightForJolly: false,
    requireRestAfterNight: true,
    openOnWeekends: true,
    openOnNights: true,
    dailyCoverage: { morning: 2, afternoon: 2, night: 1 }
  });

  // Step 3 State
  const [initialOps, setInitialOps] = useState<{nome: string, cognome: string}[]>([
    { nome: '', cognome: '' }
  ]);

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const addEmptyOp = () => setInitialOps([...initialOps, { nome: '', cognome: '' }]);
  const updateOp = (index: number, field: 'nome' | 'cognome', value: string) => {
    const newOps = [...initialOps];
    newOps[index][field] = value;
    setInitialOps(newOps);
  };
  const removeOp = (index: number) => {
    if (initialOps.length > 1) {
      setInitialOps(initialOps.filter((_, i) => i !== index));
    }
  };

  const finishSetup = () => {
    // 1. Create Department
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      coordinatorId: user?.id || 'coord_demo',
      name: deptName || 'Nuovo Reparto',
      settings: rules
    };

    setDepartments([newDept]);
    setCurrentDepartmentId(newDept.id);

    // 2. Add initial operators
    initialOps.forEach((op, index) => {
      if (op.nome.trim() && op.cognome.trim()) {
        const newOp: Operator = {
          id: `op_${Date.now()}_${index}`,
          departmentId: newDept.id,
          nome: op.nome.trim().toUpperCase(),
          cognome: op.cognome.trim().toUpperCase(),
          qualifica: 'TSRM',
          unitaOperativa: newDept.name,
          stato: 'attivo',
          legge104: false,
          oreContrattualiMensili: 144
        };
        addOperator(newOp);
      }
    });

    // 3. Unlock App
    setActiveView('dashboard');
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-[100] font-sans overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex-none p-6 md:p-10 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight uppercase">CareFlow</span>
        </div>
        <div className="text-slate-400 font-medium text-sm">
          Passo {step} di 4
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-3xl mx-auto px-6 z-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-500 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {[
            { num: 1, icon: Building2, title: 'Reparto' },
            { num: 2, icon: Cpu, title: 'Motore' },
            { num: 3, icon: Users, title: 'Staff' },
            { num: 4, icon: Rocket, title: 'Lancio' }
          ].map(s => (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all duration-300 ${
                step >= s.num ? 'bg-sky-500 border-slate-950 text-white shadow-lg shadow-sky-500/50' : 'bg-slate-800 border-slate-950 text-slate-500'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`absolute -bottom-8 whitespace-nowrap text-xs font-bold uppercase tracking-wider ${step >= s.num ? 'text-sky-400' : 'text-slate-600'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 z-10 mt-10">
        <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          
          <div className="flex-1 overflow-y-auto p-8 md:p-12">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Benvenuto Coordinatore! 👋</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                  Per iniziare a generare i tuoi turni con l'intelligenza artificiale, dobbiamo creare il tuo primo ambiente di lavoro. Come si chiama il tuo reparto?
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2 block">Nome dell'Unità Operativa</label>
                    <input 
                      type="text"
                      value={deptName}
                      onChange={e => setDeptName(e.target.value)}
                      placeholder="es. Radiologia DEU, Pronto Soccorso, ecc."
                      className="w-full bg-slate-950 border-2 border-slate-800 focus:border-sky-500 rounded-2xl px-6 py-4 text-xl font-bold text-white placeholder-slate-600 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-black text-white tracking-tight mb-4">Come vuoi generare i turni? 🧠</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Il nostro planner possiede due "motori". Scegli quello più adatto alla natura del tuo reparto.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div 
                    onClick={() => setRules({...rules, turnationApproach: 'custom'})}
                    className={`p-6 rounded-2xl cursor-pointer transition-all border-2 ${
                      rules.turnationApproach === 'custom' ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Motore Dinamico</h3>
                    <p className="text-sm text-slate-400">Distribuisce i turni cercando di coprire i fabbisogni in modo flessibile, basandosi sui vincoli personali e le ferie.</p>
                  </div>

                  <div 
                    onClick={() => setRules({...rules, turnationApproach: 'arezzo_15'})}
                    className={`p-6 rounded-2xl cursor-pointer transition-all border-2 ${
                      rules.turnationApproach === 'arezzo_15' ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ciclo Fisso Legacy</h3>
                    <p className="text-sm text-slate-400">Modello matematico rigido con sfalsamento di 15 giorni. Ignora ferie e preferenze per mantenere un pattern perfetto.</p>
                  </div>
                </div>

                {rules.turnationApproach === 'custom' && (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                    <h4 className="text-sky-400 font-bold uppercase tracking-wider text-xs mb-4">Fabbisogno Giornaliero Base</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Mattina</label>
                        <input type="number" min="0" value={rules.dailyCoverage.morning} onChange={e => setRules({...rules, dailyCoverage: {...rules.dailyCoverage, morning: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Pomeriggio</label>
                        <input type="number" min="0" value={rules.dailyCoverage.afternoon} onChange={e => setRules({...rules, dailyCoverage: {...rules.dailyCoverage, afternoon: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Notte</label>
                        <input type="number" min="0" value={rules.dailyCoverage.night} onChange={e => setRules({...rules, dailyCoverage: {...rules.dailyCoverage, night: Number(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-black text-white tracking-tight mb-4">La tua Squadra 👥</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  Aggiungi subito qualche operatore per poter generare il primo turno di prova. Potrai aggiungerne quanti ne vuoi (o importarli da Excel) in un secondo momento!
                </p>

                <div className="space-y-3">
                  {initialOps.map((op, i) => (
                    <div key={i} className="flex gap-3">
                      <input 
                        type="text" placeholder="Nome" value={op.nome} onChange={e => updateOp(i, 'nome', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium focus:border-sky-500 outline-none"
                      />
                      <input 
                        type="text" placeholder="Cognome" value={op.cognome} onChange={e => updateOp(i, 'cognome', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-medium focus:border-sky-500 outline-none"
                      />
                      <button onClick={() => removeOp(i)} className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-colors font-bold">X</button>
                    </div>
                  ))}
                  
                  <button onClick={addEmptyOp} className="w-full py-3 mt-2 border-2 border-dashed border-slate-700 hover:border-sky-500 text-slate-400 hover:text-sky-400 rounded-xl font-bold transition-colors">
                    + Aggiungi altra riga
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-12">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-4">Tutto Pronto! 🚀</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                  Il reparto <strong>{deptName || 'Senza Nome'}</strong> è stato configurato con successo. Sei pronto ad accedere alla tua nuova Dashboard e a lanciare l'algoritmo genetico.
                </p>
                <button onClick={finishSetup} className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-lg shadow-lg shadow-sky-500/30 transition-all hover:scale-105">
                  Accedi alla Piattaforma
                </button>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          {step < 4 && (
            <div className="p-6 md:px-12 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
              <button 
                onClick={handlePrev}
                disabled={step === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <ChevronLeft className="w-5 h-5" /> Indietro
              </button>
              
              <button 
                onClick={handleNext}
                disabled={step === 1 && !deptName.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 hover:bg-sky-50 rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continua <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
