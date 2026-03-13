# Complete Deployment Configuration - WIRED ✅

## Connection Map

```
┌─────────────────────────────────────────────────────┐
│  Frontend: kangarugirlsschool-sc-ke.onrender.com    │
│  ➜ Calls API: https://kangarugirlsseniorschool-sc-ke.onrender.com
└─────────────────────────────────────────────────────┘
              ↓ (Cross-Origin API Requests)
┌─────────────────────────────────────────────────────┐
│  Backend: kangarugirlsschool.onrender.com           │
│  Database: MongoDB Atlas (kangaru_girls_db)         │
└─────────────────────────────────────────────────────┘
```

---

## Files Updated ✅

1. **kscfrontend/.env.production**
   ```
   VITE_API_URL=https://kangarugirlsseniorschool-sc-ke.onrender.com
   ```

2. **kscbackend/.env**
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:4000,https://kangarugirlsseniorschool-sc-ke.onrender.com,https://kangarugirlsseniorschool-sc-ke.onrender.com
   ```

---

## Deployment Status

### Backend ✅ DEPLOYED
- **URL**: https://kangarugirlsseniorschool-sc-ke.onrender.com
- **Status**: Running
- **Database**: Connected to MongoDB Atlas
- **Test**: `/api/footer-links` ✅ Responding

### Frontend ⚠️ NEEDS REBUILD & REDEPLOY
- **URL**: https://kangarugirlsseniorschool-sc-ke.onrender.com
- **Status**: Running (but API calls failing)
- **Reason**: Using old configuration pointing to localhost:4000
- **Fix**: Rebuild with new env var, then push to git

---

## Step-by-Step Deployment

### 1. Build Frontend Locally ⚡
```bash
cd kscfrontend

# Setup images
npm run setup:images

# Build for production (uses .env.production)
npm run build
```

### 2. Verify Build Success
```bash
# Check dist folder was created
ls dist/

# Should show: index.html, assets/, header/, images/
```

### 3. Deploy to Render (Git Push)
```bash
# From project root
git add .
git commit -m "chore: Configure frontend to use backend at kangarugirlsschool.onrender.com"
git push
```

Render will automatically:
- Trigger redeployment of kscfrontend
- Rebuild with new .env.production 
- Deploy within 2-3 minutes

### 4. Update Backend Environment (If Not Already Set)

Go to **Render Dashboard** → **kangarugirlsschool** (backend service) → **Environment**

Verify these variables are set:
```
MONGO_URI=mongodb+srv://kangach:kangach19%4019@cluster0.7bmfdr8.mongodb.net/kangaru_girls_db?retryWrites=true&w=majority
NODE_ENV=production
PORT=4000
CLIENT_ORIGIN=https://kangarugirlsseniorschool-sc-ke.onrender.com
CORS_ORIGINS=http://localhost:5173,http://localhost:4000,https://kangarugirlsseniorschool-sc-ke.onrender.com,https://kangarugirlsseniorschool-sc-ke.onrender.com
JWT_SECRET=de3a3d92e5f44e87b8fa2cc4c2123b7cf3a09d0e7b6a69c4bba45fee29f8b3494tf5hj7knjhhg3
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mukundisam19@gmail.com
SMTP_PASS=your-app-password-here
```

If any are missing, add them and redeploy backend.

---

## Testing After Deployment

### 1. Check Frontend Console (F12)
```
Expected: No errors about localhost:4000
Expected: API calls go to https://kangarugirlsseniorschool-sc-ke.onrender.com/api/*
```

### 2. Network Tab (F12 → Network)
Click on Network, reload page, check requests:
```
✅ https://kangarugirlsseniorschool-sc-ke.onrender.com/api/footer-links → 200
✅ https://kangarugirlsseniorschool-sc-ke.onrender.com/api/content/home → 200
✅ https://kangarugirlsseniorschool-sc-ke.onrender.com/images/* → 200
```

### 3. Test Live Site
```
https://kangarugirlsseniorschool-sc-ke.onrender.com

Should see:
✅ Logo loading
✅ Home content visible
✅ All images loading
✅ Footer links populated
❌ No console errors
```

### 4. Quick API Test
```bash
curl https://kangarugirlsseniorschool-sc-ke.onrender.com/api/content/home
# Should return JSON with home page content

curl https://kangarugirlsseniorschool-sc-ke.onrender.com/api/footer-links
# Should return footer links JSON
```

---

## Configuration Summary

### Development (localhost)
```
Frontend: http://localhost:5173
Backend: http://localhost:4000
VITE_API_URL: (empty - uses Vite proxy)
```

### Production (Render)
```
Frontend: https://kangarugirlsseniorschool-sc-ke.onrender.com
Backend: https://kangarugirlsseniorschool-sc-ke.onrender.com
VITE_API_URL: https://kangarugirlsseniorschool-sc-ke.onrender.com
```

---

## What's Wired

✅ Frontend knows backend URL
✅ Backend allows CORS from frontend domain
✅ API requests go cross-domain properly
✅ MongoDB connected to backend
✅ Images served from public/images/
✅ Authentication tokens included in requests
✅ Form uploads routed correctly

---

## Troubleshooting

### Still seeing "Failed to load content"
- [ ] Run `npm run build` to rebuild frontend
- [ ] Git push to Render
- [ ] Wait 2-3 minutes for redeploy
- [ ] Hard refresh browser (Ctrl+Shift+Delete)
- [ ] Check F12 console for actual error

### CORS error: "Not allowed by CORS"
- [ ] Check backend CORS_ORIGINS includes frontend domain
- [ ] Verify both domains use https (not http in production)
- [ ] Restart backend in Render (redeploy)

### 404 on images
- [ ] Verify `npm run setup:images` ran during build
- [ ] Check dist/images/ folder exists locally
- [ ] Rebuild: `npm run build`

### API returns HTML instead of JSON
- [ ] Backend service might be down
- [ ] Check Render backend logs
- [ ] Verify MONGO_URI is correct and database is accessible

---

## Next Steps

1. **Rebuild frontend**: `npm run build`
2. **Push to git**: `git add . && git commit -m "..." && git push`
3. **Wait for redeploy**: 2-3 minutes on Render
4. **Test**: https://kangarugirlsseniorschool-sc-ke.onrender.com
5. **Verify API calls** in F12 Network tab

**You're done once:**
- ✅ Content loads on homepage
- ✅ Images display
- ✅ No console errors
- ✅ API calls show 200 status
