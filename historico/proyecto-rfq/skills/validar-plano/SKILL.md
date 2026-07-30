---
name: validar-plano
description: Use this skill BEFORE processing any technical drawing in an RFQ workflow to verify that the drawing has minimum quality and contains the information required for technical analysis. Trigger automatically as a pre-step whenever a PDF, JPG, PNG or technical drawing arrives that will need quotation - this includes when the user uploads a plano técnico, dibujo de ingeniería, drawing, blueprint, or technical document for quoting purposes. Also trigger when the user asks "¿se puede procesar este plano?", "valida este dibujo", "está completo este plano", or expresses doubt about drawing quality. Returns a clear YES/NO/UNCERTAIN with specific reasons and an action recommendation.
---

# Validar Plano — Pre-validación de Calidad Técnica

Skill rápida que evalúa si un plano técnico tiene calidad mínima y datos suficientes para ser procesado por la skill `procesar-rfq`. Se ejecuta SIEMPRE antes del procesamiento completo para evitar trabajar sobre datos defectuosos.

## Cuándo usar esta skill

Activar de forma automática cuando:
- Llega un plano (PDF, JPG, PNG, TIFF) en un flujo de RFQ
- Antes de cualquier procesamiento técnico
- Cuando el usuario pregunta si un plano es procesable
- Cuando hay dudas sobre la calidad de un dibujo

Esta skill es PRE-FILTRO. Su objetivo es no perder tiempo procesando planos malos.

## Output esperado

Decisión clara en formato Markdown estructurado:

```markdown
## VALIDACIÓN DE PLANO

**Plano:** [nombre archivo]
**Resultado:** ✅ PROCESABLE / ⚠️ DUDOSO / ❌ NO PROCESABLE

### Calidad técnica
[Evaluación de imagen]

### Información presente
[Checklist de datos mínimos]

### Problemas detectados
[Lista si los hay]

### Acción recomendada
[Procesar / Solicitar mejor versión / Solicitar info adicional]

### Email al cliente (si aplica)
[Borrador de email solicitando lo que falta]
```

## Flujo de validación

### Nivel 1 — Calidad de imagen (eliminatorio)

Verifica:

- [ ] **Resolución suficiente**: ¿se puede leer texto y cotas claramente?
- [ ] **Sin emborronado**: imagen nítida, no escaneo movido
- [ ] **Sin recortes**: cajetín visible, vista principal completa
- [ ] **Orientación correcta**: no rotado / al revés
- [ ] **Contraste adecuado**: líneas claras sobre fondo legible

**Si alguno falla → ❌ NO PROCESABLE**

### Nivel 2 — Información mínima presente (eliminatorio)

Verifica que aparezcan:

- [ ] **Cajetín del plano**: empresa emisora, número, revisión, fecha
- [ ] **Vista principal con cotas**: al menos una vista cotada visible
- [ ] **Material**: indicado en cajetín o nota
- [ ] **Tolerancias generales**: ISO 2768 mK/fK o similar (si no, marcar como asunción)
- [ ] **Escala**: indicada o deducible

**Si faltan ≥2 críticos → ❌ NO PROCESABLE**
**Si falta 1 crítico → ⚠️ DUDOSO**
**Si están todos → continuar a Nivel 3**

### Nivel 3 — Información para cotización (importante pero no bloqueante)

Verifica:

- [ ] **Cantidades** indicadas (en plano o email)
- [ ] **Acabado superficial** especificado (Ra)
- [ ] **Tratamientos** mencionados si son necesarios
- [ ] **GD&T** legible si está presente
- [ ] **Notas técnicas** en el plano son legibles

**Faltantes aquí no bloquean, pero se reportan como ambigüedades a resolver.**

## Criterios de decisión

### ✅ PROCESABLE
- Calidad de imagen correcta
- Toda información mínima presente
- Cantidades conocidas (en plano o email)
- Material especificado

→ **Acción**: invocar skill `procesar-rfq`

### ⚠️ DUDOSO
- Algún dato menor falta o está poco claro
- Calidad de imagen aceptable pero no óptima
- Tolerancias generales no aparecen pero son asumibles

→ **Acción**: procesar con nota de asunciones, generar email aclaratorio paralelo

### ❌ NO PROCESABLE
- Imagen ilegible / muy mala calidad
- Faltan ≥2 datos críticos
- Material no identificable
- Cantidades no especificadas en ningún sitio

→ **Acción**: NO procesar. Generar email solicitando mejor plano.

## Plantillas de email al cliente

### Para imagen de mala calidad

```
Estimado/a [Nombre],

Hemos recibido vuestro RFQ con referencia [XXX]. 

El plano [nombre archivo] presenta calidad insuficiente para realizar 
una estimación precisa. Para garantizar un presupuesto ajustado, 
necesitaríamos:

- Plano original en formato PDF (preferible) o
- Imagen escaneada con resolución mínima 300 DPI

Una vez recibida la nueva versión, procesaremos el RFQ y os 
remitiremos el presupuesto en 24-48h.

Quedamos a la espera.

Saludos cordiales,
[Firma del taller]
```

### Para información faltante

```
Estimado/a [Nombre],

Gracias por vuestro RFQ con referencia [XXX].

Para ofreceros un presupuesto preciso necesitaríamos confirmar los 
siguientes puntos:

[Lista numerada de puntos concretos faltantes]

En cuanto recibamos esta información, prepararemos el presupuesto 
en un plazo de 24-48h.

Saludos cordiales,
[Firma del taller]
```

## Reglas críticas

1. **Esta skill NUNCA procesa el RFQ completo**, solo valida
2. **Si la calidad es mala, STOP**. No procesar bajo ningún concepto
3. **Genera siempre un email al cliente** si la decisión es ⚠️ o ❌
4. **Reporta tiempo estimado de procesamiento** si es ✅ procesable
5. **Sé específico** en lo que falta, no genérico

## Tiempo objetivo de ejecución

Esta skill debe completarse en **2-3 minutos**. Es un filtro rápido, no un análisis profundo.

## Errores frecuentes a evitar

- Procesar planos ilegibles "porque parece que se entiende"
- Asumir material cuando no está especificado
- Asumir cantidades cuando no aparecen en email ni plano
- No generar el email al cliente cuando la decisión es ❌
- Perder tiempo intentando "mejorar" la imagen del cliente
