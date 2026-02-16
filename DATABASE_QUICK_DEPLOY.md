# Database Deployment Quick Reference

Fast reference for deploying your application with MongoDB properly configured.

---

## 📋 Essential Setup Commands

```bash
# Local development setup
npm run db:connect              # ✅ Test MongoDB connection
npm run db:setup                # ✅ Full setup (connect + create admin)
npm run db:admin                # ✅ Create/verify admin user only
npm run dev                     # ✅ Start development server
```

---

## 🚀 Deployment Environment Variables

### Required in ALL Environments

```env
# For Railway: Set in service → Variables
# For Render: Set in service → Environment

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/kangaru_girls_db
JWT_SECRET=your-64-hex-secret-here
NODE_ENV=production
```

### For Frontend Integration

```env
# Get frontend domain from your deployment platform
CLIENT_ORIGIN=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com

# Optional: Backend public URL
PUBLIC_ORIGIN=https://your-backend-domain.com
```

### For Email/Admin Setup

```env
ID_CARD_SECRET=your-32-hex-secret-here
ADMIN_EMAIL=admin@kangaru-girls.ac.ke
ADMIN_PASSWORD_HASH=your-bcrypt-hash
# OR
ADMIN_PASSWORD=temporary-password
```

### Optional

```env
# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🔑 Generate Required Secrets

```bash
# Generate JWT_SECRET (64 hex characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate ID_CARD_SECRET (32 hex characters)
node -e "console.log('ID_CARD_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate bcrypt hash for password (if not auto-generating)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10, (err, hash) => console.log('ADMIN_PASSWORD_HASH=' + hash))"
```

---

## 🚄 Railway Deployment

### Step 1: Create Backend Service

```
1. Go to railway.app → Dashboard
2. New Project → Deploy from GitHub repo
3. Select your repository
4. Wait for detection
```

### Step 2: Configure Root Directory

```
Backend Service → Settings → Root Directory
Set to: kscbackend
Save
```

### Step 3: Add Database

**Option A: Railway MongoDB Plugin (Easiest)**
```
Project → New Service → MongoDB
Automatic setup! (DATABASE_URL created)
```

**Option B: MongoDB Atlas**
```
Backend Service → Variables
Add: MONGO_URI=mongodb+srv://...
```

### Step 4: Set Environment Variables

```
Backend Service → Variables

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/kangaru_girls_db
JWT_SECRET=<your-generated-secret>
NODE_ENV=production
CLIENT_ORIGIN=https://<your-frontend-domain>
CORS_ORIGINS=https://<your-frontend-domain>
ID_CARD_SECRET=<your-generated-secret>
```

### Step 5: Deploy & Verify

```
1. Commit changes: git add . && git commit -m "Database config"
2. Push to GitHub: git push origin main
3. Railway auto-deploys
4. Watch logs for: ✅ Connected to MongoDB
```

### Step 6: Initialize Database (Post-Deployment)

```bash
# SSH into Railway
railway shell

# Run setup
node scripts/db-setup.js

# You'll see admin credentials printed
```

---

## 🎨 Render Deployment

### Step 1: Create Backend Service

```
1. Go to render.com → Dashboard
2. New → Web Service
3. Connect GitHub repository
4. Select repository
5. Set branch: main (or your branch)
```

### Step 2: Configure Settings

```
Service Settings:
  Root Directory: kscbackend
  Build Command: npm install
  Start Command: npm start
```

### Step 3: Create MongoDB (if needed)

```
1. Go to Render Dashboard → New → MongoDB
2. Choose plan (free tier available)
3. Copy connection string
```

### Step 4: Set Environment Variables

```
Go to service → Environment

MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-generated-secret>
NODE_ENV=production
CLIENT_ORIGIN=<your-frontend-url>
CORS_ORIGINS=<your-frontend-url>
ID_CARD_SECRET=<your-generated-secret>
```

### Step 5: Deploy

```
1. Render auto-deploys on git push
2. Monitor build and deploy logs
3. Look for: ✅ Connected to MongoDB
```

### Step 6: Initialize Database

```bash
# Via Render Shell
/bin/sh
node scripts/db-setup.js
```

---

## ✅ Post-Deployment Verification

### Verify Connection

```bash
# Test health endpoint
curl https://your-backend-domain.com/api/health

# Should return: {"ok":true,"time":"..."}
```

### Create Admin User

```bash
# Via SSH/Shell (happens automatically or manually)
node scripts/db-setup.js

# Check deployment logs for admin credentials
```

### Test Authentication

```bash
# Login test
curl -X POST https://your-backend-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kangaru-girls.ac.ke","password":"..."}'

# Should return JWT token (not error)
```

---

## 🐛 Quick Troubleshooting

### "Cannot connect to MongoDB"

```
✅ Check: MONGO_URI environment variable is set
✅ Check: MongoDB Atlas IP whitelist includes deployment platform
✅ Check: Credentials are correct (test in MongoDB Atlas shell)
✅ Check: Database name matches
✅ Check: Cluster status is "Active"
```

### "Authentication failed"

```
✅ Regenerate password in MongoDB Atlas
✅ Update URL encode special characters (@  = %40)
✅ Test credentials locally first
```

### "Connection timeout"

```
✅ Check network is working: ping cluster.mongodb.net
✅ Check firewall isn't blocking (MongoDB uses port 27017)
✅ Increase timeout: Check dbConnection.js settings
✅ Check MongoDB cluster status
```

### Admin credentials not created

```
✅ Run initialization manually:
   node scripts/db-setup.js

✅ Check logs for errors
✅ Verify admin email is correct
✅ Ensure database is connected first
```

---

## 📝 MongoDB Atlas Setup (If Not Using Railway Plugin)

1. **Create Atlas Account**
   - Go to mongodb.com/cloud/atlas
   - Sign up (free tier available)

2. **Create Cluster**
   - New Project
   - Create Database
   - Choose free tier
   - Select region close to your server

3. **Create Database User**
   - Database Access → Add User
   - Username: kangaru_girls_user
   - Password: Generate strong password
   - Database: kangaru_girls_db

4. **Get Connection String**
   - Databases → Connect
   - Drivers → Node.js
   - Copy connection string
   - Replace <username>, <password>, <database>

5. **Setup IP Whitelist**
   - Network Access → Add IP
   - For production: Add your deployment platform's IP
   - Or use 0.0.0.0/0 (less secure, only if necessary)

---

## 🔐 Security Quick Checklist

- [ ] MongoDB password is **unique** and **strong** (12+ chars)
- [ ] MongoDB Atlas IP whitelist is configured
- [ ] `.env` file **NOT** in git repository
- [ ] All secrets are environment variables, not hardcoded
- [ ] JWT_SECRET is unique per environment
- [ ] HTTPS is enabled for all URLs
- [ ] Backups are automatic and tested
- [ ] Connection uses SSL/TLS (mongodb+srv://)

---

## 📖 Documentation Files

- [DATABASE_DEPLOYMENT.md](./DATABASE_DEPLOYMENT.md) - Comprehensive guide
- [DATABASE_DEPLOYMENT_CHECKLIST.md](./DATABASE_DEPLOYMENT_CHECKLIST.md) - Full checklist
- [RAILWAY.md](./RAILWAY.md) - Railway-specific guide
- [kscbackend/.env.example](./kscbackend/.env.example) - Configuration template

---

## 🤝 Need Help?

### Check Logs

```bash
# Railway
railway logs

# Render  
# View in dashboard → Logs

# Local
npm run dev
# Errors will show in terminal
```

### Common Issues Documentation

See [DATABASE_DEPLOYMENT.md](./DATABASE_DEPLOYMENT.md) **"Troubleshooting"** section

### Test Connection Script

```bash
npm run db:connect
```

### Generate Missing Secrets

```bash
node -e "console.log('JWT=' + require('crypto').randomBytes(64).toString('hex')); console.log('ID_CARD=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚡ TL;DR - Fastest Setup

```bash
# 1. Local setup
npm install
cp .env.example .env
# Edit .env with MongoDB URI
npm run db:setup

# 2. Deploy to Railway
# Add MONGO_URI, JWT_SECRET, NODE_ENV to Variables
# Push to git
# Railway deploys automatically

# 3. Post-deploy
railway shell
node scripts/db-setup.js
```

---

**Last Updated**: February 16, 2026
**Status**: ✅ Production Ready
