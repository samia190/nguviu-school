# Kangaru Platform Production-Readiness Audit

**Audit date:** 17 August 2026  
**Scope:** Static source-code and dependency audit of the supplied Kangaru frontend and backend, including the targeted streaming-assistant integration. No production credentials, database, external storage account, TURN service, or deployed environment were available for black-box testing.

> **Release decision: Not production-ready for student results, online examinations, or live invigilation.** The public website may be separated from these systems, but the identified access-control, exam-integrity, privacy, and operational issues must be remediated before using the sensitive modules with real students or assessment data.

## 1. Executive assessment

The project has substantial feature coverage: a role-based website, authenticated student/teacher/admin areas, result records with trend analysis, online exam workflows, monitoring events, WebRTC/mediasoup signalling, file storage integration, and a floating AI assistant. However, the sensitive features rely too heavily on client-provided identifiers and browser signals. Several server routes expose or accept student data, exam content, results, uploads, or monitoring activity without checking that the current user is entitled to the specific resource.

| Area | Current state | Production assessment |
| --- | --- | --- |
| Public school website | Feature-rich public and content-management surface | Can be evaluated separately after standard hardening. |
| Role authentication | JWT verification and role middleware exist | **Partially complete**; resource-level authorisation is inconsistent. |
| Student results | Published-result retrieval and deterministic analytics exist | **Not ready** because ownership checks can be bypassed. |
| Student-results “AI” | Rule-based trend/risk/recommendation engine exists | **Partially complete**, but it is not an AI assistant and lacks safeguards, calibration, and review controls. |
| General AI assistant | Existing widget plus streamed provider fallback and role prompts | **Integration-ready**, conditional on production secrets, model governance, rate limiting, and data-boundary controls. |
| Online exams | Exam creation, enrolment, sessions, answers, basic MCQ scoring, and files exist | **Not ready** for consequential assessments. |
| Live invigilation | Socket signalling, browser media publishing, event logs, and monitoring UI exist | **Prototype / pilot only**; not a production proctoring system. |
| Operations | Health endpoint, Helmet, compression, database gating, rate limits on selected flows | **Incomplete**; no adequate test, observability, deployment, or resilience evidence. |

## 2. What is complete

The system already has meaningful foundations. The backend verifies bearer JWTs and applies roles through `middleware/requireAuth.js`. Login and registration are rate limited, as are student verification and public form submissions. The server uses Helmet, compression, request-size limits, a database health check, and a database-availability gate. The exam domain persists exams, questions, sessions, results, files, proctoring logs, and recording metadata. The client can capture answers, upload working files, emit browser activity events, and publish camera/audio tracks through the mediasoup pathway.

The student-results page also has a non-generative analysis layer. It calculates trends, subject consistency, attendance-related flags, predicted next-term averages, risk levels, and canned study recommendations in `kscbackend/utils/performanceAnalysis.js`. This is useful as descriptive analytics, provided it is labelled accurately and governed appropriately.

## 3. Critical production blockers

The following items are release blockers. They create a realistic risk of unauthorised disclosure, assessment compromise, or invalid proctoring evidence.

| Priority | Finding | Evidence | Impact | Required remediation |
| --- | --- | --- | --- | --- |
| **P0** | Exam questions and answer keys are publicly retrievable. | `routes/exams.js:35-36,70` permits public list/detail access; `examController.js:90-104` returns question documents without removing MCQ `isCorrect` fields. | Anyone who knows or discovers an exam ID can obtain the assessment and potentially the answers before or during an exam. | Require authenticated access for all exam reads; verify enrolment/teacher ownership; never send correct answers to a student client; create a student-safe question projection. |
| **P0** | Student result verification can disclose another student’s results. | `routes/results.js:55-171` accepts an admission number, name, and date of birth from any authenticated student but never verifies that the admission number belongs to `req.user`. | A student who knows another student’s basic identity information can retrieve that person’s published academic records. | Remove the second identity challenge for authenticated students and derive the result identity exclusively from `req.user`; create a separate, tightly governed recovery flow if needed. |
| **P0** | A student can request any student’s exam results by user ID. | `routes/exams.js:51`; `examController.js:506-523` queries arbitrary `studentId` without an ownership check. | Cross-student assessment disclosure. | Enforce `studentId === req.user.id` for students; allow teachers only for exams they own; allow admins through explicit policy. |
| **P0** | Examination evidence files can be uploaded anonymously and attached to arbitrary exam/session/question identifiers. | `routes/files.js:37-159` has no authentication middleware; the client posts to `/api/files` without an authorization header in `TakeExam.jsx:252-292`. | Attackers can inject files, consume storage, poison evidence, or attach content to another student’s session. | Require student authentication; load and verify the session belongs to the caller and is in progress; derive student/exam/session metadata on the server; allowlist MIME types and scan uploads. |
| **P0** | Invigilation room and monitoring subscriptions lack resource-level authorisation. | `socketServer.js:160-195` accepts arbitrary room IDs after role check; `realtimeMonitoring.js:5-16` lets any authenticated socket subscribe to any exam room. | Students or staff can potentially observe unauthorised media or monitoring events by learning an exam ID. | Bind every socket action to a server-authorised `ExamSession`; verify student enrolment and session ownership, and verify teacher assignment/admin authority before joining, consuming, or subscribing. |
| **P0** | Exam timing, scheduling, status, and attempt limits are not enforced on the server. | `examController.js:188-227` starts a session without enforcing scheduled windows or duration; `229-300` submits without checking expiry/status; `TakeExam.jsx:94-100` uses a client-only countdown. | Students can alter client time, submit late, start outside an approved window, or potentially create additional attempts after submission. | Store immutable `serverStartedAt`, `serverExpiresAt`, attempt number, and terminal status; enforce each at start/autosave/submit inside a database transaction or conditional update. |
| **P0** | Proctoring events are client-asserted and can be written against sessions without ownership verification. | `routes/exams.js:58`; `examController.js:563-606` writes a log for the requested session without checking `session.studentId === req.user.id`. | Monitoring records are not trustworthy and could be forged, polluted, or used unfairly. | Restrict students to their own active session, permit staff only through scoped policy, validate allowed event types server-side, and treat browser telemetry as untrusted signals rather than proof. |

## 4. Student-results assistant audit

### 4.1 Current implementation

The result page is **not currently an AI assistant that analyses an individual student’s results through a model**. It displays deterministic calculations from `performanceAnalysis.js`, including simple thresholds, fixed recommendations, and linear-regression projections. The results page does not invoke the general AI assistant with a verified, minimised result-data context.

This distinction matters. Deterministic analytics can be easier to test and explain, but labels such as “prediction,” “risk,” and “urgent” can still affect a student’s confidence, school decisions, or family discussions. The current logic includes recommendations such as considering health issues, parent-teacher meetings, or additional support without a professional review workflow.

| Status | Capability | Gap |
| --- | --- | --- |
| Implemented | Trend, subject, attendance, and score analysis | Inputs are not versioned, calibrated, or independently validated. |
| Implemented | Student-facing recommendations | Recommendations are fixed templates, not personalised instructional plans. |
| Implemented | Predicted next-term average | No confidence interval, data-quality check, minimum cohort rule, or explanation of limitations. |
| Missing | Secure result-to-assistant grounding | General assistant has no explicit permissioned result-context endpoint. |
| Missing | Human-review and escalation workflow | High-risk/urgent outputs are displayed without teacher/counsellor approval or case-management controls. |
| Missing | Student-safe presentation policy | “Risk” labels and health-related suggestions should not be presented as diagnoses or final judgements. |
| Missing | Analytics validation | No test dataset, accuracy criteria, bias review, curriculum review, or monitoring for false positives. |

### 4.2 Required design for safe student support

The recommended design is a **separate, authenticated `GET /api/results/me/assistant-context` service**. It should derive the student ID from the JWT, select only the current student’s published results, reduce fields to the minimum necessary, redact staff-only comments and peer-ranking data where appropriate, and produce a structured server-side summary. The assistant should receive this summary only after the student explicitly asks for help.

The response should be framed as learning support rather than prediction or diagnosis. It should cite the observed data, distinguish facts from suggestions, avoid mental-health/medical assertions, and direct serious wellbeing concerns to trusted school staff. All model calls should be rate-limited, logged without raw sensitive prompts where possible, and reviewed under a written school AI/data policy.

## 5. Online examination audit

The current examination implementation supports a useful internal prototype but does not meet production standards for high-stakes or graded remote assessments.

| Control area | Current implementation | Gap and consequence |
| --- | --- | --- |
| Access to exam content | Public list and detail routes exist. | Questions and answer keys can leak; student-specific delivery is absent. |
| Enrolment | Student enrolment is stored on the exam. | Enrolment does not enforce availability windows, cohort/class membership, eligibility, or attempt policy. |
| Timing | Client renders a countdown. | The server does not authoritatively enforce start/end time or duration. |
| Autosave/resume | Activity sync sends answer previews. | There is no clear durable, atomic answer-autosave contract or recovery reconciliation. |
| Submission | Client posts all answers and marks the session submitted. | No idempotency key, server expiry check, terminal-state guard, or robust partial-failure recovery. |
| Scoring | MCQ scoring is performed on submission. | Correct answers are delivered to clients; non-MCQ grading workflow is incomplete; scoring/grade rules lack integrity checks. |
| Files / working | Files can be attached. | Uploads are unauthenticated and metadata is client controlled. |
| Teacher ownership | Teacher can create and edit only self-created exams in some controller methods. | Results, alerts, sessions, and recording routes need the same ownership policy consistently applied. |
| Audit trail | Session and proctoring models exist. | Sensitive state changes, question edits, grades, overrides, and result publication are not covered by a complete immutable audit trail. |

### Required examination release criteria

Before opening any consequential exam, the platform should pass all of the following criteria.

1. The server must control assessment availability, session start, server expiry, attempts, submission idempotency, and finalisation.
2. Student responses must be stored through authenticated, session-bound autosave endpoints with optimistic concurrency/version checks.
3. Student response payloads must never include answer keys, marking schemes, teacher notes, or unauthorised resources.
4. File uploads must be session-scoped, authenticated, malware-scanned, size/type constrained, and stored with immutable evidence metadata.
5. All exam routes must apply a central policy function that checks role, ownership, assignment, active status, and enrolment.
6. The system must have end-to-end tests for unauthorised access, answer-key leakage, late submission, duplicate submission, interrupted network recovery, and result isolation.

## 6. Live invigilation audit

The live-invigilation feature is a technical foundation, not a production proctoring solution. It can establish Socket.IO signalling, create mediasoup transports, publish a student’s camera/audio tracks, and show monitoring events. It does not yet provide sufficient evidence integrity, privacy governance, fault tolerance, or operational controls.

| Priority | Finding | Evidence | Required remediation |
| --- | --- | --- | --- |
| **P0** | Room membership is based on caller-provided room IDs rather than exam-session authorisation. | `socketServer.js:160-195` | Issue signed, short-lived session/room tokens after the server verifies assignment; reject arbitrary room identifiers. |
| **P0** | Monitoring subscription is unauthorised beyond socket login. | `realtimeMonitoring.js:5-16` | Authorise subscription against exam ownership/assignment; use namespaced private rooms and server-side membership records. |
| **P1** | Camera and microphone are optional operator-controlled previews. | `TakeExam.jsx:295-409,792-815` | If proctoring is required, perform preflight before exam start and enforce a documented policy; otherwise label monitoring as optional. |
| **P1** | Browser events are easy to evade and are not proof of misconduct. | `TakeExam.jsx:160-219` | Treat telemetry as low-confidence signals, keep evidence provenance, require human review, and never automate adverse action from browser events alone. |
| **P1** | “Recording” appears to persist state metadata, not actual audio/video media. | `socketServer.js:389-435`; `RecordingSession` usage | Implement media recording pipeline, encrypted storage, retention/deletion, access control, retrieval audit logs, and consent notice before claiming recording capability. |
| **P1** | Realtime media is single-process and operationally fragile. | `socketServer.js:56-65,92-105`; `services/mediasoupWorker.js` | Run media on dedicated always-on infrastructure with static/public UDP range, TURN credentials, capacity limits, monitoring, redundancy, and a tested failure plan. |
| **P1** | Sensitive identifiers and diagnostic data are written to browser/server logs. | `TakeExam.jsx:325-337`; `socketServer.js:129,137,268` | Remove token fragments and unnecessary personal data from logs; add redaction and retention controls. |
| **P1** | Recording metadata endpoints require only generic authentication. | `routes/recording.js:8-27` | Require session ownership for students and exam ownership/explicit assignment for staff; record every access. |

> **Important:** Remote invigilation should have a privacy notice, consent/alternative assessment process, retention schedule, access-review procedure, staff training, incident response, and a documented human-review policy before any real deployment. The current code does not demonstrate these controls.

## 7. Cross-cutting production gaps

| Priority | Finding | Evidence | Remediation |
| --- | --- | --- | --- |
| **P1** | CORS fails open if `CORS_ORIGINS` is omitted. | `index.js:122-145`; `.env.example:36-47` | Fail startup in production unless an explicit allowlist is configured; do not allow credentials with an implicit all-origin policy. |
| **P1** | User-uploaded files are publicly served and documents may be cached publicly. | `index.js:173-214`; `routes/files.js:37-159` | Store private files outside static paths; use signed, expiring downloads and per-resource authorisation; set `Cache-Control: private, no-store` for sensitive records. |
| **P1** | Realtime and external connections conflict with a restrictive CSP configuration. | `index.js:86-103` | Explicitly allow only required API, WebSocket, storage, and TURN origins; test CSP in staging. |
| **P1** | AI, file upload, exam, and socket flows lack dedicated rate/abuse controls. | Rate limiter is used only on selected auth/verification/form routes. | Add distributed rate limits and quotas keyed by user, session, IP, and exam; add upload/concurrency limits. |
| **P1** | No comprehensive security or exam regression suite exists. | Test inventory found only `kscbackend/tests/aiStreaming.test.js`. | Add unit, API integration, authorisation matrix, browser E2E, media smoke, and load tests; run them in CI before release. |
| **P1** | Production dependencies contain two high-severity audit findings. | `npm audit --omit=dev`: Nodemailer and Sharp. | Upgrade Nodemailer to at least the supplied fixed version `9.0.5` and Sharp to at least `0.35.3`; run regression tests and lock dependencies. |
| **P2** | JWT is a long-lived bearer credential with no demonstrated revocation/device/session control. | `.env.example:21-35`; `requireAuth.js` | Use shorter access tokens, refresh-token rotation or server sessions, logout/revocation, secret rotation, and device/session management. |
| **P2** | Health check reports database availability only. | `index.js:281-288` | Add readiness/liveness checks for database, storage, email, AI providers, Socket.IO/mediasoup, and queue dependencies; alert on SLO breaches. |
| **P2** | Default in-memory rate limiting and in-memory realtime rooms do not scale horizontally. | `middleware/rateLimiter.js`; `socketServer.js:8` | Use Redis or equivalent shared stores for rate limits, Socket.IO adapters, presence, and session coordination. |

## 8. Prioritised remediation plan

| Delivery wave | Objective | Required outcomes |
| --- | --- | --- |
| **Wave 0 — release stop** | Prevent disclosure and assessment compromise. | Close P0 result/exam/upload/room authorisation gaps; remove answer keys from student payloads; enforce server-side exam state and timing; disable live invigilation and high-stakes online exams until done. |
| **Wave 1 — security baseline** | Establish robust controls. | Central resource-authorisation service, signed private storage, strict CORS, auth/session hardening, rate limits, input validation, dependency upgrades, secret management, audit logs. |
| **Wave 2 — examination integrity** | Make examination workflows reliable. | Server-authoritative state machine, autosave/recovery, grading review, test suite, content-versioning, teacher approval/result release flow, accessibility and failure-handling runbooks. |
| **Wave 3 — safe student support** | Turn analytics into governed support. | Permissioned result context, transparent labels, confidence/limitations, teacher/counsellor escalation, consent/data minimisation, evaluation dataset, model/provider governance. |
| **Wave 4 — invigilation operations** | Build a defensible media service. | Dedicated media infrastructure, TURN, signed room tokens, recording pipeline, encryption, retention/deletion, staff access review, monitoring dashboards, load/failure testing, privacy programme. |

## 9. Suggested release policy

The safest near-term release is to keep the **public school website** separate from sensitive workflows. The general assistant may be offered only after provider secrets, rate limits, prompt boundaries, and privacy/data rules are configured. The result portal should remain unavailable until ownership checks are fixed. Online exams and live invigilation should be disabled for real graded use until all Wave 0 and Wave 1 requirements pass in staging and an independent security test confirms the fixes.

## 10. Audit evidence map

| Component | Key reviewed files |
| --- | --- |
| Authentication and roles | `kscbackend/middleware/requireAuth.js`, `middleware/rateLimiter.js` |
| Server and deployment controls | `kscbackend/index.js`, `.env.example`, `services/dbConnection.js` |
| Student results | `routes/results.js`, `utils/performanceAnalysis.js`, `kscfrontend/src/components/StudentResults.jsx` |
| Online exams | `routes/exams.js`, `controllers/examController.js`, models, `kscfrontend/src/components/TakeExam.jsx` |
| Files and evidence | `routes/files.js`, `utils/storage.js` |
| Invigilation | `socketServer.js`, `services/realtimeMonitoring.js`, `services/mediasoupWorker.js`, `routes/recording.js` |
| Test and dependency posture | backend test inventory and `npm audit --omit=dev` |

---

**Bottom line:** Kangaru has a strong functional base, but sensitive student data and assessment features require substantial security and operational hardening. Treat the exam/invigilation capability as a development or controlled-pilot feature, not a production assessment system, until the release blockers are remediated and verified.
