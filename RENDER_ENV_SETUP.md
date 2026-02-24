# RENDER ENVIRONMENT CONFIGURATION - PRODUCTION SETUP

## CRITICAL: Required Environment Variables for Deployment

This guide covers all required environment variables to deploy the Kangaru Girls School app to Render.

---

## STEP 1: Backend Service Environment Variables

Navigate to: **Render Dashboard → Backend Service `kangarugirlsschool` → Settings → Environment**

Copy and paste the following variables. **Replace all placeholder values with actual credentials.**

```
NODE_ENV=production
PORT=4000

# ==================== MONGODB - CRITICAL ====================
# Get your connection string from MongoDB Atlas:
# 1. Go to https://cloud.mongodb.com
# 2. Switch to your cluster
# 3. Click "Connect" → "Driver" → "Node.js" → "Copy connection string"
# 4. Replace username:password in the string below
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority

# Alternative names (if above doesn't work):
# MONGO_URL=<same value>
# MONGODB_URI=<same value>
# DATABASE_URL=<same value>

# ==================== JWT SECURITY - CRITICAL ====================
# Generate secure key: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run this locally first to get the key, then paste here
JWT_SECRET=<64-character-hex-string-from-command-above>
JWT_EXPIRES_IN=7d

# ==================== CORS & FRONTEND ====================
# Frontend URL (Render auto-assigned for static site)
FRONTEND_URL=https://kangarugirlsschool-sc-ke.onrender.com

# CORS_ORIGINS: Both frontend AND backend must be included
# DO NOT LEAVE EMPTY - this is a security risk!
CORS_ORIGINS=https://kangarugirlsschool-sc-ke.onrender.com,https://kangarugirlsschool.onrender.com,http://localhost:5173,http://localhost:4000

# Public origin for generating absolute URLs
PUBLIC_ORIGIN=https://kangarugirlsschool.onrender.com

# ==================== EMAIL CONFIGURATION ====================
# Option A: Gmail (Recommended for testing)
# 1. Enable 2FA: https://myaccount.google.com/security
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Paste below:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-gmail-address>
SMTP_PASS=<app-password-NOT-regular-password>
SMTP_FROM=noreply@kangaru-girls.ac.ke

# Option B: SendGrid (Uncomment if using SendGrid)
# SENDGRID_API_KEY=<your-sendgrid-key>
# SENDGRID_FROM=noreply@kangaru-girls.ac.ke

# ==================== ADMIN ACCOUNT - INITIAL SETUP ====================
# Only needed for first deployment. Can delete after admin account is created.
ADMIN_EMAIL=admin@kangaru-girls.ac.ke
ADMIN_PASSWORD_HASH=<leave-as-is-for-first-deploy>

# ==================== CLOUDINARY (Image Storage) ====================
# Get credentials from https://console.cloudinary.com/
# Settings → API Keys
CLOUDINARY_CLOUD_NAME=ddm1dgws8
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLOUDINARY_FOLDER=kangaru

# ==================== ID CARD SECURITY ====================
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ID_CARD_SECRET=<64-character-hex-string>

# ==================== PASSWORD RESET & RATE LIMITING ====================
RESET_TOKEN_EXPIRES_MS=3600000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5
```

---

## STEP 2: Frontend Static Site Configuration

Navigate to: **Render Dashboard → Frontend Static Site `kangarugirlsschool-sc-ke` → Settings**

**No environment variables needed for frontend (Render injects VITE_API_URL automatically).**

Verify in Settings:
- Build Command: `npm run build`
- Start Command: `npx serve -s dist -l 3000`
- Publish Directory: `dist`
- Root Directory: `kscfrontend` (if monorepo structure)

---

## STEP 3: Verification Checklist

After setting environment variables, verify deployment:

### Health Check Endpoints

```bash
# Backend health
curl https://kangarugirlsschool.onrender.com/api/health

# Expected response:
# { "status": "ok", "uptime": 123.45 }

# Frontend health
curl https://kangarugirlsschool-sc-ke.onrender.com/

# Expected response:
# (HTML page with DOCTYPE)
```

### Console Tests

Open browser DevTools → Console and verify:

```javascript
// 1. API connectivity test
fetch('https://kangarugirlsschool.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✓ API connected:', d))
  .catch(e => console.error('✗ API failed:', e));

// 2. Database test (via API endpoint)
fetch('https://kangarugirlsschool.onrender.com/api/home-news?active=true')
  .then(r => r.json())
  .then(d => console.log('✓ Database working:', d.length, 'news items'))
  .catch(e => console.error('✗ Database error:', e));

// 3. Images test (Cloudinary)
const img = new Image();
img.onload = () => console.log('✓ Cloudinary images working');
img.onerror = () => console.error('✗ Cloudinary error');
img.src = 'https://res.cloudinary.com/ddm1dgws8/image/upload/w_100,q_auto/kangaru/DSC_5392.jpg';
```

---

## STEP 4: Troubleshooting

### **Problem: "CORS error" in browser console**

**Cause:** CORS_ORIGINS doesn't include frontend domain

**Fix:**
1. Go to Backend Settings → Environment
2. Check CORS_ORIGINS contains `https://kangarugirlsschool-sc-ke.onrender.com`
3. Click "Save"
4. Wait 1-2 minutes for redeploy
5. Hard refresh browser (Ctrl+Shift+Delete)

### **Problem: "Cannot connect to MongoDB" / API returning 500**

**Cause:** MONGO_URI not set or invalid

**Fix:**
1. Go to Backend Settings → Environment
2. Verify MONGO_URI is set and valid format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/db_name?retryWrites=true&w=majority
   ```
3. Test locally: `node -e "console.log(require('crypto').randomBytes(1))" `
4. If error, regenerate MONGO_URI from MongoDB Atlas

### **Problem: Images showing 404 or broken**

**Cause:** Cloudinary not configured

**Fix:**
1. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set
2. Images fallback to local `/images/` if Cloudinary fails (which 404s on Render)
3. Backend must have Cloudinary credentials

### **Problem: Emails not sending**

**Cause:** SMTP credentials invalid or Gmail 2FA not enabled

**Fix:**
1. Enable 2FA on Gmail: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use **App Password**, NOT regular password
4. Verify SMTP_USER and SMTP_PASS are correct

---

## DEPLOYMENT FLOW

1. **Set environment variables** (this document)
2. **Push code to `kangaru` branch**
3. Render auto-detects and deploys:
   - Backend (from root `index.js`)
   - Frontend (from `kscfrontend/`)
4. **Monitor deployment logs** (Render Dashboard → Logs)
5. **Run verification checks** (step 3 above)
6. **Test in production** (visit both URLs)

---

## CRITICAL SECURITY NOTES

⚠️ **NEVER:**
- Commit `.env` file with real credentials to git
- Share JWT_SECRET or CLOUDINARY_API_SECRET
- Set CORS_ORIGINS to `*` (allows any origin)
- Use non-HTTPS URLs in production

✅ **ALWAYS:**
- Rotate secrets quarterly
- Use environment variables, never hardcode secrets
- Enable 2FA on MongoDB Atlas and Cloudinary
- Review Render security settings regularly

---

## FILE REFERENCE

For .env.example template, see: `kscbackend/.env.example`

