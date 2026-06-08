import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Test DB connection
const { data: rows, error: connErr } = await sb.from('users').select('id').limit(1);
console.log('\n--- DB Connection ---');
console.log('error:', connErr);
console.log('rows:', rows);

// 2. Fetch admin user
const { data: user, error: userErr } = await sb
  .from('users')
  .select('id,email,role,is_active,password_hash')
  .eq('email', 'admin@gannpro9.com')
  .single();

console.log('\n--- Admin User ---');
console.log('error:', userErr);
console.log('user:', user);

// 3. Check password match
if (user?.password_hash) {
  const match = await bcrypt.compare('GannPro9!Admin@2026#Vx7k', user.password_hash);
  console.log('\n--- Password Match ---', match);

  if (!match) {
    // Fix it right now
    const newHash = await bcrypt.hash('GannPro9!Admin@2026#Vx7k', 12);
    const { error: updateErr } = await sb
      .from('users')
      .update({ password_hash: newHash })
      .eq('email', 'admin@gannpro9.com');
    console.log('Password updated! Error:', updateErr);
    console.log('New hash:', newHash);
  }
}
