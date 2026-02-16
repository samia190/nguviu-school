# Post-Deployment Fix Checklist

## Issues Fixed ✅

### 1. **Backend API Connection (Critical)**
- **Problem**: Frontend calling `localhost:4000` instead of deployed backend
- **Fixed**: 
  - Updated `kscfrontend/.env.production` with `VITE_API_URL=/api`
  - Updated `kscbackend/.env` with correct `CLIENT_ORIGIN` and `CORS_ORIGINS`
  - Backend now allows requests from: `https://kangarugirlsschool-sc-ke.onrender.com`

### 2. **Missing Images (Critical)**
- **Problem**: Images in responses returning 404
- **Fixed**:
  - Created `scripts/setup-images.mjs` to copy optimized images from `.optimized/images/` to `public/images/`
  - Updated build scripts to run image setup before build
  - Images now properly included in deployment

### 3. **Srcset Parsing Warnings (Minor)**
- **Status**: Informational warnings - will disappear when images load correctly
- **Note**: These warnings occur when browser can't parse image paths, should resolve with proper image serving

---

## Deployment Steps

### Step 1: Copy Images for Deployment
```bash
cd kscfrontend
npm run setup:images
```
This copies all optimized images to `public/images/` for serving.

### Step 2: Rebuild Frontend
```bash
npm run build
```
This will automatically:
1. Setup images (`setup:images`)
2. Build with Vite
3. Create optimized production bundle

### Step 3: Deploy to Render
```bash
# Frontend automatically redeploys when you git push
git add .
git commit -m "Fix: Wire database and images for production deployment"
git push

# Backend will need environment variables set in Render dashboard:
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=...
# NODE_ENV=production
# CLIENT_ORIGIN=https://kangarugirlsschool-sc-ke.onrender.com
# CORS_ORIGINS=https://kangarugirlsschool-sc-ke.onrender.com
```

---

## Environment Configuration Summary

### Frontend (.env.production)
```
VITE_API_URL=/api
```
- Uses relative paths so frontend makes requests to same domain
- Change to full URL if backend is on different domain

### Backend (.env)
```
NODE_ENV=production
CLIENT_ORIGIN=https://kangarugirlsschool-sc-ke.onrender.com
CORS_ORIGINS=http://localhost:5173,http://localhost:4000,https://kangarugirlsschool-sc-ke.onrender.com
```
- Allows CORS requests from production frontend
- Includes localhost for local development

---

## Testing After Deployment

1. **Check Browser Console** (F12 → Console tab)
   - No more `localhost:4000` errors
   - API calls should show actual domain in Network tab

2. **Check Network Tab** (F12 → Network)
   - API calls: Should be `/api/content/...` 
   - Images: Should show `kangarugirlsschool-sc-ke.onrender.com/images/...`
   - Status codes: 200 for successful requests

3. **Clear Cache & Reload**
   - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   - Hard refresh: Ctrl+F5 (or Cmd+Shift+R on Mac)

---

## Quick Troubleshooting

### Still seeing 404s for images?
- Run `npm run setup:images` in `kscfrontend/`
- Rebuild: `npm run build`
- Redeploy

### Still getting connection refused?
- Check backend is running on Render
- Verify `CORS_ORIGINS` in backend `.env`
- Check `VITE_API_URL` in frontend `.env.production`

### Getting HTML instead of JSON from API?
- Backend might be returning error page
- Check backend logs in Render dashboard
- Verify database connection (MONGO_URI)

---

## Files Modified

1. `kscfrontend/.env.production` - Backend API URL configuration
2. `kscfrontend/.env.development` - Local development setup
3. `kscfrontend/package.json` - Added image setup scripts
4. `kscfrontend/scripts/setup-images.mjs` - NEW: Image setup utility
5. `kscbackend/.env` - CORS and client origin configuration

---

## Next Steps

1. Run image setup: `npm run setup:images`
2. Rebuild frontend: `npm run build`
3. Push to git and deploy
4. Monitor browser console for any remaining errors
5. Test all API endpoints from production URL
