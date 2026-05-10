# RFQ Agent - fuente unica de verdad

Este es el unico agente operativo del proyecto. Codex, Claude Code u otra IA deben leer este archivo antes de hacer cambios. `CLAUDE.md` existe solo como puente para Claude y debe remitir aqui.

## Producto

RFQ Agent es un gestor local para automatizar borradores de presupuesto de mecanizado a partir de emails con planos PDF/PNG/JPG.

El objetivo actual no es un SaaS completo: es un piloto profesional local, barato, demostrable y con revision humana obligatoria.

## Flujo actual

1. Llega un email por Resend Receiving o se simula desde la app.
2. Se crea una entrada visible en `rfq-agent-piloto/inbox/`.
3. El piloto procesa `email.txt`, adjuntos y `config-taller.json`.
4. Gemini o `mock` extraen datos tecnicos del plano.
5. El motor local calcula costes con configuracion y materiales locales.
6. Se generan salidas en `rfq-agent-piloto/salidas/`.
7. La app Next muestra RFQs, planos, piezas, Quality Gate, presupuesto y email borrador.

Todo presupuesto es `BORRADOR` hasta aprobacion humana.

## Arquitectura viva

- App gestor: `src/` con Next.js 14, TypeScript y Tailwind.
- Piloto local: `rfq-agent-piloto/` con TypeScript CLI.
- Datos de entrada: `rfq-agent-piloto/inbox/` y `rfq-agent-piloto/ejemplos/`.
- Datos de salida: `rfq-agent-piloto/salidas/`.
- Materiales editables: `rfq-agent-piloto/config/materiales.json`.
- Skills de negocio: `skills/`.
- Skills de trabajo de Codex: `codex-skills/` y `C:\Users\esteb\.codex\skills\`.

## Stack actual

- Next.js 14 App Router.
- Node.js 20+.
- TypeScript estricto.
- Tailwind CSS.
- Resend Receiving para email entrante.
- Gemini opcional para vision/texto real.
- `mock` como proveedor gratis para demo, UI y regresion.
- Zod para contratos y parseo defensivo.
- Puppeteer solo para QA visual y capturas.

No reintroducir Supabase, Anthropic/Claude API, OpenAI runtime, Vercel o colas cloud salvo que el usuario lo pida explicitamente como una nueva etapa.

Claude Code puede colaborar en el proyecto, pero no existe un "agente Claude" separado. Debe trabajar sobre este mismo RFQ Agent y respetar estas mismas reglas.

## Variables clave

Se configuran en `.env.local` raiz y/o `rfq-agent-piloto/.env.local`. Nunca imprimir ni repetir claves.

- `RFQ_AI_PROVIDER=mock|gemini`
- `RFQ_INBOUND_PROVIDER=mock|gemini`
- `GOOGLE_GEMINI_API_KEY=...`
- `GEMINI_MODEL=...`
- `RESEND_API_KEY=...`
- `RESEND_WEBHOOK_SECRET=...`
- `ALLOW_UNVERIFIED_RESEND_WEBHOOKS=true` solo para pruebas locales.
- `RESEND_FROM=...`
- `TEST_EMAIL_TO=...`

Las claves que hayan sido pegadas en chats o capturas deben considerarse comprometidas y rotarse antes de cualquier prueba publica.

## Rutas importantes

- Dashboard: `http://localhost:3000/dashboard`
- RFQs: `http://localhost:3000/dashboard/rfqs`
- Email: `http://localhost:3000/dashboard/email`
- Pipeline: `http://localhost:3000/dashboard/pipeline`
- Ajustes/materiales: `http://localhost:3000/dashboard/settings`
- Webhook inbound: `/api/inbound-email`
- Procesar inbox local: `/api/local/inbox/[id]/process`

`/api/process-rfq` queda desactivado a proposito. Era una ruta cloud antigua y no debe usarse para el piloto actual.

## Reglas de trabajo

1. Mantener un unico agente: este archivo manda. Si otro documento contradice este archivo, actualizarlo o marcarlo como historico.
2. No borrar datos de RFQs, inbox, salidas ni capturas sin confirmacion explicita.
3. No tocar `.env.local` salvo para crear plantillas o placeholders. No revelar secretos.
4. No usar `any` en TypeScript.
5. Validar todo output IA con Zod o parseo defensivo.
6. Para PDFs multipagina, analizar cada pagina/plano como posible pieza independiente.
7. La app debe mostrar identidad de email: asunto, remitente y fecha recibida.
8. El coste/precio debe venir de configuracion local/materiales locales, no de invencion del modelo.
9. Mantener revision humana antes de enviar nada a cliente final.
10. Si aparece Server Error de Next tipo `Cannot find module './*.js'`, limpiar `.next` y reiniciar con `npm.cmd run dev:clean`.

## Comandos de verificacion

Raiz:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

Piloto:

```powershell
cd rfq-agent-piloto
npm.cmd run typecheck
npm.cmd run test:fixtures
npm.cmd audit --omit=dev
```

Arranque limpio:

```powershell
npm.cmd run dev:clean
```

## QA visual obligatorio

Tras cambios de frontend:

1. Ejecutar `typecheck`, `lint` y `build`.
2. Reiniciar con `npm.cmd run dev:clean`.
3. Capturar al menos:
   - Desktop 1440 x 1100.
   - Mobile 390 x 950.
4. Verificar que no hay Server Error, texto solapado, overflow horizontal, cards rotas ni perdida de identificacion de RFQs.

## Criterio de exito actual

El proyecto esta sano si:

- La app abre `/dashboard/rfqs`.
- Los RFQs muestran asunto, remitente y fecha.
- Un email entrante crea registro visible en inbox/RFQs.
- Un RFQ puede reprocesarse con `mock` y, si hay cuota, con Gemini.
- Cada salida genera analisis, presupuesto y Quality Gate.
- El presupuesto se mantiene como borrador revisable.
