# ARCHITECTURE — Decisiones técnicas del proyecto

> Nota 2026-05-08: este documento contiene arquitectura historica y puede mencionar Supabase/Claude API/flujo cloud antiguo. La fuente operativa actual es `AGENTS.md`. No seguir este documento si contradice `AGENTS.md`.

Documento vivo. Cada decisión arquitectónica se anota aquí para no reabrirla cada vez.

---

## 1. ARQUITECTURA DE PRODUCTO: EMAIL-NATIVE

**Decisión:** El producto es un **agente que vive en el email**, no una web app SaaS clásica.

**Cómo funciona:**

```
Cliente final del taller          Taller (cliente nuestro)         Tu sistema
        │                                  │                            │
        │  Email con RFQ + planos          │                            │
        ├─────────────────────────────────►│                            │
        │                                  │                            │
        │                                  │  Reenvía a email mágico:   │
        │                                  │  rfq-{taller}@dominio.com  │
        │                                  ├───────────────────────────►│
        │                                  │                            │
        │                                  │                            │ procesa con IA
        │                                  │                            │ (5-15 min)
        │                                  │                            │
        │                                  │  Email con análisis +      │
        │                                  │  PDF presupuesto borrador  │
        │                                  │◄───────────────────────────┤
        │                                  │                            │
        │  Email con presupuesto final     │                            │
        │◄─────────────────────────────────┤  (tras validar 5 min)      │
```

**Por qué:** Cero fricción de adopción. El comercial del taller no cambia su flujo, solo añade una acción de reenvío.

**Web app mínima asociada:** Solo existe para 2 cosas:
1. Onboarding inicial del taller (configurar precios, márgenes, datos empresa)
2. Histórico de RFQs procesados (visualización, no obligatorio para uso)

---

## 2. STACK TÉCNICO DEFINITIVO

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend (web mínima)** | Next.js 14 + TypeScript + Tailwind | Standard, vibe-coding-friendly, Vercel native |
| **Hosting** | Vercel | Free tier, auto-deploy desde GitHub |
| **Base de datos** | Supabase (Postgres) | Free tier 500MB, auth incluido |
| **Auth (web mínima)** | Supabase Auth | Email/password, sin complicaciones |
| **Storage planos** | Supabase Storage | Free tier 1GB, gratis hasta volumen |
| **Email entrante** | Resend Inbound | Webhook al webhook de la API |
| **Email saliente** | Resend | Free 3.000/mes |
| **LLM razonamiento** | Claude Sonnet 4.6 API | Mejor en arquitectura comercial y presupuestos |
| **LLM visión técnica** | Gemini 2.5 Pro API | Mejor en lectura multimodal de planos densos |
| **Generación PDF** | Puppeteer + HTML template | Standard, control total del diseño |
| **Versionado código** | GitHub | Repo privado, integración con Cursor |

**Coste mensual proyectado del MVP:**
- Vercel, Supabase, Resend: 0€ (free tiers)
- Claude API: ~15-30€ (depende volumen)
- Gemini API: ~0-15€ (50 req/día gratis, después pago)
- Total: <50€/mes durante MVP, escalable a 80-150€/mes con 3-5 clientes

---

## 3. ESTRUCTURA DEL CÓDIGO (cuando se implemente)

```
codigo/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── inbound-email/        # Webhook de Resend Inbound
│   │   │   └── route.ts          # POST: recibe email + adjuntos
│   │   ├── process-rfq/          # Endpoint interno
│   │   │   └── route.ts          # POST: lanza el procesamiento
│   │   └── send-response/        # Endpoint interno
│   │       └── route.ts          # POST: envía email respuesta
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── dashboard/
│   │   ├── rfqs/                 # Lista de RFQs procesados
│   │   ├── settings/             # config-taller editable
│   │   └── page.tsx
│   └── page.tsx                  # Landing page
├── lib/
│   ├── local-store.ts            # Lectura local de RFQs/salidas
│   ├── material-store.ts         # Materiales/precios locales
│   ├── gemini.ts                 # Cliente Gemini API
│   ├── resend.ts                 # Cliente Resend
│   ├── pdf.ts                    # Generación de PDF
│   └── skills/                   # Implementación de las skills
│       ├── validar-plano.ts
│       ├── procesar-rfq.ts
│       └── generar-presupuesto.ts
├── prompts/                      # Prompts de las skills (texto)
│   ├── validar-plano.txt
│   ├── procesar-rfq.txt
│   └── generar-presupuesto.txt
├── types/
│   └── rfq.ts                    # Tipos compartidos
└── plantillas/
    └── presupuesto.html          # Plantilla HTML del PDF
```

---

## 4. ESQUEMA DE BASE DE DATOS

### Tabla: `talleres` (clientes)
```sql
id              uuid PRIMARY KEY
created_at      timestamp
nombre          text
email_owner     text                 -- email del dueño/contacto
email_magico    text UNIQUE          -- ej: rfq-talleresperez@dominio.com
config          jsonb                -- precios, márgenes, datos empresa
plan            text                 -- piloto / pro / enterprise
activo          boolean
```

### Tabla: `rfqs` (cada email procesado)
```sql
id              uuid PRIMARY KEY
created_at      timestamp
taller_id       uuid FK
email_origen    text                 -- email del cliente final
email_subject   text
estado          text                 -- recibido / procesando / completado / error
planos_urls     text[]               -- URLs en Supabase Storage
analisis        jsonb                -- output skill procesar-rfq
presupuesto     jsonb                -- output skill generar-presupuesto
pdf_url         text
tiempo_proc_ms  integer              -- tiempo total de procesamiento
error_log       text
```

### Tabla: `eventos` (auditoría)
```sql
id              uuid PRIMARY KEY
created_at      timestamp
rfq_id          uuid FK
tipo            text                 -- email_recibido / validado / procesado / etc
detalle         jsonb
```

---

## 5. FLUJO TÉCNICO DETALLADO

### 5.1 Recepción del email (webhook Resend Inbound)

```
Cliente reenvía email a rfq-{taller}@tudominio.com
    ↓
Resend Inbound recibe el email
    ↓
POST a /api/inbound-email con payload:
  - from, to, subject, body, attachments[]
    ↓
1. Validar que `to` corresponde a un taller activo
2. Crear registro en tabla `rfqs` (estado: recibido)
3. Subir adjuntos a Supabase Storage
4. Lanzar procesamiento async (background job)
5. Responder 200 OK a Resend (rápido)
```

### 5.2 Procesamiento async

```
Job lanza:
    ↓
1. Skill validar-plano sobre cada adjunto
   → Si todos NO procesables: enviar email pidiendo mejor plano. STOP.
   → Si al menos uno procesable: continuar
    ↓
2. Skill procesar-rfq con Gemini Pro
   → Input: email body + planos validados + config-taller
   → Output: análisis estructurado
    ↓
3. Skill generar-presupuesto con Claude
   → Input: análisis + config-taller (precios, márgenes)
   → Output: presupuesto JSON
    ↓
4. Generar PDF profesional con Puppeteer
   → Plantilla HTML con datos del presupuesto
   → PDF subido a Supabase Storage
    ↓
5. Componer email respuesta:
   → Asunto: "[RFQ-XXX] Análisis técnico + presupuesto borrador"
   → Body: análisis técnico en markdown
   → Adjunto: PDF presupuesto
   → To: email original del taller
    ↓
6. Enviar vía Resend
    ↓
7. Actualizar `rfqs.estado = completado`
```

### 5.3 Onboarding del taller

```
Taller se registra en web (login Supabase)
    ↓
Onboarding form pide:
  - Nombre empresa
  - Sectores que sirven
  - Precios/hora-máquina por operación
  - Márgenes objetivo por gama
  - Plazos estándar
  - Datos para encabezado del presupuesto
    ↓
Sistema genera config-taller.json (guardado en `talleres.config`)
    ↓
Sistema genera email mágico único: rfq-{slug}@tudominio.com
    ↓
Email de bienvenida con instrucciones:
  "Reenvía cualquier RFQ a tu email mágico y recibirás el análisis 
   en 15 min."
```

---

## 6. DECISIONES CRÍTICAS YA TOMADAS

### D-001: Email-native vs Web app
**Decisión:** Email-native como producto principal.
**Razón:** Cero fricción de adopción, MVP más rápido, ticket más alto por menor coste de cambio.
**Fecha:** Sprint 0
**Reversible:** No (cambia toda la arquitectura).

### D-002: Stack Next.js + Supabase + Vercel
**Decisión:** Standard moderno, vibe-coding friendly.
**Razón:** Generación de código por IA muy madura, mucha documentación, free tier generoso.
**Fecha:** Sprint 0
**Reversible:** Caro pero posible.

### D-003: Gemini Pro para visión, Claude para razonamiento
**Decisión:** División de trabajo entre LLMs.
**Razón:** Gemini es mejor en visión multimodal técnica densa, Claude es mejor en razonamiento comercial.
**Fecha:** Sprint 0
**Reversible:** Sí, fácil con buena abstracción.

### D-004: Wizard of Oz primero
**Decisión:** Primeros 2-3 RFQs reales se procesan manualmente con las skills antes de automatizar todo.
**Razón:** Aprender qué automatizar exactamente antes de codificarlo.
**Fecha:** Sprint 0
**Reversible:** Sí.

---

## 7. SUPUESTOS A VALIDAR

A confirmar en sprints 1-2:

- [ ] Resend Inbound funciona bien con adjuntos PDF de 5-30MB
- [ ] Gemini 2.5 Pro lee planos PDF densos con calidad consistente
- [ ] Webhook handling soporta procesamiento async sin timeouts
- [ ] Free tier de Supabase aguanta primeros clientes
- [ ] Coste real Claude+Gemini por RFQ < 0.30€

---

**Última actualización:** Sprint 0
**Próxima revisión:** Final de Sprint 2 (validar supuestos)
