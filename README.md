# RFQ Agent

Piloto local para revisar RFQs de mecanizado recibidos por email, analizar planos y generar presupuestos borrador con revision humana.

## Fuente unica de verdad

Lee primero `AGENTS.md`.

`CLAUDE.md` es solo un puente para que Claude Code lea las mismas instrucciones. No hay un agente separado de Claude ni un flujo alternativo.

## Estado actual

- Gestor local Next.js en `src/`.
- Piloto TypeScript en `rfq-agent-piloto/`.
- Email entrante con Resend Receiving.
- Proveedor IA `mock` gratis para pruebas y UI.
- Gemini opcional para analizar planos reales.
- Materiales y precios desde base local editable.
- Presupuestos siempre marcados como `BORRADOR`.

No se usa Supabase ni Anthropic/Claude API en el flujo actual.

## Arrancar

```powershell
npm.cmd install
npm.cmd run dev:clean
```

Abre:

```text
http://localhost:3000/dashboard/rfqs
```

## Verificar

Raiz:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Piloto:

```powershell
cd rfq-agent-piloto
npm.cmd run typecheck
npm.cmd run test:fixtures
```

## Probar sin gastar cuota

En la app usa proveedor `mock` o ejecuta:

```powershell
cd rfq-agent-piloto
npm.cmd run dev
```

## Probar con email real

1. Arranca la app con `npm.cmd run dev:clean`.
2. Expone local con ngrok.
3. En Resend configura el webhook a:

```text
https://TU-URL-NGROK/api/inbound-email
```

4. Envia un email a la direccion de Resend Receiving con un PDF/PNG/JPG.
5. Revisa el RFQ en `/dashboard/rfqs`.

## Seguridad

Nunca subas ni pegues claves de `.env.local`. Las claves compartidas en chats o capturas deben rotarse antes de cualquier prueba publica.
