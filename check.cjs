const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqglyzmfbtgznybccpnf.supabase.co', 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr');
async function check() {
  const { data: d1 } = await supabase.from('operators').select('*').eq('coordinatorId', 'c371385a-9c7a-4edd-ac01-8d74ffe6f65c');
  console.log("length of operators:", d1.length);
}
check();
