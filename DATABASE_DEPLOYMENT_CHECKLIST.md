# Database Deployment Checklist

Complete checklist for properly configuring MongoDB and the database layer before deploying to production.

---

## Pre-Deployment (Local Development)

### ✅ Local Setup

- [ ] Created MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Created free cluster
- [ ] Created database user with secure password
- [ ] Created database `kangaru_girls_db`
- [ ] Obtained MongoDB connection URI
- [ ] IP whitelist includes development machine (0.0.0.0/0 for dev)

### ✅ Environment Configuration

- [ ] Copied `.env.example` to `.env`
- [ ] Updated `.MONGO_URI` with actual MongoDB Atlas URI
- [ ] Generated new `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Generated new `ID_CARD_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set `CLIENT_ORIGIN=http://localhost:5173` (or your dev frontend URL)
- [ ] Set `CORS_ORIGINS=http://localhost:5173,http://localhost:4000`
- [ ] Set `NODE_ENV=development`
- [ ] ✅ .env file is in `.gitignore` (never commit!)

### ✅ Database Connection Test

```bash
# Test connection
npm run db:connect

# Expected output:
# ✅ Connected to MongoDB
# ℹ️  Database: kangaru_girls_db
```

### ✅ Initialize Local Database

```bash
# Create admin user
npm run db:setup

# Verify admin was created - you should see:
# ✅ Admin user created successfully!
# 📋 Admin Credentials
# Email: admin@example.com
# Password: [generated]
```

### ✅ Test API Endpoints

```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:4000/api/health
# Expected: {"ok":true,"time":"..."}

# Test auth (login with admin credentials)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Expected: JWT token and user data
```

### ✅ Data Seeding (Optional)

```bash
# Seed sample data
npm run seed:content
npm run seed:students
npm run seed:results

# Or use migration scripts
node scripts/migrateContentJsonToMongo.js
```

---

## Pre-Production (Before Deployment)

### ✅ Security Review

- [ ] `JWT_SECRET` changed from default
- [ ] `ADMIN_PASSWORD_HASH` will be set during deployment
- [ ] `ID_CARD_SECRET` changed from default
- [ ] No hardcoded credentials in code
- [ ] Database user has only necessary permissions
- [ ] `.env` file is NOT in git repository
- [ ] `.env.example` has placeholder values (no real secrets)

### ✅ Database Configuration

- [ ] MongoDB Atlas cluster created for production
- [ ] Separate database user created (not development user)
- [ ] Database user password is strong (12+ characters, random)
- [ ] Automatic backups enabled in MongoDB Atlas
- [ ] Backups tested (can restore from backup)

### ✅ Network Configuration

- [ ] IP whitelist properly configured in MongoDB Atlas
  - [ ] For Railway: Add Railway IP ranges (or use private endpoints)
  - [ ] For Render: Add Render IP ranges
  - [ ] DO NOT use 0.0.0.0/0 (open to all) in production
- [ ] Connection string uses SSL/TLS (`?ssl=true` or `mongodb+srv://`)
- [ ] Network timeout settings appropriate for production

### ✅ Code Review

- [ ] `services/dbConnection.js` configuration reviewed
- [ ] `index.js` properly imports and uses database connection
- [ ] All models properly define indexes
- [ ] No console.log statements exposing sensitive data
- [ ] Error handling doesn't expose database structure
- [ ] Connection pooling configured for production

### ✅ Migration Testing

- [ ] Tested migrations locally
- [ ] Verified data migration scripts work
- [ ] Rollback plan documented
- [ ] Database indexes created

---

## Deployment (Railway/Render)

### ✅ Railway Deployment (Recommended)

1. **Set Backend Root Directory**
   - [ ] Go to backend service → Settings
   - [ ] Set "Root Directory" to `kscbackend`
   - [ ] Save changes

2. **Configure Database**

   Option A - Use Railway MongoDB Plugin (Easiest)
   - [ ] Go to project → New Service → MongoDB
   - [ ] Railway auto-creates `DATABASE_URL`
   - [ ] Variable is automatically available
   - [ ] Skip to "Test Deployment" below

   Option B - Use MongoDB Atlas
   - [ ] Go to backend service → Variables
   - [ ] Add variable:
     ```
     MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority
     ```

3. **Configure Authentication**
   - [ ] Add to backend service Variables:
     ```
     JWT_SECRET=<your-generated-64-hex-string>
     NODE_ENV=production
     ```
   - [ ] Add `ID_CARD_SECRET=<your-generated-32-hex-string>`
   - [ ] Add `ADMIN_EMAIL=admin@kangaru-girls.ac.ke`
   - [ ] Add `ADMIN_PASSWORD_HASH=<bcrypt-hash>` OR set `ADMIN_PASSWORD`

4. **Configure Frontend URLs**
   - [ ] Generate frontend domain in Railway → Frontend service → Settings → Networking
   - [ ] Get backend domain (Settings → Networking → Generate Domain)
   - [ ] Add to Variables:
     ```
     CLIENT_ORIGIN=https://your-frontend-domain.up.railway.app
     CORS_ORIGINS=https://your-frontend-domain.up.railway.app
     PUBLIC_ORIGIN=https://your-backend-domain.up.railway.app
     ```

5. **Deploy**
   - [ ] Commit all changes to git
   - [ ] Push to GitHub
   - [ ] Railway auto-deploys
   - [ ] Wait for deployment to complete (watch logs)
   - [ ] Should see: "✅ Connected to MongoDB"

### ✅ Render Deployment

1. **Set Root Directory**
   - [ ] Go to service → Settings
   - [ ] Set "Root Directory" to `kscbackend`
   - [ ] Save

2. **Configure Database**
   - [ ] Create MongoDB Atlas cluster
   - [ ] Get URL with credentials
   - [ ] Go to service → Environment
   - [ ] Add variable:
     ```
     MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/kangaru_girls_db
     ```

3. **Add All Required Variables**
   - [ ] `JWT_SECRET=<64-hex>`
   - [ ] `NODE_ENV=production`
   - [ ] `ID_CARD_SECRET=<32-hex>`
   - [ ] `CLIENT_ORIGIN=https://your-domain.render.com`
   - [ ] `CORS_ORIGINS=https://your-domain.render.com`
   - [ ] Database and auth variables

4. **Configure Build**
   - [ ] **Build Command**: `npm install`
   - [ ] **Start Command**: `npm start`

5. **Deploy**
   - [ ] Push to GitHub
   - [ ] Render auto-deploys
   - [ ] Monitor build logs
   - [ ] Verify startup shows: "✅ Connected to MongoDB"

---

## Post-Deployment Testing

### ✅ Verify Database Connection

```bash
# Curl to health endpoint
curl https://your-backend-domain.up.railway.app/api/health

# Expected response:
# {"ok":true,"time":"2026-02-16T..."} 

# Check backend logs for:
# ✅ Connected to MongoDB
# ℹ️  Database: kangaru_girls_db
```

### ✅ Initialize Admin User

SSH into your deployment or run initialization:

```bash
# Method 1: SSH (Railway)
railway shell
node scripts/db-setup.js

# Method 2: Render shell
/bin/sh
node scripts/db-setup.js

# Expected output:
# ✅ Connected to MongoDB
# ✅ Admin user created successfully!
# 📋 Admin Credentials
# Email: admin@kangaru-girls.ac.ke
# Password: [generated]
```

### ✅ Test Authentication

```bash
# Test login endpoint
curl -X POST https://your-backend-domain.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kangaru-girls.ac.ke","password":"your-password"}'

# Expected: JWT token + user data
# Should NOT get 500 error
```

### ✅ Test Database Operations

```bash
# Test reading data (adjust endpoints as needed)
curl https://your-backend-domain.up.railway.app/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: JSON array of users
# Should NOT get "Cannot connect to database" error
```

### ✅ Monitor Logs

- [ ] Backend logs show successful MongoDB connection
- [ ] No authentication errors
- [ ] No connection timeout errors
- [ ] No unhandled rejections

---

## Post-Deployment Configuration

### ✅ Change Default Credentials

1. Export JWT token from admin login
2. Update admin password via API or admin panel
3. Remove default `ADMIN_PASSWORD` from deployment variables
4. Keep `ADMIN_PASSWORD_HASH` for reference only

### ✅ Enable Backups

- [ ] MongoDB Atlas automatic backups enabled
- [ ] Backup retention set to 30+ days
- [ ] Test backup restoration process
- [ ] Document backup/restore procedures

### ✅ Monitor Performance

- [ ] Set up monitoring alerts in MongoDB Atlas
- [ ] Monitor connection pool usage
- [ ] Set up application error tracking (Sentry, etc.)
- [ ] Monitor response times

### ✅ Document Configuration

- [ ] Save all environment variable values in secure location
- [ ] Document MongoDB Atlas user credentials
- [ ] Document backup/restore procedures
- [ ] Create runbook for common issues

---

## Troubleshooting Checklist

### Connection Issues

```bash
# ✅ Verify MongoDB URI format is correct
mongodb+srv://user:password@cluster.mongodb.net/db?retryWrites=true&w=majority

# ✅ Check IP whitelist in MongoDB Atlas
# Should include your deployment platform's IP

# ✅ Verify credentials are correct
# Test in MongoDB Atlas shell

# ✅ Check network connectivity
# Deploy from the same platform as the backend

# ✅ Review error logs in deployment platform
```

### Authentication Issues

```bash
# ✅ Verify JWT_SECRET is set
echo $JWT_SECRET  # Should output secret

# ✅ Verify ADMIN_EMAIL is correct
echo $ADMIN_EMAIL

# ✅ Check admin user exists in database
# Connect to MongoDB Atlas shell and query
```

### Deployment Issues

- [ ] Check deployment platform build logs
- [ ] Verify root directory is correct
- [ ] Ensure package.json exists in root
- [ ] Check that start command runs without error
- [ ] Review NODE_ENV is set to `production`

---

## Rollback Procedure

If deployment fails:

1. **Check Recent Changes**
   - Review recent code commits
   - Check environment variable changes

2. **Restore Previous Version**
   ```bash
   # On Railway/Render, rollback to previous deployment
   # Go to Deployments tab and select previous version
   ```

3. **Verify Database Connection**
   ```bash
   npm run db:connect
   ```

4. **Test Locally**
   ```bash
   npm run dev
   npm run db:setup
   ```

5. **Redeploy**
   - Fix issues locally
   - Push to git
   - Deploy fresh

---

## Security Checklist After Deployment

- [ ] `.env` file not accessible from web
- [ ] MongoDB credentials not in error messages
- [ ] JWT token expiration working
- [ ] CORS properly restricting origins
- [ ] Rate limiting enabled
- [ ] Failed login attempts logged
- [ ] Database connection uses SSL/TLS
- [ ] Backups stored securely

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check database connection status

### Weekly
- [ ] Verify backups are completing
- [ ] Review failed authentication attempts
- [ ] Check disk usage

### Monthly
- [ ] Test backup restoration
- [ ] Update security secrets
- [ ] Review database performance metrics
- [ ] Update MongoDB client libraries if needed

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update documentation

---

## Quick Reference

```bash
# Local testing
npm run db:connect      # Test connection
npm run db:setup        # Full setup
npm run db:admin        # Create admin only
npm run dev             # Start server

# Production commands (via SSH)
node scripts/db-setup.js --connect-only  # Test connection
node scripts/db-setup.js --admin-only    # Create admin
node scripts/db-setup.js                 # Full setup
```

---

**Status**: ✅ Complete
**Last Updated**: February 16, 2026
**Version**: 1.0.0
