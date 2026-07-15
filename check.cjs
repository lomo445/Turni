const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqglyzmfbtgznybccpnf.supabase.co', 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr');
async function check() {
  const { data: o } = await supabase.from('operators').select('*').eq('coordinatorId', '145dc753-4d46-4e80-a448-5ced48260c74');
  console.log("Operators for monacolorenzo18:", o.length);
  const { data: d } = await supabase.from('departments').select('*').eq('coordinatorId', '145dc753-4d46-4e80-a448-5ced48260c74');
  console.log("Departments for monacolorenzo18:", d.length);
}
check();
