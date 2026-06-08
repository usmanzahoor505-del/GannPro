import { supabase } from './server/db.ts';

async function test() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'admin@gannpro9.com').eq('role', 'admin').maybeSingle();
  console.log("DB Result:", { data, error });
}
test();
