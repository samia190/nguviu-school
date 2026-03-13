# MASTER PROMPT — Multi-School Website Platform
### Generate a complete, production-ready school website for any school in Kenya (or globally), with full CMS, student portal, admin dashboard, and multi-theme support.

---

## HOW TO USE THIS PROMPT

Copy everything from "SYSTEM INSTRUCTIONS" onward, paste it into your AI coding agent, then append your school's **CONFIG BLOCK** (see Section 0) at the end. The agent will generate a fully working codebase for that school.

To generate websites for 100+ schools: create one CONFIG BLOCK per school, run the prompt once per school. Each website is a standalone deployment with its own database, Cloudinary folder, and color theme.

---

## 0. SCHOOL CONFIG BLOCK (Customize Per School)

Fill in this block for each school. Everything else in the prompt stays the same.

```
SCHOOL_CONFIG {
  // Identity
  SCHOOL_NAME:          "Kangaru Girls Senior Secondary School"
  SCHOOL_SHORT_NAME:    "KSC"
  SCHOOL_COUNTY:        "Embu"
  SCHOOL_TYPE:          "Girls Secondary" // Boys Secondary | Mixed Secondary | Primary | International
  SCHOOL_MOTTO:         "Integrity, Excellence, Service"
  SCHOOL_FOUNDED:       "1975"
  SCHOOL_CATEGORY:      "National" // National | Extra-County | County | Sub-County

  // Contact
  SCHOOL_ADDRESS:       "P.O. BOX 1094-60100, EMBU, KENYA"
  SCHOOL_PHONE:         "+254796214804"
  SCHOOL_EMAIL:         "kangarugirls@yahoo.com"
  SCHOOL_WEBSITE:       "https://kangarugirls.ac.ke"

  // Theme — Color System
  // Pick a THEME_PRESET or define custom colors
  THEME_PRESET:         "CUSTOM" // ROYAL_BLUE | FOREST_GREEN | CRIMSON | GOLD_BLACK | PURPLE_GOLD | TEAL_WHITE | ORANGE_NAVY | CUSTOM
  THEME_PRIMARY:        "#003087"       // main brand color (nav, buttons, headings)
  THEME_SECONDARY:      "#FFD700"       // accent color (highlights, borders, badges)
  THEME_ACCENT:         "#00A86B"       // third color (icons, tags, active states)
  THEME_BG:             "#f8fafc"       // page background
  THEME_TEXT:           "#1a1a2e"       // body text
  THEME_HEADER_BG:      "#003087"       // navigation bar background
  THEME_HEADER_TEXT:    "#ffffff"       // navigation bar text/icon color
  THEME_SIDEBAR_BG:     "#001f5c"       // admin sidebar background
  THEME_SIDEBAR_ACTIVE: "#FFD700"       // admin sidebar active item

  // Branding
  SCHOOL_LOGO_URL:      ""              // Cloudinary URL or leave empty
  SCHOOL_HERO_VIDEO:    ""              // optional hero background video
  SCHOOL_CLOUDINARY_FOLDER: "kangaru"  // Cloudinary folder name for this school

  // Curriculum system
  CURRICULUM_SYSTEM:    "8-4-4"        // 8-4-4 | CBC | IGCSE | IB
  EXAM_SYSTEM:          "KCSE"         // KCSE | KCPE | IGCSE | IB
  GRADING_SCALE:        "KNEC_12"      // KNEC_12 | KNEC_9 | PERCENTAGE | GPA_4 | LETTER_A_E

  // Admin account (change before deployment)
  ADMIN_EMAIL:          "admin@school.ac.ke"
  ADMIN_PASSWORD:       "ChangeMe@2025!"

  // Features toggles (true/false)
  FEATURE_STUDENT_PORTAL:     true
  FEATURE_PARENT_PORTAL:      true
  FEATURE_HOMEWORK_PORTAL:    true
  FEATURE_RESULTS_PORTAL:     true
  FEATURE_STUDENT_ID_CARDS:   true
  FEATURE_MAGAZINE:           true
  FEATURE_CHAT_WIDGET:        true
  FEATURE_NEWSLETTER:         true
  FEATURE_EVENTS:             true
  FEATURE_GALLERY:            true
  FEATURE_SEO:                true
  FEATURE_PWA:                true
}
```

### Built-in THEME_PRESET palette reference

| Preset | PRIMARY | SECONDARY | ACCENT | Typical For |
|---|---|---|---|---|
| ROYAL_BLUE | #003087 | #FFD700 | #00A86B | Premier boys/girls nationals |
| FOREST_GREEN | #1B5E20 | #FFC107 | #FF5722 | Agricultural / green schools |
| CRIMSON | #B71C1C | #FFFFFF | #212121 | Prestigious mixed schools |
| GOLD_BLACK | #F9A825 | #212121 | #D32F2F | High-prestige nationals |
| PURPLE_GOLD | #4A148C | #FFD600 | #FFFFFF | Girls schools |
| TEAL_WHITE | #00695C | #FFFFFF | #FF8F00 | Coastal / modern schools |
| ORANGE_NAVY | #E65100 | #0D47A1 | #FFFFFF | Technical / vocational |
| CUSTOM | (from THEME_PRIMARY etc.) | — | — | Any custom brand |

---

## SYSTEM INSTRUCTIONS — FULL STACK SCHOOL WEBSITE PLATFORM

You are a senior full-stack engineer. Build a **complete, production-ready, fully functional school website** using the configuration above. Follow every specification below precisely. Do NOT skip any section. Do NOT leave placeholder comments — generate all real code.

---

## 1. TECH STACK (Fixed — Do Not Change)

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 18, Vite 5 |
| Routing | react-router-dom | v7 |
| Charts | recharts | latest |
| PDF generation | jsPDF + jspdf-autotable | latest |
| QR codes | qrcode | latest |
| Barcodes | jsbarcode | latest |
| Backend | Node.js + Express | Node 20, Express 5 |
| Database | MongoDB + Mongoose | Mongoose 8 |
| Auth | JWT + bcrypt | jsonwebtoken, bcryptjs |
| File storage | Cloudinary SDK | cloudinary v2 |
| Email | Nodemailer | latest |
| Image processing | sharp | latest |
| Security | helmet + express-rate-limit + cors | latest |
| Compression | compression (Express) + vite-plugin-compression2 | latest |
| Module system | ES Modules throughout (type: "module") | — |
| Deployment | Environment variables via `.env` | — |

---

## 2. PROJECT STRUCTURE

Generate two packages:

```
{SCHOOL_SHORT_NAME}backend/
  index.js
  .env.example
  package.json
  models/
  routes/
  controllers/
  middleware/
  services/
  utils/
  scripts/
  public/
    uploads/
    images/

{SCHOOL_SHORT_NAME}frontend/
  index.html
  vite.config.js
  package.json
  public/
  src/
    App.jsx
    main.jsx
    theme.js          ← generated from SCHOOL_CONFIG colors
    components/
      admin/
      subpages/
      shared/
    hooks/
    utils/
    styles/
```

---

## 3. THEMING SYSTEM

### 3.1 Generate `src/theme.js`

This file is auto-generated from the CONFIG BLOCK and exports a `THEME` object used throughout the app. Every color reference in every component must use this object — no hardcoded hex colors anywhere in components.

```js
// src/theme.js  — AUTO-GENERATED from SCHOOL_CONFIG
export const THEME = {
  primary:        "THEME_PRIMARY_VALUE",
  secondary:      "THEME_SECONDARY_VALUE",
  accent:         "THEME_ACCENT_VALUE",
  bg:             "THEME_BG_VALUE",
  text:           "THEME_TEXT_VALUE",
  headerBg:       "THEME_HEADER_BG_VALUE",
  headerText:     "THEME_HEADER_TEXT_VALUE",
  sidebarBg:      "THEME_SIDEBAR_BG_VALUE",
  sidebarActive:  "THEME_SIDEBAR_ACTIVE_VALUE",
  // Derived helpers
  primaryLight:   "THEME_PRIMARY_VALUE" + "22",   // 13% opacity
  primaryDark:    darken(THEME_PRIMARY_VALUE, 15), // 15% darker
  secondaryLight: "THEME_SECONDARY_VALUE" + "33",
};

export const SCHOOL = {
  name:         "SCHOOL_NAME_VALUE",
  shortName:    "SCHOOL_SHORT_NAME_VALUE",
  county:       "SCHOOL_COUNTY_VALUE",
  type:         "SCHOOL_TYPE_VALUE",
  motto:        "SCHOOL_MOTTO_VALUE",
  founded:      "SCHOOL_FOUNDED_VALUE",
  category:     "SCHOOL_CATEGORY_VALUE",
  address:      "SCHOOL_ADDRESS_VALUE",
  phone:        "SCHOOL_PHONE_VALUE",
  email:        "SCHOOL_EMAIL_VALUE",
  website:      "SCHOOL_WEBSITE_VALUE",
  curriculum:   "CURRICULUM_SYSTEM_VALUE",
  examSystem:   "EXAM_SYSTEM_VALUE",
  cloudinaryFolder: "SCHOOL_CLOUDINARY_FOLDER_VALUE",
};
```

### 3.2 CSS Variables

In `src/styles/global.css`, declare CSS custom properties mirroring the theme:
```css
:root {
  --clr-primary:       /* THEME_PRIMARY */;
  --clr-secondary:     /* THEME_SECONDARY */;
  --clr-accent:        /* THEME_ACCENT */;
  --clr-bg:            /* THEME_BG */;
  --clr-text:          /* THEME_TEXT */;
  --clr-header-bg:     /* THEME_HEADER_BG */;
  --clr-header-text:   /* THEME_HEADER_TEXT */;
  --clr-sidebar-bg:    /* THEME_SIDEBAR_BG */;
  --clr-sidebar-active:/* THEME_SIDEBAR_ACTIVE */;
  --font-heading:      'Poppins', sans-serif;
  --font-body:         'Inter', sans-serif;
  --radius-card:       12px;
  --shadow-card:       0 2px 16px rgba(0,0,0,0.08);
  --transition:        0.2s ease;
}
```

---

## 4. BACKEND — COMPLETE SPECIFICATION

### 4.1 Entry Point (`index.js`)

- Dotenv config loaded first
- Connect to MongoDB with connection pooling (maxPoolSize: 10, minPoolSize: 2, serverSelectionTimeoutMS: 5000)
- Express app with: helmet, cors (whitelist from env), compression (level 6), express.json (limit 50mb), express.urlencoded
- Mount all routers at `/api/` prefix
- Serve `public/` as static with long-lived cache headers (images: `max-age=31536000 immutable`, videos: `max-age=2592000`)
- Global error handler (never leak stack traces in production)
- Graceful shutdown on SIGTERM / SIGINT
- Listen on `process.env.PORT || 4000`

### 4.2 Environment Variables (`.env.example`)

```
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/schooldb
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=school@gmail.com
SMTP_PASS=app_password_here
ADMIN_EMAIL=admin@school.ac.ke
ADMIN_PASSWORD=ChangeMe@2025!
NODE_ENV=development
```

### 4.3 Middleware

**`middleware/requireAuth.js`**
- Verify JWT from `Authorization: Bearer <token>` header
- Attach `req.user = { id, email, role }` to request
- Return 401 if missing/expired, 403 if role check fails

**`middleware/requireRole.js`**
- Factory: `requireRole('admin')` or `requireRole(['admin', 'teacher'])`
- Return 403 with message if role mismatch

**`middleware/rateLimiter.js`**
- Auth limiter: 5 requests / 15 min per IP (skip in dev)
- General API limiter: 200 requests / 1 min per IP

**`middleware/upload.js`**
- Multer configured with Cloudinary storage (via `multer-storage-cloudinary`)
- Also configure local disk fallback if Cloudinary env vars are missing
- Field limits: single image max 10MB, video max 100MB, PDF max 20MB
- Allowed MIME types: `image/*`, `video/*`, `application/pdf`

### 4.4 Database Models (Mongoose Schemas)

Generate all of the following schemas fully. Use `timestamps: true` on all.

#### User
```
email: String (unique, lowercase, trim, required)
password: String (hashed, required)  
role: enum ['admin','teacher','student','parent','staff','pending'] default 'pending'
firstName, lastName: String
phone: String
isActive: Boolean default true
lastLogin: Date
resetPasswordToken: String (hashed)
resetPasswordExpires: Date
linkedStudents: [ObjectId ref Student]  // for parents
studentId: ObjectId ref Student  // for student accounts
accessTokenHash: String  // for parent portal
```

#### Student
```
admissionNumber: String (unique, required)
firstName, lastName, middleName: String
dateOfBirth: Date
gender: enum ['Male','Female','Other']
class: String  // e.g. "Form 3A"
stream: String
yearOfAdmission: Number
yearOfCompletion: Number
guardianName: String
guardianPhone: String
guardianEmail: String
guardianRelation: String
photo: String (Cloudinary URL)
idCardSecret: String (unique, auto-generated uuid on creation)
idCardGenerated: Boolean default false
isActive: Boolean default true
qrCodeUrl: String
barcodeData: String
curriculumType: enum ['8-4-4','CBC','IGCSE'] default from CONFIG
```

#### Result
```
student: ObjectId ref Student (required)
admissionNumber: String
academicYear: String  // e.g. "2024"
term: enum ['Term 1','Term 2','Term 3','Annual']
examType: String  // e.g. "Mid-Term", "End-Term", "KCSE Mock"
subjects: [{
  subject: String,
  score: Number,
  grade: String,
  points: Number,
  remarks: String
}]
totalMarks: Number
totalPoints: Number
meanGrade: String
meanScore: Number
position: Number
streamPosition: Number
classSize: Number
termRemarks: String (teacher/HoD comments)
principalRemarks: String
isPublished: Boolean default false
publishedAt: Date
uploadedBy: ObjectId ref User
```

#### SchoolPerformance
```
year: Number (required, unique)
examType: String default "KCSE"
meanScore: Number
meanGrade: String
candidateCount: Number
aCount, bPlusCount, bCount, bMinusCount, cPlusCount, cCount, cMinusCount, dPlusCount, dCount, eCount: Number  // grade distribution
remarks: String
isPublished: Boolean default true
```

#### Staff
```
firstName, lastName: String (required)
title: String  // Mr., Mrs., Ms., Dr., Prof.
role: enum ['principal','deputy_principal','hod','teacher','support','bursar','librarian','counselor','nurse']
department: String
subjects: [String]
qualification: String
experience: Number  // years
photo: String (Cloudinary URL)
email: String
phone: String
bio: String
isActive: Boolean default true
order: Number (for display sorting)
adminType: String  // "Academic Deputy Principal", "Administration Deputy Principal", etc.
```

#### Content (Generic CMS)
```
type: String (required)  // 'about','contact','admissions','policies','parents','legal','fee_structure','newsletter', etc.
title: String
body: String (rich text / markdown)
sections: [{ heading: String, content: String, imageUrl: String, order: Number }]
metadata: Map<String, Mixed>
isPublished: Boolean default true
version: Number default 1
lastEditedBy: ObjectId ref User
```

#### HomePage
```
IS SINGLETON (find-or-create pattern)
heroSlides: [{
  title, subtitle, description: String,
  imageUrl, videoUrl: String,
  ctaText, ctaLink: String,
  order: Number,
  isActive: Boolean
}]
quickLinks: [{
  title, description, icon, link: String,
  order: Number,
  bgColor: String
}]
welcomeMessage: { heading, body, signature: String }
statsBar: [{ label, value, icon: String }]
```

#### HeroContent
```
page: String (required)  // which page this hero belongs to
type: enum ['image','video','slider']
mediaUrl: String
title, subtitle: String
overlayColor: String
overlayOpacity: Number default 0.5
isActive: Boolean default true
```

#### HomeNews (Ticker)
```
text: String (required)
link: String
priority: Number default 0
isActive: Boolean default true
expiresAt: Date
```

#### GalleryPage (Singleton — albums)
```
albums: [{
  name: String,
  description: String,
  coverImage: String,
  images: [{
    url: String,
    caption: String,
    uploadedAt: Date,
    cloudinaryId: String
  }],
  order: Number,
  isPublished: Boolean
}]
```

#### Event
```
title: String (required)
description: String
startDate, endDate: Date
location: String
category: enum ['academic','sports','cultural','community','exam','holiday','other']
imageUrl: String
isPublished: Boolean default true
isFeatured: Boolean default false
registrationLink: String
```

#### Homework
```
title: String (required)
description: String
subject: String
class: String
dueDate: Date
attachments: [{ name: String, url: String, fileType: String }]
postedBy: ObjectId ref User
isPublished: Boolean default true
```

#### Admission
```
firstName, lastName: String (required)
dateOfBirth: Date
gender: String
parentName, parentPhone, parentEmail: String
previousSchool: String
classApplyingFor: String
documents: [{ name: String, url: String }]
status: enum ['pending','reviewing','accepted','rejected','waitlisted'] default 'pending'
notes: String
submittedAt: Date default Date.now
```

#### ChatMessage
```
name, email: String
message: String (required)
refNumber: String (auto-generated, 8-char uppercase hex)
topic: String
status: enum ['open','in_progress','resolved'] default 'open'
reply: String
repliedAt: Date
repliedBy: ObjectId ref User
```

#### ChatConfig (Singleton)
```
botName: String default "School Assistant"
greeting: String
topics: [String]
officeHours: String
isEnabled: Boolean default true
autoReplyMessage: String
contactEmail: String
```

#### Magazine
```
title, edition: String
issueDate: Date
coverImageUrl: String
pdfUrl: String
description: String
isPublished: Boolean default true
```

#### DownloadableFile
```
name, description: String
fileUrl: String
fileType: String
category: String  // 'form','policy','syllabus','circular','timetable'
isPublished: Boolean default true
downloadCount: Number default 0
```

#### AuditLog
```
user: ObjectId ref User
action: String  // 'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','PUBLISH'
resource: String  // model name
resourceId: ObjectId
details: String
ipAddress: String
userAgent: String
```

#### Page singletons (one model each, find-or-create)
Generate dedicated singleton models OR use Content type-keyed docs for:
`AboutPage`, `AdmissionsPage`, `EventsPage`, `PerformancePage`, `StudentLifePage`, `CurriculumPage`, `StudentPage`

Each has: `heading`, `subheading`, `heroImage`, `sections: [{ title, body, imageUrl, order }]`, `isPublished`, `seoTitle`, `seoDescription`, `seoKeywords`.

---

### 4.5 API Routes (All Endpoints)

Mount all at `/api/`. For every route, implement full CRUD. Protect write operations with `requireAuth + requireRole('admin')` unless noted.

#### Auth Routes — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /login | Public | Email+password login; return JWT + user object |
| POST | /register | Admin | Create new user |
| POST | /forgot-password | Public | Send reset email |
| POST | /reset-password | Public | Consume reset token, update password |
| GET | /me | Auth | Return current user |
| PUT | /me | Auth | Update own profile |
| POST | /logout | Auth | Clear session (optional server-side blacklist) |

#### Users / Roles — `/api/users`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Admin | List all users (paginated) |
| PUT | /:id/role | Admin | Change user role |
| PUT | /:id/activate | Admin | Toggle isActive |
| DELETE | /:id | Admin | Delete user |

#### Students — `/api/students`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Admin/Teacher | List all students (paginated, filterable by class/year) |
| POST | / | Admin | Create student + auto-create User account |
| GET | /:id | Admin/Teacher | Get student details |
| PUT | /:id | Admin | Update student |
| DELETE | /:id | Admin | Delete student |
| POST | /:id/upload-photo | Admin | Upload student photo to Cloudinary |
| POST | /bulk-import | Admin | Import students from JSON or CSV |
| GET | /export/csv | Admin | Export all students as CSV |

#### Student ID & Verification — `/api/student-verification`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /generate-token/:id | Admin | Sign verification token, generate QR URL |
| GET | /verify | Public | Consume token, return student info for display |
| POST | /generate-id-card/:id | Admin | Generate and store ID card PDF |

#### Results — `/api/results`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Admin | List all results (paginated, filterable) |
| POST | / | Admin/Teacher | Create result record |
| PUT | /:id | Admin/Teacher | Update result |
| DELETE | /:id | Admin | Delete result |
| GET | /student/:admissionNumber | Auth (own or admin/teacher/parent) | Get results for a student |
| POST | /:id/publish | Admin | Publish result (make visible to student) |
| POST | /bulk-upload | Admin | Import results from PDF or JSON |

#### School Performance — `/api/school-performance`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | Get all performance records |
| POST | / | Admin | Add performance record |
| PUT | /:id | Admin | Update record |
| DELETE | /:id | Admin | Delete record |

#### Staff — `/api/staff`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | List active staff (optional ?role=principal) |
| POST | / | Admin | Create staff member |
| PUT | /:id | Admin | Update staff |
| DELETE | /:id | Admin | Delete staff |
| POST | /:id/photo | Admin | Upload staff photo |

#### Content (CMS) — `/api/content`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /:type | Public | Get content by type |
| PUT | /:type | Admin | Update or create content by type |

#### HomePage — `/api/homepage`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | Get homepage data |
| PUT | / | Admin | Update homepage |
| POST | /hero | Admin | Add hero slide |
| PUT | /hero/:slideId | Admin | Update slide |
| DELETE | /hero/:slideId | Admin | Delete slide |

#### Hero Content — `/api/hero`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /:page | Public | Get hero for a page |
| PUT | /:page | Admin | Set hero for a page |

#### Home News — `/api/home-news`
Standard CRUD. GET is public, write is admin-only.

#### Gallery — `/api/gallery`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | Get all albums |
| POST | /album | Admin | Create album |
| PUT | /album/:albumId | Admin | Update album |
| DELETE | /album/:albumId | Admin | Delete album + images |
| POST | /album/:albumId/images | Admin | Upload images to album |
| DELETE | /album/:albumId/images/:imageId | Admin | Delete image |

#### Events — `/api/events`
Standard CRUD. GET (all, with ?published=true filter) public. Write = admin.

#### Homework — `/api/homework`
GET (all, filterable by class/subject) accessible to student+teacher+admin. Write = teacher+admin.

#### Admissions (Applications) — `/api/admissions`
POST (submit application) = public. GET+PUT = admin only.

#### Chat — `/api/chat`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /message | Public | Submit chat message, return refNumber |
| GET | /messages | Admin | List all messages |
| PUT | /messages/:id/reply | Admin | Reply to message |
| GET | /config | Public | Get chat bot config |
| PUT | /config | Admin | Update chat config |

#### Magazine — `/api/magazine`
Standard CRUD. GET public, write admin.

#### Downloads — `/api/downloads`
Standard CRUD + increment download counter. GET public, write admin.

#### Audit Log — `/api/audit`
GET (paginated, filterable) = admin only.

#### Parent Portal — `/api/parents`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /login | Public | Parent login with email + access token |
| GET | /dashboard | Parent | Get linked students' data |
| POST | /link-student | Admin | Link student to parent account |

#### Upload (generic) — `/api/upload`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /image | Admin | Upload image to Cloudinary |
| POST | /video | Admin | Upload video to Cloudinary |
| POST | /pdf | Admin | Upload PDF to Cloudinary |
| DELETE | /:publicId | Admin | Delete from Cloudinary |

#### Notifications — `/api/notifications`
Stored notification bell items for the admin. Standard CRUD, admin only.

#### Page Backgrounds — `/api/page-backgrounds`
Map of `{ page: String, imageUrl: String }` pairs. GET public, write admin.

---

### 4.6 Utility Modules

**`utils/storage.js`** — Cloudinary upload helper
```js
// Wraps cloudinary.uploader.upload with:
// - folder = SCHOOL_CLOUDINARY_FOLDER from env
// - transformation: quality auto, format auto
// - fallback: save to public/uploads/ if Cloudinary not configured
// Exports: uploadToCloudinary(filePath, { folder, resourceType }), deleteFromCloudinary(publicId)
```

**`utils/email.js`** — Nodemailer transporter
```js
// Creates transporter from SMTP env vars
// Exports: sendEmail({ to, subject, html, text })
// Templates: passwordReset(resetUrl), welcomeStudent(name), admissionConfirm(name, refNum)
```

**`utils/jwt.js`**
```js
// Exports: signToken(payload), verifyToken(token), generateResetToken()
```

**`utils/pdfExtraction.js`**
```js
// Uses pdf-parse to extract text from uploaded results PDFs
// Returns structured data: { studentName, admissionNumber, subjects: [], meanGrade, meanScore }
```

**`utils/performanceAnalysis.js`**
```js
// Analyzes result data and computes:
// - grade distribution
// - subject performance averages
// - improvement trend (compareYears)
// - top/bottom performers
```

**`services/dbConnection.js`** — MongoDB connect with retry
```js
// Connects with reconnect retry (max 5 attempts, exponential backoff)
// Logs connection events
```

---

### 4.7 Seed Script (`scripts/seed.js`)

Generate a seed script that:
1. Wipes the database (dev only — checks NODE_ENV)
2. Creates the admin user from env
3. Inserts 5 sample students with matching User accounts
4. Inserts sample staff (1 principal, 2 deputies, 3 teachers)
5. Creates default HomePage, ChatConfig singletons
6. Inserts sample events, news tickers, and gallery album
7. Inserts dummy school performance for last 8 years
8. Prints summary of what was created
9. Exits cleanly

---

## 5. FRONTEND — COMPLETE SPECIFICATION

### 5.1 `vite.config.js`

```js
// - base: '/'
// - React plugin
// - vite-plugin-compression2 (brotli + gzip)
// - manualChunks: vendor-react, vendor-router, vendor-charts, vendor-pdf
// - esbuild minify, no sourcemaps in production
// - css code splitting: true
// - build target: 'es2020'
// - preview server port: 4173
```

### 5.2 `src/main.jsx`

- Import Google Fonts: Poppins (headings) + Inter (body) via `<link>` in `index.html`
- Import CSS variables file
- Mount `<App />` to `#root`
- Register service worker in production (PWA)

### 5.3 `src/App.jsx`

- `BrowserRouter` from react-router-dom
- All non-home pages lazy-loaded with `React.lazy + Suspense`
- `<ProtectedRoute>` wrapper for auth-required routes
- Scroll-to-top on route change
- Global loading spinner while lazy chunks load

### 5.4 `src/utils/api.js`

Central fetch wrapper:
```js
// - Base URL from import.meta.env.VITE_API_URL
// - Automatically attaches Authorization: Bearer <token> from localStorage
// - On 401: clears token + redirects to /login
// - On network error: throws with human-readable message
// - Exports: get(path), post(path, body), put(path, body), del(path), postForm(path, formData)
```

### 5.5 `src/utils/paths.js`

```js
// - getCloudinaryUrl(publicId, options): builds optimized CDN URL with w_, q_auto, f_auto
// - getImageUrl(relativeOrAbsolute): handles both Cloudinary and local fallback
// - SCHOOL_CLOUDINARY_FOLDER from SCHOOL.cloudinaryFolder
```

---

## 6. PAGES & COMPONENTS — COMPLETE LIST

Generate ALL of the following. Every page must:
- Use colors from `THEME` object (no hardcoded hex)
- Be fully responsive (mobile ≥ 320px, tablet ≥ 768px, desktop ≥ 1280px)
- Have a hero section with the school name
- Have proper `<title>` and meta description (set via document.title or react-helmet)
- Animate in with a subtle fade-on-scroll (IntersectionObserver or CSS animation)

### 6.1 Shared Components

| Component | Description |
|---|---|
| `Navbar` | Sticky top nav. Logo left, links center, hamburger mobile menu. Uses `THEME.headerBg/headerText`. Highlights active route. |
| `Footer` | 3-column grid: school info + logo, quick links, contact. Social icons. Copyright. Uses `THEME.primary`. |
| `HeroSection` | Full-width hero (image or video background). Overlay with `THEME.primary` at 50% opacity. Title + subtitle + CTA button. |
| `PageLoader` | Centered animated spinner in `THEME.primary` color while page loads. |
| `ProtectedRoute` | Redirects unauthenticated users to `/login`. `requiredRole` prop for role-checking. |
| `LazyImage` | IntersectionObserver-based lazy loader with blur-up placeholder. |
| `OptimizedImage` | Wraps LazyImage with Cloudinary transformation URL builder. |
| `SmartImage` | Falls back to a placeholder if image 404s. |
| `ChatWidget` | Floating chat bubble (bottom-right). Opens a modal with message form. Submits to `/api/chat/message`. Shows refNumber on success. |
| `NotificationBell` | Admin nav: shows unread count badge, dropdown of recent items. |
| `SEOHead` | Sets `document.title`, meta description, og:image, og:title, canonical URL per page. |
| `Breadcrumb` | Simple breadcrumb trail for subpages. |
| `BackToTop` | Scroll-to-top floating button, appears after 300px scroll. |
| `SearchBar` | Global search bar in nav. Searches content, staff, events via API. |
| `SearchResults` | `/search` page displaying results in categories. |

### 6.2 Public Pages

#### Home (`/`)
- Animated hero slideshow (from `HomePage.heroSlides` via API)
- News ticker (from `HomeNews` API)
- Welcome/About snapshot with image
- Stats bar (enrollment count, founded year, pass rate, etc.)
- Quick links grid (6 cards)
- Upcoming events preview (3 cards from Events API)
- Gallery preview (latest 6 photos)
- Newsletter signup form
- Testimonials section (if content available)
- Full Navbar + Footer

#### About (`/about`)
- Mission, Vision, Values
- History timeline
- Principal's message (from Staff API where role=principal)
- Deputy Principals (from Staff API where role=deputy_principal)
- Heads of Department grid
- School badge/motto display

#### Contact (`/contact`)
- Map embed (Google Maps iframe from address)
- Contact form (submits to ChatMessage API)
- Contact info cards (address, phone, email, social links)
- Office hours

#### Admissions (`/admissions`)
- Overview / eligibility
- Application form (submits to Admissions API)
- Required documents list
- Fee structure snapshot
- Important dates / deadlines

#### Curriculum (`/curriculum`)
- Overview with tabs: Primary | Secondary | Syllabus | Extracurricular | Assessment | Careers
- Subject grid with icons
- Downloadable syllabus (from DownloadableFile API filtered to syllabus)

#### Performance (`/performance`)
- School-wide KCSE performance table (from SchoolPerformance API)
- Trend chart (Recharts AreaChart) — mean score over years
- Grade distribution chart (BarChart) for latest year
- Achievement highlights

#### Gallery (`/gallery`)
- Album grid (from GalleryPage API)
- Click album → opens lightbox grid of images
- Lightbox with prev/next navigation

#### Events (`/events`)
- Upcoming events (card grid)
- Past events section
- Filter by category
- Individual event modal/expand

#### Student Life (`/student-life`)
- Clubs & associations
- Sports section
- Arts & culture
- Boarding life

#### Parents (`/parents`)
- Parent resources
- Link to parent login portal
- Downloadable forms

#### Fee Structure (`/feestructure`)
- Fee tables by class from CMS
- Payment instructions
- Bank details (if in CMS)

#### Policies (`/policies`)
- School rules, code of conduct from CMS
- Sections with collapsible accordions

#### Newsletter (`/newsletter`)
- Magazine/newsletter cards (from Magazine API)
- PDF download links

#### Legal (`/legal`)
- Privacy policy, terms from CMS

### 6.3 Auth Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email + password. Roles: admin, teacher, staff. JWT stored to localStorage. Redirect based on role. |
| Sign Up | `/signup` | New account (pending role). |
| Reset Password | `/reset-password` | Token from URL + new password form. |
| Parent Login | `/parent-login` | Email + access token. Separate flow. |

### 6.4 Student Portal

| Page | Route | Access |
|---|---|---|
| Student Dashboard | `/student-dashboard` | Student |
| Student Results | `/student-results` | Student (own) |
| Homework Portal | `/portal/homework` | Student + Teacher + Admin |
| Student Verification | `/verify-student?t=token` | Public (QR scan) |
| Parent Dashboard | `/parent-dashboard` | Parent |

**Student Dashboard** shows:
- Greeting with student name
- Current class, admission number
- Latest results summary (latest term's mean grade + position)
- Pending homework count
- Links to subpages

**Student Results page:**
- Term selector dropdown
- Results table (subject, score, grade, remarks)
- Mean grade badge
- Position in class
- Principal remarks
- Download as PDF button (jsPDF)

**Homework Portal:**
- Filter by class + subject
- Cards showing title, subject, due date, attachment download
- Teachers can post new homework from the same page
- Admins can manage all

**Student Verification page (`/verify-student?t=token`):**
- Calls `/api/student-verification/verify?t=token`
- On success: shows photo, name, admission number, class, DOB
- "VERIFIED" badge in green
- If token invalid/expired: red "NOT VERIFIED" message

**Parent Dashboard:**
- List of linked children
- Per child: latest results, attendance (if tracked), homework list

### 6.5 Teacher Pages

| Page | Route | Access |
|---|---|---|
| Teacher Homework | `/teacher/homework` | Teacher |

- Form to post new homework
- Own posted assignments list
- Edit / delete own assignments

### 6.6 Admin Dashboard (`/admin`)

Full admin panel accessible only to `role: admin`. Uses a sidebar navigation.

Sidebar sections and their management components — implement all:

| Sidebar Item | Component | Features |
|---|---|---|
| **Dashboard** | `DashboardOverview` | Stats widgets: total students, staff, events, messages. Recent audit log. Quick actions. |
| **Analytics** | `AnalyticsDashboard` | Charts: page visits (mock), student count trend, performance trend, grade distribution. |
| **Home Page** | `HomeManagement` | Edit welcome message, stats bar, quick links. |
| **Hero Slides** | `HeroManagement` | Upload/edit hero slides per page. Drag to reorder. |
| **News Ticker** | `HomeNewsManagement` | Add/edit/delete ticker items. Toggle active. |
| **About Page** | `AboutManagement` | Edit mission, vision, values, history. |
| **Staff** | `StaffManagement` | CRUD staff. Photo upload. Role/department assignment. Reorder. |
| **Admissions Page** | `AdmissionsPageManagement` | Edit admissions page content. |
| **Applications** | `AdminSubmissions` | View + process admission applications. Change status. Notes. |
| **Events** | `EventsManagement` | CRUD events. Set featured. Image upload. |
| **Gallery** | `GalleryManagement` | Create albums. Bulk image upload. Set cover. Delete images. |
| **Fee Structure** | `FeeStructureManagement` | Edit fee tables per class. |
| **Newsletter/Magazine** | `MagazineManagement` + `NewslettersManagement` | Upload magazine PDFs. Manage newsletter sections. |
| **Student Life** | `StudentLifeManagement` | Edit student life page content. |
| **Curriculum** | `CurriculumPageManagement` | Edit curriculum page content per tab. |
| **Performance** | `PerformanceManagement` | CRUD annual performance records. |
| **Policies** | `PoliciesManagement` | Edit policy documents. Accordion sections. |
| **Parents Page** | `ParentsManagement` | Edit parents page content. |
| **Contact** | `ContactManagement` | Edit contact info, social links. |
| **Legal** | `LegalManagement` | Edit legal/privacy pages. |
| **Student Registry** | `StudentAdminManagement` | CRUD students. Bulk import via JSON/CSV. Export CSV. |
| **ID Cards** | `StudentIDManagement` | Generate QR+barcode ID cards. Download PDF. Bulk generate. |
| **Results** | `ResultsManagement` | Upload results (manual or PDF). Publish per student. View by class/term. |
| **Homework** | `HomeworkManagement` | Manage all homework. Assign to class. Delete. |
| **Chat** | `ChatManagement` | View messages, reply, resolve. Manage chat bot config. |
| **Role Management** | `RoleManagement` | Activate/deactivate users. Change roles. View pending. |
| **Parent Portal** | `ParentPortalManagement` | Link students to parents. Issue access tokens. |
| **Downloads** | `DownloadManagement` | CRUD downloadable files. Category management. |
| **Page Backgrounds** | `PageBackgroundManagement` | Set background image per page. Upload or URL. |
| **Notifications** | `Notifications` | View all admin notifications. Mark read. |
| **Drag & Drop Upload** | `DragDropUpload` | Standalone drag-and-drop media uploader. Copies Cloudinary URL. |
| **Audit Log** | `AuditLogView` | Paginated log of all admin actions. Filter by user/action/resource. |
| **Settings** | `SiteSettings` | School name, logo, contact info, SMS/email configs. |

Each management component must have:
- Data table or card grid displaying existing records
- Add/Edit modal or inline form
- Delete with confirmation dialog
- Cloudinary image upload where applicable (with preview)
- Loading and error states
- Success toast notifications

---

## 7. STUDENT ID CARD SYSTEM

### Card Design (PDF — A6 portrait, jsPDF)

```
┌─────────────────────────────────┐
│  [SCHOOL LOGO]  SCHOOL NAME     │  ← primary color header
│  "Student Identity Card"        │
├──────────┬──────────────────────┤
│ [PHOTO]  │  Name: ___________  │
│ 35x45mm  │  Adm #: __________  │
│          │  Class: ___________  │
│          │  DOB: _____________  │
│          │  Year: ____________  │
├──────────┴──────────────────────┤
│  [BARCODE — admission number]   │
│  [QR CODE]  "Scan to Verify"    │
├─────────────────────────────────┤
│  This card is property of...    │  ← footer in secondary color
└─────────────────────────────────┘
```

- QR code encodes URL: `{SCHOOL_WEBSITE}/verify-student?t={signed_token}`
- Barcode uses CODE128 format, encodes admission number
- Colors use `THEME.primary` and `THEME.secondary` from config
- Generate individually or in bulk (ZIP download for batch)

---

## 8. RESULTS SYSTEM — GRADING

Implement grading logic based on `GRADING_SCALE` config:

### KNEC_12 (KCSE 12-point system)
| Points | Grade | Remark |
|---|---|---|
| 12 | A | Excellent |
| 11 | A- | Excellent |
| 10 | B+ | Very Good |
| 9 | B | Very Good |
| 8 | B- | Good |
| 7 | C+ | Good |
| 6 | C | Average |
| 5 | C- | Below Average |
| 4 | D+ | Below Average |
| 3 | D | Poor |
| 2 | D- | Poor |
| 1 | E | Fail |

Mean score → mean grade uses the standard KNEC conversion table.

### PERCENTAGE
Score → Grade: 
A (75–100), B (60–74), C (50–59), D (40–49), E (<40)

### GPA_4
Standard 4.0 GPA scale.

Implement `utils/grading.js` in both frontend and backend with:
- `scoreToGrade(score, scale)` — returns `{ grade, points, remark }`
- `pointsToMeanGrade(meanPoints, scale)` — for KNEC scales
- `computeResultSummary(subjects[], scale)` — returns `{ totalPoints, meanPoints, meanGrade, meanScore }`

---

## 9. SEO IMPLEMENTATION

For every public page:
1. Set `document.title = "{Page Title} | {SCHOOL_NAME}"`
2. Set meta description (unique per page)
3. Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
4. Twitter card tags
5. Canonical URL
6. JSON-LD structured data for the school (Organization schema):
```json
{
  "@context": "https://schema.org",
  "@type": "School",
  "name": "SCHOOL_NAME",
  "address": { "@type": "PostalAddress", "addressLocality": "SCHOOL_COUNTY", "addressCountry": "KE" },
  "telephone": "SCHOOL_PHONE",
  "email": "SCHOOL_EMAIL",
  "url": "SCHOOL_WEBSITE"
}
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### Frontend
- All pages except Home are lazy-loaded
- `manualChunks` splits: vendor-react, vendor-router, vendor-charts, vendor-pdf, vendor-qr
- `LazyImage` component (IntersectionObserver, loads only when 50px from viewport)
- Video: `preload="none"`, load on user interaction
- Brotli + Gzip via `vite-plugin-compression2`
- Service Worker (Workbox) caches: static assets (cache-first), API GET responses (stale-while-revalidate, 5-min TTL)

### Backend
- Gzip/Brotli compression on all responses
- Static assets: `Cache-Control: public, max-age=31536000, immutable` (images), `max-age=2592000` (videos)
- MongoDB: lean queries for pure reads (`.lean()`)
- Pagination on all list endpoints (default limit: 20, max: 100)
- Index: `admissionNumber`, `email`, `role`, `year` on their respective collections

---

## 11. SECURITY IMPLEMENTATION

- **Helmet**: sets X-Frame-Options, CSP, HSTS, noSniff
- **CORS**: whitelist `CLIENT_URL` from env. Allow credentials.
- **Rate limiting**: Auth: 5/15min per IP. API: 200/1min per IP.
- **Input validation**: Use express-validator on all POST/PUT endpoints. Sanitize strings. Validate email format, date ranges, required fields.
- **Password policy**: Min 8 chars, 1 uppercase, 1 number, 1 special character (enforced both client + server)
- **JWT**: 7-day expiry. Secrets from env. Never expose in logs.
- **File uploads**: Validate MIME type (not just extension). Max sizes enforced. Reject non-allowed types.
- **MongoDB injection**: Use Mongoose with typed schemas. Never pass raw user strings to `$where` or `$regex` without sanitization.
- **XSS**: Use DOMPurify on client for any rendered HTML from CMS. Escape all user output.
- **CSRF**: Not required (JWT-only API, no cookies). If cookies added in future, implement CSRF tokens.
- **Audit log**: Record every admin write action (create/update/delete/publish) with userId, IP, timestamp.

---

## 12. DEPLOYMENT CONFIGURATION

### `render.yaml`

```yaml
services:
  - type: web
    name: school-backend
    env: node
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: CLIENT_URL
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false

  - type: static
    name: school-frontend
    buildCommand: npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        sync: false
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "node index.js", "restartPolicyType": "ON_FAILURE", "restartPolicyMaxRetries": 3 }
}
```

### `Dockerfile` (optional)

```dockerfile
FROM node:20-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]
```

---

## 13. MOBILE RESPONSIVENESS

Apply to ALL components:

```css
/* Breakpoints */
/* Mobile:  0–767px */
/* Tablet:  768–1279px */
/* Desktop: 1280px+ */

/* Navbar: hamburger menu on mobile, full links on desktop */
/* Admin sidebar: drawer/off-canvas on mobile, fixed on desktop */
/* Tables: horizontal scroll on mobile */
/* Cards: single column on mobile, 2-col tablet, 3-col desktop */
/* Hero: min-height 60vh mobile, 80vh desktop */
/* Fonts: scale with clamp() */
/* Touch targets: min 44x44px */
```

Mobile-specific `styles/mobile-optimization.css`:
- Touch-friendly tap targets
- Prevent horizontal overflow
- iOS Safari fixes (safe-area-inset)
- Smooth scroll behavior

---

## 14. README FILES

Generate two README files:

### `{SCHOOL_SHORT_NAME}backend/README.md`

```markdown
# {SCHOOL_NAME} — Backend API

## Stack
Node.js 20 + Express 5 + MongoDB + Cloudinary

## Setup
1. Copy `.env.example` to `.env` and fill in secrets
2. `npm install`
3. (Dev only) `node scripts/seed.js` to seed test data
4. `npm run dev` — starts with nodemon on port 4000

## Scripts
- `npm start` — production start
- `npm run dev` — nodemon watch
- `node scripts/seed.js` — seed database

## Environment Variables
See `.env.example` for all required vars.

## API Base URL
`http://localhost:4000/api`
```

### `{SCHOOL_SHORT_NAME}frontend/README.md`

```markdown
# {SCHOOL_NAME} — Frontend

## Stack
React 18 + Vite 5

## Setup
1. Copy `.env.example` to `.env.local`
2. Set VITE_API_URL=http://localhost:4000
3. `npm install`
4. `npm run dev` — starts on http://localhost:5173

## Scripts
- `npm run dev` — development
- `npm run build` — production build
- `npm run preview` — preview production build

## Theme
Edit `src/theme.js` to change colors and school info.
```

---

## 15. GENERATION CHECKLIST

Before you finish, verify you have generated:

- [ ] `{SHORT}backend/index.js` — full entry point
- [ ] `{SHORT}backend/package.json` — all dependencies
- [ ] `{SHORT}backend/.env.example`
- [ ] All 25+ Mongoose model files
- [ ] All 35+ Express route files with full CRUD
- [ ] `middleware/requireAuth.js`, `requireRole.js`, `rateLimiter.js`, `upload.js`
- [ ] `utils/storage.js`, `email.js`, `jwt.js`, `grading.js`, `pdfExtraction.js`, `performanceAnalysis.js`
- [ ] `services/dbConnection.js`
- [ ] `scripts/seed.js`
- [ ] `{SHORT}frontend/package.json`
- [ ] `{SHORT}frontend/vite.config.js`
- [ ] `{SHORT}frontend/index.html` (with Google Fonts, meta tags)
- [ ] `src/theme.js` — filled with CONFIG values
- [ ] `src/styles/global.css` — CSS variables
- [ ] `src/styles/mobile-optimization.css`
- [ ] `src/utils/api.js`, `paths.js`, `grading.js`
- [ ] `src/App.jsx` — full router with lazy loading
- [ ] All shared components (Navbar, Footer, HeroSection, LazyImage, etc.)
- [ ] All 20+ public pages
- [ ] Auth pages (Login, Signup, ResetPassword, ParentLogin)
- [ ] Student portal pages (Dashboard, Results, Homework, Verification, ParentDashboard)
- [ ] Teacher page
- [ ] Admin Dashboard with ALL 30+ management components
- [ ] `render.yaml`, `railway.json`
- [ ] Both `README.md` files

---

## 16. IMPORTANT NOTES FOR THE AI AGENT

1. **No placeholder comments.** Generate all real, working code — never write `// TODO: implement this` or `// ... rest of component`. 

2. **Color discipline.** Every UI element that uses a color must reference `THEME.primary`, `THEME.secondary`, etc. — not hardcoded hex. This is what makes the system work for 100+ schools.

3. **ES Modules everywhere.** Both frontend and backend use `"type": "module"`. Use `import/export`, not `require`.

4. **Consistent API contract.** Every API response uses: `{ success: true, data: {...} }` on success, `{ success: false, error: "message" }` on failure.

5. **No external UI libraries.** Do not use Material-UI, Ant Design, Chakra, Tailwind, Bootstrap. All CSS is hand-written using CSS variables from the theme. This keeps bundle size small and allows full color customization.

6. **Cloudinary folder isolation.** All uploads use `SCHOOL_CLOUDINARY_FOLDER` from env as the base folder. This allows 100 schools to share ONE Cloudinary account with isolated media by folder.

7. **One MongoDB database per school.** The `MONGODB_URI` in each school's `.env` points to a separate database (e.g., `mongodb+srv://.../kangaru_db`). This provides full data isolation.

8. **Seed script generates realistic data.** Staff names, subjects, and events should feel realistic for a Kenyan secondary school (use common Kenyan names, Kenyan subjects: English, Kiswahili, Mathematics, Biology, Chemistry, Physics, History, Geography, CRE, Business Studies, Agriculture, Computer Studies, Music, Art).

9. **Results import from PDF.** The admin can upload a results PDF (e.g., KNEC result slip) and the system will parse and pre-fill the results form. Use `pdf-parse`.

10. **Student ID card generation is production-quality.** The jsPDF output must look like a real school ID — clean layout, school colors, proper fonts, photo, QR, barcode. Use `THEME.primary/secondary` for the card header and footer.

---

## END OF MASTER PROMPT

To generate a website for a new school:
1. Fill in the SCHOOL_CONFIG block at the top with that school's details
2. Choose a THEME_PRESET or set custom hex colors
3. Paste this entire document into your AI agent
4. The agent will output a complete, deployable school website codebase
5. Deploy backend to Render/Railway, frontend to Render Static/Vercel/Netlify
6. Set environment variables on the hosting platform
7. Run `node scripts/seed.js` on first deploy to initialize the database
8. Login at `/login` with the ADMIN_EMAIL/ADMIN_PASSWORD from config and start customizing
