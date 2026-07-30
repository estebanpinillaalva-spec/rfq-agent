---
name: prospectar-linkedin
description: Use this skill for B2B LinkedIn prospecting sessions targeting Spanish mechanical workshops, machining shops, sheet metal fabricators, decoletaje, calderería, welding shops, and industrial subcontractors. Trigger when the user says "vamos a prospectar", "buscar talleres", "lista de prospectos", "prospección semanal", "encontrar leads", "investigar empresas industriales", or wants to plan/execute a commercial outreach session. Also trigger when the user mentions Sales Navigator, LinkedIn outreach, cold email to industrial companies, or generating personalized B2B messages for the Spanish manufacturing sector. The skill produces a qualified prospect list with personalized outreach messages and a tracking pipeline ready to execute.
---

# Prospectar LinkedIn — Sesión de Captación B2B Industrial

Skill para sesiones sistemáticas de prospección comercial dirigida a talleres mecánicos y fabricantes industriales españoles, vía LinkedIn (Sales Navigator preferiblemente) y email frío.

## Cuándo usar esta skill

Activar cuando:
- Inicio de sesión semanal de prospección
- Necesidad de generar lote de 20-30 prospectos nuevos
- Personalización de mensajes para sector industrial
- Investigación previa a contacto comercial
- Análisis de pipeline existente

## Output esperado

Conjunto de outputs en una sola sesión:

1. **CSV con prospectos cualificados** (`lote-[fecha].csv`) — 20-30 empresas
2. **Mensajes personalizados** — para cada prospecto, mensaje LinkedIn + email
3. **Plan de envío escalonado** — respetando límites de plataforma
4. **Updates al pipeline general** — `pipeline.csv` actualizado

## Pre-requisitos

Verifica que tienes:
- [ ] Acceso a LinkedIn (idealmente Sales Navigator)
- [ ] Acceso a Perplexity Max para enriquecimiento
- [ ] `pipeline.csv` actual (para no duplicar contactos)
- [ ] `mensajes-base.md` con plantillas (auto-generadas si no existen)
- [ ] Definición clara del sector objetivo de esta sesión

Si falta algún recurso, generarlo o solicitarlo al usuario antes de proceder.

## Sectores objetivo y CNAEs

Foco principal:

| Sector | CNAE | Características |
|--------|------|-----------------|
| Mecanizado / fabricación piezas | 2562 | Talleres CNC, decoletaje |
| Estructuras metálicas | 2511 | Calderería, estructuras industriales |
| Forja, estampación | 2550 | Conformado en frío y caliente |
| Otros productos metálicos | 2599 | Fabricación a medida diversa |
| Maquinaria especializada | 2899 | Fabricantes de máquinas a medida |
| Construcción de equipo eléctrico | 27xx | Cuadros, ensamblajes |
| Aero / Defensa subcontratistas | 30xx | Alta especialización, ticket alto |

## Filtros LinkedIn Sales Navigator (guardar como búsquedas)

### Filtro principal — "Talleres Mecanizado España"

```
Localización: España
Industria: 
  - Mechanical or Industrial Engineering
  - Machinery
  - Industrial Automation
  - Aviation & Aerospace (subcontract)
  - Automotive (subcontract)
Tamaño empresa: 11-50 + 51-200 empleados
Posición contacto: 
  - Director General / CEO / Gerente / Owner
  - Director de Operaciones / Operations Manager
  - Director Comercial / Sales Director
  - Responsable de Ofertas / Quoting Manager
  - Director Técnico / Technical Director
Antigüedad en cargo: <5 años (más receptivos a innovación)
```

### Filtro secundario — "Calderería / Soldadura"

```
Palabras clave: 
  caldereria OR "sheet metal" OR "metal fabrication" OR soldadura
Excluir: "instalaciones" OR "reformas" OR "construccion"
[Resto igual al filtro principal]
```

### Filtro avanzado — "Aero/Auto subcontractors"

```
Palabras clave: "aerospace supplier" OR "automotive tier" OR "AS9100" 
  OR "IATF 16949" OR "aero subcontract"
Tamaño empresa: 51-200 + 201-500
[Mayor ticket potencial]
```

## Flujo de trabajo de la sesión

### Paso 1 — Definir objetivo de la sesión (5 min)

- Sector/sectores a prospectar esta sesión
- Zona geográfica (todo España, una región, una provincia)
- Cantidad target: 20-30 prospectos nuevos
- Si hay foco específico (ej: "buscamos talleres con certificación ISO 9001")

### Paso 2 — Búsqueda en LinkedIn Sales Navigator (30 min)

Aplicar filtros guardados. Para cada empresa que aparece:

1. Comprobar contra `pipeline.csv` que NO está ya contactada
2. Si es nueva: anotar URL empresa + URL contacto principal
3. Verificar que el contacto sigue activo en la empresa

Objetivo: 30-40 candidatos brutos para filtrar luego.

### Paso 3 — Enriquecimiento con Perplexity Max (45 min)

Para cada empresa candidata, lanzar query a Perplexity:

```
Investiga la empresa [Nombre Empresa] (web: [url si la tienes]) 
ubicada en España. Necesito conocer:
1. Sector específico al que se dedican (mecanizado / calderería / etc)
2. Tamaño aproximado (empleados, facturación si pública)
3. Sectores cliente que sirven (automoción, aero, ferroviario, máquina herramienta...)
4. Certificaciones que tienen (ISO 9001, IATF 16949, EN 9100, AS9100...)
5. Maquinaria/capacidades técnicas si están en su web
6. Noticias recientes (últimos 12 meses)
7. Presencia digital y actividad en redes
8. Posibles dolores operativos detectables

Dame fuentes verificables.
```

Volcar respuestas a campo "notas" del CSV. Esto es crítico para la personalización.

### Paso 4 — Cualificación final (15 min)

Descartar de la lista:
- Empresas <10 empleados (probablemente no procesan suficientes RFQs)
- Empresas >500 empleados (proceso de venta enterprise, ciclo largo)
- Empresas que ya tienen software de quoting (Paperless Parts, DigiFabster, Tacton)
- Empresas en concurso de acreedores o problemas financieros
- Distribuidoras puras (no fabrican)

**Quedan**: 20-25 prospectos cualificados.

### Paso 5 — Personalización de mensajes (60 min)

Para cada prospecto, generar:

**A. Mensaje LinkedIn de conexión (300 caracteres máx)**

Estructura:
```
Hola [Nombre],

Soy Esteban, ingeniero mecánico [recién graduado / estudiante último año] 
en [universidad]. Estoy investigando cómo los talleres de [sector 
específico de ESTA empresa] están gestionando el volumen de RFQs con IA.

Vi que [hook personalizado: certificación / cliente conocido / 
maquinaria especial / noticia reciente]. Me encantaría conectar.

Sin compromiso.

Esteban
```

**B. Mensaje de seguimiento si aceptan (mensaje #2)**

Plantilla en `referencias/mensaje-seguimiento.md`, personalizar el "hook" técnico.

**C. Email frío alternativo**

Plantilla en `referencias/email-frio.md`, ajustar según sector.

### Paso 6 — Plan de envío escalonado

LinkedIn limita a ~30 invitaciones/día (más es spam y te limitan).

Distribuir los 25 prospectos:

| Día | Acción | Cantidad |
|-----|--------|----------|
| Lunes | Invitaciones LinkedIn lote A | 12 |
| Martes | Invitaciones LinkedIn lote B + emails fríos a no-conectados | 13 LI + 5 email |
| Miércoles | Mensajes #2 a quienes aceptaron lote A | variable |
| Jueves | Mensajes #2 a quienes aceptaron lote B | variable |
| Viernes | Follow-ups (recordatorio si no responden a #2 desde lunes) | variable |

### Paso 7 — Actualización del pipeline

Actualizar `pipeline.csv` con cada acción:

Columnas obligatorias:
- empresa
- contacto (nombre completo)
- cargo
- email
- url_linkedin
- sector_especifico
- tamaño_empleados
- certificaciones
- web
- notas_perplexity
- fecha_contacto_1
- canal (LinkedIn / Email)
- estado (Pendiente envío / Enviado / Aceptado / Respondido / Demo agendada / Piloto / Cliente / Descartado)
- proxima_accion
- fecha_proxima_accion
- razon_descarte (si aplica)

## Plantillas base de mensajes

### Mensaje #1 LinkedIn (conexión)

Ver bloque B del Paso 5. Personalizar SIEMPRE el hook con info de Perplexity.

### Mensaje #2 LinkedIn (post-conexión)

```
¡Gracias por aceptar [Nombre]!

Te lanzo el contexto rápido:

He construido un agente IA que procesa los RFQs entrantes de un taller 
en 10-15 minutos en lugar de las 2-3 horas habituales. Lee el email 
+ los planos PDF/STEP, extrae automáticamente material, tolerancias, 
operaciones y geometría, y genera un borrador de presupuesto que 
vuestro estimador solo tiene que validar.

Especialmente útil para talleres como [empresa] que [hook personalizado].

Estoy buscando 3-5 talleres dispuestos a probarlo GRATIS durante 
2 semanas, a cambio de feedback honesto. Sin coste, sin permanencia.

¿Te encajaría una llamada de 15 min esta semana o la siguiente?

Esteban
```

### Email frío

```
Asunto: Procesamiento de RFQs en 15 min - prueba gratuita 
(Esteban, ingeniero mecánico)

Hola [Nombre],

Te escribo directamente porque [empresa] hace [sector específico] y 
probablemente recibís 20+ RFQs/semana que vuestros estimadores 
procesan a mano.

Soy ingeniero mecánico. He montado una herramienta IA que automatiza 
ese trabajo: lee email + planos PDF, extrae specs y genera borrador 
de presupuesto en minutos.

Estoy haciendo pruebas piloto GRATIS con 3 talleres este mes. Cero 
coste, cero compromiso, solo feedback.

Si te interesa probarlo con 5 RFQs vuestros para ver el resultado, 
respóndeme a este email o agenda directamente: [link Calendly]

Saludos,
Esteban [Apellido]
Ingeniero mecánico | [link landing]
```

### Follow-up (3-5 días después si no responden)

```
Hola [Nombre],

Te dejo este recordatorio por si se te traspapeló mi mensaje anterior.

Sigue en pie la prueba gratuita de 2 semanas para automatizar el 
procesamiento de vuestros RFQs.

Si ahora no es buen momento, dímelo y te dejo de molestar.

Saludos,
Esteban
```

## Reglas críticas

1. **NUNCA copy-paste genérico**. Personalización mínima del hook con datos de Perplexity
2. **Respetar límites LinkedIn**: max 30 invitaciones/día
3. **Excluir empresas ya contactadas**: revisar SIEMPRE pipeline.csv antes
4. **Ser ingeniero mecánico es tu credibilidad**: usarlo en el primer contacto
5. **Posicionamiento "investigando" / "estudiando"**: baja la guardia comercial
6. **Sin compromiso, gratis, feedback** son las 3 palabras mágicas del primer mensaje
7. **Una conversación = una oportunidad**: no quemar prospectos con malos mensajes
8. **Tracking obligatorio**: todo va al pipeline.csv, sin excepciones

## Métricas a trackear

Por cada lote semanal, calcular:

- Tasa aceptación LinkedIn: invitaciones aceptadas / enviadas (objetivo 25-35%)
- Tasa respuesta mensaje #2: respuestas / aceptaciones (objetivo 15-25%)
- Tasa demo agendada: demos / respuestas (objetivo 30-40%)
- Tasa demo → piloto: pilotos / demos (objetivo 30-50%)

Si una métrica está por debajo del objetivo durante 2 semanas, ITERAR el mensaje correspondiente. Ver `referencias/iteracion-mensajes.md` para metodología A/B.

## Recursos

- `referencias/mensaje-base-linkedin.md` — Plantilla mensaje #1
- `referencias/mensaje-seguimiento.md` — Plantilla mensaje #2
- `referencias/email-frio.md` — Plantilla email frío
- `referencias/follow-up.md` — Plantilla follow-up
- `referencias/filtros-sales-navigator.md` — Filtros guardados
- `referencias/iteracion-mensajes.md` — Cómo iterar mensajes con datos
- `pipeline.csv` — CRM en CSV (ubicación: `/prospectos/pipeline.csv`)

## Errores frecuentes a evitar

- Spam genérico copy-paste a 100 contactos
- No personalizar el hook con info real de la empresa
- Saltarse el enriquecimiento con Perplexity (clave para personalizar)
- Contactar a contactos no decisores (operarios, becarios)
- Mandar mensaje comercial DURO en la primera conexión
- No actualizar pipeline.csv (perder track de quién está en qué fase)
- Vender en vez de generar conversación
- Saltar el follow-up (50% de respuestas vienen del 2º contacto)

## Tiempo objetivo de la sesión completa

**3-4 horas** para una sesión semanal completa. Distribuir:
- 30 min: definir foco
- 30 min: búsqueda LinkedIn
- 45 min: enriquecimiento Perplexity
- 60 min: personalización mensajes
- 30 min: programación envío
- 15 min: actualización pipeline
