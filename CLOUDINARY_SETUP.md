# ☁️ Cloudinary Setup - CRITICAL FOR PRODUCTION

**Status:** Your code now REQUIRES Cloudinary on Render. No more broken `/uploads/` paths.

---

## 🚀 3-Minute Setup

### 1. Get Cloudinary Credentials (2 min)

Go to: https://console.cloudinary.com/settings/api

You'll see:
```
Cloud Name:   ddm1dgws8        (copy this)
API Key:      1234567890       (copy this)
API Secret:   abc123xyz        (copy this - KEEP SECRET)
```

---

### 2. Set on Render (1 min)

**Go to:** Render Dashboard → Backend Service `kangarugirlsschool` → Settings → Environment

**Paste these lines:**
```bash
CLOUDINARY_CLOUD_NAME=ddm1dgws8
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
CLOUDINARY_FOLDER=kangaru
```

Replace `<your-api-key>` and `<your-api-secret>` with actual values from step 1.

**Click "Save"** → Render redeployment starts (3-5 min)

---

### 3. Test (Immediately After Redeployment)

Open browser DevTools → Console:

```javascript
// Test 1: Upload a small file
const formData = new FormData();
formData.append('files', new Blob(['test'], {type: 'text/plain'}), 'test.txt');

fetch('https://kangarugirlsseniorschool-sc-ke.onrender.com/api/some-upload-endpoint', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(d => console.log('✅ Upload works:', d.url))
.catch(e => console.error('❌ Upload failed:', e.message));

// Test 2: Check if Cloudinary is enabled
fetch('https://kangarugirlsseniorschool-sc-ke.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Backend error:', e));
```

---

## ❌ What Happens If You Don't Set Cloudinary

**On Render (Production):**
```
POST /api/gallery/:id/attachments
→ uploadBuffer() tries Cloudinary
→ Cloudinary not configured
→ Tries S3 (not configured)
→ Tries disk (/uploads/)
❌ ERROR: "Cloudinary or S3 not configured"
→ Upload FAILS
```

**Images will NOT load.** The code now **prevents** the broken fallback behavior.

---

## ✅ What Happens When Cloudinary is Set

**On Render:**
```
POST /api/gallery/:id/attachments
→ uploadBuffer() tries Cloudinary
→ ✅ Cloudinary configured
→ Uploads image to CDN: https://res.cloudinary.com/ddm1dgws8/image/upload/...
→ Returns Cloudinary URL
→ Stores in MongoDB
→ Frontend displays image from CDN
→ Image persists forever (not deleted on restart)
```

**Images ALWAYS load.** Works every time.

---

## 📋 Checklist

- [ ] Visit https://console.cloudinary.com/settings/api
- [ ] Copy Cloud Name, API Key, API Secret
- [ ] Go to Render Dashboard → Backend Settings → Environment
- [ ] Add 4 environment variables (CLOUDINARY_*)
- [ ] Click "Save"
- [ ] Wait 3-5 minutes for redeployment
- [ ] Hard refresh browser (Ctrl+Shift+Delete)
- [ ] Test gallery upload/view
- [ ] Test file downloads

---

## 🆘 Troubleshooting

### Problem: Still getting 404 on images

**Cause:** Render still running old code without Cloudinary check

**Fix:** 
1. Render Dashboard → Backend → click "Clear build cache and redeploy"
2. Wait 5 minutes
3. Hard refresh browser 3 times

### Problem: "API Secret" field seems empty

**That's OK.** The secret is hidden for security. Just copy it anyway:
- Click the copy icon next to the field
- Paste into Render environment

### Problem: Cloudinary free tier seems limited

**No, it's generous:**
- 25GB storage (≈5,000 images)
- 25GB bandwidth/month
- Automatic optimization (WebP, responsive sizes)
- Free forever

---

## 🔒 Security Notes

⚠️ **NEVER** commit `.env` file with real API Secret to git

✅ **Always** use Render Environment Variables (not in code)

✅ **Change** API Secret if ever leaked (Cloudinary Dashboard → Settings → Account)

---

## Done! 🎉

Once Cloudinary is configured on Render:
- ✅ Gallery images upload successfully
- ✅ Images persist (no more 404s)
- ✅ Images optimized automatically
- ✅ Works globally with CDN

**Expected deployment time: 5-10 minutes total**

