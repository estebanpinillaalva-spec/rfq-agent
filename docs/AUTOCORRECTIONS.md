# AUTOCORRECTIONS - RFQ Agent

Purpose: project memory for mistakes, fixes and operational lessons that should change future Codex behavior. Read this file at the start of every RFQ Agent session before changing code.

## 2026-05-08 - One Agent Source Of Truth

- Symptom: Claude/Codex project files described different historical agents and could reintroduce Supabase, Anthropic/Claude API, OpenAI runtime or the old cloud `/api/process-rfq` path.
- Root cause: `AGENTS.md`, `CLAUDE.md` and README had drifted from the actual local RFQ pilot.
- Correction: make `AGENTS.md` the single operative source of truth, reduce `CLAUDE.md` to a bridge that points to it, and mark old docs as historical when needed.
- Future rule: before implementing architecture changes, read `AGENTS.md` first; if any other document contradicts it, update or mark that document as historical instead of following the old path.

## 2026-05-08 - Material Library Version Must Be Backward Compatible

- Symptom: inbound emails arrived and Gemini completed validation/analysis, but every process failed in `PASO 3: Generando presupuesto` with `expected "1.0", received "1.1"` at `version`.
- Root cause: `rfq-agent-piloto/config/materiales.json` was upgraded to `version: "1.1"` while both the pilot and app material schemas only accepted literal `"1.0"`.
- Correction: accept material library versions `"1.0"` and `"1.1"` in both `rfq-agent-piloto/src/types.ts` and `src/lib/material-store.ts`.
- Future rule: when bumping local config/data versions, update readers before or with the data file, then rerun an inbound email fixture through the real `/api/local/inbox/[id]/process` path.

## 2026-05-08 - Dashboard Cleanup Must Archive The View, Not Delete Data

- Symptom: the RFQ board kept accumulating test requests until the screen became noisy.
- Root cause: the dashboard listed every local `salidas/` and pending `inbox/` folder forever.
- Correction: add a `Limpiar pantalla` action that stores hidden IDs in `rfq-agent-piloto/.dashboard-view.json` and filters them from the board; add `Restaurar ocultos` to bring them back.
- Future rule: UI cleanup actions should hide/archive local records by default. Do not delete RFQ folders, inboxes, PDFs or outputs unless the user explicitly asks for destructive cleanup.

## 2026-05-08 - Gemini Quota Should Not Block Local Demo Review

- Symptom: retrying an inbound Gmail with Gemini could fail with `429 Too Many Requests`, leaving the RFQ in recoverable error even though the local demo could still produce a draft.
- Root cause: free-tier Gemini quota is unstable during repeated tests, and the retry path treated quota exhaustion like a hard processing failure.
- Correction: detect Gemini quota errors and automatically start a mock fallback for inbound/background processing; synchronous local processing also falls back to mock when Gemini is quota-blocked.
- Future rule: when the provider is Gemini and the error is quota/rate-limit, keep the RFQ visible and generate a clearly local/mock draft rather than making the user lose the workflow.

## 2026-05-08 - Background Processing Must Notify And Open The Result

- Symptom: simulated or retried inbound RFQs started correctly, but the UI told the user to wait and refresh manually.
- Root cause: background processing returned a PID immediately and the dashboard did not poll for the matching generated output.
- Correction: after starting an inbox process from the dashboard, poll `/api/local/rfqs`, show progress text, and open the generated RFQ detail automatically when the output appears. For local simulated emails, pass the selected provider so `mock` tests do not burn Gemini quota.
- Future rule: actions that launch background RFQ processing should either open the finished RFQ automatically or show a final, visible completion/error state without requiring manual refresh. Demo/simulation actions must honor the selected provider.

## 2026-05-09 - Pilot Runtime Must Stay CommonJS-Compatible

- Symptom: pressing/retrying process from the app failed immediately and `process.log` showed `TS1343: The 'import.meta' meta-property is only allowed...`.
- Root cause: the app launches the pilot with `process.execPath -r ts-node/register`, which is the stable Windows/CommonJS path, but `rfq-agent-piloto/src/utils/guardarSalida.ts` used `import.meta.url`.
- Correction: remove `import.meta` from the pilot runtime path and derive the pilot root from the process working directory, which the app already sets to `rfq-agent-piloto`.
- Future rule: do not use ESM-only runtime features in pilot files loaded by `ts-node/register`; if an ESM feature is needed, change the launcher and tsconfig together and retest inbound processing.

## 2026-05-09 - Test Email Route Must Use The Stable Pilot Launcher

- Symptom: the pilot could generate `email-respuesta.md` and `presupuesto.pdf`, but the dashboard test-send route still used `npm.cmd`, risking Windows `spawnSync` failures.
- Root cause: the send-test API had not been migrated with the processing APIs to the direct Node launcher.
- Correction: launch `src/scripts/sendTestEmail.ts` with `process.execPath -r ts-node/register` from `rfq-agent-piloto`.
- Future rule: every app route that executes pilot scripts should use the same stable direct Node launcher, not `npm.cmd`.

## 2026-05-09 - Quality Gate Must Not Turn Every Clarification Into A Hard Block

- Symptom: a real RFQ was technically extracted and quoted as a draft, but the dashboard showed Quality Gate `0/100` and `NO_PROCESABLE`.
- Root cause: every `blocking_reasons` entry from validation, analysis and budget was promoted to `CRITICO`, even when validation was only `DUDOSO` and the drawing had usable material, dimensions, tolerances and operations.
- Correction: classify declared blockers by context. Missing/corrupt drawings remain critical, while inferred material, scale, revision, finish and similar review points become `AVISO` unless the extracted data is actually absent. Single-piece RFQs may use a positive generic quantity as inferred quantity.
- Future rule: `NO_PROCESABLE` is only for truly unusable RFQs or real critical blockers; useful technical drafts with uncertainties should be `ACLARACIONES_NECESARIAS`.

## 2026-05-06 - Resend Receiving Is Not Sending Email

- Symptom: user tried to send RFQ email to `onboarding@resend.dev` or literal `<anything>@...`.
- Root cause: `onboarding@resend.dev` is only for outbound test sending. Receiving needs a Resend Receiving domain/address. `<anything>` is a placeholder, not literal text.
- Correction: use a real local part, for example `rfq@taleclaroi.resend.app`, and confirm the domain exists in Resend Receiving.
- Future rule: when user asks where to send email, explicitly distinguish Resend Sending vs Receiving.

## 2026-05-06 - Resend SDK Version Too Old

- Symptom: installed `resend@3.5.0` lacked `emails.receiving` and `webhooks.verify`.
- Root cause: older SDK did not expose modern Receiving APIs.
- Correction: root app upgraded to `resend@^6.12.3`.
- Future rule: before implementing Resend Receiving, verify SDK has `resend.emails.receiving` and `resend.webhooks.verify`.

## 2026-05-06 - Webhook Payload Does Not Include Full Email Body

- Symptom: original webhook implementation expected email body and attachments directly in webhook payload.
- Root cause: modern Resend `email.received` webhook contains metadata; full email and attachments must be fetched with Receiving API.
- Correction: `/api/inbound-email` verifies webhook, then calls `resend.emails.receiving.get(emailId)` and Receiving attachment endpoints.
- Future rule: never assume inbound webhook contains full RFQ contents.

## 2026-05-06 - Windows Spawn With npm.cmd Can Fail

- Symptom: local inbound simulation returned `spawn EINVAL`.
- Root cause: spawning `npm.cmd` with detached/log FD handling on Windows and paths with spaces was unreliable.
- Correction: launch the pilot directly with `process.execPath -r ts-node/register src/index.ts <inboxPath>`.
- Future rule: for pilot execution from the app on Windows, avoid `npm.cmd` if direct Node invocation is available. Keep synchronous local processing and background inbox processing on the same `process.execPath -r ts-node/register` pattern.

## 2026-05-06 - Next Typecheck Can Fail Before Build Regenerates .next Types

- Symptom: `tsc --noEmit` reported missing files under `.next/types/...` after adding/removing App Router routes.
- Root cause: stale `.next` generated types.
- Correction: run `npm.cmd run build`, then repeat `npm.cmd run typecheck`.
- Future rule: if `.next/types` missing-file errors appear after route changes, build once before treating it as a code error.

## 2026-05-06 - Need Persistent Webhook Debug Logs

- Symptom: ngrok showed `POST /api/inbound-email 500`, but terminal output was not enough to diagnose after the fact.
- Root cause: webhook errors were only logged to console.
- Correction: `/api/inbound-email` writes JSONL debug events and last-error files under `rfq-agent-piloto/inbound-debug/`.
- Future rule: for external webhook work, always persist minimal debug artifacts locally, without secrets.

## 2026-05-06 - Resend API Key Restricted To Sending

- Symptom: ngrok showed `POST /api/inbound-email 500`; inbound debug said `This API key is restricted to only send emails`.
- Root cause: the configured `RESEND_API_KEY` had permission only for outbound sending, so the app could not call `resend.emails.receiving.get()` or download attachments.
- Correction: create a new Resend API key with Full access, or at minimum permissions that include Receiving read/access, and put it in root `.env.local`.
- Future rule: when configuring Resend Receiving, explicitly require a key that can read received emails and attachments, not just send email.

## 2026-05-06 - Visual QA Caught Stale/Unstyled App

- Symptom: screenshot showed unstyled HTML while page content existed.
- Root cause: old dev server/stale `.next` assets.
- Correction: restart local dev server and recapture screenshots.
- Future rule: after frontend changes, always verify desktop and mobile screenshots via localhost.

## 2026-05-08 - Next Server Error From Stale Chunks

- Symptom: browser showed `Server Error` with messages like `Cannot find module './92.js'` from `.next/server/webpack-runtime.js`.
- Root cause: a dev server kept running while `.next` had been rebuilt/changed, leaving stale chunk references.
- Correction: stop all project Node/Next processes, remove only the generated `.next` folder after path verification, then start dev again.
- Future rule: after `npm run build` or frontend/dashboard changes, use `npm.cmd run dev:clean` before browser QA instead of relying on the old hot-reload server.

## 2026-05-08 - Inbound Email Can Fail From Gemini Free Quota

- Symptom: email arrived and attachment was saved, but the RFQ stayed as recoverable error instead of producing a quote.
- Root cause: Gemini returned `429 Too Many Requests` because the free-tier daily request quota was exhausted.
- Correction: keep the inbox visible with provider/message, add local retry actions for `mock` and `gemini`, and provide an API to relaunch processing from the same inbox folder.
- Future rule: when inbound processing fails, inspect `rfq-agent-piloto/inbox/{id}/process-status.json` and `process.log`; quota failures should be treated as retryable, not as lost emails.

## 2026-05-08 - RFQ Names Must Preserve Email Identity

- Symptom: processed RFQs were hard to match back to the original email because the UI showed generic IDs like `RFQ-2026-255`.
- Root cause: the pilot output kept the AI/internal reference but did not preserve the source email as display metadata.
- Correction: save the original `email.txt` in each output's `raw/email.txt`, derive display labels from date, subject and sender, and fall back to linked inbox email for older outputs.
- Future rule: every email-native RFQ card should show at least subject, sender and received date; internal RFQ IDs are secondary.

## 2026-05-08 - Duplicate Dev Servers Can Make The Frontend Look Lost

- Symptom: the app appeared visually reset/desconfigured even though the latest feature files still existed.
- Root cause: multiple Next dev processes were running for the same project, and a stale server/cache served a mismatched frontend.
- Correction: stop every project Node/Next process, remove generated `.next` after path verification, restart dev cleanly, then verify with screenshots.
- Future rule: before diagnosing a "lost frontend" as code loss, check duplicate `node.exe` processes for the project and run the clean restart workflow.

## 2026-05-06 - PDF Multipagina Is Not One Piece

- Symptom: the pilot could accept a PDF with several pages, but downstream review summarized only the first extracted piece.
- Root cause: the app assumed `analisis.piezas[0]` was enough for plan review, and PDF metadata did not expose page count.
- Correction: store PDF `page_count`, prompt Gemini to analyze multipage PDFs page by page, add piece traceability fields, and show all extracted pieces in the RFQ manager.
- Future rule: when an RFQ includes a multipage PDF, treat every page as a possible independent drawing until the analysis proves otherwise.

## 2026-05-07 - Inbound RFQs Need Visible Processing State

- Symptom: Resend webhook created `rfq-agent-piloto/inbox/...`, but the RFQ did not appear in the app until the background pilot finished; if the process was stopped, it looked like the email had not been detected.
- Root cause: the dashboard only listed `salidas/`, and the background process wrote no per-inbox status or log.
- Correction: list pending inbox folders as `PROCESANDO`, add `process-status.json` and `process.log` for inbound jobs, and keep them visible until a matching `salidas/` folder exists.
- Future rule: every external email must create a visible received/processing record before starting expensive AI work.

## 2026-05-07 - Gemini Can Return Null For Optional Text

- Symptom: a real PDF validation failed because Gemini returned `email_sugerido: null` instead of a string.
- Root cause: schema was strict about a field that can legitimately be empty.
- Correction: normalize nullable `email_sugerido` to an empty string while keeping the rest of the validation strict.
- Future rule: fields used as optional prose may accept `null` and normalize safely, but technical extraction fields should remain strict unless a real failure proves otherwise.

## 2026-05-07 - Material Codes Can Be Read But Not Promoted

- Symptom: Gemini read cajetin/title-block text such as `F-1120`, `F-1280` and `C-6440`, but still returned `material: null` or `No especificado`.
- Root cause: the model treated the material code as loose cajetin text instead of promoting it to the structured `material` field.
- Correction: add exhaustive source fields and deterministic postprocessing that extracts common material codes from cajetin/notas when `material` is missing, while marking the source as inferred from title block.
- Future rule: for critical quote fields, combine LLM extraction with deterministic postprocessors and explicit evidence fields.

## 2026-05-07 - Do Not Overblock Useful Drafts

- Symptom: Gemini sometimes marked a multipage PDF as `NO_PROCESABLE` because quantities, material, tolerances or some title-block fields were unclear, even though the plans were useful for an internal draft.
- Root cause: validation confused "not enough for final quote" with "not enough for internal draft".
- Correction: if a 2D plan exists and is not totally unreadable/corrupt, downgrade excessive `NO_PROCESABLE` to `DUDOSO` and keep human review/blocking reasons.
- Future rule: reserve `NO_PROCESABLE` for missing 2D drawings, corrupt files, or totally unreadable drawings; use `DUDOSO` for useful but incomplete RFQs.

## 2026-05-07 - Gemini Free Tier Quota Is A Real Test Constraint

- Symptom: repeated real PDF tests hit `429 Too Many Requests` for Gemini free-tier daily request quota.
- Root cause: exhaustive validation/analysis/quote uses several model calls per RFQ, and repeated reruns burn quota quickly.
- Correction: use `mock` for UI/regression checks and reserve Gemini calls for final extraction tests; build a fixture benchmark that can run selectively.
- Future rule: before rerunning a large RFQ several times, check whether code changes affect LLM calls or only UI/postprocessing.

## 2026-05-07 - RFQ Review Must Not Become An Alert Wall

- Symptom: plan errors, missing fields and DFM notes could accumulate as repeated red chips in the RFQ detail view.
- Root cause: the UI exposed raw extraction arrays directly instead of prioritizing and grouping review work.
- Correction: generate a `quality-report.json` per RFQ, group issues by commercial data, title block, manufacturing, DFM and cost/deadline, and show only top-priority issues first.
- Future rule: every professional RFQ review view needs an executive verdict, score, grouped risks and progressive technical detail before exposing raw extraction lists.

## 2026-05-07 - Do Not Let The LLM Invent Material Prices

- Symptom: quote totals could look plausible while material cost was a fixed mock value or model-generated.
- Root cause: extraction and costing were coupled; the AI could influence price without a local source of truth.
- Correction: add a local editable material library and deterministic costing engine; Gemini extracts technical facts, but local workshop data drives material cost.
- Future rule: prices used in RFQ quotes must be traceable to local config/material data, with warnings when stale, missing or low-confidence.
