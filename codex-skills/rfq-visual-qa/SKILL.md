---
name: rfq-visual-qa
description: Use this skill whenever modifying or reviewing the RFQ Agent web app, dashboard, RFQ detail page, local manager UI, responsive layout, screenshots, visual QA, browser testing, or anything the user should inspect visually in localhost.
---

# RFQ Visual QA

## Required Workflow

Use this skill after any UI or frontend change in the RFQ Agent manager.

1. Run checks from repo root:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

2. Ensure the local app is reachable at `http://localhost:3000`. If an old dev server is serving stale assets, restart it.
3. Capture at least:
   - Desktop screenshot: 1440 x 1100.
   - Mobile screenshot: 390 x 950.
4. Open the screenshots and verify:
   - CSS loaded, no unstyled HTML.
   - Text does not overflow buttons/cards.
   - RFQ tabs are clickable and readable.
   - Plan images/PDFs render and are framed correctly.
   - Important actions are visible without confusing wording.
5. Report screenshot paths and any visible issues.

## RFQ Screens To Prefer

- RFQ list: `/dashboard/rfqs`
- Latest RFQ detail: `/dashboard/rfqs/{id}`
- Settings: `/dashboard/settings`
- Pipeline: `/dashboard/pipeline`

## Acceptance Bar

Do not call visual work complete if:

- The page is unstyled.
- The plan viewer is blank.
- Cards stretch because another column is tall.
- Mobile layout hides the primary RFQ review.
- The UI suggests real customer sends are allowed when only test sends are safe.
