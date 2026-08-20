# Kangaru Production Hardening Status

## Scope and outcome

The original Kangaru website interface, public routes, navigation, and non-sensitive content modules remain unchanged. The remediation work targeted the existing student-results support, AI service, online exam, evidence upload, invigilation, recording, realtime, and server-production paths.

| Area | Implemented remediation |
| --- | --- |
| Student results | Replaced browser-supplied student identity verification with JWT-derived student ownership; added a published-only and minimised result-context service. |
| Results AI support | Added a student-only streamed endpoint that derives context on the server, limits it to learning support, and forbids diagnosis, peer disclosure, or consequential decisions. |
| AI providers | Added server-only Groq, OpenRouter, and NVIDIA-compatible priority fallback, request timeout, model output bound, rate limit, and per-model circuit breaker. |
| Exam content | Replaced public exam content delivery with authenticated, enrolment-checked delivery; student projections strip answer keys and explanations. |
| Exam sessions | Added server-computed expiry, attempt numbers, answer versioning, server-side availability checks, autosave, input validation, and idempotent final submission. |
| Exam evidence | Requires authentication and binds uploads to the signed-in student’s active exam session; client metadata no longer controls student, exam, or session assignment. |
| Exam results | Restricts students to their own results and teachers to results for exams they own. |
| Invigilation | Authorizes Socket.IO room/media actions against a real session and the assigned exam manager; browser telemetry is session-owned and server-classified. |
| Monitoring and recordings | Restricts subscriptions, session details, alerts, acknowledgement, and recording metadata to authorised exam staff; recording stays disabled without configured secure storage. |
| Deployment | Production startup fails without explicit CORS and essential private storage/database/JWT configuration; local sensitive-file serving is disabled by default. |
| Dependencies and validation | Upgraded Sharp and Nodemailer to audit-fixed versions; backend syntax checks, five regression tests, production dependency audit, and frontend build completed successfully. |

## Validation completed

| Validation | Result |
| --- | --- |
| Backend syntax checks for hardened modules | Passed. |
| Node regression suite | Passed: 5 tests. |
| Production dependency audit | Passed: 0 vulnerabilities reported. |
| Original frontend production build | Passed. |

## Required release actions

The code is hardened, but production readiness still requires real infrastructure and operational execution. These prerequisites cannot safely be fabricated in source code.

1. Back up the production database, run `node scripts/migrate-production-exam-sessions.mjs` as a dry run, then run it with `--apply --sync-indexes` in a maintenance window. Resolve any reported duplicate result-session groups before index creation.
2. Configure non-placeholder `MONGO_URI`, `JWT_SECRET`, HTTPS `CORS_ORIGINS`, private Cloudinary/S3 storage, and at least one server-side AI provider credential. Use the revised `.env.example` as the contract; never place these values in frontend assets.
3. Keep `ENABLE_LIVE_INVIGILATION=false` until a persistent realtime runtime, TURN service, secure media-recording storage, retention policy, access review, monitoring, and capacity/load test are operational. The code now fails closed for recording storage, but it does not manufacture a compliant media-recording service.
4. Run staging end-to-end tests with real role accounts for student, teacher, administrator, and unauthorised users. Cover answer-key non-disclosure, cross-student access denial, session expiry, duplicate submit, network recovery, evidence upload rejection, socket room denial, and recording access denial.
5. Configure structured logs, alerting, backups, secret rotation, incident response, and a teacher review policy before using results support or invigilation with real students.

> **Release status:** The application code is substantially hardened and passes static/build/test validation. Do not declare live invigilation or recording production-ready until the external runtime, TURN, private storage, privacy controls, and staging load tests are completed.
