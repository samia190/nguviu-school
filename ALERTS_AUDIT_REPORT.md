# Real-Time Alerts & Notifications System Audit

**Audit Date:** 2026-07-02  
**Status:** ✅ PARTIALLY IMPLEMENTED  
**Summary:** System captures SOME real proctoring events but misses many detection mechanisms and lacks real-time push notifications.

---

## Executive Summary

| Aspect | Status | Details |
|--------|--------|---------|
| **Real Events** | ✅ PARTIAL | 4/7 event types implemented |
| **Real-Time Push** | ❌ MISSING | Using polling (3s interval) instead of Socket.IO push |
| **Persistence** | ✅ COMPLETE | All events stored in MongoDB |
| **Display** | ✅ COMPLETE | Teacher dashboard shows real alerts |
| **Acknowledgment** | ✅ COMPLETE | Teachers can mark alerts as acknowledged |

---

## PART 1: WHAT'S ACTUALLY WORKING ✅

### Real Event Detection (4 types)

#### 1. **Window/Tab Focus Events**
- **Trigger:** Student tabs out or loses focus
- **Endpoint:** TakeExam.jsx `handleBlur()` / `handleFocus()`
- **Event Types:**
  - `window_blur` (severity: warning)
  - `window_focus` (severity: info)
  - `page_visibility` (severity: warning when hidden)
- **API Call:** POST `/api/exams/session/{sessionId}/activity`
- **Storage:** ✅ Saved to MongoDB ProctoringLog
- **Status:** 🟢 WORKING - Student cannot avoid detection

#### 2. **Activity Tracking (Every 15 Seconds)**
- **Trigger:** Periodic sync
- **Data Captured:**
  - Current question index
  - Answer preview
  - Last activity timestamp
  - Camera status (enabled/disabled)
- **Event Type:** `activity_update` (severity: info)
- **API Call:** POST `/api/exams/session/{sessionId}/activity`
- **Storage:** ✅ Saved to ExamSession model
- **Status:** 🟢 WORKING - Creates audit trail

#### 3. **Camera Lifecycle Events**
- **Trigger:** When student clicks "Start Camera" or "Stop Camera"
- **Event Types:**
  - `camera_started` (severity: info)
  - `camera_stopped` (severity: info)
- **API Call:** POST `/api/exams/session/{sessionId}/activity`
- **Storage:** ✅ Saved to ProctoringLog
- **Detection Method:** Manual user action
- **Status:** 🟢 WORKING - But only manual triggers

#### 4. **Exam Questions Viewed/Answered (NOT IMPLEMENTED YET)**
- **Event Types:** `question_viewed`, `question_answered`
- **Status:** ❌ DEFINED in schema but NO detection code
- **Location:** TakeExam.jsx line 448+ (question rendering)

---

## PART 2: WHAT'S MISSING ❌

### 5 Event Types Defined But NOT Detected

| Event Type | Severity | Use Case | Implementation | Status |
|-----------|----------|----------|-----------------|--------|
| `copy_paste` | warning | Copy/paste attempt | Needs `copy`/`paste` listeners | ❌ NOT DONE |
| `right_click` | warning | Right-click context menu | Needs `contextmenu` listener | ❌ NOT DONE |
| `tab_switch` | warning | Multiple windows/tabs | Needs `blur` + window object check | ⚠️ PARTIAL (blur only) |
| `screenshot_detected` | critical | Screen capture attempt | Requires browser API or heuristic | ❌ NOT DONE |
| `suspicious_movement` | warning | Excessive mouse/webcam movement | Requires vision/ML | ❌ NOT DONE |
| `recording_started` | critical | Screen recording | Requires ScreenCapture API check | ❌ NOT DONE |
| `multiple_faces` | critical | Multiple people in frame | Requires face detection library | ❌ NOT DONE |
| `no_face` | critical | Student not visible | Requires face detection library | ❌ NOT DONE |

---

## PART 3: REAL-TIME DELIVERY MECHANISM

### Current Architecture: POLLING (Not Real-Time)

```
Student sends event → Server stores in DB
                ↓
Teacher polls every 3 seconds → GET /api/exams/{examId}/alerts
                ↓
State updated → UI re-renders
```

**Latency:** 0-3 seconds (depends on polling interval)

### Problem with Current Approach:
1. ❌ Network overhead: 20 HTTP requests per minute per teacher
2. ❌ Delays: Events delayed by up to 3 seconds
3. ❌ Not true "real-time"
4. ❌ Scales poorly with many teachers
5. ❌ Battery drain on mobile devices

---

## PART 4: DATA FLOW ANALYSIS

### Event Capture → Storage → Display Pipeline

```
TakeExam.jsx (Student)
    ↓
    logEvent(eventType, severity, description)
    ↓
    POST /api/exams/session/{sessionId}/activity
    ↓
examController.updateSessionActivity()
    ↓
ProctoringLog.create({
    sessionId, studentId, examId,
    eventType, severity, description,
    timestamp, acknowledged: false
})
    ↓
MongoDB ProctoringLog collection
    ↓
    ← (Teacher polls every 3s)
LiveInvigilation.jsx
    ↓
    GET /api/exams/{examId}/alerts
    ↓
examController.getExamAlerts()
    ↓
Returns ProctoringLog entries with:
    - severity: ["warning", "critical"]
    - populated: studentId, sessionId
    - sorted: newest first
    ↓
Frontend renders:
    - Alert tiles in "Active Alerts Section"
    - recentEvents in monitoring session cards
    - Statistics: total alerts, severity counts
```

---

## PART 5: DATABASE & SCHEMA ANALYSIS

### ProctoringLog Schema
```javascript
{
  sessionId: ObjectId (ref: ExamSession),
  studentId: ObjectId (ref: User),
  examId: ObjectId (ref: Exam),
  
  eventType: String [enum of 17 types],
  severity: String (enum: "info", "warning", "critical"),
  description: String,
  details: Mixed,
  
  timestamp: Date (default: now),
  acknowledged: Boolean (default: false),
  acknowledgedAt: Date,
  acknowledgedBy: ObjectId (ref: User),
  
  createdAt, updatedAt: Timestamps
}
```

**Indexes:**
- sessionId + timestamp (for fast queries by session)
- studentId + severity (for alerts by student)
- eventType (for filtering by event type)

**Queries:**
- Get alerts: `ProctoringLog.find({ sessionId: {$in: [...]}, severity: {$in: ["warning", "critical"]} }).limit(50)`
- Acknowledge: `ProctoringLog.findByIdAndUpdate(alertId, { acknowledged: true, acknowledgedAt: now, acknowledgedBy: userId })`

---

## PART 6: TEACHER DASHBOARD INTEGRATION

### What Teachers See (Currently)

#### Section 1: Quick Stats
```
Streaming Now: {count of active video producers}
Total Students: {total enrolled students}
Connection Status: Connected/Connecting/Waiting
```

#### Section 2: Live Student Streams
- Video tiles showing real-time camera feeds
- Stream name: Student name or producerId
- Status: 🟢 Live indicator

#### Section 3: Active Alerts (This is the Real-Time Part)
```
Alerts displayed:
- Event timestamp (localized)
- Student name
- Event description (e.g., "Student moved away from the exam window")
- Severity badge: ⚠️ warning or 🔴 critical
- Acknowledge button (sets acknowledged: true)

Filters available:
- By severity (all/warning/critical)
- By student
- Search by description
```

#### Section 4: System Status
- Socket.IO connection status
- Room state
- Producer count
- Consumer count

### Refresh Strategy
- Auto-refresh every 3000ms (configurable: 2s, 3s, 5s, 10s)
- Manual fetch: Click any stat to refresh
- No real-time push on new alerts

---

## PART 7: WHAT'S GENUINELY REAL vs PLACEHOLDER

### ✅ GENUINELY REAL (Verified in Code)
1. **Window blur/focus events** - Triggered by actual browser events, stored in DB
2. **Activity updates** - Real question progress, answer previews, timestamps
3. **Camera lifecycle** - Real start/stop events with timestamps
4. **Persistence** - All events in MongoDB with full audit trail
5. **Acknowledge workflow** - Teachers actually mark alerts as handled
6. **Trust score adjustment** - Critical events lower ExamSession.trustScore by 10 points

### ❌ PLACEHOLDER/NOT IMPLEMENTED
1. **Copy/paste detection** - No detection code exists
2. **Screenshot detection** - No detection code exists
3. **Right-click detection** - No detection code exists
4. **Multiple faces detection** - No face detection library integrated
5. **No face detection** - No face detection library integrated
6. **Suspicious movement** - No movement analysis code
7. **Recording detection** - No ScreenCapture API monitoring
8. **Question viewed/answered events** - Defined but not generated

---

## PART 8: BACKEND API ENDPOINTS

### Alert Endpoints (All Implemented)

| Method | Endpoint | Purpose | Real-Time? |
|--------|----------|---------|-----------|
| `POST` | `/api/exams/{sessionId}/activity` | Log activity event | Sync only |
| `POST` | `/api/exams/{sessionId}/log-event` | Log proctoring event | Sync only |
| `GET` | `/api/exams/{examId}/alerts` | Fetch alerts for exam | Polling only |
| `POST` | `/api/exams/alerts/{alertId}/acknowledge` | Mark alert acknowledged | Sync only |
| `GET` | `/api/exams/sessions/monitoring?examId={examId}` | Get monitoring sessions with recentEvents | Polling only |

### Frontend Integration Points

| Component | Function | Poll Interval |
|-----------|----------|---------------|
| LiveInvigilation.jsx | `fetchAlerts()` | Every 3s (default) |
| LiveInvigilation.jsx | `fetchMonitoringSessions()` | Every 3s (default) |
| LiveInvigilation.jsx | `fetchRecordingState()` | Every 3s (default) |
| TakeExam.jsx | `sendActivity()` | Every 15s |

---

## PART 9: SOCKET.IO INTEGRATION STATUS

### Current Socket.IO Usage
- ✅ Used for: Mediasoup WebRTC signaling (video streaming)
- ❌ NOT Used for: Alert/notification push
- ❌ NOT Used for: Real-time event broadcasting

### Opportunities for Socket.IO Real-Time Alerts
```javascript
// Currently NOT IMPLEMENTED:
socket.on('connect', () => {
  // Could join room: examRoom:{examId}
});

io.to(`examRoom:${examId}`).emit('newAlert', {
  studentId, eventType, severity, description
});

// Would require:
// 1. Socket.emit('joinExamRoom', {examId}) on teacher connect
// 2. Emit newAlert event when ProctoringLog.create() is called
// 3. Listen to 'newAlert' in LiveInvigilation.jsx
// 4. Add alert to state immediately (no polling needed)
```

---

## PART 10: PERFORMANCE & SCALABILITY ANALYSIS

### Current Polling Overhead
**Scenario:** 10 teachers monitoring 50 exams with 500 students

```
Requests per teacher:
  - fetchAlerts(): 1 per 3 seconds
  - fetchMonitoringSessions(): 1 per 3 seconds
  - fetchRecordingState(): 1 per 3 seconds
  = 3 requests per 3 seconds = 1 req/sec

Total: 10 teachers × 1 req/sec = 10 req/sec = 36,000 req/hour

Database queries:
  - alerts: ProctoringLog.find({severity: ["warning", "critical"]}) × 10 = 10 queries/sec
  - sessions: ExamSession.find({examId, status}) + populate + enrichment × 10 = 10 queries/sec
  = 20 queries/sec = 72,000 queries/hour
```

### With Real-Time Socket.IO
```
Connections: 10 × 1 = 10 websocket connections (persistent)
Bandwidth: ~1 event per student per minute = 500 events/min across all students
  = 8.3 events/sec broadcast = ONE message to teacher when event happens
  vs 20 queries/sec in polling mode
  
Result: ~4x reduction in database load
```

---

## SUMMARY TABLE: REAL vs PLACEHOLDER

| Feature | Implemented | Real-Time | Persistent | Comments |
|---------|------------|-----------|------------|----------|
| Window blur/focus | ✅ Yes | ⚠️ 3s delay | ✅ Yes | Working well |
| Activity updates | ✅ Yes | ⚠️ 15s delay | ✅ Yes | Manual sync |
| Camera events | ✅ Yes | ⚠️ 3s delay | ✅ Yes | Manual action only |
| Copy/paste | ❌ No | - | - | Placeholder |
| Right-click | ❌ No | - | - | Placeholder |
| Screenshot | ❌ No | - | - | Placeholder |
| Face detection | ❌ No | - | - | Placeholder |
| Recording detect | ❌ No | - | - | Placeholder |
| Q/A events | ❌ No | - | - | Placeholder |
| Real-time push | ❌ No | ❌ No | - | Using polling |

---

## RECOMMENDATIONS FOR PRODUCTION

### Immediate (Priority 1)
1. ✅ KEEP: Window blur/focus detection - working well
2. ✅ KEEP: Activity polling - reasonable compromise
3. ⚠️ UPGRADE: Replace polling with Socket.IO real-time push for alerts
4. ❌ REMOVE: Placeholder event types that aren't detected (reduce confusion)

### Short-term (Priority 2)
1. Implement copy/paste detection
2. Implement right-click context menu blocking
3. Implement question viewed/answered event tracking
4. Add browser tab/window count tracking

### Medium-term (Priority 3)
1. Integrate face detection library (face-api.js or ML5.js)
2. Implement screenshot detection heuristics
3. Implement screen recording detection
4. Add suspicious movement analysis

### Long-term (Priority 4)
1. Add device camera access logs
2. Add network connection quality monitoring
3. Add keystroke pattern analysis
4. Add AI-based behavior anomaly detection

---

## Test Checklist

After implementation, verify:

- [ ] Window blur event appears in alerts within 3 seconds
- [ ] Window focus event appears in alerts
- [ ] Activity updates appear in monitoring sessions
- [ ] Camera events appear with correct timestamp
- [ ] Teacher can acknowledge alert
- [ ] Acknowledged alerts disappear from "Active" list
- [ ] Unacknowledged alerts persist after page refresh
- [ ] Trust score decreases for critical events
- [ ] Multiple alerts from same student show correctly
- [ ] Alert timestamps are in teacher's timezone

