---
name: investigar-prospecto
description: Use this skill BEFORE any sales call, demo, or important commercial interaction with a prospective client (Spanish industrial workshop or manufacturer) to gather deep context that enables a personalized, high-conversion conversation. Trigger when the user says "investiga esta empresa", "prepara llamada con", "research sobre", "tengo demo con [empresa]", "voy a contactar a [empresa]", or similar. Also trigger automatically before generating personalized outreach messages or before scheduled meetings appearing in the pipeline. The skill produces a complete dossier with company background, decision-makers, technical capabilities, recent news, and personalized conversation hooks for the upcoming interaction.
---

# Investigar Prospecto — Dossier Comercial Pre-llamada

Skill rápida que produce un dossier completo de un prospecto industrial antes de una interacción comercial importante (llamada, demo, email personalizado). Multiplica la tasa de cierre porque el prospecto siente que conoces su empresa.

## Cuándo usar esta skill

Activar:
- 24-48h antes de una demo o llamada agendada
- Antes de personalizar un mensaje LinkedIn / email importante
- Antes de proponer pilot a un prospecto interesado
- Después de que un prospecto responda positivamente a contacto inicial

## Output esperado

Dossier en formato Markdown (`investigaciones-perplexity/[empresa]-[fecha].md`) con:

1. **Snapshot ejecutivo** (1 párrafo)
2. **Datos corporativos**
3. **Capacidades técnicas** (lo más relevante)
4. **Decisores y stakeholders**
5. **Sectores cliente y casos de uso**
6. **Noticias y movimientos recientes**
7. **Hooks personalizados** (3-5 ángulos para conversación)
8. **Riesgos / red flags**
9. **Pitch específico** para esta empresa

## Flujo de trabajo

### Paso 1 — Datos básicos (5 min, Perplexity)

Lanzar query inicial:

```
Investigación corporativa de [Empresa] (web: [url]) en España.
Datos que necesito:

1. Razón social completa, CIF/NIF
2. Año de fundación
3. Localización (provincia, ciudad)
4. Tamaño: empleados, facturación si pública
5. Estructura societaria (familiar, grupo, fondo)
6. Histórico básico (¿son fabricantes desde siempre?, ¿pivot reciente?)
7. Web oficial y perfiles redes sociales
8. Datos de contacto (email general, teléfono central)

Dame fuentes verificables (eInforma, Axesor, web oficial, BORME).
```

### Paso 2 — Capacidades técnicas (10 min, Perplexity + web propia)

```
Investigación técnica de [Empresa]:

1. ¿Qué fabrican exactamente? Productos / servicios principales
2. ¿Qué procesos tienen in-house? (mecanizado, soldadura, montaje, 
   pintura, tratamientos...)
3. Maquinaria visible en su web o redes (modelos específicos si 
   aparecen)
4. Materiales con los que trabajan (aceros, aluminios, inox, 
   especiales...)
5. Tipo de fabricación: serie corta / media / larga, prototipos, 
   one-offs
6. Certificaciones que tienen (ISO 9001, IATF 16949, EN 9100, AS9100, 
   ISO 14001, OHSAS 18001, sectoriales)
7. Capacidad declarada (si la mencionan en web)
8. ¿Tienen ya algún software de gestión de ofertas / quoting?

Dame fuentes y citas literales si las encuentras.
```

### Paso 3 — Decisores (10 min, LinkedIn + Perplexity)

Identificar 3-5 personas clave en LinkedIn:

| Cargo | Por qué es clave |
|-------|------------------|
| CEO / Director General / Owner | Decisor final, sobre todo en familiar |
| Director de Operaciones | Sufre el dolor del RFQ a diario |
| Director Comercial | Mide el cierre de RFQs como KPI |
| Responsable de Ofertas / Estimación | El usuario directo de la herramienta |
| Director Técnico / Ingeniería | Validador técnico de la solución |

Para cada persona:
- Nombre completo, cargo exacto
- Antigüedad en la empresa y en el cargo
- Empresas anteriores (revela perfil: ¿viene de gran empresa? ¿de competencia?)
- Formación
- Actividad reciente en LinkedIn (qué postea, qué le interesa)
- Nivel de "modernidad" digital (LinkedIn activo = abierto a innovación)

### Paso 4 — Sectores cliente (5 min)

```
¿A qué sectores sirve [Empresa]? Necesito:

1. Industrias cliente principales (automoción, aero, ferroviario, 
   máquina herramienta, energía, food, pharma...)
2. Clientes de referencia mencionados en web o casos de éxito
3. Mercados geográficos (sólo España, Europa, exporta?)
4. Tipo de relación cliente (subcontratación pura, colaboración 
   ingeniería, joint venture)

Dame fuentes.
```

### Paso 5 — Noticias y movimientos (10 min)

```
Noticias recientes (últimos 18 meses) sobre [Empresa]:

1. Inversiones declaradas (nueva nave, máquina, sede)
2. Crecimiento o reducción de plantilla
3. Nuevos contratos / clientes ganados
4. Premios, reconocimientos
5. Apariciones en prensa sectorial (Interempresas, Metales y Metalurgia, 
   Automática e Instrumentación, Tecnipublicaciones)
6. Cambios de dirección
7. Acuerdos, fusiones, adquisiciones
8. Problemas conocidos (concurso, regulatorios)

Dame URLs y fechas.
```

### Paso 6 — Análisis de dolor potencial (15 min)

Cruzar todos los datos anteriores y deducir:

**Síntomas de dolor por RFQ alto:**
- Empresas con mucha variedad de cliente final → muchos RFQs distintos
- Empresas con certificación aero/auto → RFQs muy técnicos y complejos
- Empresas con crecimiento rápido → procesos saturados
- Empresas con poca gente comercial visible en LinkedIn → cuellos de botella
- Empresas sin software de quoting visible → procesando a mano

**Síntomas de NO encaje:**
- Empresas con software de quoting ya implementado
- Empresas <10 personas (volumen RFQ probablemente bajo)
- Empresas en problemas financieros
- Distribuidoras puras (no fabrican)

### Paso 7 — Generación de hooks personalizados

Producir 3-5 ángulos de conversación específicos para esta empresa:

**Ejemplo de hooks para taller con certificación AS9100:**

1. *"Vi que tenéis AS9100. Los RFQs aero suelen llevar 3-4h cada uno por la trazabilidad y certificaciones. ¿Cómo lo gestionáis cuando os llegan 10 a la vez?"*

2. *"Trabajáis con [cliente aero declarado en web]. Sus RFQs históricamente exigen análisis muy profundo. ¿Cuántos cerráis vs cuántos respondéis?"*

3. *"Vi vuestra inversión en el centro de mecanizado de 5 ejes. Las piezas que pasan por ahí suelen tener planos densos. Procesar el RFQ debe ser casi tan complejo como mecanizar."*

### Paso 8 — Pitch específico

Adaptar el pitch genérico al contexto de ESTA empresa concreto:

**Pitch genérico:**
> Procesamos vuestros RFQs en 15 min en vez de 2-3 horas

**Pitch específico** (ejemplo aero):
> Vuestros RFQs aero llevan probablemente 3-5 horas cada uno por la trazabilidad de material, ITP, certificados 3.1/3.2, y análisis de tolerancias críticas. Mi agente IA hace ese trabajo en 20 minutos manteniendo todo el rigor: extrae GD&T, detecta cotas críticas que requieren ITP, identifica si el material necesita certificado 3.2, y genera la base del presupuesto con coste material trazado. Vuestro estimador solo valida y añade el margen específico del proyecto. Resultado: respondéis 4x más RFQs en aero sin contratar más ingeniería.

### Paso 9 — Riesgos / Red flags

Anotar aspectos que requieren cuidado:

- ¿Han tenido mala experiencia previa con software / digitalización?
- ¿Hay tensiones laborales conocidas?
- ¿Estructura familiar conservadora vs grupo profesionalizado?
- ¿Hay competencia directa que ya use solución parecida?
- ¿Cliente final en sector regulado donde la confidencialidad es crítica?

## Plantilla de output completo

```markdown
# DOSSIER: [Empresa]

**Fecha investigación:** [fecha]
**Tipo interacción:** [demo / llamada / email / cold]
**Fecha interacción prevista:** [fecha]
**Investigador:** Esteban

---

## SNAPSHOT EJECUTIVO

[1 párrafo de 4-6 líneas con lo esencial: quiénes son, qué hacen, 
tamaño, por qué encajan, hook principal]

---

## 1. DATOS CORPORATIVOS

- **Razón social:** ...
- **CIF:** ...
- **Fundación:** ...
- **Sede:** ...
- **Empleados:** ...
- **Facturación (estimada/declarada):** ...
- **Estructura societaria:** ...
- **Web:** ...
- **LinkedIn empresa:** ...

## 2. CAPACIDADES TÉCNICAS

### Procesos in-house
[Lista]

### Maquinaria destacable
[Lista con modelos si conocidos]

### Materiales
[Lista]

### Certificaciones
[Lista]

### Software de gestión actual
[Si se conoce]

## 3. DECISORES Y STAKEHOLDERS

### Decisor principal
- **Nombre:** ...
- **Cargo:** ...
- **LinkedIn:** ...
- **Antigüedad:** ...
- **Background:** ...
- **Actividad LinkedIn:** ...

### Otros stakeholders relevantes
[Repetir formato]

## 4. SECTORES CLIENTE

[Lista de sectores y clientes de referencia conocidos]

## 5. NOTICIAS RECIENTES

[Lista cronológica con fuentes]

## 6. ANÁLISIS DE ENCAJE

### Síntomas de dolor RFQ
[Lista]

### Síntomas de NO encaje (si los hay)
[Lista]

### Veredicto preliminar
[ALTO ENCAJE / ENCAJE MEDIO / BAJO ENCAJE / NO ENCAJA]

## 7. HOOKS PARA LA CONVERSACIÓN

### Hook 1: [Tema]
[Pregunta o frase específica]

### Hook 2: [Tema]
[Pregunta o frase específica]

### Hook 3: [Tema]
[Pregunta o frase específica]

## 8. PITCH ADAPTADO

[Pitch específico de 60-90 segundos para ESTA empresa, no genérico]

## 9. RIESGOS Y CUIDADOS

[Lista de cosas a tener en cuenta]

## 10. PRÓXIMAS ACCIONES SUGERIDAS

[1-3 acciones concretas para el seguimiento post-interacción]

---

**Fuentes consultadas:**
[Lista de URLs y referencias]
```

## Reglas críticas

1. **Tiempo máximo de la skill: 45-60 minutos**. Más allá es overinvestigation
2. **Fuentes verificables siempre**: nada de inventos, todo trazado
3. **Enfocarse en la persona Y la empresa**: no solo la empresa
4. **El dossier es para TI, no para el cliente**: nivel de detalle interno
5. **Hooks deben ser ESPECÍFICOS** (no "trabajáis con piezas mecanizadas")
6. **Pitch específico debe sonar a "investigué tu empresa"** sin parecer stalker
7. **Si encaje es BAJO**: documentarlo y NO perder tiempo en demo

## Recursos

- `referencias/plantilla-dossier.md` — Plantilla completa
- `referencias/queries-perplexity.md` — Queries optimizadas para reutilizar
- `referencias/red-flags.md` — Lista completa de señales de no-encaje

## Errores frecuentes a evitar

- Hacer dossier de 10 páginas (overkill, pérdida de tiempo)
- No identificar al decisor real (perder tiempo con stakeholder no-decisor)
- Hooks genéricos del estilo "veo que sois fabricantes industriales"
- No revisar LinkedIn personal del contacto (perder señales clave)
- No anotar red flags (luego sorprenderse en la demo)
- Investigar empresas que claramente no encajan (filtrar antes)
