# Revisión de Presupuesto BORRADOR — RFQ-2026-047

**Estado:** BLOQUEADO — No enviar hasta resolver los puntos críticos.

---

## Bloqueadores críticos (impiden el envío)

### 1. Cliente no identificado
- El campo "empresa" figura como 'empresa XYZ', nombre real desconocido.
- El contacto no está especificado.
- **Riesgo:** El presupuesto no tiene destinatario válido. Si se envía así, puede llegar a la persona equivocada o ser ignorado. Desde un punto de vista legal/comercial, un presupuesto sin identificación del cliente carece de validez.
- **Acción requerida:** Confirmar razón social y persona de contacto antes de continuar.

### 2. Material Pieza A sin especificar en plano
- Se asume F-114 (acero de construcción general), pero el plano no lo indica.
- **Riesgo:** Si el cliente necesita otra calidad (F-1140, F-1250, inoxidable, etc.), el precio de 95€/ud puede ser incorrecto. El coste de materia prima puede variar un 20–60% según grado.
- **Acción requerida:** Solicitar al cliente especificación de material o añadir condición explícita en el presupuesto ("precio basado en acero F-114; sujeto a revisión si se confirma otro material").

### 3. Grado de acero inoxidable Pieza B sin definir (304 vs 316L)
- Diferencia de precio materia prima: 316L es aprox. 25–35% más caro que 304.
- **Riesgo:** Con 3 uds y precio unitario de 210€, una variación de grado puede suponer 50–80€ de desviación en coste real, con margen comprometido o pérdida.
- **Acción requerida:** Confirmar grado con el cliente. No asumir. Si hay aplicación en entorno marino o químico, 316L es prácticamente obligatorio.

### 4. Acabado espejo Ra 0.4 sin operación de rectificado ni bruñido
- El presupuesto exige Ra 0.4 (acabado espejo) en pieza B, pero la lista de operaciones no incluye rectificado cilíndrico, plano, ni bruñido.
- **Riesgo doble:**
  - El presupuesto está incompleto: falta el coste de la operación de acabado fino. El precio de 210€/ud puede ser insuficiente.
  - Si se fabrica sin esa operación, el cliente rechazará las piezas (no conformidad). Coste de reproceso o chatarreo recae en el taller.
- **Acción requerida:** Añadir operación de rectificado o bruñido con su coste, o confirmar que Ra 0.4 se alcanza con el mecanizado actual (improbable sin operación dedicada en inox).

---

## Problemas secundarios (corregir antes de enviar)

### 5. Identificación del RFQ incompleta
- No consta fecha de validez del presupuesto.
- No consta plazo de entrega estimado.
- No consta condición de pago.
- Estos campos son estándar en cualquier presupuesto industrial y su ausencia puede generar disputas posteriores.

### 6. IVA aplicado sin verificar régimen fiscal del cliente
- Se aplica IVA (21% estándar: 1.105 × 1.21 = 1.337,05€ ✓ cálculo correcto).
- Si el cliente es intracomunitario o tiene exención, el IVA no aplica.
- Como el cliente no está identificado, no se puede confirmar el régimen.

### 7. Cálculo aritmético — verificación
- Pieza A: 5 × 95€ = 475€ ✓
- Pieza B: 3 × 210€ = 630€ ✓
- Total sin IVA: 475 + 630 = 1.105€ ✓
- Total con IVA (21%): 1.105 × 1.21 = 1.337,05€ ✓
- Los números son correctos, pero el total podría cambiar si se corrigen materiales u operaciones.

---

## Resumen de acciones requeridas

| # | Acción | Bloquea envío |
|---|--------|---------------|
| 1 | Identificar cliente y contacto | Sí |
| 2 | Confirmar material Pieza A | Sí |
| 3 | Confirmar grado inox Pieza B (304/316L) | Sí |
| 4 | Añadir operación rectificado/bruñido Pieza B | Sí |
| 5 | Añadir fecha validez, plazo, condición pago | Recomendado |
| 6 | Verificar régimen fiscal cliente | Recomendado |

**Conclusión:** El presupuesto tiene 4 bloqueadores que impiden el envío. En el estado actual, enviarlo expone al taller a fabricar piezas no conformes, con materiales incorrectos, a un precio posiblemente deficitario, y sin receptor identificado.
