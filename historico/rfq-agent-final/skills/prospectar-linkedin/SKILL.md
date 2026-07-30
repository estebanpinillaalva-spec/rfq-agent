---
name: prospectar-linkedin
description: Genera lotes de prospectos B2B cualificados (talleres mecánicos, fabricantes industriales españoles) con mensajes personalizados listos para enviar en LinkedIn y email. Úsala en cada sesión semanal de prospección comercial — incluso si el usuario solo dice "vamos a prospectar", "buscar talleres", "lista de empresas industriales", "envía mensajes", "sesión comercial". Activa también con menciones a Sales Navigator, "outreach", "leads", "captación B2B España", o cuando el usuario quiere planificar/ejecutar acciones comerciales para el sector de mecanizado, calderería, decoletaje, soldadura. Output: CSV de 20-30 prospectos cualificados con mensajes únicos, plan de envío escalonado y pipeline.csv actualizado.
---

# Prospectar LinkedIn

Sesión sistemática de captación B2B. Identifica 20-30 talleres cualificados, los enriquece con research, genera mensajes personalizados y planifica el envío respetando límites de plataforma.

## Cuándo activar

Activa para sesiones de:
- Captación semanal sistemática (lunes/jueves típicamente)
- Generación de lote nuevo de 20-30 prospectos
- Personalización de mensajes para el sector industrial
- Análisis de pipeline existente y siguiente acción

## Pre-requisitos

Verifica disponibilidad de:
- Acceso LinkedIn (idealmente Sales Navigator activo)
- Acceso a Perplexity Max para enriquecimiento
- `pipeline.csv` actual para no duplicar contactos
- Definición clara del sector objetivo de la sesión

Si falta algún recurso: solicítalo o ayúdale al usuario a conseguirlo antes de proceder.

## Output de la sesión

1. **CSV con prospectos cualificados** (`prospectos/lote-[fecha].csv`) — 20-30 empresas
2. **Mensajes personalizados únicos** — LinkedIn + email para cada uno
3. **Plan de envío escalonado** — respetando límites de LinkedIn
4. **Pipeline actualizado** — `pipeline.csv` con nuevas filas

## Sectores objetivo y CNAEs

| Sector | CNAE | Características |
|--------|------|-----------------|
| Mecanizado / piezas | 2562 | Talleres CNC, decoletaje |
| Estructuras metálicas | 2511 | Calderería, estructuras industriales |
| Forja, estampación | 2550 | Conformado en frío y caliente |
| Otros productos metálicos | 2599 | Fabricación a medida diversa |
| Maquinaria especializada | 2899 | Fabricantes de máquinas a medida |
| Aero / Defensa subcontratistas | 30xx | Alta especialización, ticket alto |

Filtros completos para Sales Navigator en `references/filtros-sales-navigator.md`.

## Flujo de trabajo (3-4 horas total)

### Paso 1 — Definir foco (5 min)

Aclara antes de empezar:
- Sector objetivo de esta sesión
- Zona geográfica (todo España, una región, una provincia)
- Cantidad target: 20-30 prospectos
- Foco específico opcional (ej. "talleres con ISO 9001 + IATF 16949")

### Paso 2 — Búsqueda en LinkedIn Sales Navigator (30 min)

Aplica filtros guardados. Para cada empresa:
1. Comprueba contra `pipeline.csv` que NO está ya contactada
2. Si es nueva: anota URL empresa + URL contacto principal
3. Verifica que el contacto sigue activo en la empresa

Objetivo: 30-40 candidatos brutos para filtrar.

### Paso 3 — Enriquecimiento con Perplexity Max (45 min)

Para cada empresa candidata, lanza la query estándar (ver `references/queries-enriquecimiento.md`). Datos clave a obtener:
- Sector específico (mecanizado / calderería / etc)
- Tamaño aproximado (empleados, facturación)
- Sectores cliente que sirven (auto, aero, ferroviario, máquina herramienta)
- Certificaciones (ISO 9001, IATF 16949, EN 9100, AS9100)
- Maquinaria/capacidades técnicas
- Noticias recientes (12 meses)
- Posibles dolores operativos detectables

Volca a campo "notas" del CSV. **Esto es crítico para la personalización**.

### Paso 4 — Cualificación final (15 min)

Descarta:
- Empresas <10 empleados (poco volumen RFQ)
- Empresas >500 empleados (proceso enterprise, ciclo largo)
- Empresas con software de quoting ya implementado
- Empresas en concurso o problemas financieros
- Distribuidoras puras (no fabrican)

Quedan: 20-25 prospectos cualificados.

### Paso 5 — Personalización de mensajes (60 min)

Para cada prospecto, genera:

**A. Mensaje LinkedIn de conexión** (300 caracteres máx)
Plantilla base + hook personalizado de las notas Perplexity. Ver `references/mensaje-linkedin.md`.

**B. Mensaje de seguimiento si aceptan** (mensaje #2)
Más detallado, presenta la oferta. Ver `references/mensaje-seguimiento.md`.

**C. Email frío alternativo**
Para los que no usan LinkedIn activamente. Ver `references/email-frio.md`.

### Paso 6 — Plan de envío escalonado

LinkedIn limita a ~30 invitaciones/día. Para 25 prospectos:

| Día | Acción | Cantidad |
|-----|--------|----------|
| Lunes | Invitaciones LinkedIn lote A | 12 |
| Martes | Invitaciones LinkedIn lote B + emails fríos | 13 LI + 5 email |
| Miércoles | Mensajes #2 a quienes aceptaron lote A | variable |
| Jueves | Mensajes #2 a quienes aceptaron lote B | variable |
| Viernes | Follow-ups y respuestas | variable |

### Paso 7 — Actualización del pipeline

Actualiza `pipeline.csv` con cada acción. Columnas obligatorias en `references/estructura-pipeline.md`.

## Reglas críticas

- Nunca copy-paste genérico. Personalización mínima del hook con datos reales de Perplexity sobre la empresa.
- Respeta límites LinkedIn: 30 invitaciones/día máx.
- Excluye empresas ya contactadas (revisa pipeline.csv siempre antes).
- Tu credibilidad es ser ingeniero mecánico. Úsala en el primer contacto.
- Posicionamiento "investigando" / "estudiando" baja la guardia comercial.
- Las palabras mágicas del primer mensaje: "sin compromiso", "gratis", "feedback".
- Una conversación = una oportunidad. No quemes prospectos con malos mensajes.
- Tracking obligatorio: todo va al pipeline.csv sin excepciones.

## Métricas a trackear semanalmente

Por cada lote:
- Tasa aceptación LinkedIn: aceptadas / enviadas (objetivo 25-35%)
- Tasa respuesta mensaje #2: respuestas / aceptaciones (objetivo 15-25%)
- Tasa demo agendada: demos / respuestas (objetivo 30-40%)
- Tasa demo → piloto: pilotos / demos (objetivo 30-50%)

Si una métrica está 2 semanas por debajo del objetivo: iterar el mensaje correspondiente.

## Errores frecuentes a evitar

- Spam genérico copy-paste a 100 contactos
- No personalizar el hook con info real de Perplexity
- Saltarse el enriquecimiento con Perplexity
- Contactar a no-decisores (operarios, becarios)
- Mandar mensaje comercial duro en la primera conexión
- No actualizar pipeline.csv (perder track de fases)
- Vender en vez de generar conversación
- Saltar el follow-up (50% de respuestas vienen del 2º contacto)

## Tiempo objetivo de la sesión completa

3-4 horas para una sesión semanal completa, distribuidas así:
- 30 min: definir foco
- 30 min: búsqueda LinkedIn
- 45 min: enriquecimiento Perplexity
- 60 min: personalización mensajes
- 30 min: programación envío
- 15 min: actualización pipeline

## Recursos

- `references/filtros-sales-navigator.md` — Filtros guardados para Sales Navigator
- `references/queries-enriquecimiento.md` — Queries estándar para Perplexity
- `references/mensaje-linkedin.md` — Plantilla mensaje #1 conexión
- `references/mensaje-seguimiento.md` — Plantilla mensaje #2 post-conexión
- `references/email-frio.md` — Plantilla email frío B2B
- `references/follow-up.md` — Plantilla recordatorio 3-5 días después
- `references/estructura-pipeline.md` — Columnas y estados del pipeline.csv
