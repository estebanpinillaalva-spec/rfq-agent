---
name: rfq-real-case-review
description: Use this skill when the user provides or references a real RFQ, drawing, CAD plan, PDF, image, extracted JSON, quote, budget, or asks whether the agent extracted enough to quote like a real machining workshop estimator.
---

# RFQ Real Case Review

## Goal

Review an RFQ as if it were a real machining quote request. The answer must separate what the agent extracted correctly from what blocks a professional quote.

## Sources To Inspect

For a local pilot result, inspect the RFQ folder under `rfq-agent-piloto/salidas/{id}/`:

- `analisis.json`
- `presupuesto.md`
- `revision-checklist.md`
- `email-respuesta.md`
- `input/` drawings, if present

If the app is relevant, open `/dashboard/rfqs/{id}` and use `$rfq-visual-qa`.

## Review Checklist

Verify these fields:

- Customer, contact, quantities, deadline.
- Part name and drawing reference/revision.
- Material and whether it exists in `config-taller.json`.
- Overall dimensions and scale.
- Critical tolerances and general tolerance standard.
- Threads, holes, fits, GD&T, surface finish, heat treatment/coating.
- Operations, setup risk, subcontracts, special tooling.
- DFM risks, ambiguities, and blocking reasons.
- Quote math: quantity, unit price, subtotal, IVA, total, delivery time, validity.
- `BORRADOR` mark and human review status.

## Verdict Format

Always give a clear verdict:

- `ENVIABLE COMO BORRADOR INTERNO`
- `NECESITA ACLARACIONES`
- `NO PROCESABLE`

Then list:

- Extracted correctly.
- Missing or risky.
- Questions to ask the client.
- Changes needed in config or prompts.

Never claim a quote is ready for final customer send if material prices, critical dimensions, finish, or blocking ambiguities are missing.
