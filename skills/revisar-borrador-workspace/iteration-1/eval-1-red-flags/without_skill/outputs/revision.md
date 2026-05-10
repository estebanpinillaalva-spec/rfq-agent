# Revisión de Presupuesto — RFQ-2026-033
**Cliente:** Grupo Ferrominero SA  
**Pieza:** Árbol escalonado  
**Estado:** BORRADOR — NO ENVIAR hasta resolver puntos críticos

---

## SEMÁFORO GENERAL: 🔴 NO APTO PARA ENVÍO

Se identifican **3 banderas rojas críticas** y **2 advertencias** que impiden enviar este presupuesto sin correcciones.

---

## BANDERAS ROJAS CRÍTICAS

### 🔴 RED FLAG 1 — Plazo imposible (4 días laborables)
**Problema:** El taller subcontrata el rectificado a Rectificados Arenas, que tiene actualmente **3 semanas de plazo por saturación**. El plazo ofertado de 4 días laborables es físicamente irrealizable.

**Impacto:** Incumplimiento contractual garantizado. Daño reputacional con cliente.

**Acción requerida:**
- Confirmar plazo real con Rectificados Arenas antes de emitir presupuesto.
- Si el plazo es inaceptable para el cliente, explorar alternativas de subcontrata o rechazar el pedido.
- Plazo realista mínimo estimado: **4–5 semanas** (3 semanas subcontrata + margen mecanizado + logística).

---

### 🔴 RED FLAG 2 — Tolerancias IT5 sin rectificado en presupuesto
**Problema:** Se especifican tolerancias **IT5 en dos superficies de apoyo de rodamiento**. IT5 es una tolerancia de precisión alta (típicamente ±2–5 µm según diámetro) que en titanio **no es alcanzable solo con torno CNC o fresadora 5 ejes**. Requiere rectificado o superacabado.

El presupuesto **no incluye la operación de rectificado**, lo que significa:
1. El precio no cubre el coste real de fabricación.
2. La pieza entregada probablemente no cumpla las tolerancias comprometidas.

**Acción requerida:**
- Añadir línea de subcontrata de rectificado al presupuesto (coste + margen).
- Recalcular precio unitario y total.
- Revisar si el plazo resultante es aceptable.

---

### 🔴 RED FLAG 3 — Material con confianza BAJA en base de datos (Titanio Gr.5)
**Problema:** La estimación de 280 min/pieza se basa en datos de baja confianza para titanio Gr.5 (Ti-6Al-4V). Este material presenta:
- Maquinabilidad muy difícil (índice ~20–30% respecto al acero 1212).
- Alta tendencia al endurecimiento por trabajo y al desgaste acelerado de herramientas.
- Generación de calor concentrada en filo — riesgo de rotura de herramienta y rechazo de pieza.

Con datos de confianza BAJA, el tiempo estimado puede ser **un 30–80% inferior al real**, lo que destruiría el margen del 12%.

**Acción requerida:**
- Buscar referencia de mecanizado previo de titanio en el taller o consultar proveedor de herramientas (Sandvik, Kennametal, Iscar).
- Si no hay referencia, añadir factor de incertidumbre al precio (recargo de riesgo mínimo recomendado: +25–40%).
- Considerar pieza de prueba o primera unidad a coste real antes de comprometer las 3 unidades.

---

## ADVERTENCIAS (no bloquean si se gestionan)

### ⚠️ ADVERTENCIA 1 — Margen del 12% insuficiente para titanio con subcontrata
Con margen del 12%, cualquier desviación en tiempo de mecanizado o coste de subcontrata de rectificado consume el margen rápidamente. Para materiales de difícil maquinabilidad con subcontrata externa, el margen mínimo recomendado es **18–25%**.

**Acción requerida:** Revisar margen tras incluir coste de rectificado y factor de riesgo de material.

### ⚠️ ADVERTENCIA 2 — Sin especificar acabado superficial ni norma de tolerancias
El presupuesto menciona IT5 pero no referencia explícita a norma (ISO 286, ASME B4.1) ni rugosidad Ra/Rz en zonas críticas. Esto puede generar disputa con cliente en inspección.

**Acción requerida:** Solicitar plano o especificación técnica completa al cliente antes de confirmar precio.

---

## RESUMEN DE VERIFICACIÓN NUMÉRICA

| Concepto | Valor en borrador | Estado |
|---|---|---|
| Precio unitario | 1.800 € | ⚠️ Revisar tras añadir rectificado |
| Total (3 uds) | 5.400 € | ⚠️ Revisar |
| Margen | 12% | ⚠️ Insuficiente para este material+subcontrata |
| IVA 21% | 1.134 € | ✅ Correcto |
| **Total con IVA** | **6.534 €** | ⚠️ Cifra base incorrecta |
| Plazo | 4 días lab. | 🔴 Imposible — mín. ~4 semanas |
| Rectificado IT5 | No incluido | 🔴 Falta operación crítica |
| Riesgo material Ti Gr.5 | No cubierto | 🔴 Confianza BAJA sin recargo |

---

## ACCIONES ANTES DE ENVIAR (ordenadas por urgencia)

1. **[URGENTE]** Llamar a Rectificados Arenas → confirmar plazo real y precio para 3 árboles.
2. **[URGENTE]** Añadir coste de rectificado al presupuesto y recalcular precio unitario.
3. **[URGENTE]** Revisar estimación de tiempo con referencia real de titanio o añadir recargo de riesgo ≥25%.
4. **[IMPORTANTE]** Ajustar margen a mínimo 18–20% dado el perfil de riesgo.
5. **[IMPORTANTE]** Solicitar plano técnico completo con tolerancias y acabados.
6. **[ANTES DE ENVIAR]** Recalcular total y verificar IVA sobre nueva base.
7. **[ANTES DE ENVIAR]** Comunicar plazo real al cliente — si es inaceptable, negociar antes de comprometer.

---

*Revisión generada: 2026-05-08 | Estado: BORRADOR — requiere corrección humana antes de emisión*
