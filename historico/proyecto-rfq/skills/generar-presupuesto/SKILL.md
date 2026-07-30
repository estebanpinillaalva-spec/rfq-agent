---
name: generar-presupuesto
description: Use this skill whenever a Spanish mechanical workshop or industrial manufacturer needs to generate a quotation document from a previously processed RFQ analysis. Trigger this skill when there is an analyzed RFQ available (output from the procesar-rfq skill) AND the user wants to produce a quote document, draft offer, "presupuesto", "oferta económica", "cotización" or similar commercial document. Also trigger when the user says "genera presupuesto", "calcula coste", "haz una oferta", "estima precio", or asks to convert technical specs into a price-bearing document. The skill produces a professional commercial quotation in Spanish ready for the estimator to review and send to the end customer.
---

# Generar Presupuesto — Cotización Comercial Profesional

Esta skill toma el análisis técnico de un RFQ previamente procesado y genera un presupuesto comercial profesional en español, listo para que el estimador del taller lo valide y envíe al cliente final.

## Cuándo usar esta skill

Activar cuando:
- Existe un análisis técnico estructurado de un RFQ (output de la skill `procesar-rfq`)
- El usuario pide generar oferta, presupuesto, cotización o presupuesto comercial
- Se necesita un documento profesional con desglose de costes y condiciones comerciales

## Pre-requisitos obligatorios

Antes de generar cualquier presupuesto, verifica que existen estos archivos en el contexto:

1. **`analisis-rfq.md`** — Output validado de la skill `procesar-rfq`
2. **`config-taller.md`** — Configuración específica del taller cliente con:
   - Precio/hora máquina por tipo de operación
   - Margen objetivo por gama de pieza
   - Plazos estándar de entrega
   - Condiciones comerciales por defecto
   - Datos de empresa para encabezado del presupuesto

Si falta `config-taller.md`, solicita al usuario los datos antes de proceder. NO inventes valores.

## Output esperado

Documento Markdown estructurado siguiendo `referencias/plantilla-presupuesto.md` que contiene:

1. Encabezado con datos del taller y referencia única
2. Datos del cliente
3. Desglose por pieza con cantidades y precios unitarios
4. Resumen económico con totales
5. Condiciones comerciales completas
6. Notas técnicas relevantes del análisis DFM
7. Marca "BORRADOR — pendiente validación estimador"

## Flujo de trabajo

### Paso 1 — Validación de inputs

Antes de calcular nada, verifica:

- [ ] Análisis RFQ está completo y sin ambigüedades sin resolver (⚠️ resolved)
- [ ] Config del taller disponible
- [ ] Cantidades confirmadas para cada referencia
- [ ] Operaciones identificadas con tiempos estimados

Si hay ambigüedades sin resolver: STOP. Genera nota explicando que el presupuesto requiere aclarar las dudas antes de cotizar.

### Paso 2 — Cálculo de coste de material

Para cada pieza:

1. **Calcular volumen** desde dimensiones del plano
2. **Calcular masa** = volumen × densidad del material (ver `referencias/tabla-densidades.md`)
3. **Aplicar merma** según operación principal:
   - Mecanizado desde barra: 30-50%
   - Mecanizado desde forja/fundición: 5-15%
   - Corte láser de chapa: 10-20%
   - Plegado de chapa: 0-5% adicional
4. **Coste material por pieza** = masa con merma × €/kg del material × 1.05 (gestión)

Material precio €/kg viene de `config-taller.md` o se solicita al usuario.

### Paso 3 — Cálculo de operaciones

Para cada operación necesaria:

1. **Tiempo de operación por pieza** (extraído del análisis RFQ)
2. **Tiempo de preparación / setup** (varía con cantidad):
   - Lote pequeño (1-10 piezas): setup completo en cada operación
   - Lote medio (10-100): setup amortizado
   - Lote grande (>100): setup mínimo
3. **Coste por operación** = (tiempo operación × cantidad + tiempo setup) × €/hora máquina del taller

Aplicar tabla de €/hora-máquina por tipo desde `config-taller.md`. Tipos típicos:
- Torno CNC: 35-55 €/h
- Centro mecanizado 3 ejes: 40-65 €/h
- Centro mecanizado 5 ejes: 65-95 €/h
- Soldadura TIG cualificada: 45-70 €/h
- Plegadora CNC: 35-50 €/h
- Corte láser: 50-80 €/h (depende espesor)

### Paso 4 — Subcontrataciones

Para cada subcontrata necesaria (tratamientos, recubrimientos):

1. **Coste según tabla** `referencias/tabla-subcontratas.md` o `config-taller.md`
2. **Plazo adicional** que añade al lead time total
3. **Margen de gestión** (típico 10-15% sobre coste subcontrata)

### Paso 5 — Cálculo final por pieza

```
Coste directo unitario = Material + Operaciones + Subcontratas
Coste indirecto = Coste directo × % overhead taller (típico 15-25%)
Coste total unitario = Coste directo + Coste indirecto
PVP unitario = Coste total × (1 + margen objetivo)
```

Margen objetivo típico:
- Pieza estándar: 25-35%
- Pieza alta complejidad: 35-50%
- Pieza urgente: añadir 15-25% extra
- Pieza especial / única: 50-100%

### Paso 6 — Redondeo comercial

Aplicar redondeo para presentación:
- PVP unitario <50€: redondear a múltiplos de 1€
- PVP unitario 50-500€: redondear a múltiplos de 5€
- PVP unitario 500-5000€: redondear a múltiplos de 25€
- PVP unitario >5000€: redondear a múltiplos de 100€

### Paso 7 — Plazo de entrega

Calcular sumando:
- Aprovisionamiento de material: 3-15 días según material
- Tiempo de fabricación: tiempos × cantidad ÷ capacidad diaria
- Subcontrataciones (si aplican): tiempo de tratamiento + transporte
- Margen de seguridad: 20-30% sobre estimación

Indicar siempre como **"plazo estimado, confirmar al pedido"**.

### Paso 8 — Generación del documento

Usar `referencias/plantilla-presupuesto.md`. Estructura obligatoria:

```markdown
# PRESUPUESTO BORRADOR

**Ref. interna:** RFQ-2026-XXX
**Fecha:** [hoy]
**Validez oferta:** 15 días naturales
**⚠️ BORRADOR — pendiente validación del estimador**

---

## DATOS DEL CLIENTE
[Empresa, contacto, email, ref del cliente si la tiene]

## DETALLE DE LAS PIEZAS

### Pieza 1 — [Denominación]
- **Plano:** [referencia y revisión]
- **Material:** [designación normalizada]
- **Cantidad:** [unidades]
- **Operaciones principales:** [lista]
- **Plazo unitario:** [días desde confirmación]

| Concepto | Importe |
|----------|---------|
| PVP unitario | XX,XX € |
| Cantidad | XX uds |
| **Total pieza 1** | **XXX,XX €** |

[Repetir para cada pieza]

## RESUMEN ECONÓMICO

| Concepto | Importe |
|----------|---------|
| Subtotal piezas | XXX,XX € |
| Embalaje y gestión | XX,XX € |
| **Total sin IVA** | **XXX,XX €** |
| IVA 21% | XX,XX € |
| **TOTAL CON IVA** | **XXX,XX €** |

## CONDICIONES COMERCIALES

- **Forma de pago:** 50% confirmación pedido, 50% antes de envío
- **Plazo de entrega:** XX días laborables desde confirmación de pedido y recepción del anticipo
- **Lugar de entrega:** [según config taller]
- **Embalaje:** estándar industrial, especial bajo petición
- **Validez:** 15 días naturales desde fecha presupuesto
- **Certificaciones incluidas:** [según análisis RFQ]
- **Condiciones generales:** disponibles bajo petición

## OBSERVACIONES TÉCNICAS

[Aquí se vuelcan las recomendaciones DFM relevantes para el cliente, redactadas en lenguaje comercial:
- Sugerencias de optimización
- Aclaraciones sobre tolerancias asumidas
- Notas sobre acabados]

## NOTAS INTERNAS (NO ENVIAR AL CLIENTE)

[Sección visible solo para el estimador:
- Asunciones realizadas
- Riesgos de fabricación detectados
- Margen aplicado
- Subcontratas y proveedores recomendados]
```

## Reglas críticas

1. **TODO documento generado lleva la marca "BORRADOR"** hasta validación humana
2. **NO comprometas plazos** sin margen de seguridad
3. **Si complejidad es ALTA o MUY ALTA**: añadir nota "Requiere análisis detallado por estimador senior antes de envío"
4. **Si hay subcontratas críticas**: marcar dependencia explícitamente
5. **Aplicar precios desde config-taller.md**, NUNCA inventar precios
6. **Si falta dato de coste**, marcar `[CONFIRMAR PRECIO]` en lugar de inventar
7. **Sección "Notas Internas"**: SIEMPRE separada, marcada para no enviar
8. **Si el cliente pide certificación especial** (3.1, 3.2, materiales aero), añadir coste asociado y validarlo

## Recursos

- `referencias/plantilla-presupuesto.md` — Plantilla completa del documento de salida
- `referencias/tabla-densidades.md` — Densidades de materiales para cálculo de masa
- `referencias/tabla-tiempos-operaciones.md` — Tiempos estándar por operación y material
- `referencias/tabla-subcontratas.md` — Costes y plazos de subcontrata estándar
- `referencias/condiciones-comerciales-base.md` — Plantilla de condiciones comerciales
- `config-taller.md` — Configuración específica del taller cliente (CRÍTICO)

## Errores frecuentes a evitar

- Calcular sin merma de material (subestimar coste)
- Olvidar tiempo de setup en lotes pequeños
- No incluir gestión de subcontratas en margen
- Margen demasiado bajo en piezas complejas (perder dinero)
- Margen demasiado alto en piezas estándar (perder pedido)
- Comprometer plazos sin validar capacidad del taller
- Olvidar IVA o calcular mal (21% en España, salvo excepciones)
- No marcar el documento como BORRADOR

## Validación final antes de entregar

Checklist obligatorio:
- [ ] Marca "BORRADOR" visible
- [ ] Todos los precios calculados desde config-taller.md
- [ ] Subcontratas listadas con plazo adicional
- [ ] Plazo total con margen de seguridad
- [ ] IVA calculado correctamente
- [ ] Condiciones comerciales completas
- [ ] Observaciones técnicas redactadas en lenguaje comercial
- [ ] Notas internas separadas y marcadas
- [ ] Validez del presupuesto indicada
