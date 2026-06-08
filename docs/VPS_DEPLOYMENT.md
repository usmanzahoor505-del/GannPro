# GannPro9 — Hostinger VPS Deployment Guide

Complete deployment guide for Ubuntu on Hostinger VPS with Nginx, PM2, SSL, and environment setup.

---

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 or 24.04
- Domain pointed to your VPS IP (A record)
- SSH access to your server
- Supabase project configured (see `SUPABASE_SETUP.md`)
- Hostinger email account for SMTP

---

## Part 1: Initial Server Setup

### 1.1 Connect via SSH

```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Update system packages

```bash
apt update && apt upgrade -y
```

### 1.3 Create a deploy user (recommended)

```bash
adduser gannpro
usermod -aG sudo gannpro
su - gannpro
```

### 1.4 Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should show v22.x
npm -v
```

### 1.5 Install PM2, Nginx, Git, Certbot

```bash
sudo npm install -g pm2
sudo apt install -y nginx git certbot python3-certbot-nginx
```

### 1.6 Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Part 2: Deploy Application Code

### 2.1 Create app directory

```bash
sudo mkdir -p /var/www/gannpro9
sudo chown -R gannpro:gannpro /var/www/gannpro9
cd /var/www/gannpro9
```

### 2.2 Clone or upload your project

**Option A — Git:**

```bash
git clone https://github.com/YOUR_USERNAME/gannpro9.git .
```

**Option B — Upload via SCP (from your local machine):**

```bash
scp -r ./gannpro9/* gannpro@YOUR_VPS_IP:/var/www/gannpro9/
```

### 2.3 Install dependencies

```bash
cd /var/www/gannpro9
npm install
cd server && npm install && cd ..
```

### 2.4 Build frontend

```bash
npm run build
```

This creates `dist/` — static files served by Nginx.

---

## Part 3: Environment Variables on VPS

### 3.1 Create production `.env`

```bash
nano /var/www/gannpro9/.env
```

Paste and fill in (example for production):

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://gannpro9.com

JWT_ACCESS_SECRET=your_64_char_random_hex_string
JWT_REFRESH_SECRET=your_other_64_char_random_hex_string
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=.gannpro9.com

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@gannpro9.com
SMTP_PASS=your-hostinger-email-password
SMTP_FROM_NAME=GannPro9
SMTP_FROM_EMAIL=noreply@gannpro9.com

PAYMENT_MSISDN=03099716270
PAYMENT_IBAN=PK82JCMA3005921099716270
PAYMENT_ACCOUNT_NUMBER=01099716270

TRIAL_DAYS=3
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_SECONDS=60
```

Generate JWT secrets on the server:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.2 Secure the env file

```bash
chmod 600 /var/www/gannpro9/.env
```

---

## Part 4: PM2 Configuration

### 4.1 Create ecosystem file

Create `/var/www/gannpro9/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'gannpro9-api',
      cwd: '/var/www/gannpro9/server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '/var/www/gannpro9/.env',
      error_file: '/var/www/gannpro9/logs/api-error.log',
      out_file: '/var/www/gannpro9/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

### 4.2 Create logs directory

```bash
mkdir -p /var/www/gannpro9/logs
```

### 4.3 Build and start the API server

```bash
cd /var/www/gannpro9/server
npm run build
cd /var/www/gannpro9
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command PM2 prints (sudo env PATH=...)
```

### 4.4 Useful PM2 commands

```bash
pm2 status                  # Check running processes
pm2 logs gannpro9-api       # View live logs
pm2 restart gannpro9-api    # Restart after code update
pm2 stop gannpro9-api       # Stop the API
pm2 monit                   # Real-time monitoring
```

---

## Part 5: Nginx Reverse Proxy

### 5.1 Create Nginx site config

```bash
sudo nano /etc/nginx/sites-available/gannpro9
```

```nginx
# Rate limiting for auth endpoints
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

server {
    listen 80;
    server_name gannpro9.com www.gannpro9.com;

    # Redirect HTTP to HTTPS (after Certbot setup, Certbot adds this automatically)
    # return 301 https://$server_name$request_uri;

    root /var/www/gannpro9/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # API — proxy to Express backend
    location /api/ {
        limit_req zone=auth_limit burst=20 nodelay;

        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for file uploads (payment screenshots)
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 6M;
    }

    # React SPA — serve static files, fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 5.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/gannpro9 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Part 6: SSL with Certbot (Let's Encrypt)

### 6.1 Obtain SSL certificate

```bash
sudo certbot --nginx -d gannpro9.com -d www.gannpro9.com
```

Follow prompts:
- Enter email for renewal notices
- Agree to terms
- Choose whether to redirect HTTP → HTTPS (**Yes, recommended**)

### 6.2 Verify auto-renewal

```bash
sudo certbot renew --dry-run
```

Certbot adds a cron job automatically. Certificates renew every 90 days.

### 6.3 After SSL — update Nginx config

Certbot modifies your Nginx config to listen on port 443 with SSL. Verify:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Part 7: Post-Deploy Verification

### 7.1 Check all services

```bash
pm2 status
sudo systemctl status nginx
curl -I https://gannpro9.com
curl https://gannpro9.com/api/health
```

### 7.2 Test in browser

1. Open `https://gannpro9.com` — landing page loads
2. Register a new user — OTP email arrives
3. Login as admin at `https://gannpro9.com/admin/login`
4. Approve a test payment — user gets notification

---

## Part 8: Updating the App (Deployments)

```bash
cd /var/www/gannpro9

# Pull latest code
git pull origin main

# Install any new dependencies
npm install
cd server && npm install && cd ..

# Rebuild
npm run build
cd server && npm run build && cd ..

# Restart API
pm2 restart gannpro9-api

# Reload Nginx (only if config changed)
sudo nginx -t && sudo systemctl reload nginx
```

---

## Part 9: Hostinger Email SMTP Setup

1. Log in to **Hostinger hPanel**.
2. Go to **Emails** → create `noreply@gannpro9.com` (or your chosen address).
3. Note the password you set.
4. SMTP settings (already in `.env`):

| Setting | Value |
|---------|-------|
| Host | `smtp.hostinger.com` |
| Port | `465` |
| Encryption | SSL/TLS |
| Username | Full email address |
| Password | Email account password |

5. Test SMTP from server:

```bash
cd /var/www/gannpro9/server
node -e "
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.hostinger.com', port: 465, secure: true,
  auth: { user: 'noreply@gannpro9.com', pass: 'YOUR_PASSWORD' }
});
t.verify().then(() => console.log('SMTP OK')).catch(console.error);
"
```

---

## Part 10: Security Checklist

- [ ] Changed default admin password (`admin@gannpro9.com`)
- [ ] `.env` file permissions set to `600`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never in frontend code
- [ ] `COOKIE_SECURE=true` in production
- [ ] UFW firewall enabled (SSH + Nginx only)
- [ ] SSL certificate active and auto-renewing
- [ ] Rate limiting on `/api/auth/*` endpoints (Nginx `limit_req`)
- [ ] Regular `apt update && apt upgrade`

---

## Troubleshooting

### 502 Bad Gateway
API not running. Check: `pm2 logs gannpro9-api`

### Cookies not persisting
Ensure `COOKIE_SECURE=true` only when using HTTPS. Match `COOKIE_DOMAIN` to your domain.

### OTP emails not delivered
- Verify SMTP credentials in hPanel
- Check spam folder
- Run SMTP test command in Part 9
- Ensure port 465 outbound is not blocked: `telnet smtp.hostinger.com 465`

### Frontend shows blank page
- Check `dist/` exists: `ls /var/www/gannpro9/dist`
- Rebuild: `npm run build`
- Check Nginx `root` path matches `dist/`

### Realtime not working
- Confirm `SUPABASE_ANON_KEY` in frontend build env
- Check Supabase Realtime is enabled on tables

---

## Server Architecture

```
Internet
    │
    ▼
Nginx (port 443, SSL)
    ├── /          → /var/www/gannpro9/dist  (React SPA)
    └── /api/*     → http://127.0.0.1:3001    (Express + PM2)
                          │
                          ├── Supabase Postgres (database)
                          ├── Supabase Storage  (screenshots)
                          └── Hostinger SMTP    (OTP emails)
```

---

## Next Step

After VPS is live, proceed to **Step 3: Auth System** implementation.
