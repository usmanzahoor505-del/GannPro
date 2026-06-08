import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const name = 'Abuzar';
const email = 'abuzar@gannpro9.com';
const password = 'Abuzar@123';

// Hash password
const passwordHash = await bcrypt.hash(password, 12);

// Insert user
const { data: user, error: userErr } = await sb
  .from('users')
  .insert({
    name,
    email,
    password_hash: passwordHash,
    role: 'user',
    is_active: true,
  })
  .select()
  .single();

if (userErr) {
  console.error('User create error:', userErr.message);
  process.exit(1);
}

console.log('✅ User created:', user.email);

// Create 3-day trial subscription
const trialDays = 3;
const now = new Date();
const expiresAt = new Date(now);
expiresAt.setDate(expiresAt.getDate() + trialDays);

const { error: subErr } = await sb.from('subscriptions').insert({
  user_id: user.id,
  plan: 'trial',
  status: 'active',
  started_at: now.toISOString(),
  expires_at: expiresAt.toISOString(),
});

if (subErr) {
  console.error('Subscription error:', subErr.message);
} else {
  console.log('✅ Trial subscription created (3 days)');
}

// Welcome notification
const { error: notifErr } = await sb.from('notifications').insert({
  user_id: user.id,
  message: 'Welcome Abuzar! Your 3-day free trial has started.',
  type: 'success',
});

if (notifErr) {
  console.error('Notification error:', notifErr.message);
} else {
  console.log('✅ Welcome notification added');
}

console.log('\n--- Dummy User Credentials ---');
console.log('Name    :', name);
console.log('Email   :', email);
console.log('Password:', password);
console.log('Trial   : 3 days');
