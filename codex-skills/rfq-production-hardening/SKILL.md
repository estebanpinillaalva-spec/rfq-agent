---
name: rfq-production-hardening
description: Use this skill when preparing the RFQ Agent for production, real workshop pilots, Resend inbound email, Supabase, Vercel, storage security, webhooks, queues, observability, costs, API keys, deployment, or market launch readiness.
---

# RFQ Production Hardening

## Priority

The product must stay safe before it is automated. A wrong quote sent to a customer is worse than a blocked RFQ with a clear explanation.

## Hardening Checklist

Before public or customer-facing use:

- Read `docs/AUTOCORRECTIONS.md` and check whether a known previous failure applies.
- Rotate any API keys exposed in chat, screenshots, files, or IDE tabs.
- Keep `.env.local` ignored and never print secrets in responses.
- Implement real Resend/Svix webhook signature verification.
- Make Supabase Storage private or use signed URLs, not public plan URLs.
- Add idempotency for inbound emails and RFQ processing.
- Replace fire-and-forget processing with a queue/background job and retries.
- Validate all LLM JSON with Zod and parse markdown-wrapped JSON defensively.
- Store raw LLM responses, usage, cost, duration, and errors.
- Require human approval before sending final customer quotes.
- Add audit events for received, validated, processed, quoted, reviewed, sent, failed.
- Track provider/model and estimated cost per RFQ.
- Add rate limits and max attachment size.
- Run `npm audit --omit=dev` and handle root vulnerabilities before public deploy.

## Production Readiness Verdict

Use these labels:

- `LOCAL PILOT READY`: safe for demos on local/test data.
- `PRIVATE WORKSHOP PILOT READY`: safe with one trusted workshop and human review.
- `PUBLIC PRODUCTION READY`: safe for real traffic and multiple customers.

Do not call the project public-production ready while webhook signatures, private storage, queueing, and human approval are missing.
