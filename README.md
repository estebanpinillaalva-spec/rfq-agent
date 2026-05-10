# RFQ Agent

**Agente local de presupuestos de mecanizado con IA**  
_Local AI quoting agent for machining workshops_

---

## ¿Qué es esto?

RFQ Agent automatiza la generación de borradores de presupuesto a partir de emails con planos técnicos (PDF, PNG, JPG). Un taller recibe un email con un plano CAD, el agente lo analiza con visión por IA (Gemini), extrae materiales, tolerancias y geometría, y genera un presupuesto borrador listo para revisión humana.

**Todos los presupuestos son `BORRADOR` hasta aprobación del técnico.**

```
Email con plano
     │
     ▼
Resend Receiving ──► Webhook ──► Next.js API
                                      │
                                      ▼
                               rfq-agent-piloto (CLI)
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                    Gemini Vision              Mock (gratis)
                    (análisis real)         (demos y CI)
                          │                       │
                          └───────────┬───────────┘
                                      ▼
                              Presupuesto BORRADOR
                                      │
                                      ▼
                           Dashboard Next.js (revisión)
```

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / API | Next.js 14 App Router, TypeScript estricto, Tailwind CSS |
| IA | Google Gemini 2.5 Pro (visión + texto) / modo `mock` gratuito |
| Email entrante | Resend Receiving (webhook) |
| Email saliente | Resend API |
| Datos | Ficheros locales JSON + CSV (sin base de datos) |
| Validación | Zod |
| PDF → imágenes | Puppeteer / pdf-parse |

---

## Estructura del proyecto

```
.
├── src/                         # App Next.js (dashboard web)
│   ├── app/
│   │   ├── dashboard/           # Páginas: RFQs, clientes, pipeline, email, ajustes
│   │   └── api/                 # API routes: inbound-email, local/*
│   ├── components/              # UI compartida
│   └── lib/                     # local-store, resend, material-store
│
├── rfq-agent-piloto/            # CLI: procesa inbox y genera salidas
│   ├── src/skills/              # procesarRFQ, calcularPresupuesto, generarEmail…
│   ├── inbox/                   # Emails entrantes (ignorado en git)
│   ├── salidas/                 # Salidas procesadas (ignorado en git)
│   └── config/
│       ├── config-taller.json   # Configuración de tarifas del taller
│       └── materiales.json      # Tabla de materiales y costes
│
├── skills/                      # Skills de negocio (prompts del agente)
│   ├── procesar-rfq/
│   ├── generar-presupuesto/
│   ├── validar-plano/
│   └── prospectar-linkedin/
│
├── .planning/                   # Coordinación AI (WORKING.md)
└── AGENTS.md                    # Fuente única de verdad del proyecto
```

---

## Instalación

### Prerequisitos

- Node.js 20+
- npm 9+
- (Opcional) Clave API de Google Gemini para análisis real de planos

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/rfq-agent.git
cd rfq-agent
```

### 2. Instalar dependencias

```bash
# App Next.js
npm install

# Piloto CLI
cd rfq-agent-piloto && npm install && cd ..
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y rellenar los valores:

```bash
cp .env.local.example .env.local
```

Ver la sección [Variables de entorno](#variables-de-entorno-disponibles) para los detalles.

### 4. Arrancar

```bash
npm run dev:clean
```

Abrir [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## Uso rápido (modo demo gratuito)

Con `RFQ_AI_PROVIDER=mock` no necesitas ninguna API key. El agente simula el análisis y calcula presupuestos con los datos de `rfq-agent-piloto/config/`.

1. Ir a `/dashboard/email`
2. Hacer clic en **"Simular email entrante"**
3. El RFQ aparece en `/dashboard/rfqs`
4. Hacer clic en **"Procesar"** para generar el presupuesto borrador
5. Revisar el presupuesto y aprobarlo o editarlo

---

## Variables de entorno disponibles

| Variable | Valores | Descripción |
|----------|---------|-------------|
| `RFQ_AI_PROVIDER` | `mock` \| `gemini` | Motor de análisis de planos |
| `RFQ_INBOUND_PROVIDER` | `mock` \| `gemini` | Motor de análisis de emails |
| `GOOGLE_GEMINI_API_KEY` | string | Clave Gemini (solo si provider=gemini) |
| `GEMINI_MODEL` | string | Modelo Gemini a usar |
| `RESEND_API_KEY` | string | Clave Resend para emails |
| `RESEND_WEBHOOK_SECRET` | string | Secreto del webhook de Resend |
| `RESEND_FROM` | email | Dirección de envío |
| `TEST_EMAIL_TO` | email | Destino para emails de prueba |
| `ALLOW_UNVERIFIED_RESEND_WEBHOOKS` | `true` | Solo para desarrollo local |

---

## Comandos útiles

```bash
# Arranque limpio (mata procesos huérfanos, limpia caché .next)
npm run dev:clean

# Arranque normal
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build de producción
npm run build

# En rfq-agent-piloto/
cd rfq-agent-piloto
npm run typecheck
npm run test:fixtures
```

---

## Flujo completo con email real

1. Configurar un dominio en [Resend Receiving](https://resend.com/domains) → webhook apunta a `https://tu-dominio.com/api/inbound-email`
2. El remitente envía un email con el plano adjunto (PDF, PNG o JPG)
3. Resend llama al webhook → la app crea el RFQ en `inbox/`
4. Desde el dashboard, hacer clic en **"Procesar"**
5. El agente CLI analiza el plano con Gemini, extrae piezas, materiales y tolerancias GD&T
6. Se genera un presupuesto borrador en `salidas/`
7. El técnico revisa en el dashboard y envía la respuesta al cliente

---

## Estado del proyecto

> **Piloto local activo** — Funcional para talleres individuales con revisión humana obligatoria.

| Módulo | Estado |
|--------|--------|
| Recepción de emails (Resend Receiving) | ✅ Funcional |
| Análisis de planos con Gemini Vision | ✅ Funcional |
| Modo mock sin API key | ✅ Funcional |
| Extracción GD&T y materiales | ✅ Funcional |
| Cálculo de presupuesto con tarifas locales | ✅ Funcional |
| Dashboard web (RFQs, clientes, pipeline) | ✅ Funcional |
| Pipeline comercial con métricas | ✅ Funcional |
| Materiales configurables | ✅ Funcional |
| Multi-idioma en planos (ES/EN/DE) | 🔧 En progreso |
| Vinculación Pipeline ↔ RFQs | 📋 Planificado |
| Export CSV del pipeline | 📋 Planificado |

---

## Seguridad

- Nunca subir ni pegar claves de `.env.local`
- Las claves compartidas en chats o capturas deben rotarse antes de cualquier prueba pública
- `inbox/` y `salidas/` están en `.gitignore` — los datos de clientes no se suben al repositorio

---

## Licencia

MIT
