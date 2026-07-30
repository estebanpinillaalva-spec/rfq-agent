---
name: procesar-rfq
description: Convierte un RFQ industrial (email + planos técnicos) en un análisis estructurado profesional, listo para que un estimador genere presupuesto. Úsala en cuanto llegue a un taller mecánico español cualquier petición de presupuesto con dibujos técnicos — incluso si el usuario solo dice "léete esto", "revisa este plano" o adjunta archivos sin instrucción explícita. Activa también con frases como "presupuesto", "RFQ", "request for quotation", "petición de oferta", "consulta técnica", "fabricación a medida", "mecanizado a medida", "cotizar pieza", "cuánto cuesta esta pieza". Soporta input multilingüe (ES, EN, FR, DE, IT, PT) y produce output siempre en español. Es el núcleo del flujo: ahorra 2-3 horas por RFQ.
---

# Procesar RFQ

Análisis técnico estructurado de un RFQ industrial. Output listo para que el estimador genere presupuesto en minutos.

## Cuándo activar

Activa cuando:
- Llega un email con planos PDF/STEP/DXF/imagen pidiendo presupuesto
- Hay una petición de fabricación de piezas mecánicas
- Cualquier consulta técnica con dibujos cotados que requiera estimación

Antes de procesar: pasar siempre por la skill `validar-plano`. Si la validación es NO PROCESABLE, no avanzar; si es DUDOSO, procesar con asunciones documentadas.

Idiomas de entrada soportados: español, inglés, francés, alemán, italiano, portugués. **Output siempre en español**, sin excepciones.

## Output

Genera siempre un análisis siguiendo exactamente la plantilla de `references/plantilla-output.md`. Las secciones obligatorias son:

1. **Datos del cliente y RFQ**: empresa, contacto, idioma, cantidades, plazos, condiciones
2. **Análisis técnico por pieza**: identificación, material, dimensiones, tolerancias, operaciones, características críticas
3. **Análisis DFM**: riesgos, sugerencias, ambigüedades flageadas
4. **Estimación de complejidad**: nivel, operaciones críticas, subcontratas, tiempos
5. **Borrador de respuesta al cliente**: en español, profesional

Cada dato técnico debe ser trazable al plano del que se extrajo. Los datos no presentes se marcan explícitamente como "no especificado", nunca se inventan.

## Proceso en 6 pasos

### Paso 1 — Validación previa

Confirma antes de empezar:
- Texto del email del cliente está disponible
- Al menos un plano legible y validado (skill `validar-plano` ya ejecutada)
- Información mínima del cliente identificable

Si falta algo crítico: ejecutar el flujo de email pidiendo información (ver `references/emails-respuesta.md`).

### Paso 2 — Análisis del email

Extrae sistemáticamente:

**Datos del cliente:**
- Empresa, persona de contacto, cargo, email, teléfono
- Idioma original del email

**Datos comerciales:**
- Cantidades por referencia (si hay varias piezas)
- Plazo de entrega requerido
- Condiciones especiales: certificaciones (ISO 9001, IATF 16949, EN 9100, AS9100), ITP, declaración de conformidad
- Repetición vs primera vez (revisar firma, mención de proyectos previos)
- Indicadores de urgencia
- Forma de pago si se menciona

**Notas técnicas en el email** que complementan los planos.

### Paso 3 — Análisis técnico de cada plano

Para cada plano, extrae las 7 dimensiones de análisis:

**A. Identificación**: denominación, número de plano, revisión, escala, empresa emisora.

**B. Material**: con designación normalizada (F-114, AISI 304L, EN AW-6082, etc.). Si aparece en formato no estándar, normaliza y aclara equivalencia.

**C. Dimensiones**: generales (largo×ancho×alto o ø×longitud), volumen aproximado, peso si relevante.

**D. Tolerancias**: generales (ISO 2768 mK/fK), especiales cota a cota, GD&T detectado.

**E. Acabado superficial**: rugosidad Ra, recubrimientos, tratamientos térmicos.

**F. Operaciones requeridas (CRÍTICO)**: lista todas las operaciones en orden de fabricación. Ver `references/tabla-operaciones.md` para nomenclatura completa.

**G. Características críticas**: roscas (designación completa con paso y dirección), chaveteros, estriados, engranajes, sellos, tipos de agujero.

### Paso 4 — Análisis DFM (Design For Manufacturing)

Detecta y reporta:

**Riesgos de fabricación:**
- Tolerancias muy ajustadas sin justificación funcional aparente (IT5-IT6)
- Geometrías de difícil acceso para herramienta
- Espesores muy delgados (<1mm en chapa, <2mm mecanizado)
- Aristas vivas no especificadas
- Rugosidades extremas (Ra <0.4µm) que requieren operaciones extra
- Materiales difíciles de mecanizar (titanio, inconel, hastelloy)

**Sugerencias de optimización** (cuando sean evidentes):
- Cambio de tolerancia general que no afecta función
- Sustitución de operación cara por equivalente más barato
- Material alternativo más económico con mismas propiedades
- Agrupación de operaciones para reducir cambios de utillaje

**Flag obligatorio**: si detectas ambigüedad técnica seria, marca `⚠️ REQUIERE REVISIÓN HUMANA` en la sección correspondiente. No intentes resolver tú la ambigüedad.

### Paso 5 — Estimación de complejidad

NO calcules precios finales. Esto es input para la skill `generar-presupuesto`.

Indica:

**Nivel de complejidad** (BAJA / MEDIA / ALTA / MUY ALTA) basado en:
- Número de operaciones distintas
- Tolerancias y acabados requeridos
- Material
- Cantidad (one-off vs serie corta vs serie media)

**Operaciones críticas** que marcarán el coste y plazo.

**Subcontrataciones necesarias**: tratamientos térmicos, recubrimientos, operaciones que el taller no realice in-house (verificar contra `config-taller.md` si está disponible).

**Tiempo estimado por pieza**: rangos en minutos, sin valor monetario.

### Paso 6 — Borrador de respuesta al cliente

Genera siempre un email en español, profesional, dirigido al contacto del cliente.

Dos variantes:

**A. Sin ambigüedades**: confirmación de recepción + plazo de entrega del presupuesto (24-48h) + datos de contacto del taller.

**B. Con ambigüedades / falta información**: confirmación de recepción + lista numerada de preguntas técnicas concretas + indicación de que el presupuesto se elaborará tras recibir aclaraciones.

Plantillas exactas en `references/emails-respuesta.md`.

## Reglas críticas

- Nunca inventes datos que no estén en el plano o el email. Si falta, marca "no especificado".
- Si la calidad del plano es mala (debió detectarse en `validar-plano`), STOP y solicita mejor versión.
- Mantén trazabilidad: cada dato técnico debe poder asociarse al plano del que viene.
- Materiales y tolerancias son críticos: una mala interpretación cuesta dinero real al taller. Ante la mínima duda, pregunta al cliente.
- No comprometas plazos sin validación humana. Indica plazos como "estimación preliminar".
- Output siempre en español, aunque el input venga en otro idioma.
- Marca claramente las secciones como BORRADOR pendiente de validación del estimador.

## Validación final antes de entregar

Antes de devolver el análisis, verifica:
- Cliente y empresa identificados correctamente
- Cantidades extraídas para cada referencia
- Material designado con norma estándar (no genérico)
- Todas las operaciones listadas en orden
- DFM completado con sugerencias si aplican
- Complejidad evaluada (BAJA/MEDIA/ALTA/MUY ALTA)
- Email de respuesta generado en español
- Marca de "BORRADOR" presente
- Ambigüedades flageadas con ⚠️

## Errores frecuentes a evitar

- Confundir cota nominal con dimensión final terminada
- Asumir tolerancia general (ISO 2768 mK) cuando no aparece sin documentar la asunción
- Olvidar mencionar tratamientos térmicos o superficiales especificados
- No detectar GD&T (símbolos en marcos rectangulares)
- Confundir roscas métricas con whitworth o UNF
- Ignorar acabados especiales (Ra) que cambian la operación de mecanizado
- Saltarse notas tipo "PROHIBIDO" o "VARIACIONES NO ACEPTABLES" en el cajetín
- Procesar la revisión equivocada del plano (siempre verificar la última)

## Recursos

- `references/plantilla-output.md` — Estructura exacta del análisis a generar
- `references/emails-respuesta.md` — Plantillas de email al cliente (con/sin ambigüedades)
- `references/tabla-operaciones.md` — Lista completa de operaciones de fabricación con nomenclatura
- `references/tabla-materiales.md` — Designaciones normalizadas de materiales y equivalencias
- `references/tabla-gdt.md` — Símbolos GD&T y su significado
