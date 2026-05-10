# RFQ Agent - puente para Claude Code

Claude Code debe trabajar sobre el mismo agente que Codex. No existe un agente separado para Claude.

Lee `AGENTS.md` completo antes de hacer cambios. Ese archivo es la fuente unica de verdad del proyecto actual.

Reglas rapidas:

- No reintroducir Supabase, Anthropic/Claude API, OpenAI runtime ni el flujo cloud antiguo salvo peticion explicita del usuario.
- No usar `/api/process-rfq`; esta desactivado porque pertenece al flujo viejo.
- Trabajar sobre el piloto local, la app Next y el flujo Resend inbound actual.
- Mantener siempre presupuesto `BORRADOR` y revision humana.
- No revelar ni copiar claves de `.env.local`.
- Tras cambios de UI, ejecutar checks y QA visual segun `AGENTS.md`.

Si algun documento de `docs/` contradice `AGENTS.md`, tratelo como historico y actualicelo antes de implementar.
