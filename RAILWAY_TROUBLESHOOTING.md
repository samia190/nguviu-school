# Railway Deployment Troubleshooting Guide

## Common "vite: not found" Error - FIXED ✅

### Problem
Railway deployment fails with:
```
sh: vite: not found
Error: Command failed with exit code 127
```

### Root Cause
Vite was in `devDependencies`, but Railway production builds use:
```bash
npm ci --only=production
```
This skips `devDependencies`, so vite wasn't available for `npm start` (which runs `vite preview`).

### Solution Applied ✅

**1. Moved Vite to dependencies** (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^7.9.6",
    "vite": "^5.4.21"  // ← Now in dependencies!
  }
}
```

**2. Updated Dockerfile** (frontend)
- Now uses `npm ci --only=production` which includes vite
- No need to manually install vite separately

**3. Updated railway.toml** (frontend)
- Explicit build command: `npm run build`
- Explicit start command: `npm start`

---

## Railway Deployment Checklist

### Before Deploying:

- [x] **node_modules excluded** from Git (.gitignore)
- [x] **Vite in dependencies** (not devDependencies)
- [x] **Build command** configured: `npm run build`
- [x] **Start command** configured: `npm start`
- [x] **Environment variables** set in Railway dashboard

### Verify Locally:

```bash
# Test production build locally
cd nguviu-frontend
rm -rf node_modules dist
npm ci --only=production  # Simulates Railway
npm run build             # Should work
npm start                 # Should work
```

Expected output:
```
> nguviu-frontend@1.1.0 start
> vite preview --host 0.0.0.0 --port ${PORT:-3000}

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

---

## Other Common Railway Errors

### 1. "Cannot find module 'X'"

**Cause:** Missing dependency in package.json

**Fix:**
```bash
npm install X --save  # Use --save, not --save-dev
```

### 2. "Port already in use"

**Cause:** Not using Railway's $PORT variable

**Fix:** Ensure your start script uses `${PORT:-3000}` syntax:
```json
{
  "scripts": {
    "start": "vite preview --host 0.0.0.0 --port ${PORT:-3000}"
  }
}
```

### 3. "CORS error" in browser

**Cause:** Backend CORS not configured for frontend URL

**Fix:** Update backend environment variable:
```
CORS_ORIGINS=https://your-frontend.up.railway.app
```

### 4. "MongoDB connection failed"

**Cause:** Wrong MONGO_URI or IP not whitelisted

**Fix:**
- Check MONGO_URI format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- In MongoDB Atlas: Network Access → Add IP → 0.0.0.0/0

### 5. "Build succeeded but app won't start"

**Cause:** Wrong start command or missing files

**Fix:**
```bash
# In Railway Settings:
Build Command: npm run build
Start Command: npm start

# Verify package.json has:
"scripts": {
  "start": "vite preview --host 0.0.0.0 --port ${PORT:-3000}"
}
```

### 6. "node_modules committed to Git"

**Cause:** .gitignore not working

**Fix:**
```bash
# Remove from Git
git rm -r --cached node_modules
git commit -m "Remove node_modules from Git"

# Verify .gitignore has:
node_modules
```

---

## Railway Configuration Summary

### Frontend Service (nguviu-frontend)

**Settings:**
- Root Directory: `nguviu-frontend`
- Builder: Nixpacks (auto-detected)

**Build Settings:**
- Build Command: `npm run build` (Railway auto-detects from railway.toml)
- Start Command: `npm start` (Railway auto-detects from railway.toml)

**Environment Variables:**
```
VITE_API_URL=https://your-backend.up.railway.app
NODE_ENV=production
```

**package.json requirements:**
```json
{
  "scripts": {
    "build": "vite build",
    "start": "vite preview --host 0.0.0.0 --port ${PORT:-3000}"
  },
  "dependencies": {
    "vite": "^5.4.21"  // MUST be in dependencies!
  }
}
```

### Backend Service (nguviu-backend)

**Settings:**
- Root Directory: `nguviu-backend`
- Builder: Nixpacks (auto-detected)

**Build Settings:**
- Build Command: (none needed)
- Start Command: `npm start`

**Environment Variables:**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.up.railway.app
PUBLIC_ORIGIN=https://your-backend.up.railway.app
```

**package.json requirements:**
```json
{
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=18.18.0"
  }
}
```

---

## Debugging Railway Deployments

### 1. Check Build Logs

In Railway Dashboard:
- Click on your service
- Go to "Deployments" tab
- Click on the latest deployment
- Check "Build Logs" for errors

Common issues:
- Missing dependencies → Check package.json
- Build failures → Test `npm run build` locally
- Out of memory → Simplify build process

### 2. Check Runtime Logs

In Railway Dashboard:
- Click on your service
- Go to "Logs" tab (or "Deployments" → "View Logs")

Look for:
```
✅ Server listening on http://localhost:XXXX
✅ Connected to MongoDB
❌ Error: Cannot find module...
❌ CORS error
```

### 3. Test Environment Variables

In Railway Dashboard:
- Click on your service
- Go to "Variables" tab
- Verify all required variables are set

Test by adding a temporary console.log:
```javascript
// In index.js (backend) or main.jsx (frontend)
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
```

### 4. Health Check

Railway provides a health check URL:
```
https://your-service.up.railway.app
```

Backend should have `/api/health`:
```bash
curl https://your-backend.up.railway.app/api/health
# Should return: {"ok":true,"time":"..."}
```

---

## Quick Fixes Reference

| Error | Quick Fix |
|-------|-----------|
| `vite: not found` | Move vite to dependencies |
| `Cannot find module 'X'` | `npm install X --save` |
| `CORS error` | Update `CORS_ORIGINS` in backend |
| `MongoDB connection failed` | Check `MONGO_URI`, whitelist IP |
| `Port in use` | Use `${PORT:-3000}` syntax |
| `Build timeout` | Optimize build, reduce deps |
| `node_modules in Git` | Add to .gitignore, `git rm -r --cached node_modules` |

---

## Railway-Specific Tips

### 1. Use Railway's Variable References

Backend env var:
```
PUBLIC_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
```
Railway auto-replaces with actual domain.

### 2. Set Watch Paths

In Settings → Service:
```
Watch Paths: nguviu-frontend/**
```
Only deploy when frontend files change.

### 3. Use Railway CLI for Testing

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy from CLI
railway up
```

### 4. Check Service Metrics

Railway Dashboard → Service → Metrics:
- Memory usage
- CPU usage
- Request rate
- Response times

---

## Verification Steps

After deploying, verify everything works:

1. **Frontend loads:** Visit `https://your-frontend.up.railway.app`
2. **Backend responds:** `curl https://your-backend.up.railway.app/api/health`
3. **MongoDB connected:** Check backend logs for "✅ Connected to MongoDB"
4. **No CORS errors:** Open browser console on frontend
5. **Login works:** Test authentication flow
6. **API calls work:** Test content loading, forms, etc.

---

## Getting Help

If issues persist:

1. **Check Railway Status:** https://status.railway.app
2. **Railway Docs:** https://docs.railway.app
3. **Railway Discord:** https://discord.gg/railway
4. **Review Logs:** Railway Dashboard → Service → Logs
5. **Test Locally:** `npm ci --only=production && npm run build && npm start`

---

## Success Indicators ✅

You've successfully deployed when:
- ✅ Build completes without errors
- ✅ Service shows "Active" status
- ✅ Health check returns 200 OK
- ✅ Frontend loads without blank page
- ✅ No CORS errors in browser console
- ✅ MongoDB connection confirmed in logs
- ✅ Auto-deploy triggers on Git push

**You're all set!** 🚀
