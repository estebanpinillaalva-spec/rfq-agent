# 🚀 Proyecto RFQ AI Agent — Guía de Uso

Bienvenido Esteban. Este es tu sistema operativo completo para construir el negocio. Léelo entero la primera vez, después solo consultas las secciones que necesitas.

---

## 📂 ESTRUCTURA DEL SISTEMA

Has recibido 5 SKILLs profesionales más todo el contexto necesario. Esto es lo que tienes:

### Skills (en `skills/`)

1. **`validar-plano`** — Pre-validación rápida de plano técnico. **Úsala SIEMPRE antes de procesar.**
2. **`procesar-rfq`** — El núcleo. Análisis técnico completo del RFQ.
3. **`generar-presupuesto`** — Convierte análisis en presupuesto comercial.
4. **`prospectar-linkedin`** — Sesión semanal de captación B2B.
5. **`investigar-prospecto`** — Dossier pre-llamada de cada prospecto importante.

### Documentación (en `docs/`)

- **`CONTEXT.md`** — TU CEREBRO EXTERNO. Adjúntalo en cada conversación nueva con cualquier IA.

### Operativa (en `prospectos/`)

- **`pipeline.csv`** — Tu CRM gratis en CSV. Una fila por empresa contactada.

---

## 🎯 CÓMO USAR LAS SKILLS DÍA A DÍA

### Escenario A — Llega un RFQ por email

```
PASO 1: Abrir Gemini Pro (https://aistudio.google.com)
        Adjuntar SKILL: validar-plano/SKILL.md
        Adjuntar plano(s) del cliente
        Pegar email del cliente
        Decir: "Valida este plano según la skill"
        ↓
        Output: ✅ PROCESABLE / ⚠️ DUDOSO / ❌ NO PROCESABLE
        ↓
        Si ❌: copias el email generado y respondes al cliente
        Si ✅ o ⚠️: continuas al PASO 2

PASO 2: En la misma sesión Gemini
        Adjuntar SKILL: procesar-rfq/SKILL.md
        Decir: "Procesa el RFQ según la skill"
        ↓
        Output: análisis-rfq.md estructurado completo
        ↓
        Tú revisas 5 minutos. Validar material, cantidades, ambigüedades.

PASO 3: Abrir Claude Code (o Claude.ai)
        Adjuntar CONTEXT.md (siempre)
        Adjuntar SKILL: generar-presupuesto/SKILL.md
        Adjuntar el análisis-rfq.md del paso 2
        Adjuntar config-taller.md (precios, márgenes del taller)
        Decir: "Genera presupuesto borrador"
        ↓
        Output: presupuesto.md profesional

PASO 4: Revisas, exportas a PDF (Google Docs / Word), envías al cliente

TIEMPO TOTAL: 15-25 minutos vs 2-3 horas manual
```

### Escenario B — Sesión semanal de prospección

```
LUNES 09:00 — 4 horas bloqueadas

PASO 1: Abrir Claude Code
        Adjuntar CONTEXT.md
        Adjuntar SKILL: prospectar-linkedin/SKILL.md
        Decir: "Vamos a por la sesión semanal. Sector objetivo esta 
                semana: [mecanizado / calderería / etc]. Zona: [...]"
        ↓
        Claude te guía por todo el flujo: filtros, queries Perplexity, 
        personalización, plan envío.

PASO 2: Sales Navigator + Perplexity (paralelo)
        Generas lista de 25-30 prospectos cualificados con notas.

PASO 3: Personalización mensajes
        Con la skill cargada, Claude personaliza cada mensaje basado 
        en las notas Perplexity de cada empresa.

PASO 4: Programar envío
        Distribuyes en 2-3 días siguientes (max 30 invites/día LinkedIn).

PASO 5: Actualizar pipeline.csv
        Cada acción queda registrada.
```

### Escenario C — Tienes demo agendada con un prospecto

```
24-48h ANTES DE LA DEMO

PASO 1: Abrir Claude Code o Perplexity
        Adjuntar SKILL: investigar-prospecto/SKILL.md
        Decir: "Investiga [empresa] para mi demo del [fecha]"
        ↓
        Claude ejecuta los 8 pasos de research

PASO 2: Output → guardar en prospectos/investigaciones-perplexity/
        Archivo: [empresa]-[fecha].md

PASO 3: Leer el dossier 1h antes de la llamada
        Memorizar 2-3 hooks principales y el pitch específico.
```

---

## 🔥 LOS 3 ARCHIVOS MÁS IMPORTANTES

Si solo lees 3 archivos, que sean estos:

1. **`docs/CONTEXT.md`** — Adjúntalo SIEMPRE en cada conversación nueva con IA
2. **`skills/procesar-rfq/SKILL.md`** — La skill núcleo del producto
3. **`prospectos/pipeline.csv`** — Tu memoria comercial

---

## ⚙️ ARCHIVOS QUE FALTAN POR CREAR (lo harás tú o conmigo en próximas sesiones)

Para que las skills funcionen al 100%, necesitas crear estos archivos auxiliares:

### En `skills/procesar-rfq/referencias/`
- `plantilla-output.md` — La estructura exacta del análisis
- `plantilla-email-respuesta.md` — Plantillas de email al cliente
- `tabla-materiales.md` — Equivalencias de materiales normalizadas
- `tabla-tolerancias-iso.md` — ISO 2768, IT, GD&T
- `tabla-operaciones.md` — Lista de operaciones de fabricación

### En `skills/generar-presupuesto/referencias/`
- `plantilla-presupuesto.md` — Plantilla del presupuesto comercial
- `tabla-densidades.md` — Densidades de materiales
- `tabla-tiempos-operaciones.md` — Tiempos estándar
- `tabla-subcontratas.md` — Costes de subcontrata

### En `skills/generar-presupuesto/`
- `config-taller.md` — Datos específicos del taller cliente (POR CADA CLIENTE QUE ENTRE)

### En `skills/prospectar-linkedin/referencias/`
- `mensaje-base-linkedin.md`
- `mensaje-seguimiento.md`
- `email-frio.md`
- `follow-up.md`
- `filtros-sales-navigator.md`

**Estos archivos los iremos creando juntos cuando los necesites.** No te bloquean ahora porque las skills funcionan como base.

---

## 🛠️ FLUJO DE TRABAJO RECOMENDADO PRIMER MES

### Semana 1
- [ ] Activa GitHub Student Pack (mientras tanto sigue con todo lo demás)
- [ ] Lee CONTEXT.md y memoriza tu propio proyecto
- [ ] Lee las 5 SKILL.md una vez completas
- [ ] Sube esta carpeta entera a Google Drive (backup) y a GitHub (cuando lo tengas)
- [ ] Primer post en LinkedIn presentándote

### Semana 2
- [ ] Crea cuentas Vercel, Supabase, Resend, Google AI Studio
- [ ] Genera la landing usando el PROMPT MAESTRO #1 con Claude Code
- [ ] Crea pipeline.csv con primeros 30 prospectos investigados
- [ ] Ejecuta primera sesión de prospección (skill `prospectar-linkedin`)

### Semana 3-4
- [ ] Procesa los primeros RFQs MANUALMENTE con las skills (Wizard of Oz)
- [ ] Mide tiempos: cuánto tardas con la skill vs sin ella
- [ ] Documenta aprendizajes en `docs/LEARNINGS.md`
- [ ] Sigue prospección: 30 nuevos contactos/semana

---

## 📊 MÉTRICAS A TRACKEAR

Crea un archivo `docs/METRICAS.md` y actualízalo cada viernes:

```markdown
# Métricas semana [N]

## Comercial
- Prospectos contactados: [X]
- Tasa aceptación LinkedIn: [%]
- Demos agendadas: [X]
- Pilotos cerrados: [X]
- Clientes pagando: [X]
- MRR: [€]

## Operación (si ya hay clientes en piloto)
- RFQs procesados: [X]
- Tiempo medio por RFQ: [min]
- Errores reportados por cliente: [X]
- Satisfacción cualitativa: [comentarios]

## Aprendizajes clave
- [Lo más importante de la semana]
```

---

## ⚡ TIPS RÁPIDOS DE PRODUCTIVIDAD

1. **Bloquea slots de tiempo en el calendario** para cada actividad. Sin bloque = no pasa.
2. **Una IA por tarea**: no mezcles. Claude para razonamiento, Gemini para visión, Perplexity para research, Cursor para código.
3. **Adjunta CONTEXT.md SIEMPRE** al iniciar conversación nueva. Te ahorra reexplicar todo.
4. **Versiona tus skills**: si modificas un SKILL.md, anótalo en `docs/DECISIONS.md`.
5. **Backup en Google Drive + GitHub**: nunca pierdas esta carpeta.
6. **No optimices prematuramente**: usa las skills tal cual están un mes antes de cambiarlas.

---

## 🆘 SI TE BLOQUEAS

Vuelve a esta conversación con Claude y dime:
- En qué fase estás
- Qué intentaste hacer
- Qué resultado obtuviste
- Qué error o duda concreta tienes

Te desbloqueo. **El bloqueo no es fracaso, es información sobre qué falta en el sistema.**

---

## 🎯 FILOSOFÍA DEL SISTEMA

Tres principios que guían todo:

1. **Vender antes de construir** — el Wizard of Oz primero, el código después
2. **Skills > Prompts ad-hoc** — cualquier tarea que hagas más de 3 veces se convierte en skill
3. **Trazabilidad obligatoria** — todo dato técnico viene del plano, todo lead va al pipeline, todo aprendizaje al LEARNINGS.md

---

**Última actualización:** [fecha de creación]
**Versión sistema:** 1.0
**Próximas mejoras:** archivos de referencia auxiliares de cada skill
