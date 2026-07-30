---
name: procesar-rfq
description: Use this skill whenever a Request For Quotation (RFQ) arrives at a Spanish mechanical workshop or industrial manufacturer and needs to be processed - this includes any email with technical drawings (PDF, JPG, PNG, STEP, DXF) requesting a quote for machining, sheet metal, welding, decoletaje, or custom industrial fabrication. Trigger this skill whenever you see emails, drawings, or attachments with words like "presupuesto", "RFQ", "request for quotation", "petición de oferta", "consulta técnica", "fabricación a medida", or any technical drawing requesting a quote, even if the user does not explicitly say "process this RFQ". This skill extracts all technical specifications from the email and drawings, performs DFM analysis, and produces a structured technical analysis ready for the estimator to validate.
---

# Procesar RFQ — Análisis Técnico de Petición de Presupuesto

Esta skill convierte un RFQ (email + planos técnicos) en un análisis estructurado en español, listo para que el estimador del taller solo tenga que validar antes de generar el presupuesto.

## Cuándo usar esta skill

Activar siempre que llegue:
- Un email solicitando presupuesto con planos adjuntos (PDF, JPG, PNG, STEP, DXF, IGES)
- Una petición de oferta para fabricación de piezas mecánicas
- Cualquier consulta técnica con dibujos cotados que requiera estimación de coste

Idiomas soportados en input: español, inglés, francés, alemán, italiano, portugués.
Output siempre en español.

## Output esperado

Un análisis en formato Markdown estructurado siguiendo exactamente la plantilla en `referencias/plantilla-output.md`.

El análisis debe contener:
1. Datos del cliente y RFQ
2. Análisis técnico de cada pieza
3. Análisis DFM (Design For Manufacturing)
4. Estimación de complejidad (sin precios finales)
5. Borrador de respuesta al cliente

## Flujo de trabajo

### Paso 1 — Validación previa

Antes de procesar nada, confirma que tienes:
- [ ] Texto del email del cliente
- [ ] Al menos un plano legible (resolución suficiente, texto claro)
- [ ] Información mínima: cantidades o referencia a las mismas

Si falta algo crítico, NO inventes datos. En su lugar, genera un email solicitando la información faltante (ver `referencias/email-info-faltante.md`).

### Paso 2 — Análisis del email

Extrae del cuerpo del email:

**Datos del cliente:**
- Empresa (razón social completa)
- Persona de contacto (nombre, cargo si aparece)
- Email y teléfono
- Idioma original del email

**Datos comerciales:**
- Cantidades solicitadas (por referencia si hay varias piezas)
- Plazo de entrega requerido
- Condiciones especiales: certificaciones (ISO, IATF, EN9100), ITP, declaración de conformidad
- Repetición vs primera vez (mirar firma, histórico mencionado)
- Urgencia indicada
- Forma de pago si se menciona

**Notas técnicas en el email:**
- Material alternativo aceptado
- Acabados especiales
- Embalaje específico
- Lugar de entrega

### Paso 3 — Análisis de cada plano

Para CADA plano adjunto, extrae:

#### A. Identificación
- Denominación / nombre de la pieza
- Número de plano y revisión
- Escala
- Empresa emisora del plano (si aparece en cajetín)

#### B. Material
Identifica con designación normalizada:
- Aceros: F-114, F-1140, AISI 304L, AISI 316L, S235JR, S275JR, C45, 42CrMo4...
- Aluminios: AlMg3, EN AW-6082, EN AW-7075, AlSi10Mg...
- Otros: latón, bronce, cobre, plásticos técnicos (POM, PA, PEEK)

Si el material aparece en formato no estándar, normalízalo y aclara la equivalencia.

#### C. Dimensiones
- Generales: largo × ancho × alto, o ø × longitud para piezas cilíndricas
- Volumen aproximado (para estimación de material)
- Peso estimado si es relevante

#### D. Tolerancias
- **Generales**: ISO 2768 mK, ISO 2768 fK, etc.
- **Especiales / críticas**: cota a cota cuando estén indicadas con asterisco o en marco
- **GD&T detectado**: planitud, perpendicularidad, paralelismo, concentricidad, posición, cilindricidad, simetría, redondez, perfil, batimiento

#### E. Acabado superficial
- Rugosidad requerida (Ra en µm)
- Recubrimientos: anodizado, niquelado, cincado, cromado, pintura
- Color/RAL si aplica
- Tratamientos térmicos: temple, revenido, normalizado, recocido, cementación, nitruración

#### F. Operaciones requeridas (CRÍTICO)
Lista TODAS las operaciones necesarias en orden:
- Corte (sierra, plasma, láser, oxicorte, chorro de agua)
- Conformado (plegado, embutición, estampación, curvado)
- Mecanizado (torneado, fresado, taladrado, escariado, mandrinado, brochado)
- Roscado (interior, exterior, normalizado, especial)
- Soldadura (TIG, MIG/MAG, electrodo, por puntos, robot)
- Acabados (rectificado, lapeado, pulido, granallado, decapado)
- Tratamientos (a subcontratar generalmente)
- Montaje / ensamblaje

#### G. Características críticas
- Roscas: M6, M10, UNF 1/4-20, BSP, NPT (con designación completa: paso, dirección, profundidad)
- Chaveteros y chavetas
- Estriados
- Engranajes: módulo, número de dientes, ángulo de presión, calidad DIN
- Sellos, juntas, anillos elásticos
- Agujeros: ciegos vs pasantes, escariados, avellanados, refrentados

### Paso 4 — Análisis DFM (Design For Manufacturing)

Detecta y reporta:

**Riesgos de fabricación:**
- Tolerancias muy ajustadas sin justificación funcional aparente (IT5-IT6)
- Geometrías de difícil acceso para herramienta
- Espesores muy delgados (<1mm en chapa, <2mm en mecanizado)
- Aristas vivas no especificadas
- Rugosidades extremas (Ra <0.4µm) que requieren operaciones extra
- Materiales difíciles de mecanizar (titanio, inconel, hastelloy)

**Sugerencias de optimización (cuando sean evidentes):**
- Cambio de tolerancia general que no afecta función
- Sustitución de operación cara por equivalente más barato
- Material alternativo más económico con mismas propiedades
- Agrupación de operaciones para reducir cambios de utillaje

**Flag obligatorio:** Si detectas ambigüedad técnica seria, marca `⚠️ REQUIERE REVISIÓN HUMANA` en la sección correspondiente.

### Paso 5 — Estimación de complejidad

NO calcules precios finales. Indica:

**Nivel de complejidad** (BAJA / MEDIA / ALTA / MUY ALTA) basado en:
- Número de operaciones distintas
- Tolerancias y acabados requeridos
- Material
- Cantidad (one-off vs serie)

**Operaciones críticas** que marcarán el coste y plazo.

**Subcontrataciones necesarias:**
- Tratamientos térmicos
- Recubrimientos / pintura
- Operaciones que el taller no realice in-house (verificar con `config-taller.md` si está disponible)

**Tiempo estimado por pieza** (rangos en minutos, sin valor unitario monetario).

### Paso 6 — Borrador de respuesta al cliente

Genera siempre un email de respuesta en ESPAÑOL, profesional, dirigido al contacto del cliente. Dos variantes según el caso:

**A. Si no hay ambigüedades:**
Confirmación de recepción + plazo de entrega del presupuesto (24-48h) + datos de contacto del taller.

**B. Si hay ambigüedades / falta información:**
Confirmación de recepción + lista numerada de preguntas técnicas concretas + indicación de que el presupuesto se elaborará tras recibir aclaraciones.

Ver `referencias/plantilla-email-respuesta.md`.

## Reglas críticas

1. **NUNCA inventes datos** que no estén explícitamente en el plano o el email
2. **SIEMPRE indica "no especificado"** en lugar de asumir valores
3. **Si la calidad del plano es mala**, indícalo ANTES de proceder y solicita mejor versión
4. **Mantén trazabilidad**: cada dato debe venir referenciado al plano del que se extrajo
5. **Materiales y tolerancias son sagrados**: una mala interpretación cuesta dinero real al taller. Ante la mínima duda, pregunta al cliente
6. **NO comprometas plazos** sin validación humana. Indica plazos como "estimación preliminar"
7. **Output siempre en español**, aunque el input venga en otro idioma
8. **Marca claramente** lo que es BORRADOR pendiente de validación

## Recursos

- `referencias/plantilla-output.md` — Estructura exacta del análisis a generar
- `referencias/plantilla-email-respuesta.md` — Plantillas de email al cliente (con/sin ambigüedades)
- `referencias/email-info-faltante.md` — Email cuando falta información crítica
- `referencias/tabla-materiales.md` — Designaciones normalizadas y equivalencias
- `referencias/tabla-tolerancias-iso.md` — Tablas ISO 2768, IT, GD&T
- `referencias/tabla-operaciones.md` — Lista completa de operaciones de fabricación
- `ejemplos/rfq-bueno.md` — Ejemplo de RFQ bien procesado
- `ejemplos/rfq-ambiguo.md` — Ejemplo de RFQ con ambigüedades

## Errores frecuentes a evitar

- Confundir cota nominal con dimensión final
- Asumir tolerancia general (ISO 2768 mK) cuando no aparece en cajetín
- Olvidar mencionar tratamientos térmicos o superficiales
- No detectar GD&T (símbolos en marcos rectangulares)
- Confundir roscas métricas con whitworth
- Ignorar acabados especiales (Ra) que cambian operación
- Saltarse la nota "PROHIBIDO" o "VARIACIONES ACEPTABLES" en el cajetín
- Confundir versión/revisión del plano (procesar plano antiguo)

## Validación final antes de entregar

Checklist obligatorio:
- [ ] Cliente y empresa identificados correctamente
- [ ] Cantidades extraídas para cada referencia
- [ ] Material designado con norma estándar
- [ ] Todas las operaciones listadas
- [ ] DFM completado con sugerencias si aplican
- [ ] Complejidad evaluada (BAJA/MEDIA/ALTA/MUY ALTA)
- [ ] Email de respuesta generado en español
- [ ] Marca de "BORRADOR" presente
- [ ] Ambigüedades flageadas con ⚠️
