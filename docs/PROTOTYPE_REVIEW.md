# PROTOTYPE REVIEW - RFQ Agent Pilot

Date: 2026-05-07

## Current Verdict

Status: LOCAL PILOT READY, not yet public-production ready.

The project can demonstrate the value proposition locally: a user can process a folder with an email, drawings and workshop config, then review the resulting analysis, quality score, quote, PDF, checklist and email draft in the local manager. The app now includes a per-RFQ professional review flow with executive verdict, grouped risks and progressive technical detail.

## What Works

- Root Next.js manager builds successfully.
- Local RFQ CLI pilot typechecks successfully.
- `rfq-agent-piloto` has 0 production vulnerabilities in `npm audit --omit=dev`.
- The manager shows RFQ history, detail, plan preview, extracted fields, checklist, quote markdown, generated email and safe test-email action.
- The RFQ detail view can review multiple extracted pieces from one RFQ, including source file and PDF page traceability when available.
- Each new RFQ output generates `quality-report.json` and `quality-report.md` with score, verdict, grouped issues, top priorities and suggested customer questions.
- The manager shows compact score/verdict indicators in the RFQ list and a cleaner internal demo detail view split into Resumen, Plano, Piezas, Calidad, Presupuesto and Email.
- The pilot now includes a local editable material price library and deterministic material costing, including estimated weight, EUR/kg, waste, minimum purchase and confidence warnings.
- Local outputs include `analisis.json`, `presupuesto.md`, `presupuesto.html`, `presupuesto.pdf`, `email-respuesta.md`, `revision-checklist.md`, raw LLM output and copied input plans.
- The quote flow keeps the `BORRADOR` and human-review posture.
- The email-to-local-pilot bridge exists: Resend `email.received` can create `rfq-agent-piloto/inbox/` cases and launch the local processor.
- The RFQ dashboard includes a `Simular email entrante` action to test the autonomous bridge without Resend/ngrok.

## Main Risks Before A Real Market Launch

- API keys previously exposed in chat/IDE must be rotated before any deploy.
- Root app still has `npm audit --omit=dev` findings requiring breaking upgrades, mainly Next.js/PostCSS.
- Resend inbound webhook verification is implemented for the local bridge, but still needs a real configured webhook secret and end-to-end Resend test.
- `/api/process-rfq` is intentionally disabled because it belonged to the old cloud path; the active route is the local/inbound flow.
- Cloud storage/database design is deferred; the active pilot stores files locally under `rfq-agent-piloto/`.
- Inbound processing is fire-and-forget instead of a queue with retries and idempotency.
- There is no enforced human approval gate before any final customer send.
- Real benchmark coverage is still too small; one good drawing is not enough evidence for a workshop pilot.
- Quality scoring and material costing are heuristic. They are useful for review triage, but must be calibrated against real estimator feedback and supplier prices.
- PDF multipage handling now asks Gemini to separate pages/pieces, but there is not yet page-to-image rendering or a deterministic CAD/PDF parser.

## Next Professional Steps

1. Rotate all exposed API keys and confirm secrets stay only in ignored `.env.local` files or provider dashboards.
2. Create 10-20 anonymized real RFQ fixtures under `rfq-agent-piloto/fixtures/reales-anonimizados/`.
3. Run fixture benchmarks and record quality score, verdict, extraction quality, missing fields, provider, duration, cost and confidence.
4. Add multipage PDF fixtures that contain two or more drawings in one attachment.
5. Connect Resend Receiving with a public tunnel and test one real `email.received` event end-to-end.
6. Keep `/api/process-rfq` disabled until a future production architecture is explicitly chosen; do not maintain a second processing path.
7. Add a formal review state machine: `recibido`, `procesando`, `revision_humana`, `aprobado`, `enviado`, `bloqueado`, `error_recuperable`.
8. Implement private/signed storage for plans before cloud production.
9. Add a real onboarding screen for `config-taller`: hourly rates, material prices, setup times, subcontractors, payment terms and margins.
10. Keep customer-facing sends disabled until a human estimator explicitly approves the quote.

## Pilot-Ready Acceptance Criteria

The prototype is ready for a trusted workshop pilot when:

- At least 10 anonymized real RFQs have been processed.
- At least 80% produce a useful internal draft.
- 100% of blocked cases explain what to ask the customer.
- Every RFQ has a Quality Gate report with score, verdict and grouped issues.
- A reviewer can understand in 10 seconds whether the RFQ is usable, needs clarifications or is blocked.
- Every quote includes `BORRADOR` until human approval.
- The dashboard can show the original plan, extracted data, missing fields, quote and email draft.
- Multipage PDFs are flagged with page count and every detected piece is visible in the dashboard review.
- Resend test email works only to the configured test recipient.
- No exposed secrets remain active.
- The user can demo the full process in less than 15 minutes from RFQ input to internal draft.

## Recommended Skills For Future Sessions

- `$rfq-project-operator`: use when continuing the project.
- `$rfq-visual-qa`: use for every UI/dashboard change.
- `$rfq-real-case-review`: use for real drawings and extracted quote checks.
- `$rfq-fixture-benchmark`: use to build the anonymized test corpus.
- `$rfq-production-hardening`: use before any deploy, customer pilot or email automation.
