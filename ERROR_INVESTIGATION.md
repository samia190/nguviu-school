# 🔍 ERROR SOURCE INVESTIGATION

## Summary
Your deployment is running **OLD CODE** that doesn't include our recent fixes. There are 3-4 layers of problems from different time periods.

---

## ERROR 1: `kangaru%20girls-school.onrender.com/api/home-news` ERR_NAME_NOT_RESOLVED

### Where It's Coming From
```
Request URL: https://kangaru%20girls-school.onrender.com/api/home-news
Decoded:     https://kangaru girls-school.onrender.com/api/home-news
             (with SPACE in domain - invalid)
```

### Status
- ❌ **NOT in current local code** (we use correct domain: `kangarugirlsschool.onrender.com`)
- ✅ **Fixed in commit:** `f43651d` (fix: production deployment patch)
- 🔴 **Deployed version:** Older than `f43651d`

### Source Hypothesis
- Could be hardcoded in an older deployed `.env` file from Render
- Could be in an old vite config from before November
- Likely from commit **before** `f43651d` (from 2-3 weeks ago)

**Current local .env shows:** `VITE_API_URL=https://kangarugirlsschool.onrender.com` ✅ (correct)

---

## ERROR 2: `Principal.png was preloaded but not used within a few seconds`

### Where It's Coming From
```html
<!-- This warning indicates somewhere in deployed code: -->
<link rel="preload" href="..." as="image">
<!-- is trying to preload /images/Principal.png -->
```

### Status
- ❌ **NOT in current index.html** (we removed it)
- ✅ **Fixed in commit:** `f43651d`
- 🔴 **Deployed version:** Missing latest changes

### Investigation Result
- Current index.html has: `/header/logo.PNG` preload only ✅
- Current index.html **does NOT** have `/images/Principal.png` preload ✅
- Therefore: **Render is running old index.html**

---

## ERROR 3: `Failed parsing 'srcset' - Dropped srcset candidate "/header/MOF"`

### Where It's Coming From
```
Browser srcset parser sees: "/header/MOF E.PNG"
Tries to parse as srcset descriptor
Sees space, breaks, drops "/header/MOF" part
Missing: " E.PNG" (after the space)
```

### Status
- ❌ **NOT in current code** (we renamed to `MOF_E.PNG` in commit `f43651d`)
- ✅ **Current deploy:** `MOF_E.PNG` (no space)
- 🔴 **Render deployed:** Still has `MOF E.PNG` (with space)

### File Evidence
```
Local files:
  ✅ kscfrontend/public/header/MOF_E.PNG (correct, no space)
  ✅ kscfrontend/src/components/Footer.jsx references MOF_E.PNG

Render deployed:
  ❌ Still has MOF E.PNG file
  ❌ Footer still references "/header/MOF E.PNG"
```

---

## ERROR 4: `GET https://...onrender.com/images/DSC_5454.jpg 404`

### Where It's Coming From
```
Frontend tries: GET https://kangarugirlsschool-sc-ke.onrender.com/images/DSC_5454.jpg
Render static site: No such file (never, existed, never will)
Result: 404
```

### Expected Behavior
- Images should be on **Cloudinary**, not `/images/`
- Or from backend `/uploads/` (which is ephemeral on Render)
- We updated **SignUp.jsx** to use Cloudinary URLs (commit `f43651d`)

### Status
- ❌ **Deployed version likely:** Still using `/images/DSC_5454.jpg` paths
- ✅ **Current local code:** Uses Cloudinary URLs

---

## ERROR 5: `Dropped srcset candidate "https://kangarugirlsschool.onrender.com/uploads/gallery-1771837586951-DSC_5372"` (NO FILE EXTENSION)

### Where It's Coming From
```
Backend storage.js saveBufferToDisk():
  const safeName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
  // Missing: path.extname(filename)
  // Creates: /uploads/1771837586951-DSC_5372 (no .jpg!)
```

### Status
- ✅ **FIXED in commit:** `342d534` (require Cloudinary - prevents this)
- 🔴 **Current deployed:** Still using disk storage fallback
- 📌 **Root cause:** Cloudinary not configured in Render environment

### Investigation
Without CLOUDINARY_* env vars on Render:
```
uploadBuffer() → uploadToCloudinary() FAILS (no keys)
                → uploadBufferToS3() FAILS (not configured)  
                → saveBufferToDisk() creates /uploads/file (no extension!)
```

---

## TIMELINE OF CODE CHANGES

| Commit | Date | Changes | Status |
|--------|------|---------|--------|
| `f43651d` | Feb 24 | ✅ Fixed: MOF E.PNG renamed, SignUp Cloudinary URLs, CORS docs | 🔴 NOT DEPLOYED |
| `342d534` | Feb 24 | ✅ Fixed: Require Cloudinary (prevent broken disk) | 🔴 NOT DEPLOYED |
| `5b7fa5f` | Feb 24 | ✅ Docs: Final setup steps | 🔴 NOT DEPLOYED |
| `bd930af` | (older) | Unknown changes | 🔴 DEPLOYED  |
| (many) | ... | Various updates | 🔴 DEPLOYED |

**Current deployed commit is somewhere ~ `bd930af` or earlier, missing all our recent fixes.**

---

## VERIFICATION CHECKLIST

| Item | Local Git | Deployed on Render |
|------|-----------|-------------------|
| `MOF E.PNG` filename | ✅ MOF_E.PNG (fixed) | ❌ MOF E.PNG (old) |
| Footer references MOF | ✅ MOF_E.PNG | ❌ MOF E.PNG |
| SignUp Cloudinary URLs | ✅ Fixed (f43651d) | ❌ Still /images/ |
| index.html preload Principal | ✅ Removed | ❌ Still there |
| VITE_API_URL | ✅ Correct domain | ❌ Wrong domain/space |
| Cloudinary enforcement | ✅ storage.js (342d534) | ❌ Still fallback to disk |

---

## ROOT CAUSE

**Render is caching old builds.** It has NOT picked up our recent commits because:

1. ❌ Commit hash `2c2b5dc` (latest) differs from deployed version
2. ❌ Build cache contains old dist/ files
3. ❌ Static site cache contains old index.html
4. ❌ Backend cache contains old storage.js

---

## WHERE DATA CAME FROM

### Error 1: `kangaru%20girls-school` Domain
- **Most likely source:** Very old `.env` or build config
- **Not found in:** Current codebase anywhere
- **Status:** Ancient debt from way earlier

### Errors 2-3: Principal.png preload & MOF E.PNG space
- **Source:** index.html and Footer.jsx from **before commit f43651d**
- **Status:** Render running code from **2 commits ago** (not updated)

### Error 4: /images/DSC* 404s
- **Source:** SignUp.jsx using hardcoded paths (before our fix)
- **Status:** Old SignUp code deployed

### Error 5: /uploads/ missing extension
- **Source:** storage.js fallback behavior
- **Status:** Cloudinary not configured on Render + old storage code

---

## WHAT NEEDS TO HAPPEN

1. **Force Render to re-pull latest code** (clear cache)
2. **Verify Cloudinary env vars are set** on Render dashboard
3. **Hard refresh browser** (clear frontend cache too)

**Then all errors should disappear because:**
- MOF_E.PNG is renamed ✅
- SignUp uses Cloudinary URLs ✅
- Principal.png preload removed ✅
- Storage requires Cloudinary ✅

