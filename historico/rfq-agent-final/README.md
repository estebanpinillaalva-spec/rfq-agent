# RFQ Agent

Agente IA email-native para automatizar presupuestos en talleres mecánicos españoles.

---

## 🚀 Arrancar con Claude Code (sigue estos pasos en orden)

### 1. Instalar dependencias globales (una sola vez)

```bash
# Instalar Node.js LTS desde nodejs.org, luego:
npm install -g claude   # Claude Code CLI
```

### 2. Clonar / abrir el proyecto

```bash
# Si ya tienes la carpeta descargada:
cd rfq-agent-final

# Instalar dependencias del proyecto:
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
# Abre .env.local y rellena las claves (ver sección de servicios abajo)
```

### 4. Configurar Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto
2. Ve a **SQL Editor** y pega el contenido de `docs/supabase-schema.sql`
3. Ve a **Storage** → New bucket → nombre: `planos`, público: ✅
4. Copia las claves en `.env.local`

### 5. Arrancar Claude Code

```bash
# Desde la raíz del proyecto:
claude
```

Claude Code detectará `CLAUDE.md` automáticamente y tendrá todo el contexto del proyecto.

---

## 🎯 Primer prompt en Claude Code

Cuando se abra, pega esto:

```
Lee el archivo CLAUDE.md completo.

Estoy en el Sprint 1. Quiero arrancar con la tarea de hoy.
Muéstrame el estado actual del proyecto y dime qué implementamos primero
siguiendo el ROADMAP.md.

Usa /brainstorm para planificar antes de escribir código.
```

---

## 📋 Servicios a configurar (todos gratuitos al inicio)

| Servicio | URL | Para qué | Coste |
|----------|-----|----------|-------|
| Supabase | supabase.com | BD + Auth + Storage | Gratis |
| Vercel | vercel.com | Hosting | Gratis |
| Resend | resend.com | Emails entrantes y salientes | Gratis hasta 3k/mes |
| Google AI Studio | aistudio.google.com | Gemini API para planos | Gratis 50 req/día |
| Anthropic Console | console.anthropic.com | Claude API para presupuestos | ~15€/mes |
| GitHub | github.com | Repositorio | Gratis |

**Total primer mes: 0-15€**

---

## 📁 Estructura del proyecto

```
rfq-agent-final/
│
├── CLAUDE.md              ← LEE ESTO PRIMERO — contexto para Claude Code
├── .env.example           ← Plantilla de variables de entorno
│
├── skills/                ← Las 5 skills del negocio
│   ├── validar-plano/     ← Pre-filtro de calidad de planos
│   ├── procesar-rfq/      ← Análisis técnico completo
│   ├── generar-presupuesto/ ← Documento comercial
│   ├── prospectar-linkedin/ ← Captación B2B
│   └── investigar-prospecto/ ← Dossier pre-demo
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── inbound-email/  ← Webhook: recibe emails de Resend
│   │   │   └── process-rfq/    ← Motor de procesamiento async
│   │   └── dashboard/          ← Panel del taller (Sprint 3)
│   ├── lib/
│   │   ├── supabase.ts   ← Cliente BD
│   │   ├── claude.ts     ← Cliente Claude API
│   │   ├── gemini.ts     ← Cliente Gemini (visión de planos)
│   │   └── resend.ts     ← Cliente email
│   └── types/index.ts    ← Tipos TypeScript compartidos
│
├── docs/
│   ├── ROADMAP.md         ← Plan de 4 sprints
│   ├── WORKFLOW.md        ← Cómo usar las herramientas día a día
│   ├── ARCHITECTURE.md    ← Decisiones técnicas
│   ├── SPRINT1_TAREAS.md  ← Tareas de esta semana para GSD
│   └── supabase-schema.sql ← Migraciones de BD
│
└── prospectos/
    └── pipeline.csv       ← Tu CRM en CSV
```

---

## 🔄 Flujo del producto

```
1. Cliente envía RFQ por email al taller (planos PDF + descripción)
2. Estimador reenvía a: rfq-tu-taller@tudominio.com
3. Resend Inbound → webhook → /api/inbound-email
4. Sistema procesa en background:
   - Valida calidad de planos (skill validar-plano + Gemini)
   - Extrae specs técnicas (skill procesar-rfq + Gemini)
   - Genera presupuesto (skill generar-presupuesto + Claude)
5. Estimador recibe email con análisis + PDF en 5-15 minutos
6. Valida, ajusta y envía al cliente final
```

---

## 📅 Estado del proyecto

- **Sprint actual:** 1 — Setup base
- **Clientes activos:** 0
- **MVP completado:** ~20% (estructura + tipos + APIs base)

Ver `docs/ROADMAP.md` para el plan completo.

---

## 🛠️ Comandos útiles

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run typecheck    # Verificar tipos sin compilar
npm run lint         # ESLint
npm run build        # Build de producción
```

Para probar el webhook localmente:
```bash
# Instalar ngrok para exponer localhost
npx ngrok http 3000
# Usar la URL de ngrok como webhook en Resend
```
