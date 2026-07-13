export interface AiAction {
  action: 'assign' | 'clear';
  opId: string;
  day: number;
  code?: string;
}

export interface AiResponse {
  message: string;
  actions: AiAction[];
}

export const askGemini = async (
  prompt: string,
  apiKey: string,
  contextData: {
    operators: any[];
    shifts: any[];
    schedule: any[];
    year: number;
    month: number;
  }
): Promise<AiResponse> => {
  if (!apiKey) {
    throw new Error('API Key mancante');
  }

  const systemInstruction = `
Sei "CareFlow Supervisor", un assistente AI esperto nella gestione dei turni del reparto di Radiologia (TSRM).
Ricevi in input lo stato attuale del calendario, la lista degli operatori e i codici turno disponibili.
Il tuo compito è capire la richiesta dell'utente (che può essere una domanda di analisi o un comando di modifica turni) e restituire ESCLUSIVAMENTE un oggetto JSON.

REGOLE IMPORTANTI:
1. Devi RISPONDERE SOLO CON JSON VALIDO. Nessun blocco markdown, nessuna parola prima o dopo il JSON.
2. Formato del JSON:
{
  "message": "La tua risposta discorsiva all'utente in italiano (es. 'Ho assegnato il turno...', oppure l'analisi richiesta)",
  "actions": [
    { "action": "assign", "opId": "ID_OPERATORE", "day": GIORNO_NUMERICO, "code": "CODICE_TURNO" },
    { "action": "clear", "opId": "ID_OPERATORE", "day": GIORNO_NUMERICO }
  ]
}
3. 'actions' può essere un array vuoto [] se l'utente ha fatto solo una domanda di analisi e non ha richiesto modifiche.
4. Per trovare l'ID_OPERATORE, cerca nella lista degli operatori fornita il nome e/o cognome menzionato dall'utente. Attenzione alle omonimie. Usa ESATTAMENTE l'id numerico fornito nel contesto.
5. Il giorno (day) deve essere un numero intero da 1 a 31.
6. Assicurati che CODICE_TURNO esista nella lista dei turni (es. M1, P1, N1, L per riposo, F per ferie, MAL per malattia).

DATI DI CONTESTO (STATO ATTUALE):
Mese: ${contextData.month} / Anno: ${contextData.year}
Operatori disponibili: ${JSON.stringify(contextData.operators.map(o => ({ id: o.id, nome: o.nome, cognome: o.cognome })))}
Codici Turno disponibili: ${JSON.stringify(contextData.shifts.map(s => s.codice))}
Calendario Attuale: ${JSON.stringify(contextData.schedule.map(s => ({ opId: s.operatoreId, date: s.data, code: s.codiceTurno })))}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: {
      parts: { text: systemInstruction }
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API Error:", errText);
    let errorDetails = response.statusText;
    try {
      const parsedErr = JSON.parse(errText);
      if (parsedErr.error && parsedErr.error.message) {
        errorDetails = parsedErr.error.message;
      }
    } catch (e) {}
    throw new Error(`Errore API Gemini: ${errorDetails}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Nessuna risposta dal modello AI');
  }

  try {
    const result = JSON.parse(textOutput) as AiResponse;
    return result;
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", textOutput);
    throw new Error('Formato di risposta AI non valido');
  }
};
