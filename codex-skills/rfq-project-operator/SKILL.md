---
name: rfq-project-operator
description: Use this skill at the start of any RFQ Agent project session, especially when the user says to continue, review the project, pick up where we left off, implement next steps, or work on the CAM/RFQ pilot. It preserves project context, reads the right local sources first, avoids losing the thread, and keeps secrets and pilot constraints in view.
---

# RFQ Project Operator

## Purpose

Use this skill to restart work on the RFQ Agent without guessing from memory. The product is an email-native AI agent for Spanish machine shops: a workshop receives an RFQ email with CAD drawings, forwards it to the agent, and gets a technical analysis plus a draft quote.

Current priority: professional local pilot first, SaaS/cloud later.

`AGENTS.md` is the single source of truth. `CLAUDE.md` is only a bridge for Claude Code and must not be treated as a separate agent.

## Startup Checklist

1. Read `AGENTS.md` first. It overrides every other project document.
2. Read `docs/AUTOCORRECTIONS.md` and `docs/PROTOTYPE_REVIEW.md` if present.
3. Treat `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/CONTEXT.md`, `docs/WORKFLOW.md`, and old sprint docs as historical unless they explicitly agree with `AGENTS.md`.
4. Inspect both app layers:
   - Root Next.js manager in `src/`.
   - Local CLI pilot in `rfq-agent-piloto/`.
5. Check recent outputs in `rfq-agent-piloto/salidas/`, especially the newest RFQ folder.
6. Never print or repeat API keys. If keys were pasted in chat or visible in files, tell the user to rotate them before any public deploy.
7. Keep the local pilot human-in-the-loop. Draft quotes must stay marked `BORRADOR` until a human estimator approves them.

## Useful Commands

From repo root:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

From `rfq-agent-piloto/`:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:fixtures
npm.cmd audit --omit=dev
```

## Operating Rules

- Prefer local facts over memory: read the relevant file before editing.
- When an error is diagnosed and fixed, append the lesson to `docs/AUTOCORRECTIONS.md` and sync relevant skill guidance if it affects future sessions.
- Keep changes scoped to the pilot unless the user asks for production/cloud work.
- Do not reintroduce Supabase, Anthropic/Claude API, OpenAI runtime, or the old cloud `/api/process-rfq` path unless the user explicitly chooses a new production architecture.
- For UI work, invoke `$rfq-visual-qa`.
- For a real drawing/RFQ, invoke `$rfq-real-case-review`.
- For readiness, security, email, Supabase, queues, and deployment, invoke `$rfq-production-hardening`.
