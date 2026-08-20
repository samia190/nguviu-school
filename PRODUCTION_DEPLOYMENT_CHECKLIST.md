# Kangaru Production Deployment Checklist

This checklist applies to the hardened original Kangaru project. It preserves the existing website interface while defining the minimum environment and operating controls required for sensitive student functions.

| Area | Required before production enablement |
| --- | --- |
| Database and secrets | Use a managed MongoDB deployment with backups, network restrictions, a non-placeholder `MONGO_URI`, and a rotated `JWT_SECRET` of at least 48 random characters. |
| Origins and TLS | Set explicit HTTPS `CORS_ORIGINS` and `PUBLIC_ORIGIN`. Do not use wildcard CORS with credentials. |
| Private storage | Configure Cloudinary or S3 for application files. Keep `SERVE_LOCAL_UPLOADS=false`; assessment evidence and recordings must not be public static files. |
| AI providers | Configure one or more server-only keys for Groq, OpenRouter, or NVIDIA. Set approved model identifiers and `AI_PROVIDER_ORDER`; no key belongs in the frontend build. |
| Student results | Enable only after ownership, result-publication, and assistant-context tests pass against the production database schema. |
| Online exams | Enable only after course enrolments, scheduled windows, attempt rules, question projections, autosave, submission recovery, and access matrix tests pass. |
| Live invigilation | Run on persistent infrastructure, not a stateless request-only service. Configure TURN, private media storage, monitoring, capacity limits, and retention/access-review procedures. |
| Recording | Leave disabled until a real encrypted media-recording pipeline, immutable storage key, retention schedule, and authorised retrieval controls are deployed. Metadata alone is not a recording system. |
| Observability | Send structured logs and alerts to a managed monitoring service. Alert on database failure, auth errors, provider failure/circuit opening, exam submit failures, socket/media failures, storage errors, and unusual access patterns. |
| Account activation | Configure `RESEND_API_KEY` and a verified sender before importing accounts or reissuing activation links. Back up the database, run `node scripts/backfill-directory-identities.mjs` in staging, and review School Directory totals before enforcing verified-directory access for existing users. |
| Optional identity providers | Keep `ENABLE_GOOGLE_SIGN_IN=false` and `ENABLE_PHONE_OTP=false` unless the matching complete school-controlled provider configuration is supplied. Production validation fails closed if either enabled integration is incomplete. |
| Release process | Require code review, dependency audit, backend tests, frontend build, migration backup, staging smoke test, rollback plan, and a signed release record. |

> Live invigilation is an always-on realtime media workload. It requires a persistent runtime with adequate CPU/network capacity, a public UDP/TCP media range, TURN service, monitoring, and tested recovery. Do not run the feature as a stateless autoscaling HTTP-only process.
