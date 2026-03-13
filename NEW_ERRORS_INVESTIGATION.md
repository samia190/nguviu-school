# 🔍 NEW ERROR INVESTIGATION - February 24, 2026

## Overview

Your app is **now running the latest code** (MOF_E.PNG, SignUp fixes applied), but 3 NEW serious issues have appeared:

---

## ERROR 1: `TypeError: can't access property "currentTarget", o is undefined`

### What's Happening
```
Uncaught TypeError: can't access property "currentTarget", o is undefined
  at onError (index-BdXJkVi6.js:60)
  at k (vendor-react-CuHgzld1.js:8)  ← React event delegation
  at Pf (vendor-router-BWwPkxTl.js:5)  ← Router component
```

### Stack Trace Analysis
- Router is firing an event handler
- That handler (`onError`) is being called with `o` as argument
- `o` is `undefined` or falsy
- Code tries to access `.currentTarget` on undefined
- This crashes the route render

### Most Likely Cause
**An image `onError` callback is being called without an event object:**

```javascript
// BAD:
const handleImageError = onError;  // undefined if optional parameter
// then later:
handleImageError();  // Called with no argument! ERROR

// GOOD:
const handleError = () => {
  if (onError) onError();
};
// then:
onError={handleError}  // Always passed properly with event
```

### Where to Look
- Components using OptimizedImage with optional `onError` prop
- Components passing `onError` but calling it without event object
- Callback chains where error handler is `undefined`

**Affected scope:** Router pages (From stack: vendor-router)
- Home, About, Gallery, Events, StudentLife, etc. any with images

---

## ERROR 2: `OpaqueResponseBlocking - resource is blocked`

### What's Happening
```
Header message: "A resource is blocked by OpaqueResponseBlocking..."
Files blocked:
  - 1771840349696-DSC_5353.webp
  - 1771840325075-DSC_5353.webp
  - DSC_5353.jpg
  - gallery-1771837587079-DSC_5391.jpg
  - all /uploads/ gallery images
```

### Root Cause
**CORS policy blocking cross-origin image responses**

When frontend (https://kangarugirlsschool-sc-ke.onrender.com) tries to load images from backend (https://kangarugirlsschool.onrender.com/uploads/), the response is blocked because:

1. Backend returns image without proper CORS headers
2. Browser applies OpaqueResponseBlocking (security feature)
3. Response is not readable by frontend
4. Image fails to load silently

### Why This Is Happening

Backend [kscbackend/index.js](kscbackend/index.js) likely has:
```javascript
app.use(cors()); // Missing CORS for /uploads/ route
app.use('/images', express.static('public/images'));  // ✓ Has CORS
app.use('/uploads', express.static('public/uploads'));  // ❌ Might be missing CORS
```

### Visual Symptoms
- Images show "broken" icon
- Network tab shows request succeeds but image never renders
- Console shows "blocked by OpaqueResponseBlocking"
- Service worker can't cache the response

---

## ERROR 3: `NS_BINDING_ABORTED` for `/uploads/` images

### What's Happening
```
GET https://kangarugirlsschool.onrender.com/uploads/gallery-1771837587079-DSC_5391.jpg
NS_BINDING_ABORTED
```

### Root Cause
**Connection was aborted mid-request** - usually due to:

1. **Service Worker blocking** - sw.js might be blocking /uploads/
2. **CORS rejection** - response rejected before download (OpaqueResponseBlocking)
3. **Connection cancelled** - browser cancelled request due to policy
4. **CSP violation** - Content Security Policy blocking image source

### Evidence
From [kscfrontend/public/sw.js](../kscfrontend/public/sw.js):
```javascript
const isAssetRequest = /.../.test(requestPath)
  || requestPath.startsWith('/images/')
  || requestPath.startsWith('/uploads/')  // ← Service worker is aware
  || ...;
```

Service worker knows about `/uploads/` but if it can't fetch from it (CORS), it won't cache.

---

## ERROR 4: `/header/logo new.PNG 404`

### What's Happening
```
GET https://kangarugirlsseniorschool-sc-ke.onrender.comheader/logo new.PNG  [HTTP/3 404]
```

### Root Cause
**Frontend static site doesn't have `/header/` directory**

```
Frontend structure (static site):
  /dist/
    index.html
    /assets/
      /js/
      /css/
    favicon.ico  ← Only this root file available

Backend structure:
  /public/header/
    logo new.PNG   ← Lives here
```

When frontend tries relative path `/header/logo new.PNG`, it looks in:
```
https://kangarugirlsseniorschool-sc-ke.onrender.comheader/logo new.PNG
                                              ^^^^^^^^^ NOT FOUND
                                              (should be on backend domain)
```

### Current index.html References
From [kscfrontend/index.html](../kscfrontend/index.html#L54):
```html
<link rel="preload" href="/header/logo new.PNG" as="image" />
```

This file should be:
1. Copied into frontend `public/header/`
2. OR fetched from backend with full URL: `https://kangarugirlsschool.onrender.com/header/logo new.PNG`

---

## SUMMARY TABLE

| Error | Type | Severity | Impact |
|-------|------|----------|--------|
| TypeError currentTarget | Runtime | 🔴 CRITICAL | Page crashes on image load |
| OpaqueResponseBlocking | CORS | 🔴 CRITICAL | Gallery images won't display |
| NS_BINDING_ABORTED | CORS/CSP | 🔴 CRITICAL | Upload images fail to load |
| /header/logo new.PNG 404 | Path | 🟡 MEDIUM | Logo not showing in header |

---

## WHAT NEEDS TO BE FIXED

### 1. **Fix CORS for `/uploads/` route** (Backend)
Ensure CORS headers are applied to uploads:
```javascript
app.use('/uploads', cors(), express.static('public/uploads'));
```

### 2. **Fix undefined event handlers** (Frontend)
Any component calling optional callbacks must check:
```javascript
// Before:
if (onError) onError();  // Could be undefined if not passed

// After:  
const handleError = (e) => {
  if (onError) onError(e);  // Always pass event
};
onError={handleError}  // Always have function
```

### 3. **Service Worker CORS handling** (Frontend)
Service worker should not try to cache responses with CORS issues:
```javascript
// Check if response is opaque before caching
if (contentType.includes('image') && response.status !== 200) {
  return response; // Don't cache failed images
}
```

### 4. **Logo path (quick fix)** (Frontend)
Update index.html to use correct domain:
```html
<!-- Change from: -->
<link rel="preload" href="/header/logo new.PNG" />

<!-- To: -->
<link rel="preload" href="https://kangarugirlsschool.onrender.com/header/logo new.PNG" />
```

---

## FILES THAT NEED INVESTIGATION

| File | Issue | Action |
|------|-------|--------|
| kscbackend/index.js | CORS headers missing on /uploads/ | Check CORS middleware |
| kscfrontend/src/components/*.jsx | Undefined onError callbacks | Check Components |
| kscfrontend/public/sw.js | Service worker blocking /uploads/ | Check caching logic |
| kscfrontend/index.html | Logo path wrong domain | Update to absolute URL |

