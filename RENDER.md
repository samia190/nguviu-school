# Render Deployment Guide

Complete guide to deploy the Nguviu School full-stack application on Render.

## 🚀 Quick Start

### Prerequisites
- GitHub repository with your code
- MongoDB Atlas account (or another MongoDB provider)
- Email SMTP credentials (Gmail, SendGrid, etc.)

---

## 📋 Deployment Steps

### 1. Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/nguviu`
5. Whitelist all IPs (`0.0.0.0/0`) in Network Access for Render

### 2. Deploy Backend API

#### Option A: Blueprint (Recommended)
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and create both services

#### Option B: Manual Setup
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nguviu-backend`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `nguviu-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=4000
   MONGO_URI=mongodb+srv://your-username:password@cluster.mongodb.net/nguviu
   JWT_SECRET=<generate-random-string>
   JWT_EXPIRES_IN=7d
   CORS_ORIGINS=https://your-frontend.onrender.com
   CLIENT_ORIGIN=https://your-frontend.onrender.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=no-reply@yourdomain.com
   RESET_TOKEN_EXPIRES_MS=3600000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=5
   ```

5. Click "Create Web Service"
6. **Save the backend URL**: `https://nguviu-backend.onrender.com` (or your chosen name)

### 3. Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nguviu-frontend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `nguviu-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://nguviu-backend.onrender.com
   ```
   ⚠️ **IMPORTANT**: Replace with your actual backend URL from step 2

5. Click "Create Static Site"

### 4. Update Backend CORS

After deploying the frontend, you'll get a URL like `https://nguviu-frontend.onrender.com`

1. Go to your backend service in Render
2. Click "Environment"
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://nguviu-frontend.onrender.com,http://localhost:5173
   ```
4. Click "Save Changes" (backend will auto-redeploy)

---

## 🔧 Important Configuration Notes

### JWT Secret Generation
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an "App Password": Google Account → Security → 2-Step Verification → App passwords
3. Use the 16-character password as `SMTP_PASS`

### Environment Variables Priority
The app checks for MongoDB connection in this order:
- `MONGO_URI`
- `MONGODB_URI`
- `MONGO_URL`
- `DATABASE_URL`

---

## ⚠️ Common Issues & Solutions

### Issue 1: Backend Service Fails to Start
**Symptom**: Service shows "Build failed" or "Deploy failed"
**Solution**: 
- Check build logs for errors
- Verify Node version is >= 18.18.0
- Ensure all environment variables are set correctly

### Issue 2: Frontend Can't Connect to Backend
**Symptom**: API calls return CORS errors or 404s
**Solutions**:
- Verify `VITE_API_URL` is set correctly (with https://)
- Check backend `CORS_ORIGINS` includes your frontend URL
- Ensure backend service is running (check Logs)
- Clear browser cache and rebuild frontend

### Issue 3: MongoDB Connection Failed
**Symptom**: Backend logs show "MongoDB connect error"
**Solutions**:
- Verify connection string format
- Check MongoDB Atlas Network Access allows all IPs
- Ensure database user has read/write permissions
- Test connection string locally first

### Issue 4: Email Sending Fails
**Symptom**: Password reset emails don't send
**Solutions**:
- Verify SMTP credentials are correct
- For Gmail: use App Password, not regular password
- Check SMTP_PORT (587 for TLS, 465 for SSL)
- Set SMTP_SECURE=false for port 587

### Issue 5: File Uploads Fail or Don't Persist
**Symptom**: Uploaded files disappear after restart
**Solution**: 
- Render's free tier has ephemeral storage
- Files uploaded to `/public/uploads` will be lost on restart
- For production, configure S3 storage (see below)

### Issue 6: Frontend Shows Old Content After Update
**Symptom**: Code changes don't appear
**Solutions**:
- Trigger manual redeploy in Render
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Check if build completed successfully

---

## 📦 Optional: AWS S3 for File Storage

Render's free tier uses ephemeral storage. For persistent file uploads:

### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Create a new bucket
3. Enable public access if needed
4. Create IAM user with S3 permissions

### 2. Add Environment Variables to Backend
```
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC=true
```

### 3. Install AWS SDK
The backend code already supports S3, you just need to add the package:
```bash
npm install @aws-sdk/client-s3
```

---

## 🔄 Auto-Deploy Setup

### Enable Auto-Deploy on Git Push
1. In Render Dashboard, go to your service
2. Settings → "Auto-Deploy" should be ON by default
3. Every push to `main` branch will trigger automatic deployment

### Manual Deploy
If you need to manually redeploy:
1. Go to service in Render
2. Click "Manual Deploy" → "Deploy latest commit"

---

## 📊 Monitoring & Logs

### View Logs
1. Go to service in Render Dashboard
2. Click "Logs" tab
3. Monitor real-time logs for errors

### Health Check
- Backend: `https://your-backend.onrender.com/api/health`
- Should return: `{"ok": true, "time": "..."}`

---

## 💰 Free Tier Limitations

### Backend (Web Service - Free)
- ⏰ Spins down after 15 minutes of inactivity
- 🐌 First request after spin-down takes 30-50 seconds
- 💾 Ephemeral storage (files lost on restart)
- 🔄 750 hours/month free

### Frontend (Static Site - Free)
- ✅ No spin-down
- ✅ Fast CDN delivery
- ✅ 100 GB bandwidth/month
- ✅ Always available

### Solutions for Spin-Down
1. Use a free uptime monitor (UptimeRobot, Cron-job.org)
2. Ping `/api/health` every 14 minutes
3. Upgrade to paid tier ($7/month for always-on)

---

## 🔐 Security Checklist

Before going live:
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Set proper CORS_ORIGINS (don't use `*`)
- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS only (Render does this automatically)
- [ ] Set up MongoDB IP whitelist properly
- [ ] Use Gmail App Password (not regular password)
- [ ] Review and test all admin routes

---

## 🚀 Post-Deployment Testing

### Test Checklist
1. ✅ Frontend loads correctly
2. ✅ Static assets (images, CSS) load
3. ✅ API health check responds
4. ✅ User login/logout works
5. ✅ Admin panel accessible
6. ✅ Content creation/editing works
7. ✅ File uploads work (note: ephemeral on free tier)
8. ✅ Form submissions save
9. ✅ Email sending works (password reset)
10. ✅ Gallery images display

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Vite Docs**: https://vitejs.dev/guide/
- **React Router**: https://reactrouter.com/

---

## 🎉 Success!

Your full-stack application should now be live:
- **Frontend**: https://your-frontend.onrender.com
- **Backend API**: https://your-backend.onrender.com/api/health

Remember to:
1. Share the frontend URL (not the backend URL)
2. Monitor logs after deployment
3. Test all critical features
4. Set up uptime monitoring for free tier
