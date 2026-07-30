# RFQ Agent — Contexto del proyecto

Lee este archivo completo al inicio de cada sesión antes de hacer cualquier cosa.

## Qué es este proyecto

Agente IA **email-native** que automatiza RFQs (Request For Quotation) para talleres mecánicos españoles.

**Flujo del producto:**
1. Cliente final envía email con planos PDF/STEP/DXF al taller
2. Estimador del taller reenvía a `rfq-{slug}@tudominio.com`
3. Sistema procesa en 5-15 minutos automáticamente
4. Taller recibe análisis técnico + presupuesto borrador en PDF
5. Estimador valida (5 min) y envía al cliente final

## Quién construye esto

Esteban — ingeniero mecánico recién graduado, España. Sin experiencia previa de código (vibe coding con IA). Inversión <300€/mes. 15-25h/semana.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (BD + Auth + Storage) — free tier
- Vercel (hosting) — free tier
- Resend Inbound (webhook emails entrantes)
- Resend (emails salientes) — free 3.000/mes
- Claude API claude-sonnet-4-6 — razonamiento y presupuestos
- Gemini 2.5 Pro API — visión técnica de planos PDF
- Puppeteer — generación de PDF

## Arquitectura

```
Email cliente → Resend Inbound → POST /api/inbound-email
  → guarda en Supabase, lanza job async
  → /api/process-rfq
      → skill validar-plano (Gemini)
      → skill procesar-rfq (Gemini)
      → skill generar-presupuesto (Claude)
      → genera PDF (Puppeteer)
  → /api/send-response → Resend envía email al taller
```

## Esquema BD (Supabase)

```sql
talleres: id | email_owner | email_magico UNIQUE | config jsonb | activo boolean
rfqs: id | taller_id FK | email_origen | estado | planos_urls[] | analisis jsonb | presupuesto jsonb | pdf_url | tiempo_proc_ms
eventos: id | rfq_id FK | tipo | detalle jsonb | created_at
```

## Skills del proyecto

Viven en `/skills/`. Claude Code las carga automáticamente.

- `skills/validar-plano/` — pre-filtro de calidad de planos
- `skills/procesar-rfq/` — análisis técnico completo
- `skills/generar-presupuesto/` — documento comercial profesional
- `skills/prospectar-linkedin/` — captación B2B semanal
- `skills/investigar-prospecto/` — dossier pre-demo

## Reglas absolutas

1. Nunca hardcodear API keys — siempre desde `.env.local`
2. Siempre TypeScript estricto, no usar `any`
3. Validar firma del webhook de Resend antes de procesar
4. Procesamiento de RFQ siempre async — nunca bloquear el webhook
5. Toda IA output lleva marca "BORRADOR" hasta validación humana
6. Output siempre en español aunque el input sea en otro idioma
7. Nunca modificar base de datos sin confirmación explícita

## Variables de entorno

Ver `.env.example` para la lista completa. Nunca commitear `.env.local`.

## Sprint actual

Sprint 1 — Setup base. Ver `docs/ROADMAP.md`.
