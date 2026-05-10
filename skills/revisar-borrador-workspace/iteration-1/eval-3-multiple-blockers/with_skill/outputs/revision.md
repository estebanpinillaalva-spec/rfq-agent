# Informe de Revisión — RFQ-2026-047

**Fecha de revisión:** 2026-05-08
**Revisado por:** Sistema asistido (skill: revisar-borrador)
**Estado del presupuesto:** BORRADOR

---

## SEMÁFORO GLOBAL

🔴 **NO ENVIAR — Corregir primero**

Motivo: Múltiples bloqueadores en Bloque 1 (datos de cliente) y Bloque 2 (coherencia técnica). Además, se superan las 2 ambigüedades ⚠️ no resueltas establecidas como umbral máximo.

---

## Correcciones obligatorias (bloquean el envío)

### Bloque 1 — Datos del cliente

- **[BLOQUEADOR CRÍTICO] Nombre de empresa no identificado.**
  El email indicaba "empresa XYZ" pero no se ha podido identificar la razón social real. Enviar un presupuesto sin el nombre correcto del cliente es un error imperdonable (pérdida de credibilidad, posible confusión de destinatario). Acción requerida: contactar con la fuente del email o buscar en el CRM por dominio/dirección de origen antes de continuar.

- **[BLOQUEADOR] Contacto no especificado.**
  No hay nombre de persona de contacto. El email de presupuesto no puede dirigirse a "Contacto cliente". Acción requerida: identificar al menos nombre y apellido del destinatario antes de enviar.

### Bloque 2 — Coherencia técnica

- **[BLOQUEADOR] Material Pieza A no especificado en plano — asunción no validada.**
  Se asume F-114, pero es una asunción unilateral del estimador sin confirmación del cliente ni del plano. El precio puede variar ±30% si el material real es diferente. Acción requerida: solicitar aclaración al cliente o marcar explícitamente en el presupuesto que el precio está condicionado a confirmación de material.

- **[BLOQUEADOR] Grado de inoxidable Pieza B no definido (¿304 o 316L?).**
  La diferencia de precio entre AISI 304 y 316L en barra es significativa (~15-25% en material), y el 316L tiene implicaciones en mecanizabilidad y disponibilidad. No es aceptable presupuestar sin definir el grado. Acción requerida: aclaración obligatoria con el cliente antes de presupuestar.

- **[BLOQUEADOR TÉCNICO] Acabado espejo Ra 0.4 en Pieza B sin operación de rectificado ni bruñido.**
  Ra 0.4 es imposible de conseguir solo con torneado o fresado convencional. La ausencia de operación de rectificado o bruñido en la lista de operaciones indica que: (a) la operación falta en el presupuesto (error de coste, subestimación grave), o (b) el requisito no es ejecutable en el taller. Esta es una bandera roja automática según el procedimiento de revisión. Acción requerida: añadir la operación de rectificado/bruñido con su coste o escalar a gerencia si no hay capacidad interna — en ese caso, declarar subcontrata y proveedor disponible.

---

## Mejoras recomendadas (no bloquean, pero mejoran el presupuesto)

- **Incluir rango de precio en lugar de precio fijo** mientras persistan las ambigüedades de material. Si se decide enviar con condiciones, el email debe indicar claramente que el precio está sujeto a confirmación de especificaciones técnicas.

- **Verificar IVA calculado.** El cálculo parece correcto: 1.105€ × 1,21 = 1.337,05€ ≈ 1.337€. Sin embargo, conviene confirmar que el cliente es sujeto pasivo de IVA o si aplica exención (exportación, inversión del sujeto pasivo, etc.).

- **Revisar plazo de entrega** antes de incluirlo en el presupuesto, especialmente para la Pieza B si el acabado espejo requiere subcontrata de rectificado: el lead time del proveedor externo puede impactar el plazo total.

- **Condiciones de pago:** No mencionadas en los datos del presupuesto. Añadir las condiciones estándar del taller (ej. 50% a la firma, 50% a la entrega).

---

## Estimación de confianza en el precio

**BAJA**

Justificación:
- El material de la Pieza A es una asunción no validada. Si el material real difiere del F-114 asumido, el coste puede variar ±30%.
- El grado de inoxidable de la Pieza B no está confirmado (diferencia de coste de material entre 304 y 316L).
- La operación de acabado espejo Ra 0.4 no está reflejada en las operaciones presupuestadas, lo que significa que el coste de la Pieza B está subestimado. Esta es la ambigüedad con mayor impacto económico.

Con 3 ambigüedades ⚠️ no resueltas (supera el umbral de 2), la incertidumbre total sobre el precio final es superior al ±25%. No se puede garantizar margen positivo con el presupuesto en su estado actual.

---

## Resumen de acciones antes del próximo envío

| Prioridad | Acción | Responsable |
|-----------|--------|-------------|
| 1 | Identificar razón social y contacto del cliente | Estimador / Comercial |
| 2 | Clarificar material Pieza A (confirmar o rechazar asunción F-114) | Estimador → Cliente |
| 3 | Clarificar grado inoxidable Pieza B (304 vs 316L) | Estimador → Cliente |
| 4 | Añadir operación rectificado/bruñido en Pieza B o derivar a subcontrata | Estimador + Taller |
| 5 | Recalcular precio Pieza B con operación de acabado correcta | Estimador |
| 6 | Reemitir borrador con datos completos para nueva revisión | Estimador |

**Recomendación:** Enviar primero un email de aclaraciones al cliente (con las 3 preguntas técnicas y la solicitud de datos de empresa) antes de reemitir el presupuesto. Esto es más profesional que enviar un presupuesto condicionado con múltiples asteriscos.
