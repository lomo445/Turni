const fs = require('fs');

let file = fs.readFileSync('src/hooks/useSupabaseSync.ts', 'utf8');

// We want to add a debugging trace to localStorage so we can display it.
file = file.replace(
  'const pullInitialData = async () => {',
  `const pullInitialData = async () => {
          let trace = "Start. ";
          try {
            localStorage.setItem('debug_trace', trace);`
);

file = file.replace(
  `const { data: d } = await supabase.from('departments').select('*').eq('coordinatorId', currentCoordinatorId);`,
  `trace += "Deps fetching... ";
            const { data: d, error: errD } = await supabase.from('departments').select('*').eq('coordinatorId', currentCoordinatorId);
            trace += "Deps fetched. Error: " + (errD?.message || 'None') + ". Length: " + (d?.length || 0) + ". ";
            localStorage.setItem('debug_trace', trace);`
);

file = file.replace(
  `const { data: o } = await supabase.from('operators').select('*').eq('coordinatorId', currentCoordinatorId);`,
  `trace += "Ops fetching... ";
            const { data: o, error: errO } = await supabase.from('operators').select('*').eq('coordinatorId', currentCoordinatorId);
            trace += "Ops fetched. Error: " + (errO?.message || 'None') + ". Length: " + (o?.length || 0) + ". ";
            localStorage.setItem('debug_trace', trace);`
);

file = file.replace(
  `catch (e) {`,
  `catch (e) {
          trace += "Exception: " + e.message + ". ";
          localStorage.setItem('debug_trace', trace);`
);

fs.writeFileSync('src/hooks/useSupabaseSync.ts', file);
