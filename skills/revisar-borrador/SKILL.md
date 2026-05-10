---
name: revisar-borrador
description: Revisión humana asistida del borrador de presupuesto antes del envío al cliente. Genera un checklist priorizado de puntos a validar en menos de 5 minutos. Activa cuando el estimador dice "revisa este presupuesto", "comprueba antes de enviar", "qué puede fallar aquí" o cuando el sistema pide validación manual. Evita envíos con errores graves al cliente.
---

# Revisar Borrador de Presupuesto

Checklist estructurado para que el estimador valide el borrador en menos de 5 minutos antes del envío al cliente. Detecta los errores más costosos antes de que lleguen al cliente.

## Cuándo activar

- Después de `generar-presupuesto` y antes del envío al cliente
- Cuando el estimador quiere una segunda opinión sobre un RFQ complejo
- Cuando el quality gate ha marcado `requires_human_review: true`
- Cuando hay piezas con complejidad ALTA o MUY ALTA

## Input necesario

- `analisis.json` completo (validacion + analisis + presupuesto)
- `presupuesto.md` o los datos del presupuesto
- `config-taller.json` del taller (tarifas, márgenes, capacidad)

## Proceso de revisión

### Bloque 1 — Datos del cliente (30 segundos)

Verifica:
- [ ] Nombre de empresa y contacto identificados correctamente (no "Empresa cliente")
- [ ] Email de destino del presupuesto es el correcto
- [ ] Referencia del RFQ coincide con la que envió el cliente
- [ ] Idioma del email de respuesta es el adecuado

**Acción si falla:** Corregir antes de enviar. Error de nombre de cliente es imperdonable.

### Bloque 2 — Coherencia técnica (2 minutos)

Para cada pieza del presupuesto:
- [ ] Material identificado con designación normalizada (no genérico como "acero" o "aluminio")
- [ ] Cantidad coincide con la que pedía el cliente en el email original
- [ ] Operaciones listadas son físicamente realizables en el taller
- [ ] Tiempo estimado tiene sentido para la complejidad declarada
- [ ] Subcontratas identificadas tienen proveedor disponible

**Banderas rojas automáticas:**
- Material con `confianza: BAJA` en la base de datos → precio puede variar ±30%
- Tiempo estimado <10 min para pieza ALTA complejidad → probablemente subestimado
- Tolerancias IT5-IT6 sin operación de rectificado → imposible conseguir
- Tratamiento térmico requerido sin subcontrata declarada

### Bloque 3 — Validación económica (1 minuto)

- [ ] Precio total está dentro del rango esperado para la complejidad
- [ ] Margen aplicado coincide con la política del taller para ese nivel de complejidad
- [ ] IVA calculado correctamente (21% por defecto)
- [ ] Plazo de entrega es realista con la capacidad disponible del taller
- [ ] Condiciones de pago son las estándar del taller

**Umbrales de alerta:**
- Precio <50 EUR para pieza de complejidad MEDIA → posible error en tiempo estimado
- Precio >5.000 EUR → validación doble obligatoria con gerencia
- Plazo <5 días laborables → confirmar capacidad real antes de enviar
- Margen <15% → no rentable; revisar o rechazar cortésmente

### Bloque 4 — Riesgos y ambigüedades (1 minuto)

Revisa las ambigüedades marcadas con ⚠️ en el análisis:
- [ ] ¿Hay ambigüedades que hacen el precio incierto en >±20%?
- [ ] ¿El cliente ha sido informado de estas incertidumbres?
- [ ] ¿Hay materiales difíciles (titanio, inconel, PEEK) con precio no confirmado?
- [ ] ¿Hay tratamientos térmicos o recubrimientos con plazo incierto?

**Regla de oro:** Si hay más de 2 ⚠️ no resueltos, mejor enviar email de aclaraciones antes que un presupuesto con riesgo alto.

### Bloque 5 — Revisión del email borrador (30 segundos)

- [ ] Asunto del email incluye referencia del RFQ
- [ ] Nombre del contacto del cliente está correcto (no "Contacto cliente")
- [ ] Precio total y plazo están explícitos en el cuerpo del email
- [ ] Hay mención a que es un BORRADOR pendiente de validación
- [ ] Hay instrucciones claras de qué debe hacer el cliente (aceptar, pedir cambios, etc.)
- [ ] Firma del taller incluye nombre real, cargo y teléfono de contacto

## Output

Genera un informe de revisión con:
1. **SEMÁFORO GLOBAL**: 🟢 Listo para enviar / 🟡 Enviar con precauciones / 🔴 No enviar — corregir primero
2. **Lista de correcciones obligatorias** (bloquean el envío)
3. **Lista de mejoras recomendadas** (no bloquean pero mejoran el presupuesto)
4. **Estimación de confianza en el precio** (alta / media / baja) con justificación

## Reglas

- Si hay errores de Bloque 1 o Bloque 2 → semáforo ROJO, no enviar
- Si el precio tiene incertidumbre >±25% → semáforo AMARILLO, incluir rango en el email
- Nunca dar semáforo VERDE si hay material con `confianza: BAJA` y precio >500 EUR sin revisar
- Output siempre en español
