import { supabase } from './server/db.js';
import bcrypt from 'bcryptjs';

async function fix() {
  const password = 'GannPro9@admin2026';
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('users').update({ password_hash: hash }).eq('email', 'admin@gannpro9.com').select('*');
  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log("Updated Admin Password in DB successfully!");
    console.log("New Hash:", hash);
  }
}
fix();
