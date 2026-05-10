<div align="center">

# RFQ Agent

**De email a presupuesto de mecanizado en segundos — con IA**

_From email to machining quote in seconds — powered by AI_

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Pro-orange)](https://deepmind.google/technologies/gemini)
[![Estado](https://img.shields.io/badge/Estado-Piloto%20activo-brightgreen)](https://github.com/estebanpinillaalva-spec/rfq-agent)

</div>

---

## ¿Qué es RFQ Agent?

RFQ Agent es un agente local de IA para talleres de mecanizado de precisión. Recibe emails con planos técnicos adjuntos (PDF, PNG, JPG), los analiza automáticamente con visión artificial, y genera un **borrador de presupuesto** listo para revisión humana — en segundos, no horas.

> **Todos los presupuestos son `BORRADOR` hasta aprobación explícita del técnico. La IA asiste, el técnico decide.**

```
Cliente envía email con plano CAD
           │
           ▼
    Resend Receiving
    (webhook seguro)
           │
           ▼
    Next.js API ──► rfq-agent-piloto (CLI TypeScript)
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        Gemini 2.5 Pro                   Mock gratuito
        (análisis real)              (demos y desarrollo)
               │                             │
               └──────────────┬──────────────┘
                              ▼
                   Análisis técnico del plano
                   Extracción GD&T, materiales, operaciones
                   Cálculo de costes con tarifas locales
                              │
                              ▼
                   Dashboard web (revisión humana)
                   ├── Quality Gate con score
                   ├── Presupuesto desglosado
                   └── Email borrador al cliente
```

---

## Por qué RFQ Agent

| | Sin RFQ Agent | Con RFQ Agent |
|--|---------------|---------------|
| **Tiempo por presupuesto** | 1–3 horas | ~2 minutos de revisión |
| **Riesgo de error** | Alto (copia manual de datos) | Bajo (extracción automática + revisión) |
| **Tus datos** | En el email, dispersos | En tu servidor local, estructurados |
| **Coste de infraestructura** | — | ~0€/mes (modo mock gratuito) |
| **Curva de aprendizaje** | — | 15 minutos de configuración |

---

## Características

| Característica | Detalle |
|----------------|---------|
| 📧 **Recepción automática de emails** | Webhook Resend Receiving con verificación de firma |
| 🔍 **Visión de planos técnicos** | Gemini 2.5 Pro extrae materiales, tolerancias GD&T, cotas, cajétin |
| 🌍 **Multi-idioma** | Detecta cajétines en ES, EN, DE, FR, PT automáticamente |
| 📄 **PDFs multipágina** | Cada página analizada como pieza independiente si procede |
| 💰 **Cálculo de costes local** | Tarifas de mecanizado configurables por operación y material |
| 🔧 **Tabla de materiales extendida** | Aceros, inox avanzado (Duplex 2205, 17-4PH, 303, 416), titanio, PEEK, UHMW-PE |
| 📊 **Quality Gate** | Score 0–100, veredicto, grupos de riesgos, preguntas al cliente |
| 🔄 **Modo mock gratuito** | Desarrollo y demos sin gastar cuota de API |
| 🔒 **Privacidad total** | Sin base de datos externa, sin cloud, tus datos en tu máquina |
| 💼 **Pipeline comercial** | Kanban de prospectos con métricas (valor, probabilidad, vencimientos) |
| ✉️ **Email borrador** | Respuesta profesional generada lista para aprobar o editar |
| 🔁 **Retry automático** | Fallback a mock si Gemini no tiene cuota disponible |

---

## Casos de uso reales

| Situación | Lo que hace RFQ Agent |
|-----------|----------------------|
| Cliente envía PDF de pieza en acero C45 por email | Detecta material, dimensiones, tolerancias ISO; calcula coste en segundos |
| Plano alemán con cajétin en DIN / "Werkstoff" | Traduce campos automáticamente, identifica equivalencia EN/AISI |
| PDF multipágina con 3 piezas distintas | Genera 3 fichas independientes con su propio análisis y coste |
| Email sin adjuntos | Registra incidencia, no genera RFQ zombie silencioso |
| Gemini sin cuota disponible | Fallback automático a mock para no perder el email |
| Taller recibe 10 RFQs a la vez | Procesa en paralelo, dashboard actualizado en tiempo real |

---

## Instalación rápida

### Prerequisitos

- Node.js 20+
- npm 9+
- (Opcional) Clave API de Google Gemini para análisis real

### 1. Clonar e instalar

```bash
git clone https://github.com/estebanpinillaalva-spec/rfq-agent.git
cd rfq-agent
npm install
cd rfq-agent-piloto && npm install && cd ..
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local   # editar con tus claves
```

### 3. Arrancar

```bash
npm run dev:clean
```

Abre **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**

---

## Demo sin API key (modo mock)

Con `RFQ_AI_PROVIDER=mock` no necesitas ninguna clave. El agente simula el análisis completo usando datos de configuración local.

1. Ir a `/dashboard/email` → **"Simular email entrante"**
2. El RFQ aparece en `/dashboard/rfqs` y se procesa automáticamente
3. Revisar presupuesto, Quality Gate y email borrador
4. Aprobar o editar antes de enviar

---

## Variables de entorno

| Variable | Valores | Descripción |
|----------|---------|-------------|
| `RFQ_AI_PROVIDER` | `mock` · `gemini` | Motor de análisis de planos |
| `RFQ_INBOUND_PROVIDER` | `mock` · `gemini` | Motor de análisis de emails entrantes |
| `GOOGLE_GEMINI_API_KEY` | string | Clave Gemini (solo si provider=gemini) |
| `GEMINI_MODEL` | string | Modelo Gemini (ej: `gemini-2.5-pro`) |
| `RESEND_API_KEY` | string | Clave Resend para emails |
| `RESEND_WEBHOOK_SECRET` | string | Secreto del webhook (obligatorio en producción) |
| `RESEND_FROM` | email | Dirección de envío |
| `TEST_EMAIL_TO` | email | Destino para emails de prueba |
| `ALLOW_UNVERIFIED_RESEND_WEBHOOKS` | `true` | Solo para desarrollo local — bloqueado en producción |

---

## Comandos

```bash
# Arranque limpio (mata procesos huérfanos, limpia caché .next)
npm run dev:clean

# Arranque normal
npm run dev

# Verificación completa
npm run typecheck && npm run lint && npm run build

# En rfq-agent-piloto/
npm run typecheck
npm run test:fixtures
```

---

## Estructura del proyecto

```
.
├── src/                          # App Next.js — dashboard web
│   ├── app/dashboard/            # RFQs, clientes, pipeline, email, ajustes
│   ├── app/api/                  # Webhooks y API local
│   └── lib/                      # local-store, resend, materiales
│
├── rfq-agent-piloto/             # CLI TypeScript — motor de análisis
│   ├── src/skills/               # procesarRFQ, calcularPresupuesto, generarEmail…
│   ├── config/
│   │   ├── config-taller.json    # Tarifas por operación (editable)
│   │   └── materiales.json       # Tabla de materiales y precios
│   ├── inbox/                    # Emails entrantes (excluido de git)
│   └── salidas/                  # Salidas generadas (excluido de git)
│
├── skills/                       # Skills de negocio del agente AI
│   ├── procesar-rfq/             # Prompt + tabla materiales + GD&T
│   ├── generar-presupuesto/
│   ├── validar-plano/
│   └── prospectar-linkedin/
│
└── AGENTS.md                     # Fuente única de verdad del proyecto
```

---

## Estado del proyecto

| Módulo | Estado | Notas |
|--------|--------|-------|
| Recepción emails (Resend webhook) | ✅ Estable | Verificación de firma en producción |
| Análisis con Gemini Vision | ✅ Estable | Fallback automático a mock |
| Modo mock sin API key | ✅ Estable | Para desarrollo y demos |
| Extracción GD&T y materiales | ✅ Estable | Multi-idioma ES/EN/DE/FR/PT |
| Cálculo de costes local | ✅ Estable | Tarifas editables en JSON |
| Quality Gate con score | ✅ Estable | Score 0–100, grupos de riesgo |
| Dashboard Kanban (RFQs) | ✅ Estable | Auto-polling en tiempo real |
| Pipeline comercial | ✅ Estable | Métricas, filtros, vencimientos |
| Tabla de materiales | ✅ Extendida | Titanio, Duplex 2205, 17-4PH, PEEK, UHMW-PE |
| Tests unitarios | 📋 Planificado | Fixtures básicos disponibles |
| UI para editar config-taller | 📋 Planificado | Por ahora edición manual en JSON |
| Vinculación Pipeline ↔ RFQs | 📋 Planificado | |

---

## Hoja de ruta

**Nivel 1 — Fiabilidad** *(actual)*
- Webhook seguro con verificación de firma obligatoria en producción ✅
- Auto-polling de RFQs en procesamiento ✅
- Fallback mock cuando Gemini no tiene cuota ✅

**Nivel 2 — Producto** *(próximas semanas)*
- Notificación por email cuando llegan RFQs sin adjuntos
- UI para editar `config-taller.json` desde el dashboard
- Tests unitarios core (parseJson, sanitize, retry)

**Nivel 3 — Crecimiento** *(próximo mes)*
- Vinculación Pipeline ↔ RFQs
- Export CSV del pipeline con filtros
- Historial de cambios de estado

**Nivel 4 — Escala** *(futuro)*
- Multi-taller con autenticación
- Dashboard analytics (tiempo medio de respuesta, tasa de cierre)
- Integración con sistemas de facturación (Sage, FacturaDirecta)
- Soporte para modelos alternativos (Claude Opus, GPT-4o)

---

## Seguridad

- Los datos de clientes y planos **no salen de tu servidor**
- `RESEND_WEBHOOK_SECRET` es **obligatorio** en producción (bloqueado por código)
- `inbox/` y `salidas/` están en `.gitignore` — los datos nunca se suben al repositorio
- Nunca compartas ni subas tu `.env.local`

---

## Contribuir

El proyecto está en fase piloto activo. Si tienes un taller de mecanizado y quieres probarlo o contribuir, abre un issue o un PR.

---

## Licencia

[MIT](LICENSE) — libre para uso comercial y modificación.

---

<div align="center">

*Construido para talleres de mecanizado de precisión en España y mercados hispanohablantes.*

*Built for precision machining workshops.*

</div>
