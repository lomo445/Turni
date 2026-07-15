const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqglyzmfbtgznybccpnf.supabase.co', 'sb_publishable_4IOMMi2znxIK1OBqzjnnAQ_9UbLm4Wr');

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'loo@prova.it',
    password: 'Password123!' // assuming the user used this password or similar, but wait I don't know the password
  });
  console.log(authData, authError);
}
test();
