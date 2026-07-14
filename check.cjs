const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqglyzmfbtgznybccpnf.supabase.co', 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr');
async function check() {
  const { data: d1 } = await supabase.from('departments').select('*');
  const { data: d2 } = await supabase.from('operators').select('*');
  console.log("Departments:");
  console.dir(d1, {depth: null});
  console.log("Operators:");
  console.dir(d2, {depth: null});
}
check();
