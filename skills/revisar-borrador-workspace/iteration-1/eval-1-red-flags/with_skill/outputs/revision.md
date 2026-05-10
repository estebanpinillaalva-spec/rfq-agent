# Informe de Revisión de Presupuesto
**RFQ:** RFQ-2026-033  
**Cliente:** Grupo Ferrominero SA  
**Fecha de revisión:** 2026-05-08  
**Revisado por:** Agente revisar-borrador (skill v1)

---

## SEMÁFORO GLOBAL

🔴 **NO ENVIAR — CORREGIR PRIMERO**

---

## Correcciones obligatorias (bloquean el envío)

### 1. CRÍTICO — Tolerancias IT5 sin rectificado (Bloque 2)
**Bandera roja técnica activada:** El presupuesto especifica tolerancias IT5 en dos superficies de apoyo de rodamiento, pero no incluye operación de rectificado. Conseguir IT5 en torno CNC o fresa 5 ejes es físicamente imposible sin rectificado posterior.

**Impacto:** Pieza no conformará especificaciones del cliente. Reclamación garantizada.

**Acción requerida:** Añadir operación de rectificado al proceso o renegociar tolerancias con el cliente antes de presupuestar.

### 2. CRÍTICO — Subcontrata de rectificado no viable en el plazo declarado (Bloque 2 + Bloque 3)
**Problema compuesto:** El taller no tiene rectificadora propia. La subcontrata habitual (Rectificados Arenas) tiene actualmente 3 semanas de plazo por saturación. El plazo ofertado al cliente es 4 días laborables.

**Incompatibilidad directa:** 3 semanas de subcontrata vs 4 días de plazo ofertado. El presupuesto es inviable tal como está.

**Acción requerida:** 
- Buscar subcontrata de rectificado alternativa con capacidad inmediata, o
- Revisar el plazo a mínimo 4 semanas (añadiendo margen sobre las 3 semanas de Rectificados Arenas), o
- Rechazar cortésmente el RFQ si no hay alternativa viable.

### 3. IMPORTANTE — Material con confianza BAJA y precio >500 EUR (Bloque 2 + Reglas)
**Bandera roja activada:** Titanio Gr.5 tiene `confianza: BAJA` en la base de datos. El precio unitario es 1.800€ (muy por encima del umbral de 500€). Según las reglas del skill, está **prohibido dar semáforo VERDE** en esta situación sin revisión manual del precio de material.

**Riesgo económico:** Variación potencial de ±30% en el precio del material. Sobre 3 unidades y precio actual, el riesgo es ±1.620€ sobre el total (±30% de 5.400€).

**Acción requerida:** Confirmar precio real de titanio Gr.5 con proveedor antes de enviar. Actualizar la base de datos con precio confirmado.

### 4. IMPORTANTE — Margen del 12% por debajo del umbral mínimo rentable (Bloque 3)
**Alerta económica activada:** El margen aplicado es 12%, por debajo del umbral de alerta del 15% definido en el skill.

**Acción requerida:** Revisar con gerencia si el margen del 12% es aceptable para este cliente/material, o ajustar el precio unitario para alcanzar al menos 15% de margen.

---

## Mejoras recomendadas (no bloquean, pero mejoran el presupuesto)

### 5. Plazo <5 días laborables — Confirmar capacidad real (Bloque 3)
Aunque el plazo ya está bloqueado por el problema de subcontrata (#2), se recuerda que cualquier plazo <5 días laborables requiere confirmación explícita de capacidad disponible en el taller antes de comprometerse.

### 6. Precio total >5.000 EUR — Validación doble obligatoria (Bloque 3)
El total de 5.400€ supera el umbral de 5.000€. Se requiere validación adicional con gerencia antes del envío, independientemente de otros problemas.

### 7. Informar al cliente de incertidumbre en precio de titanio
Si finalmente se envía el presupuesto (tras corregir los puntos 1-4), incluir nota en el email indicando que el precio del material está sujeto a confirmación de proveedor y puede variar. Esto protege al taller ante fluctuaciones de precio.

### 8. Verificar tiempo estimado de 280 min/pieza para titanio Gr.5
El titanio Gr.5 (Ti-6Al-4V) es significativamente más difícil de mecanizar que acero o aluminio (factor de maquinabilidad ~0.3 vs acero). Verificar que los 280 min/pieza incluyen velocidades de corte reducidas, mayor desgaste de herramienta y posibles pasadas adicionales para las superficies IT5 (antes de enviar a rectificado).

---

## Estimación de confianza en el precio

**BAJA**

Justificación:
- Material (titanio Gr.5) con `confianza: BAJA` en base de datos → precio puede variar ±30%
- Operación de rectificado omitida → coste real es mayor al presupuestado (falta la subcontrata)
- Plazo inviable → si se corrige el plazo, puede afectar al precio por urgencia o alternativas de subcontrata
- Margen ya por debajo del umbral mínimo; cualquier desviación al alza en costes lo elimina

Con los problemas actuales, la incertidumbre real del precio es superior a ±25%, lo que por sí solo justificaría semáforo AMARILLO. Combinado con los errores técnicos bloqueantes, el semáforo es ROJO.

---

## Resumen de checks por bloque

| Bloque | Estado | Notas |
|--------|--------|-------|
| Bloque 1 — Datos del cliente | ✅ | Cliente y referencia RFQ identificados |
| Bloque 2 — Coherencia técnica | ❌ | IT5 sin rectificado; subcontrata no viable; material confianza BAJA |
| Bloque 3 — Validación económica | ❌ | Margen <15%; plazo imposible; precio >5.000€ sin validación gerencia |
| Bloque 4 — Riesgos y ambigüedades | ❌ | >2 ambigüedades sin resolver; material difícil sin precio confirmado |
| Bloque 5 — Email borrador | ⏸️ | No revisado — irrelevante hasta corregir bloques 2-4 |

---

## Próximos pasos recomendados

1. Contactar a Rectificados Arenas para conocer si hay hueco urgente, o buscar subcontrata alternativa.
2. Solicitar cotización de titanio Gr.5 a proveedor habitual antes de confirmar precio.
3. Añadir operación de rectificado al proceso (tiempo + coste subcontrata).
4. Recalcular precio unitario con coste real de material y coste de rectificado subcontratado.
5. Ajustar plazo a valor realista (mínimo 4 semanas si se usa Rectificados Arenas).
6. Revisar margen resultante con gerencia.
7. Si el precio final resulta no competitivo, considerar declinar el RFQ o negociar tolerancias con el cliente.
