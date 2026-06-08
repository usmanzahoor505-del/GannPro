# GannPro9 SaaS — WD Gann Trading Calculator

Full SaaS platform with authentication, 3-day free trial, subscription plans, Pakistani payment flow, admin panel, notifications, and receipt generation.

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 22+
- Supabase account (free tier works)

### 2. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_otp_registration_fields.sql`
   - `supabase/seed.sql`
3. See `docs/SUPABASE_SETUP.md` for detailed instructions

### 3. Environment
```bash
cp .env.example .env
# Fill in Supabase keys, JWT secrets, SMTP credentials
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Install & Run
```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

### 5. Default Admin Login
| Field | Value |
|-------|-------|
| URL | http://localhost:5173/admin/login |
| Email | `admin@gannpro9.com` |
| Password | `GannPro9!Admin@2026#Vx7k` |

**Change this password immediately in production.**

## Features

- **Auth**: JWT httpOnly cookies, separate user/admin login
- **Email OTP**: 6-digit verification on register (Nodemailer + Hostinger SMTP)
- **Free Trial**: 3-day auto trial on signup with countdown banner
- **Plans**: Basic (27,800 PKR), Standard (83,400 PKR), Pro (139,000 PKR)
- **Payment Flow**: JazzCash/EasyPaisa/NayaPay/SadaPay deep links + QR fallback
- **Admin Panel**: Stats, user management, payment approve/reject
- **Notifications**: Bell icon with unread badge, auto + manual messages
- **Receipts**: Auto-generated on approval, PDF download via jsPDF
- **Calculator**: Original GannPro9 calculator wrapped with access control overlay

## Production Deployment

See `docs/VPS_DEPLOYMENT.md` for Hostinger VPS setup with Nginx, PM2, and SSL.

```bash
npm run build
pm2 start ecosystem.config.cjs
```

## Project Structure

```
src/calculator/GannCalculator.tsx  ← Original calculator (untouched logic)
server/                            ← Express API
supabase/migrations/               ← Database schema
docs/                              ← Setup & deployment guides
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Send OTP (no account yet) |
| POST | `/api/auth/verify-otp` | Verify OTP → create account + trial |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/admin/login` | Admin login |
| GET | `/api/subscription/status` | Trial/sub status + access check |
| POST | `/api/payments/submit` | Submit payment proof |
| GET | `/api/admin/stats` | Dashboard statistics |
| POST | `/api/admin/payments/:id/approve` | Approve payment |

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, React Router
- **Backend**: Express 5, JWT, bcrypt, Nodemailer, Multer
- **Database**: Supabase (PostgreSQL + Storage + Realtime)
- **Libraries**: qrcode.react, jsPDF
