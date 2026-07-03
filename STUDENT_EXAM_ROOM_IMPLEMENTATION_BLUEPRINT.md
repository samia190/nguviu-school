# Student Exam Room Implementation Blueprint

## Objective
Transform the current Student Exam Room into a production-grade Digital Examination Workspace while preserving the existing live invigilation system exactly as it is today.

This is an enhancement project, not a rewrite.

---

## Non-Negotiable Guardrails

### Protected systems
The following systems must remain fully functional throughout the work:
- live webcam streaming
- live microphone streaming
- teacher live monitoring dashboard
- student camera broadcasting
- teacher video grid
- WebRTC transport layer
- Mediasoup transport layer
- Socket.IO signalling
- monitoring event pipeline
- exam session lifecycle
- authentication and authorization

### Implementation rule
Any new feature must integrate through existing interfaces and extend current behavior without replacing working logic.

### Regression rule
After every major change, verify that:
- student streaming still works
- teacher monitoring still works
- teacher can still view students
- streams remain synchronized
- alerts still function
- exam submission still works

---

## Current Architectural Baseline

### Frontend
- student exam UI: [MAIN/kscfrontend/src/components/TakeExam.jsx](MAIN/kscfrontend/src/components/TakeExam.jsx)
- teacher live monitoring UI: [MAIN/kscfrontend/src/components/LiveInvigilation.jsx](MAIN/kscfrontend/src/components/LiveInvigilation.jsx)
- mediasoup client utilities: [MAIN/kscfrontend/src/webrtc/mediasoupClient.js](MAIN/kscfrontend/src/webrtc/mediasoupClient.js)
- student exams list: [MAIN/kscfrontend/src/components/StudentExamsAvailable.jsx](MAIN/kscfrontend/src/components/StudentExamsAvailable.jsx)

### Backend
- exam routes: [MAIN/kscbackend/routes/exams.js](MAIN/kscbackend/routes/exams.js)
- exam controller: [MAIN/kscbackend/controllers/examController.js](MAIN/kscbackend/controllers/examController.js)
- exam session model: [MAIN/kscbackend/models/ExamSession.js](MAIN/kscbackend/models/ExamSession.js)
- exam model: [MAIN/kscbackend/models/Exam.js](MAIN/kscbackend/models/Exam.js)
- socket server: [MAIN/kscbackend/socketServer.js](MAIN/kscbackend/socketServer.js)

---

## Proposed Enhancement Strategy

### Phase 1 — Workspace Shell and Experience Layer
Goal: modernize the student interface without disturbing current streaming or session logic.

Deliverables:
- dedicated exam information screen before start
- polished header with timer, status, camera, connection state
- clean exam workspace shell
- status bar for save, connection, camera, upload

Scope:
- add a pre-exam overview screen
- wrap the current exam flow in a richer container
- preserve existing exam session creation and submission logic

### Phase 2 — Universal Exam Resource Viewer
Goal: let students view exam resources inside the exam page.

Deliverables:
- inline PDF viewer
- image preview
- audio/video preview where supported
- fallback download experience for unsupported formats
- no requirement for leaving the exam page

Implementation approach:
- add a resource panel to the workspace shell
- support browser-native preview where possible
- use graceful fallback for unsupported files

### Phase 3 — Split-Screen Workspace
Goal: combine resources and answers in one professional layout.

Deliverables:
- left panel for exam resources
- right panel for answers and working uploads
- resizable panels
- remembered layout during the current session

Implementation approach:
- keep current question and answer handling intact
- add a layout container around the current experience
- make it additive rather than replacing the existing question flow

### Phase 4 — Question Navigation and Status System
Goal: upgrade the simple next/previous flow into a professional workspace.

Deliverables:
- question palette
- question status states: not visited, visited, answered, flagged, upload present
- quick jump between questions
- review-ready summary

Implementation approach:
- maintain the existing question array and answer model
- add a lightweight status layer on top

### Phase 5 — Working Uploads and Private Notes
Goal: make the exam page feel like a complete digital workspace.

Deliverables:
- per-question working uploads
- preview/replace/delete actions
- private student notes panel
- autosave for notes and uploads

Implementation approach:
- reuse existing file upload endpoints
- keep notes local to the student session and never expose them to teachers

### Phase 6 — Recovery and Confidence Features
Goal: make the experience robust and reassuring for students.

Deliverables:
- autosave indicators
- connection state badge
- camera/mic status
- upload progress state
- resume-after-refresh experience

Implementation approach:
- use local persistence for draft state
- recover answers, notes, and current question position
- do not disrupt the existing server-side session lifecycle

### Phase 7 — Accessibility, Performance, and Production Hardening
Goal: make the experience suitable for real deployment.

Deliverables:
- keyboard navigation
- screen-reader support
- responsive layouts
- performance safeguards
- testable modular components

Implementation approach:
- keep the UI modular
- avoid unnecessary re-renders
- preserve the current invigilation pipelines while layering new UI features on top

---

## Recommended Component Structure

### New UI layers
- exam overview screen
- exam workspace shell
- resource viewer panel
- answer workspace panel
- question palette panel
- notes panel
- review and submission panel

### Existing components to preserve
- current exam session initialization
- current answer submission flow
- existing file upload flow
- existing monitoring event logging
- existing mediasoup and socket logic

---

## Data and API Considerations

### Existing APIs to preserve
- exam load API
- exam start API
- session activity API
- proctoring event API
- file upload API
- exam submission API

### Suggested additions
- draft save API or local draft persistence
- note persistence API if server-side notes are required later
- review summary payload
- layout preference persistence

Important: these additions should be additive and backward-compatible.

---

## Risk Areas

### High risk
- accidentally breaking camera/microphone streaming
- breaking teacher monitoring grid
- changing Socket.IO or mediasoup behaviour
- changing the exam session lifecycle

### Medium risk
- duplicate uploads or race conditions during autosave
- layout state inconsistencies between panels
- refresh recovery mismatches

### Low risk
- visual polish gaps
- accessibility omissions
- performance tuning issues

---

## Regression Checklist

### Student experience
- join exam successfully
- start exam successfully
- timer continues correctly
- answers save correctly
- uploads still work
- camera and mic still work
- submission still works
- refresh recovery works

### Teacher experience
- monitoring dashboard still loads
- student grid still works
- alerts still appear
- live streams remain stable
- session status still updates

### Streaming and monitoring
- WebRTC still connects
- Mediasoup transports remain stable
- Socket.IO signalling remains unchanged
- audio/video remain synchronized
- no additional latency is introduced

---

## Definition of Done
The Student Exam Room can be considered production-ready for this enhancement scope when:
- the new workspace is polished and usable
- existing invigilation functionality remains intact
- students can work within a single exam page without leaving it
- answers, uploads, and notes are recoverable
- the experience is accessible and responsive
- regression checks pass

---

## Recommended Delivery Order
1. preserve and stabilize current exam flow
2. add the workspace shell and status bar
3. add the resource viewer and split-screen layout
4. add question navigation and review states
5. add notes and working uploads
6. add recovery and autosave
7. harden performance and accessibility
