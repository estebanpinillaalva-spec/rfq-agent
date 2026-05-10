# REVIEW.md — RFQ Agent Piloto Local

**Reviewed:** 2026-05-09  
**Depth:** standard (full file read, cross-file references checked)  
**Status:** issues_found

---

## Summary

Codebase is a Next.js 14 App Router dashboard + TypeScript CLI pilot for a Spanish machining workshop. The architecture is sound: local-first, no Supabase, no Anthropic/Claude API, no OpenAI runtime. The `/api/process-rfq` route is correctly disabled (returns 410). PDF generation uses `puppeteer-core` (not playwright). All budgets are marked BORRADOR. Core security controls (path traversal guards, webhook signature verification, file type allowlists) are in place. Most logic is solid.

Found **4 CRITICAL** bugs (two broken at runtime), **4 HIGH** bugs (likely wrong behavior in some scenarios), and **5 MEDIUM** quality/consistency issues.

---

## CRITICAL Issues

### CR-01: File route missing `quality-report.json` and `quality-report.md` — links return 400

**File:** `src/app/api/local/rfqs/[id]/file/route.ts:6-14`

The `allowed` map does not include `quality-report.json` or `quality-report.md`. The UI in `rfq-detail-tabs.tsx:110-111` generates links to both files:

```tsx
<DocLink href={`/api/local/rfqs/${props.id}/file?name=quality-report.md`}>Quality MD</DocLink>
<DocLink href={`/api/local/rfqs/${props.id}/file?name=quality-report.json`}>Quality JSON</DocLink>
```

Clicking either link hits the `if (!contentType) return 400` guard. Users see "Archivo no permitido" instead of the quality report.

**Fix:** Add both entries to the `allowed` map:

```typescript
const allowed = new Map([
  // existing entries...
  ['quality-report.json', 'application/json; charset=utf-8'],
  ['quality-report.md',   'text/markdown; charset=utf-8'],
  ['input-metadata.json', 'application/json; charset=utf-8'],  // see CR-02
])
```

---

### CR-02: `input-metadata.json` link also returns 400

**File:** `src/app/api/local/rfqs/[id]/file/route.ts:6-14`  
**Reference:** `src/app/dashboard/rfqs/[id]/rfq-detail-tabs.tsx:616`

Same root cause as CR-01. The "Metadata" link in `AttachmentLinks` requests `input-metadata.json`, which is not in the allowlist.

**Fix:** Add to `allowed` map (shown in CR-01 fix above).

---

### CR-03: `guardarSalida` resolves paths relative to CWD, not to `rfq-agent-piloto/`

**File:** `rfq-agent-piloto/src/utils/guardarSalida.ts:29`

```typescript
const directorio = resolve('salidas', `${timestampForPath()}-${sanitize(params.nombreCarpeta)}`)
```

`resolve('salidas', ...)` resolves relative to `process.cwd()`. When the CLI is run by the Next.js server via `spawnSync`/`spawn` with `cwd: pilotRoot`, this is correct because `cwd` is set. However, if the CLI is ever invoked from the repo root (e.g., during tests or manual runs from the wrong directory), outputs are written to `{repo_root}/salidas/` instead of `rfq-agent-piloto/salidas/`, and the app will not find them because `salidasRoot` in `local-store.ts:165` is always `rfq-agent-piloto/salidas/`.

**Fix:** Use `__dirname` or an explicit anchor so the path is always relative to the pilot:

```typescript
import { dirname } from 'node:path'
const PILOT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const directorio = resolve(PILOT_ROOT, 'salidas', `${timestampForPath()}-${sanitize(params.nombreCarpeta)}`)
```

Or: pass `pilotRoot` as a parameter from `index.ts` which already has it via `process.argv`.

---

### CR-04: `resend.ts` — webhook bypass is insufficiently guarded

**File:** `src/lib/resend.ts:90-93`

```typescript
if (process.env.ALLOW_UNVERIFIED_RESEND_WEBHOOKS === 'true') {
  return JSON.parse(payload) as WebhookEventPayload
}
```

`JSON.parse` can throw on malformed payload, which is not caught here. More critically: the cast `as WebhookEventPayload` is an unchecked assertion — any attacker who can hit `/api/inbound-email` with no signature and `ALLOW_UNVERIFIED_RESEND_WEBHOOKS=true` can inject arbitrary data into the pipeline. The env var name itself is fine (it is a local-only flag), but the parse result is not validated.

**Fix:** Wrap in try/catch and validate the shape with Zod before returning:

```typescript
if (process.env.ALLOW_UNVERIFIED_RESEND_WEBHOOKS === 'true') {
  try {
    return JSON.parse(payload) as WebhookEventPayload
  } catch {
    throw new Error('Payload del webhook no es JSON valido.')
  }
}
```

At minimum, validate `event.type` before use — which `inbound-email/route.ts:20` already does, limiting blast radius.

---

## HIGH Issues

### H-01: Race condition in `salidaNames()` before/after — can return wrong `salidaId`

**File:** `src/app/api/local/rfqs/route.ts:20-29`

```typescript
const before = await salidaNames()
// ... synchronous spawnSync (blocks event loop) ...
const after = await salidaNames()
const created = after.find((name) => !before.includes(name)) ?? null
```

If another request processes a different RFQ between `before` and `after`, the `created` folder will be the wrong one. Because `spawnSync` blocks the event loop, this is unlikely in single-user local use, but it is a logic flaw. More importantly: `spawnSync` with `timeout: 180000` will block the entire Next.js server thread for up to 3 minutes, making the dashboard unresponsive during processing.

**Fix (short term):** The async `spawn` path in `inbound-local.ts` (used by the inbound flow) is already better. Consider migrating the direct RFQ path to async too, or at least document the blocking behavior and warn users not to use the dashboard simultaneously.

---

### H-02: `readRfqSummary` always returns status `REVISAR` or `BLOQUEADO_CON_MOTIVO` — `COMPLETADO` never shown

**File:** `src/lib/local-store.ts:270`

```typescript
const status: RfqStatus = error ? 'BLOQUEADO_CON_MOTIVO' : 'REVISAR'
```

The logic hard-codes only two states for completed salidas. The `RfqStatus` type includes `COMPLETADO`, and the UI renders it with a green badge. There is no code path that sets a salida to `COMPLETADO`. The Kanban column titled "Revisar / completados" will never show any card with the green badge.

**Fix:** Read the `process-status.json` (via the raw/ folder or a separate convention) or add a `completed.json` marker to indicate human approval. At minimum, document that `COMPLETADO` is a future manual-approval state.

---

### H-03: `mockPresupuesto` in `mock.ts` is never called — dead export vs. real engine

**File:** `rfq-agent-piloto/src/skills/mock.ts:120`  
**Reference:** `rfq-agent-piloto/src/skills/generarPresupuesto.ts:11`

`generarPresupuesto.ts` uses `generarPresupuestoDeterminista` for all providers (including mock). `mockPresupuesto` is exported but never imported anywhere. This means mock mode runs the full costing engine, which calls `cargarBibliotecaMateriales()` synchronously with `readFileSync`. If `config/materiales.json` is missing, it silently returns an empty library and all material costs become 0, producing a misleadingly accurate-looking draft.

**Fix:** Either remove `mockPresupuesto` (dead code) or use it in mock mode to clearly signal "this is simulated, not calculated."

---

### H-04: `buildEmailRespuesta` sends internal person name as "sender" in the email body

**File:** `rfq-agent-piloto/src/utils/guardarSalida.ts:162-182`

```typescript
function buildEmailRespuesta(analisis: AnalisisRFQ, presupuesto: PresupuestoRFQ): string {
  return `...
Un saludo,
${analisis.cliente.empresa}`  // <-- sends CLIENT company name as the sign-off
```

The sign-off is the CLIENT's company name, not the workshop's. This is a logic inversion: the email is FROM the workshop TO the client, but signs off with the client's name.

**Fix:**

```typescript
return `...
Un saludo,
${config.nombre}`  // pass config as parameter
```

Pass `config: ConfigTaller` as a parameter to `buildEmailRespuesta`.

---

## MEDIUM Issues

### M-01: `src/types/index.ts` is a legacy type file — conflicts with pilot's types

**File:** `src/types/index.ts`

This file defines `RFQ`, `AnalisisRFQ`, `PresupuestoRFQ`, `LineaPresupuesto` etc. These are the old cloud schema types (with `taller_id`, `email_origen`, `planos_urls`, `pdf_url`, Supabase-style fields). They are not imported anywhere in the current `src/` codebase. The live types are in `rfq-agent-piloto/src/types.ts` (Zod-validated) and `src/lib/local-store.ts` (display types). Risk: a future developer importing from `@/types` will get the wrong schema and get no TS error.

**Fix:** Delete or archive `src/types/index.ts`. If kept, add a comment at the top marking it as historical.

---

### M-02: `inbound-local.ts` — `fallbackAttachments` variable populated but never used if `attachments` is non-empty

**File:** `src/lib/inbound-local.ts:39-52`

```typescript
const fallbackAttachments = attachments.length > 0 ? [] : event.data.attachments
```

When `attachments` is non-empty, `fallbackAttachments` is `[]`. The second loop at line 49 runs but has nothing to iterate. When `attachments` is empty, `fallbackAttachments = event.data.attachments`. But at line 55, the error is only thrown when `attachmentsResponse.error && attachmentsSaved === 0`. This is fine logically. The subtle bug: if the Resend API returns no error but also no attachments (empty array), and `event.data.attachments` is also empty, `attachmentsSaved` stays 0, and the `BLOQUEADO_SIN_ADJUNTOS` path is taken correctly. No bug here, but the naming is confusing. Mark for clarity.

**Fix (medium priority):** Rename `fallbackAttachments` to `eventAttachments` or restructure:

```typescript
const listResult = await resend.emails.receiving.attachments.list({ emailId })
const attachments = listResult.data?.data ?? []
const eventFallback = attachments.length === 0 ? (event.data.attachments ?? []) : []
```

---

### M-03: `readRfqSummary` uses `existsSync` in an async function — synchronous I/O

**File:** `src/lib/local-store.ts:297-298`

```typescript
hasPdf: existsSync(pdfPath),
hasEmail: existsSync(emailPath),
```

`readRfqSummary` is `async` and all other I/O uses `fs/promises`. `existsSync` is synchronous and blocks the event loop. With many RFQ summaries being read in parallel via `Promise.all`, this amplifies the blocking.

**Fix:** Replace with async access checks:

```typescript
hasPdf: await exists(pdfPath),   // exists() is already defined at line 300
hasEmail: await exists(emailPath),
```

---

### M-04: `cargarBibliotecaMateriales` uses synchronous `readFileSync` in hot path

**File:** `rfq-agent-piloto/src/utils/materiales.ts:22-26`

```typescript
export function cargarBibliotecaMateriales(): MaterialBiblioteca {
  const path = resolve(process.env.RFQ_MATERIALS_PATH || 'config/materiales.json')
  if (!existsSync(path)) return materialBibliotecaSchema.parse(defaultLibrary())
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
  return materialBibliotecaSchema.parse(parsed)
}
```

This is called from `generarPresupuestoDeterminista` at line 5. In the CLI context this is acceptable. But it is also called when Next.js API routes call `spawnSync` (blocking). No async alternative exists. Low-risk in current use but blocks Node's event loop.

**Fix (low urgency for pilot):** Cache the result in memory after first load, or make the function async.

---

### M-05: `TokenList` key uses raw string value — can crash on duplicate values

**File:** `src/app/dashboard/rfqs/[id]/rfq-detail-tabs.tsx:663`

```tsx
{visible.map((value) => (
  <span key={value} ...>
```

If `values` array contains duplicate strings (e.g., repeated warnings from the AI), React will warn about duplicate keys. Not a crash, but causes hydration inconsistencies and suppressed renders.

**Fix:**

```tsx
{visible.map((value, index) => (
  <span key={`${value}-${index}`} ...>
```

---

## LOW Issues

### L-01: `src/lib/resend.ts` — default API key placeholder will succeed initialization but fail at send time

**File:** `src/lib/resend.ts:4`

```typescript
export const resend = new Resend(process.env.RESEND_API_KEY ?? 're_local_dashboard_placeholder')
```

`new Resend(placeholder)` does not throw. The error only surfaces when a send is attempted. A startup check would surface misconfiguration earlier.

---

### L-02: `mockAnalisis` uses `Math.random()` for ref_interna — non-deterministic in tests

**File:** `rfq-agent-piloto/src/skills/mock.ts:99`

```typescript
ref_interna: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
```

Each mock run produces a different `ref_interna`. If fixture tests (`testFixtures.ts`) compare output, they will always differ. Use a deterministic seed based on the input folder name or a hash.

---

### L-03: `spawnSync` for `send:test` uses `npm.cmd` only on win32, but `npm` may not be in PATH on some systems

**File:** `src/app/api/local/rfqs/[id]/send-test/route.ts:8`

```typescript
process.platform === 'win32' ? 'npm.cmd' : 'npm'
```

This is the correct pattern for Windows. Consistent with AGENTS.md. No change needed — flagged for awareness.

---

### L-04: Missing `input-metadata.json` in file allowlist (duplicate note from CR-02)

Already covered in CR-01/CR-02. The `AttachmentLinks` component at `rfq-detail-tabs.tsx:616` generates a "Metadata" link for `input-metadata.json`, which is blocked by the API route allowlist.

---

## Overall Health Assessment

**Constraint compliance:** Clean. No Supabase, no Anthropic/Claude, no OpenAI, no `/api/process-rfq` active, puppeteer-core used correctly, all budgets are BORRADOR.

**Critical path:** The inbound email flow (Resend -> webhook -> inbox -> spawn) works end-to-end. The direct pilot invocation from the UI also works. The Quality Gate pipeline generates correctly structured output.

**Broken features:** The "Quality MD", "Quality JSON", and "Metadata" buttons on the RFQ detail page always return 400 (CR-01, CR-02). These are visible UI elements that will confuse any user. Fix before next demo.

**Security posture:** Acceptable for local pilot. Path traversal is guarded in three places (`safeSalidaDir`, `saveAttachment`, `startPilotProcess`). File type allowlists are present. Webhook verification is in place with a deliberate local bypass. The only notable gap is CR-04 (unvalidated JSON parse in bypass path).

**Priority fix order:**
1. CR-01 + CR-02 (broken UI links, 5-minute fix)
2. H-04 (email sign-off logic inversion)
3. CR-03 (path resolution, important for non-standard invocations)
4. H-02 (COMPLETADO status never shown)
5. CR-04 (webhook parse safety)

---

_Reviewed: 2026-05-09_  
_Reviewer: Claude Code (adversarial review)_  
_Depth: standard_
