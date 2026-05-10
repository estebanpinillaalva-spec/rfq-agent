---
name: rfq-fixture-benchmark
description: Use this skill when building a real anonymized RFQ test corpus, adding fixtures, running regression tests, comparing extraction quality across drawings, measuring cost/duration/confidence, or making the CAM/RFQ pilot more reliable with repeatable cases.
---

# RFQ Fixture Benchmark

## Purpose

Turn one-off demos into repeatable evidence. The pilot should be tested against a growing corpus of anonymized RFQs before any workshop pilot.

## Fixture Structure

Use this structure:

```text
rfq-agent-piloto/fixtures/reales-anonimizados/rfq-001/
  email.txt
  config-taller.json
  plano-1.png | plano-1.pdf | pieza.step
  expected-review.md
```

Do not include real customer names, emails, phone numbers, addresses, prices, or proprietary drawings unless the user has permission. Anonymize first.

## Benchmark Workflow

1. Add or inspect fixtures.
2. Run from `rfq-agent-piloto/`:

```powershell
npm.cmd run typecheck
npm.cmd run test:fixtures
```

3. For each case, record:
   - Status: completed, blocked, recoverable error.
   - Duration and provider.
   - Estimated cost.
   - Confidence scores.
   - Missing fields.
   - Whether the generated quote is usable as internal draft.

## Acceptance Bar

Before a real workshop pilot, aim for:

- 10-20 anonymized RFQs.
- At least 80% produce a useful internal draft.
- 0 cases send final quotes automatically.
- Every blocked case explains what to ask the customer.
- Regressions are visible in `reporte-validacion.md` or a similar report.
