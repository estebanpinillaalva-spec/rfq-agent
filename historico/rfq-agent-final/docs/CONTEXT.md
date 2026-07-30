# CONTEXT — Proyecto RFQ AI Agent

Este archivo se adjunta SIEMPRE al inicio de cada conversación nueva con Claude Code, Cursor, Gemini Pro o cualquier IA que vaya a colaborar en el proyecto. Es el "cerebro externo" del proyecto.

---

## ¿QUÉ ES ESTE PROYECTO?

**Producto:** Agente IA de automatización de RFQ (Request For Quotation) para talleres mecánicos / fabricantes industriales españoles.

**Cómo funciona:**
- El cliente final (cliente del taller) envía un email con planos PDF/STEP/DXF solicitando presupuesto
- Mi agente IA lee el email + analiza los planos automáticamente
- Extrae: material, dimensiones, tolerancias, GD&T, operaciones de fabricación, cantidades, plazos
- Genera un análisis técnico estructurado y un borrador de presupuesto
- El estimador del taller solo tiene que validar y enviar
- Tiempo total: 10-15 minutos en lugar de 2-3 horas habituales

**Cliente target:**
- Talleres mecánicos españoles de 10-200 empleados
- Sectores: mecanizado CNC, calderería, soldadura, decoletaje, fabricación a medida
- Sectores cliente final: automoción, aero, ferroviario, máquina herramienta, energía
- Volumen: 20-50 RFQs/semana entrantes
- Geografía: España (LinkedIn como canal principal)

**Modelo de negocio:**
- Setup inicial: 3.000-8.000€ (cubierto por Kit Digital en muchos casos)
- Recurrente mensual: 600-2.000€/mes
- Margen bruto objetivo: ~85% (es software, costes son APIs)
- Año 1 objetivo: 8-12 clientes activos, 70-130k€ acumulado, MRR final 5-7k€

---

## ¿QUIÉN SOY?

- **Esteban** [Apellido], ingeniero mecánico
- Recién graduado / estudiante último año en España
- Hispanohablante, base de operaciones España
- **Sin experiencia previa de código** (vibe coding total con IA)
- Dedicación: 15-25 horas/semana
- Inversión disponible: <300€/mes
- Canal de venta principal: LinkedIn España

---

## ESTADO ACTUAL DEL PROYECTO

- **Fase:** Validación y construcción de MVP
- **Clientes pagando:** 0
- **Clientes en piloto:** 0
- **Inversión hasta hoy:** ~0€
- **MVP completado:** 0%
- **Pipeline comercial:** vacío (arrancando)

---

## STACK TÉCNICO DEFINITIVO

| Capa | Tecnología | Estado | Notas |
|------|-----------|--------|-------|
| Frontend | Next.js 14 + TypeScript + Tailwind | Por construir | App Router |
| Hosting | Vercel | Por configurar | Hobby tier (free) |
| Base de datos | Supabase | Por configurar | Free tier hasta 500MB |
| Auth | Supabase Auth | Por configurar | Email/Password |
| Storage (PDFs) | Supabase Storage | Por configurar | Free tier 1GB |
| LLM razonamiento | Claude API (Anthropic) | Por integrar | Pay-as-you-go |
| LLM visión técnica | Gemini 2.5 Pro API | Por integrar | Free tier 50 req/día |
| Email transaccional | Resend | Por configurar | Free 3.000/mes |
| Webhook RFQ entrante | Resend Inbound | Por configurar | Email → API |
| Pago / facturación | Stripe (futuro) | Diferido | Solo cuando haya cliente |
| Versiones código | GitHub | Por configurar | Pendiente Student Pack |

---

## STACK DE IA Y SU FUNCIÓN

**División de trabajo entre IAs:**

| IA | Rol | Cuándo usarla |
|----|-----|---------------|
| **Claude Code (Pro)** | CTO / Arquitecto | Planificación, decisiones de arquitectura, debugging complejo, generación de prompts para otras IAs, code review |
| **Cursor (free) / Codex** | Programador junior | Implementación de código, componentes UI, CRUD, refactors mecánicos |
| **Gemini Pro** | Motor de visión técnica | Procesamiento de planos PDF/imágenes en el flujo Wizard of Oz, análisis multimodal |
| **Perplexity Max** | Investigador comercial | Research de prospectos, validación de normas técnicas, análisis de competencia, generación de hooks personalizados |

---

## RESTRICCIONES CRÍTICAS A RESPETAR

1. **Cero conocimiento de código** del usuario → todo el código debe estar generado por IA y bien explicado
2. **Inversión <300€/mes** → priorizar siempre opciones gratuitas o de bajo coste
3. **15-25h/semana de dedicación** → planes realistas, no agendas de 60h/semana
4. **Estrategia "Wizard of Oz" inicial** → vender ANTES de construir, procesar manualmente con IA al inicio
5. **Idioma del proyecto y outputs**: español (excepto código y comentarios técnicos)
6. **No crear cuentas** sin validación previa del usuario
7. **No usar localStorage en artifacts** (limitación técnica conocida)

---

## SKILLS DEFINIDAS Y SU PROPÓSITO

| Skill | Función | Cuándo se usa |
|-------|---------|---------------|
| `validar-plano` | Pre-validación rápida de plano técnico | Antes de procesar cualquier RFQ |
| `procesar-rfq` | Análisis técnico completo de RFQ | Núcleo del producto, output al estimador |
| `generar-presupuesto` | Conversión de análisis a presupuesto comercial | Tras procesar-rfq, output al cliente |
| `prospectar-linkedin` | Sesión semanal de captación B2B | Una vez por semana, generar 20-30 leads |
| `investigar-prospecto` | Dossier pre-llamada de prospecto | 24-48h antes de cada demo o llamada importante |

---

## ARQUITECTURA DE CARPETAS DEL PROYECTO

```
proyecto-rfq/
├── docs/                          ← Documentación
│   ├── CONTEXT.md                 ← Este archivo (maestro)
│   ├── ARCHITECTURE.md            ← Decisiones técnicas
│   ├── ROADMAP.md                 ← Plan por sprints
│   ├── DECISIONS.md               ← Log de decisiones (ADRs)
│   └── LEARNINGS.md               ← Aprendizajes de cada cliente
│
├── prompts/                       ← Prompts maestros reutilizables
│   ├── README.md
│   ├── 01-arquitecto-claude.md
│   ├── 02-procesador-gemini.md
│   ├── 03-comercial-linkedin.md
│   └── 04-debugger.md
│
├── skills/                        ← Skills ejecutables
│   ├── validar-plano/
│   ├── procesar-rfq/
│   ├── generar-presupuesto/
│   ├── prospectar-linkedin/
│   └── investigar-prospecto/
│
├── plantillas/                    ← Documentos base
│   ├── presupuesto-base.md
│   ├── email-respuesta.md
│   ├── propuesta-comercial.md
│   └── pipeline-template.csv
│
├── prospectos/                    ← Operativa comercial
│   ├── pipeline.csv
│   ├── interacciones/
│   │   └── [empresa-fecha].md
│   └── investigaciones-perplexity/
│       └── [empresa-fecha].md
│
└── codigo/                        ← MVP en desarrollo
    └── [proyecto Next.js]
```

---

## MÉTRICAS OBJETIVO

**Mes 3 (validación):**
- 1-2 talleres en piloto gratuito
- 10-20 RFQs procesados manualmente
- Caso de éxito documentado

**Mes 6 (primer ingreso):**
- 3-4 clientes activos
- MRR: 1.500-2.500€
- Setup acumulado: 5.000-15.000€

**Mes 12 (consolidación):**
- 8-12 clientes activos
- MRR: 5.000-7.000€
- Acumulado año 1: 70-130k€

---

## ALTERNATIVAS DESCARTADAS (PARA REFERENCIA FUTURA)

Estas ideas se valoraron pero se descartaron en favor del Plan D actual. Mantenidas por si se reactivan en fase 2:

- **Plan B**: Pre-CAD para PYMEs reformas/cocinas
- **Plan C**: Servicio impresión 3D bajo demanda con IA
- **Plan E**: AI Drawing Reviewer / Validator de planos
- **Plan F**: Asistente IA cumplimiento normativo CE/ATEX/ISO
- **Plan G**: AI Predictive Maintenance industrial

**Idea de upsell futuro a considerar tras Plan D consolidado:** módulo de maqueta 3D física como premium para clientes existentes (subcontratando a print farms, sin invertir en hardware propio inicialmente).

---

## CÓMO USAR ESTE ARCHIVO

**Al iniciar conversación nueva con Claude Code, Cursor o Gemini:**

```
Adjunto el archivo CONTEXT.md del proyecto en el que estoy trabajando. 
Léelo entero antes de responder. Tu tarea concreta de hoy es: [tarea]
```

**Al iniciar conversación con Perplexity Max:**

No es necesario adjuntarlo (Perplexity es para research, no contexto de proyecto). Pero sí mantener clara la pregunta concreta a resolver.

---

**Última actualización:** [fecha del momento de creación]
**Próxima revisión:** cuando cambie el modelo de negocio o el stack
