---
name: validar-plano
description: Valida la calidad técnica de planos de ingeniería (PDF, imagen, escaneado) antes de procesar un RFQ industrial. Úsala SIEMPRE como primer paso cuando llega cualquier dibujo técnico, plano de fabricación, o petición de presupuesto con planos adjuntos a un taller mecánico — incluso si el usuario no pide explícitamente "validar". Activa también cuando alguien dice "¿se puede procesar este plano?", "está completo", "tiene la calidad suficiente", "es legible". El output es una decisión clara (PROCESABLE / DUDOSO / NO PROCESABLE) con motivos específicos y un email al cliente si falta información. Esta skill evita perder tiempo procesando planos defectuosos.
---

# Validar plano técnico

Filtro rápido de calidad para planos de ingeniería. Decide en 2-3 minutos si un plano es procesable y, si no lo es, genera el email exacto para pedir al cliente lo que falta.

## Cuándo activar

Activa esta skill como primer paso cuando:
- Llega un PDF, imagen o documento técnico para procesar un RFQ
- El usuario pregunta si un plano sirve, está completo, o se puede usar
- Hay duda sobre la calidad de un dibujo técnico

No proceses ningún RFQ sin pasar antes por esta validación. Procesar planos malos genera presupuestos incorrectos que cuestan dinero real al taller.

## Output

Devuelve siempre este formato exacto:

```markdown
## VALIDACIÓN DE PLANO

**Plano:** [nombre archivo]
**Resultado:** ✅ PROCESABLE / ⚠️ DUDOSO / ❌ NO PROCESABLE

### Calidad técnica
[Evaluación breve de la imagen]

### Información presente
[Checklist de los datos mínimos]

### Problemas detectados
[Lista si los hay]

### Acción recomendada
[Procesar / Solicitar mejor versión / Solicitar info adicional]

### Email al cliente (si aplica)
[Borrador completo en español, listo para enviar]
```

## Proceso de validación en 3 niveles

### Nivel 1 — Calidad de imagen (eliminatorio)

Verifica:
- Resolución suficiente para leer cotas y texto
- Imagen nítida, sin emborronado ni movimiento
- Cajetín completo visible, sin recortes
- Orientación correcta (no rotado ni invertido)
- Contraste adecuado entre líneas y fondo

**Si alguno falla → NO PROCESABLE.** Genera email pidiendo plano original en mejor calidad.

### Nivel 2 — Información mínima presente (eliminatorio)

Comprueba que aparezcan:
- Cajetín del plano: empresa emisora, número de plano, revisión, fecha
- Vista principal con cotas legibles
- Material especificado (en cajetín o nota técnica)
- Tolerancias generales (ISO 2768 o similar, si no aparecen marcar como asunción)
- Escala del plano (indicada o deducible)

**Decisión:**
- Faltan ≥2 críticos → NO PROCESABLE
- Falta 1 crítico → DUDOSO  
- Están todos → continuar a Nivel 3

### Nivel 3 — Información para cotización (no bloqueante)

Verifica adicionalmente:
- Cantidades indicadas (en plano o email)
- Acabado superficial especificado (Ra)
- Tratamientos térmicos o superficiales si aplican
- GD&T legible si está presente
- Notas técnicas legibles

Faltantes aquí no bloquean el procesamiento, pero se reportan como ambigüedades a aclarar con el cliente en paralelo al procesamiento.

## Criterios de decisión final

**PROCESABLE** cuando: calidad correcta + toda información mínima + cantidades conocidas + material especificado.
→ Acción: invocar la skill `procesar-rfq`.

**DUDOSO** cuando: dato menor falta o poco claro + calidad aceptable + tolerancias asumibles.
→ Acción: procesar con asunciones documentadas + email aclaratorio en paralelo.

**NO PROCESABLE** cuando: imagen ilegible o muy mala calidad + faltan ≥2 datos críticos + material no identificable + cantidades no especificadas.
→ Acción: NO procesar. Generar email solicitando plano correcto.

## Plantillas de email

Las plantillas completas de email al cliente están en `references/emails-cliente.md`. Carga ese archivo cuando necesites generar un email.

Los dos casos principales son:
1. Imagen de mala calidad → solicitar plano original PDF mínimo 300 DPI
2. Información faltante → lista numerada de puntos concretos

## Reglas críticas

- Esta skill NUNCA procesa el RFQ completo. Solo valida y genera email si aplica.
- Si la calidad es mala, la decisión es NO PROCESABLE sin excepciones. No intentes "rescatar" planos malos.
- Genera siempre el email al cliente cuando la decisión es DUDOSO o NO PROCESABLE. No dejes al usuario sin la siguiente acción.
- Sé específico en lo que falta. Evita formulaciones genéricas como "necesitamos más información".
- Reporta siempre tiempo estimado de procesamiento si la decisión es PROCESABLE para gestionar expectativas.

## Tiempo objetivo

Esta skill debe completarse en 2-3 minutos. Es un filtro rápido, no un análisis profundo. Si tardas más, algo va mal: reduce el alcance.

## Errores frecuentes a evitar

- Procesar planos ilegibles "porque parece que se entiende".
- Asumir material o cantidades cuando no están especificados.
- No generar el email al cliente cuando hace falta.
- Perder tiempo intentando mejorar la imagen del cliente con OCR avanzado.
- Olvidar verificar que el cajetín está completo (es la huella técnica del plano).

## Recursos

- `references/emails-cliente.md` — Plantillas de email para cada caso de validación fallida
- `references/checklist-validacion.md` — Checklist completo de Nivel 1, 2 y 3 expandido
