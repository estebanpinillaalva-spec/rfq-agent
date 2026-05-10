# Informe de Revisión — RFQ-2026-041

**Fecha de revisión:** 2026-05-08  
**Cliente:** Hidráulica del Norte SL  
**Contacto:** Marta Solano — marta.solano@hidranorte.es  
**Revisado por:** Skill `revisar-borrador`

---

## SEMÁFORO GLOBAL: 🟢 LISTO PARA ENVIAR

No se han detectado errores bloqueantes. El presupuesto puede enviarse con las mejoras recomendadas opcionales descritas más abajo.

---

## Bloque 1 — Datos del cliente ✅

| Comprobación | Estado | Observación |
|---|---|---|
| Nombre de empresa identificado | ✅ OK | "Hidráulica del Norte SL" — nombre completo con forma jurídica |
| Contacto identificado | ✅ OK | Marta Solano — nombre real, no genérico |
| Email de destino | ✅ OK | marta.solano@hidranorte.es |
| Referencia RFQ en asunto | ✅ OK | Asunto incluye RFQ-2026-041 |
| Idioma | ✅ OK | Español — adecuado para cliente español |

Sin correcciones obligatorias en este bloque.

---

## Bloque 2 — Coherencia técnica ✅

| Comprobación | Estado | Observación |
|---|---|---|
| Material con designación normalizada | ✅ OK | "Aluminio 6082 / A6082" — designación EN normalizada |
| Confianza en material | ✅ ALTA | Sin riesgo de variación de precio por material |
| Cantidad | ✅ OK | 10 unidades |
| Tiempo por pieza | ✅ OK | 45 min/pieza para bloque hidráulico — razonable para complejidad media-alta |
| Operaciones realizables en taller | ✅ OK | Mecanizado de aluminio, sin operaciones exóticas declaradas |
| Subcontratas | ✅ OK | Sin subcontratas requeridas — simplifica el flujo |
| Tolerancia | ✅ OK | ISO 2768-m (tolerancia general media) — coherente con bloque hidráulico sin GD&T |
| Rugosidad | ✅ OK | Ra 3.2 general — alcanzable con fresado/torneado estándar en A6082 |
| Tratamiento térmico | ✅ OK | No declarado — sin riesgo de subcontrata sin proveedor |

**Banderas rojas revisadas:**
- Material confianza BAJA → NO aplica (confianza ALTA)
- Tiempo <10 min para pieza ALTA complejidad → NO aplica (45 min, complejidad acorde)
- Tolerancias IT5-IT6 sin rectificado → NO aplica (ISO 2768-m es tolerancia media)
- Tratamiento térmico sin subcontrata → NO aplica

Sin correcciones obligatorias en este bloque.

---

## Bloque 3 — Validación económica ✅

| Comprobación | Estado | Detalle |
|---|---|---|
| Precio unitario | ✅ OK | 185 € — razonable para bloque hidráulico A6082, 45 min/pieza |
| Precio total s/IVA | ✅ OK | 10 × 185 € = 1.850 € — aritmética correcta |
| Margen aplicado | ✅ OK | 22% — por encima del umbral mínimo de rentabilidad (15%) |
| IVA (21%) | ✅ OK | 1.850 € × 21% = 388,50 € — cálculo correcto |
| Total con IVA | ✅ OK | 1.850 € + 388,50 € = 2.238,50 € — correcto |
| Plazo de entrega | ✅ OK | 8 días laborables — superior al umbral de alerta (<5 días), no requiere confirmación urgente de capacidad |
| Condiciones de pago | ✅ OK | 50/50 — estándar para pedidos medianos |

**Umbrales de alerta revisados:**
- Precio <50 € para complejidad MEDIA → NO aplica (185 €/ud)
- Precio >5.000 € → NO aplica (1.850 € s/IVA)
- Plazo <5 días laborables → NO aplica (8 días laborables)
- Margen <15% → NO aplica (22%)

Sin correcciones obligatorias en este bloque.

---

## Bloque 4 — Riesgos y ambigüedades ✅

| Comprobación | Estado | Observación |
|---|---|---|
| Ambigüedades ⚠️ con impacto >±20% | ✅ OK | No se declaran ambigüedades críticas |
| Material difícil (titanio, inconel, PEEK) | ✅ OK | Aluminio A6082 — material de mecanizado estándar |
| Tratamientos/recubrimientos con plazo incierto | ✅ OK | No aplica |
| GD&T complejo | ✅ OK | Sin GD&T declarado — riesgo de interpretación bajo |

Conteo de ⚠️ no resueltos: **0** — no se activa la regla de "enviar aclaraciones primero".

Sin correcciones obligatorias en este bloque.

---

## Bloque 5 — Revisión del email borrador ✅

| Comprobación | Estado | Observación |
|---|---|---|
| Asunto incluye referencia RFQ | ✅ OK | RFQ-2026-041 en asunto |
| Nombre del contacto correcto | ✅ OK | Marta Solano — no genérico |
| Precio total y plazo explícitos | ✅ OK | 2.238,50 € con IVA, 8 días laborables |
| Mención a BORRADOR pendiente de validación | ✅ OK | Indicado en los datos del presupuesto |
| Instrucciones claras al cliente | — | Verificar que el cuerpo del email indica al cliente cómo aceptar o solicitar cambios |
| Firma con nombre real, cargo y teléfono | ✅ OK | Firma incluye teléfono y CIF del taller |

---

## Correcciones obligatorias (bloquean el envío)

**Ninguna.** Todos los bloques han superado la revisión sin errores críticos.

---

## Mejoras recomendadas (no bloquean el envío)

1. **Llamada a la acción explícita en el email:** Confirmar que el cuerpo del email incluye una frase tipo "Para aceptar este presupuesto, responda a este email con su confirmación" o similar. No se ha podido verificar el texto del cuerpo, solo el asunto y la firma.

2. **Aclarar acabado superficial en zonas funcionales:** Ra 3.2 general es correcto, pero un bloque hidráulico suele tener superficies de sellado (juntas, tapones) que requieren Ra ≤ 1.6. Si el plano no especifica zonas diferenciales, considerar añadir una nota en el presupuesto o preguntar al cliente antes de comprometerse con la tolerancia general.

3. **Confirmación de stock de A6082:** Aluminio 6082 es material estándar, pero para 10 unidades en 8 días conviene verificar disponibilidad de barra/chapa del calibre necesario si no está en almacén.

---

## Estimación de confianza en el precio

**ALTA**

Justificación:
- Material A6082 con confianza ALTA — sin variabilidad de coste de materia prima
- Tiempo estimado (45 min/pieza) coherente con la complejidad declarada (bloque hidráulico, tolerancia media, sin GD&T)
- Sin subcontratas que introduzcan incertidumbre de precio externo
- Margen 22% proporciona un colchón suficiente frente a desviaciones menores de tiempo
- Sin ambigüedades técnicas sin resolver

El precio de 185 €/ud puede sostenerse con baja probabilidad de pérdida en este pedido.

---

*Revisión generada por skill `revisar-borrador` — RFQ-2026-041 — 2026-05-08*
