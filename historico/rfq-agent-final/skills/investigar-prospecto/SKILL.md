---
name: investigar-prospecto
description: Genera dossier completo de un prospecto industrial antes de cualquier interacción comercial importante (demo, llamada, propuesta de piloto, mensaje muy personalizado). Úsala 24-48h antes de cada cita con un prospecto — incluso si el usuario solo dice "investiga esta empresa", "prepara la llamada con [empresa]", "tengo demo el jueves", "voy a contactar a [Empresa]". Activa también automáticamente antes de generar mensajes muy personalizados o tras respuestas positivas a contacto inicial. Output: dossier de 1-2 páginas con datos corporativos, decisores, capacidades técnicas, hooks específicos para conversación y pitch adaptado a esa empresa concreta.
---

# Investigar prospecto

Dossier comercial profundo previo a interacción importante. Multiplica la tasa de cierre porque el prospecto siente que conoces su empresa.

## Cuándo activar

Activa cuando:
- Hay demo agendada en 24-48h
- Antes de personalizar mensaje LinkedIn / email importante
- Antes de proponer pilot a prospecto interesado
- Tras respuesta positiva al contacto inicial
- Cuando el ticket potencial es alto y conviene preparación

## Output

Dossier en formato Markdown guardado en `prospectos/investigaciones-perplexity/[empresa]-[fecha].md` con estructura completa de `references/plantilla-dossier.md`. Incluye:

1. **Snapshot ejecutivo** (1 párrafo)
2. **Datos corporativos**
3. **Capacidades técnicas**
4. **Decisores y stakeholders**
5. **Sectores cliente y casos de uso**
6. **Noticias y movimientos recientes**
7. **Hooks personalizados** (3-5 ángulos de conversación)
8. **Riesgos / red flags**
9. **Pitch específico** para esta empresa concreta

## Flujo de trabajo (45-60 min total)

### Paso 1 — Datos corporativos (5 min, Perplexity)

Lanza query inicial sobre razón social, fundación, localización, tamaño, estructura societaria, web y redes. Plantilla en `references/queries-perplexity.md`.

### Paso 2 — Capacidades técnicas (10 min)

Investiga procesos in-house, maquinaria, materiales, certificaciones, capacidad declarada, software de gestión. Esto es CRÍTICO para identificar encaje.

### Paso 3 — Decisores (10 min, LinkedIn + Perplexity)

Identifica 3-5 personas clave:
- CEO / Director General / Owner — decisor final
- Director de Operaciones — sufre el dolor del RFQ a diario
- Director Comercial — mide el cierre como KPI
- Responsable de Ofertas — usuario directo
- Director Técnico — validador técnico

Para cada uno: nombre, cargo, antigüedad, empresas anteriores, formación, actividad LinkedIn.

### Paso 4 — Sectores cliente (5 min)

Identifica industrias cliente (auto, aero, ferroviario, máquina herramienta, energía, food, pharma), clientes de referencia mencionados, mercados geográficos.

### Paso 5 — Noticias recientes (10 min)

Últimos 18 meses: inversiones, crecimiento de plantilla, contratos ganados, premios, apariciones en prensa sectorial, cambios dirección, M&A. Fuentes habituales: Interempresas, Metales y Metalurgia, Tecnipublicaciones.

### Paso 6 — Análisis de encaje (15 min)

Cruza todos los datos y deduce:

**Síntomas de dolor por RFQ alto:**
- Mucha variedad de cliente final → muchos RFQs distintos
- Certificación aero/auto → RFQs muy técnicos
- Crecimiento rápido → procesos saturados
- Poca gente comercial visible → cuellos de botella
- Sin software de quoting visible → procesando a mano

**Síntomas de NO encaje:**
- Software de quoting ya implementado
- <10 personas (volumen RFQ probablemente bajo)
- Problemas financieros
- Distribuidoras puras

### Paso 7 — Hooks personalizados

Genera 3-5 ángulos de conversación específicos. Ver ejemplos en `references/ejemplos-hooks.md`.

### Paso 8 — Pitch específico

Adapta el pitch genérico al contexto concreto. Ejemplo: 
- Genérico: "Procesamos RFQs en 15 min vs 2-3h"
- Específico aero: "Vuestros RFQs aero llevan probablemente 3-5h cada uno por la trazabilidad de material, ITP, certificados 3.1/3.2, y análisis de tolerancias críticas. Mi agente IA hace ese trabajo en 20 minutos manteniendo el rigor: extrae GD&T, detecta cotas críticas que requieren ITP, identifica si el material necesita certificado 3.2..."

### Paso 9 — Red flags

Anota:
- Mala experiencia previa con software / digitalización
- Tensiones laborales
- Estructura familiar muy conservadora
- Competencia que ya use solución parecida
- Cliente final en sector regulado donde la confidencialidad es crítica

## Reglas críticas

- Tiempo máximo de la skill: 45-60 minutos. Más allá es over-investigation.
- Fuentes verificables siempre: nada de inventos, todo trazado.
- Enfoca en la persona Y la empresa: no solo la empresa.
- El dossier es para TI, no para el cliente: nivel de detalle interno.
- Hooks específicos (no "trabajáis con piezas mecanizadas").
- Pitch debe sonar a "investigué tu empresa" sin parecer stalker.
- Si encaje es BAJO: documenta, no pierdas tiempo en demo.

## Errores frecuentes a evitar

- Hacer dossier de 10 páginas (overkill, pérdida de tiempo)
- No identificar al decisor real
- Hooks genéricos
- No revisar LinkedIn personal del contacto
- No anotar red flags (luego sorprenderse)
- Investigar empresas que claramente no encajan

## Recursos

- `references/plantilla-dossier.md` — Plantilla completa del documento
- `references/queries-perplexity.md` — Queries optimizadas para Perplexity
- `references/ejemplos-hooks.md` — Ejemplos de hooks por sector y certificación
- `references/red-flags.md` — Lista completa de señales de no-encaje
