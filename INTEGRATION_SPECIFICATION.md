# DETAILED INTEGRATION SPECIFICATION

## Phase 1: Environment & Dependencies (CURRENT)

### 1.1 Environment Configuration
**Status**: Files created
- [x] `.env.unified` - Consolidated all env vars
- [x] `package.json.unified` (frontend) - Merged all frontend deps
- [x] `package.json.unified` (backend) - Merged all backend deps

**Next**: Apply unified configs to actual package.json and .env files

---

## Phase 2: Database Schema Consolidation

### 2.1 MongoDB Schema Mapping

#### From Main Project (Keep As-Is)
- User
- Student
- Staff
- StudentProfile
- TeacherProfile
- StaffProfile
- ParentProfile
- Results
- Event
- EventsPage
- GalleryItem
- GalleryPage
- Homework
- Content
- HomePage
- HeroContent
- etc. (existing 30+ models)

#### From Exam Room (MySQL → MongoDB)
**Drizzle Tables to Migrate:**
```
exams → Exam model
exam_questions → ExamQuestion model
exam_sessions → ExamSession model  
student_exam_results → StudentExamResult model
proctoring_logs → ProctoringLog model
```

**New Mongoose Models to Create:**
```javascript
// models/Exam.js
{
  title: String,
  subject: String,
  description: String,
  pdfUrl: String,
  duration: Number,
  trustScoreThreshold: Number,
  proctoringLevel: enum["strict", "moderate", "light"],
  passThreshold: Number,
  totalMarks: Number,
  allowedMaterials: [String],
  instructions: String,
  scheduledStart: Date,
  scheduledEnd: Date,
  createdBy: ObjectId (ref: User),
  enrolledStudents: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}

// models/ExamQuestion.js
{
  examId: ObjectId (ref: Exam),
  questionNumber: Number,
  questionText: String,
  questionType: enum["mcq", "short", "essay", "upload"],
  options: [{text: String, isCorrect: Boolean}],
  marks: Number,
  order: Number
}

// models/ExamSession.js
{
  examId: ObjectId (ref: Exam),
  studentId: ObjectId (ref: User),
  startTime: Date,
  endTime: Date,
  status: enum["not_started", "in_progress", "submitted", "graded"],
  answers: [{questionId, answer}],
  autoSaveAt: Date,
  submittedPdfUrl: String,
  score: Number,
  trustScore: Number,
  proofOfWork: [{timestamp, data}]
}

// models/StudentExamResult.js
{
  sessionId: ObjectId (ref: ExamSession),
  studentId: ObjectId (ref: User),
  examId: ObjectId (ref: Exam),
  score: Number,
  totalMarks: Number,
  percentage: Number,
  passed: Boolean,
  gradedAt: Date,
  feedback: String
}

// models/ProctoringLog.js
{
  sessionId: ObjectId (ref: ExamSession),
  timestamp: Date,
  eventType: String,
  severity: enum["info", "warning", "critical"],
  details: Object
}
```

#### From Link Generator
**Routes.js Models:**
```javascript
// models/GeneratedLink.js
{
  shortCode: String (unique, indexed),
  originalUrl: String,
  title: String,
  description: String,
  createdBy: ObjectId (ref: User),
  expiresAt: Date,
  isExpired: Boolean,
  accessCount: Number,
  lastAccessedAt: Date,
  maxAccesses: Number,
  password: String (optional),
  tags: [String],
  analytics: {
    views: Number,
    uniqueVisitors: Number,
    referrerSources: [{}],
    deviceTypes: {},
    geolocation: [{}]
  },
  createdAt: Date,
  updatedAt: Date
}

// models/LinkAnalytic.js
{
  linkId: ObjectId (ref: GeneratedLink),
  visitorId: String,
  timestamp: Date,
  referrer: String,
  userAgent: String,
  ipAddress: String,
  deviceType: String,
  location: {country, city, lat, lng},
  duration: Number
}
```

#### From AI Assistant (Supabase → MongoDB)
```javascript
// models/ChatMessage.js
{
  userId: ObjectId (ref: User),
  conversationId: ObjectId (ref: ChatConversation),
  role: enum["user", "assistant"],
  content: String,
  tokenCount: Number,
  timestamp: Date
}

// models/ChatConversation.js
{
  userId: ObjectId (ref: User),
  title: String,
  startedAt: Date,
  lastMessageAt: Date,
  messageCount: Number,
  archived: Boolean
}

// models/ChatConfig.js
{
  name: String,
  systemPrompt: String,
  model: String,
  temperature: Number,
  maxTokens: Number,
  createdBy: ObjectId (ref: User),
  isActive: Boolean
}
```

### 2.2 Migration Scripts to Create
```
scripts/
  ├── migrate-exams-to-mongo.mjs
  ├── migrate-links-to-mongo.mjs
  ├── migrate-supabase-to-mongo.mjs
  ├── create-indexes.mjs
  └── validate-migration.mjs
```

---

## Phase 3: Backend Route Integration

### 3.1 New Routes to Create

#### `/api/exams/*` Routes
```javascript
// routes/exams.js
POST   /api/exams                  - Create exam (admin/teacher)
GET    /api/exams                  - List exams
GET    /api/exams/:examId          - Get exam details
PUT    /api/exams/:examId          - Update exam (admin/teacher)
DELETE /api/exams/:examId          - Delete exam (admin)
POST   /api/exams/:examId/enroll   - Enroll student
GET    /api/exams/:examId/students - List enrolled students
POST   /api/exams/:examId/start    - Start exam session
GET    /api/exams/sessions/:sessionId - Get session
POST   /api/exams/sessions/:sessionId/save - Auto-save answers
POST   /api/exams/sessions/:sessionId/submit - Submit exam
GET    /api/exams/results/:studentId - Get student results
```

#### `/api/links/*` Routes
```javascript
// routes/links.js
POST   /api/links                  - Create short link
GET    /api/links                  - List user's links
GET    /api/links/:linkId          - Get link details
PUT    /api/links/:linkId          - Update link
DELETE /api/links/:linkId          - Delete link
GET    /api/links/:linkId/analytics - Get link analytics
GET    /s/:shortCode               - Resolve short link (public)
```

#### `/api/chat/*` Routes
```javascript
// routes/chat.js
POST   /api/chat/messages          - Send message
GET    /api/chat/conversations     - List conversations
POST   /api/chat/conversations     - Create conversation
GET    /api/chat/conversations/:id - Get conversation
DELETE /api/chat/conversations/:id - Delete conversation
GET    /api/chat/configs           - List AI configs
POST   /api/chat/configs           - Create config (admin)
```

### 3.2 Middleware Updates
```javascript
// middleware/requireAuth.js - UPDATE
// Add role checks for: admin, teacher, student, parent, staff
export function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// middleware/examAuth.js - NEW
// Verify student is enrolled in exam before allowing access

// middleware/chatAuth.js - NEW  
// Verify user has chat access

// middleware/linkAuth.js - NEW
// Check link password if required, validate access limits
```

### 3.3 Controllers to Create
```
controllers/
  ├── examController.js       - Exam CRUD + sessions
  ├── linkController.js       - Link generation + analytics
  ├── chatController.js       - Chat message handling
  └── proctoringController.js - Proctoring logic
```

### 3.4 Utilities to Create/Update
```
utils/
  ├── linkGenerator.js        - Generate short codes
  ├── examValidator.js        - Validate exam data
  ├── proctoringEngine.js     - Proctoring logic
  ├── analyticsTracker.js     - Track link clicks
  └── storage.js              - UPDATED for exam files
```

---

## Phase 4: Frontend Integration

### 4.1 New Pages to Create
```
src/pages/  (or src/routes/ depending on new router)
  ├── ExamList.jsx            - Browse exams
  ├── TakeExam.jsx            - Exam taking interface
  ├── ExamResults.jsx         - Results & performance
  ├── LinkGenerator.jsx       - Generate links (admin)
  ├── LinkAnalytics.jsx       - Link analytics (admin)
  ├── AIAssistant.jsx         - Chat interface
  └── ProctoringDashboard.jsx - Proctoring monitoring (admin)
```

### 4.2 New Components to Create
```
src/components/
  ├── ExamCard/ExamCard.jsx
  ├── ExamTimer/ExamTimer.jsx
  ├── QuestionPanel/QuestionPanel.jsx
  ├── ProctoringAlert/ProctoringAlert.jsx
  ├── LinkForm/LinkForm.jsx
  ├── Analytics/AnalyticsChart.jsx
  ├── ChatWindow/ChatWindow.jsx
  ├── MessageList/MessageList.jsx
  └── InputArea/InputArea.jsx
```

### 4.3 Hooks to Create
```
src/hooks/
  ├── useExam.js              - Fetch & manage exam state
  ├── useExamSession.js       - Handle exam session
  ├── useLink.js              - Create & manage links
  ├── useChat.js              - Chat messages state
  └── useProctoring.js        - Proctoring state
```

### 4.4 API Integration Services
```
src/utils/api/
  ├── examApi.js              - Exam API calls
  ├── linkApi.js              - Link API calls
  ├── chatApi.js              - Chat API calls
  └── proctoringApi.js        - Proctoring API calls
```

### 4.5 Routes Integration
```javascript
// Update src/App.jsx
const examRoutes = [
  { path: "/exams", component: ExamList },
  { path: "/exams/:id", component: ExamDetails },
  { path: "/exams/:id/take", component: TakeExam },
  { path: "/exams/:id/results", component: ExamResults },
];

const linkRoutes = [
  { path: "/admin/links", component: LinkGenerator },
  { path: "/admin/links/:id/analytics", component: LinkAnalytics },
];

const aiRoutes = [
  { path: "/ai-assistant", component: AIAssistant },
];

// Merge all routes and add to router
```

---

## Phase 5: Migration & Data Integration

### 5.1 Data Migration Strategy
1. **Backup existing MongoDB** before any changes
2. **Create migration scripts** for each module
3. **Validate data integrity** after each migration
4. **Update user roles** if new role types introduced
5. **Create rollback scripts** if needed

### 5.2 User Role Extensions
```javascript
// Current User model roles:
// ["pending", "admin", "teacher", "student", "staff", "parent", "user"]

// New role combinations (add to User schema if needed):
// "teacher" → can create exams, grade, proctor
// "student" → can take exams, see results
// "admin" → can manage all features
// "parent" → can view student results

// Update role validation everywhere
```

---

## Phase 6: Testing & Validation

### 6.1 Unit Tests to Create
```
tests/
  ├── unit/
  │   ├── examController.test.js
  │   ├── linkGenerator.test.js
  │   ├── chatService.test.js
  │   └── authMiddleware.test.js
```

### 6.2 Integration Tests
```
tests/
  ├── integration/
  │   ├── exam-flow.test.js
  │   ├── link-generation.test.js
  │   └── chat-system.test.js
```

### 6.3 E2E Tests
```
tests/
  ├── e2e/
  │   ├── student-exam-flow.e2e.js
  │   ├── admin-dashboard.e2e.js
  │   └── link-tracking.e2e.js
```

---

## Phase 7: Files to DELETE (after integration)

From Root Directory:
```
/uograde/AI Assiatance combine with the existing to be one/
/uograde/exam room new feature/
/uograde/link generator in admin dashboard/
```

These directories should only be referenced during migration. After verification, delete them.

---

## Phase 8: Deployment & Documentation

### 8.1 Files to Create
```
DEPLOYMENT.md               - Deployment guide
MIGRATION_GUIDE.md          - Data migration steps
API_DOCUMENTATION.md        - API endpoints & usage
ARCHITECTURE.md             - System architecture
CHANGELOG.md                - List all changes
```

### 8.2 Environment Configuration
```
.env                        - Use .env.unified as base
.env.production            - Production-specific vars
.env.development           - Development-specific vars
.env.test                  - Test-specific vars
```

---

## Summary of File Changes

| Category | Files | Action |
|----------|-------|--------|
| **Configs** | package.json (frontend) | Merge & update to unified |
| | package.json (backend) | Merge & update to unified |
| | .env (backend) | Update to unified |
| | vite.config.ts (frontend) | Update if needed |
| **Models** | *.js (backend/models) | Add Exam, ExamQuestion, ExamSession, StudentExamResult, ProctoringLog, GeneratedLink, LinkAnalytic, ChatMessage, ChatConversation, ChatConfig |
| **Routes** | *.js (backend/routes) | Add exams.js, links.js, chat.js |
| **Controllers** | - | Create examController.js, linkController.js, chatController.js |
| **Middleware** | - | Create examAuth.js, linkAuth.js, chatAuth.js |
| **Frontend Pages** | *.jsx/tsx | Create ExamList, TakeExam, ExamResults, LinkGenerator, AIAssistant |
| **Frontend Components** | *.jsx/tsx | Create exam, link, chat related components |
| **Hooks** | *.js | Create useExam, useLink, useChat hooks |
| **API Services** | *.js | Create examApi, linkApi, chatApi services |
| **Scripts** | *.mjs | Create migration scripts |
| **Tests** | *.test.js | Create unit, integration, e2e tests |
| **Docs** | *.md | Create DEPLOYMENT, MIGRATION_GUIDE, API_DOCUMENTATION |

---

## Integration Checklist

- [ ] Unified environment variables configured
- [ ] Frontend package.json merged and dependencies installed
- [ ] Backend package.json merged and dependencies installed
- [ ] MongoDB models created for new features
- [ ] Migration scripts tested and run
- [ ] Backend routes implemented and tested
- [ ] Frontend pages and components created
- [ ] API integration layer working
- [ ] Authentication flows validated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Old module directories removed
- [ ] System deployed and verified

