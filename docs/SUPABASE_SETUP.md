# GannPro9 — Supabase Setup Guide

Complete step-by-step instructions to create your Supabase project, run migrations, and connect the app.

---

## Step 1: Create a Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign up with GitHub, Google, or email.
3. Click **New Project**.
4. Fill in:
   - **Organization**: Create one or use existing
   - **Project name**: `gannpro9`
   - **Database password**: Generate a strong password and **save it** (you need it for direct DB access)
   - **Region**: Choose closest to your users (e.g. `South Asia (Mumbai)` for Pakistan)
   - **Pricing plan**: Free tier works for development; upgrade for production traffic
5. Click **Create new project** and wait 1–2 minutes for provisioning.

---

## Step 2: Get Your API Keys

1. In the Supabase Dashboard, open your `gannpro9` project.
2. Go to **Project Settings** (gear icon, bottom left) → **API**.
3. Copy these values into your `.env` file:

| Dashboard field | `.env` variable |
|----------------|-----------------|
| Project URL | `SUPABASE_URL` |
| `anon` `public` key | `SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

> **Security warning:** The `service_role` key bypasses Row Level Security. Use it **only** on your Express server. Never put it in frontend code or commit it to Git.

---

## Step 3: Run the Database Migration

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/migrations/001_initial_schema.sql` from this project.
4. Copy the **entire file contents** and paste into the SQL Editor.
5. Click **Run** (or press `Ctrl+Enter`).
6. You should see: `Success. No rows returned`.

### What this migration creates

| Table | Purpose |
|-------|---------|
| `users` | User and admin accounts |
| `otp_verifications` | 6-digit email OTP codes (10 min expiry) |
| `subscriptions` | Trial and paid subscription records |
| `payments` | Payment proof submissions |
| `receipts` | Auto-generated receipts on approval |
| `notifications` | In-app notification bell messages |

Also creates:
- Enum types for plans, statuses, roles
- Indexes for fast queries
- `updated_at` triggers
- Receipt number generator function
- Realtime publication on `notifications`, `subscriptions`, `payments`
- Storage bucket `payment-screenshots` (5 MB, images only)
- `admin_stats` view for dashboard

---

## Step 4: Run the Seed Data (Admin Account)

1. In **SQL Editor**, click **New query** again.
2. Open `supabase/seed.sql` and paste the contents.
3. Click **Run**.

### Default admin credentials

| Field | Value |
|-------|-------|
| Email | `admin@gannpro9.com` |
| Password | `GannPro9!Admin@2026#Vx7k` |
| Role | `admin` |

> **Change this password immediately** after your first admin login.

---

## Step 5: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar.
2. Confirm these tables exist:
   - `users`
   - `otp_verifications`
   - `subscriptions`
   - `payments`
   - `receipts`
   - `notifications`

3. Click `users` — you should see one row: `admin@gannpro9.com`.

---

## Step 6: Enable Realtime (verify)

1. Go to **Database** → **Replication** (or **Publications**).
2. Confirm `supabase_realtime` publication includes:
   - `notifications`
   - `subscriptions`
   - `payments`

If any table is missing, run in SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
```

---

## Step 7: Verify Storage Bucket

1. Go to **Storage** in the left sidebar.
2. Confirm bucket `payment-screenshots` exists.
3. It should be **private** (not public).

If the bucket was not created by migration, create it manually:
- Click **New bucket**
- Name: `payment-screenshots`
- Public: **OFF**
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

---

## Step 8: Configure Your Local `.env`

```bash
cp .env.example .env
```

Fill in all values from Steps 2 and your SMTP credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@yourdomain.com
SMTP_PASS=your-hostinger-email-password
SMTP_FROM_EMAIL=you@yourdomain.com
```

Generate JWT secrets:

```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 9: Test Database Connection

After the Express server is built (Step 3 of build order), test with:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{ "status": "ok", "database": "connected" }
```

---

## Troubleshooting

### "relation already exists"
You ran the migration twice. Drop tables and re-run, or skip to seed only:

```sql
-- ⚠️  DESTRUCTIVE — only use on fresh/dev projects
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
```

Then re-run `001_initial_schema.sql` and `seed.sql`.

### Storage bucket insert failed
Create the bucket manually via **Storage → New bucket** (Step 7 above).

### Realtime not firing
Check **Database → Replication** and ensure tables are in `supabase_realtime` publication.

### OTP emails not sending
Verify SMTP credentials with Hostinger. Port `465` requires `SMTP_SECURE=true`.

---

## Database Schema Diagram

```
users
  ├── subscriptions (1:many, one active at a time)
  ├── payments (1:many)
  ├── receipts (1:many)
  └── notifications (1:many)

otp_verifications (standalone — pre-registration, keyed by email)

payments
  └── receipts (1:1 on approval)

payments.reviewed_by → users.id (admin who approved/rejected)
```

---

## Next Step

Proceed to **Step 3: Auth System** — JWT with httpOnly cookies, register/login, and email OTP verification flow.
