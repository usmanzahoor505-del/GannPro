import { supabase } from './server/db.ts';
import bcrypt from 'bcryptjs';

async function fix() {
  const password = 'GannPro9!Admin@2026#Vx7k';
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('users').update({ password_hash: hash }).eq('email', 'admin@gannpro9.com').select('*');
  console.log("Updated:", data);
}
fix();
