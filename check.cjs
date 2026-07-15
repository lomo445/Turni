const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqglyzmfbtgznybccpnf.supabase.co', 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr');
async function check() {
  const { data, error } = await supabase.rpc('get_policies'); // I know this doesn't exist.
}
check();
