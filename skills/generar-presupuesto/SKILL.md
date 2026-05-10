---
name: generar-presupuesto
description: Convierte un análisis técnico de RFQ ya procesado en un presupuesto comercial profesional en español, listo para que el estimador revise y envíe al cliente. Úsala siempre tras la skill `procesar-rfq` cuando hace falta generar el documento de cotización con desglose de costes, condiciones comerciales y plazos. Activa también con frases como "genera presupuesto", "calcula coste", "haz una oferta", "estima precio", "cotiza esta pieza", "convierte esto en presupuesto", "documento comercial", o cuando hay un análisis técnico estructurado y el siguiente paso es el documento que va al cliente final. Calcula material, operaciones, subcontratas y aplica margen del taller automáticamente.
---

# Generar presupuesto

Conversión de análisis técnico de RFQ a presupuesto comercial profesional con desglose económico, condiciones comerciales y notas internas para el estimador.

## Cuándo activar

Activa cuando:
- Existe un análisis técnico estructurado (output validado de `procesar-rfq`)
- El usuario pide oferta, presupuesto, cotización o documento comercial
- Hay que convertir specs técnicas en un documento con precios

Pre-requisito imprescindible: análisis ya validado por estimador y `config-taller.md` disponible con precios y márgenes del taller cliente.

## Output

Documento Markdown profesional siguiendo `references/plantilla-presupuesto.md` con:

1. Encabezado con datos del taller y referencia única
2. Datos del cliente
3. Desglose por pieza con cantidades y precios unitarios
4. Resumen económico con totales (sin/con IVA)
5. Condiciones comerciales completas
6. Observaciones técnicas relevantes
7. Sección "Notas internas" claramente separada (no enviar al cliente)
8. Marca "BORRADOR" en cabecera

## Pre-requisitos a verificar

Antes de calcular, verifica que existen:
- `analisis-rfq.md` con todas las secciones completas
- `config-taller.md` con: precios/hora-máquina, márgenes objetivo, plazos estándar, datos empresa, condiciones por defecto
- Cantidades confirmadas para cada referencia
- Operaciones identificadas con tiempos estimados
- Sin ambigüedades sin resolver (los ⚠️ del análisis deben estar resueltos)

Si falta `config-taller.md`: solicita los datos al usuario antes de proceder. Nunca inventes precios.

Si hay ambigüedades sin resolver: STOP. El presupuesto no se genera hasta que el cliente aclare los puntos pendientes.

## Proceso de cálculo en 8 pasos

### Paso 1 — Cálculo de coste de material

Para cada pieza:
1. Calcular volumen desde dimensiones del plano
2. Calcular masa = volumen × densidad (ver `references/tabla-densidades.md`)
3. Aplicar merma según operación principal:
   - Mecanizado desde barra: 30-50%
   - Mecanizado desde forja/fundición: 5-15%
   - Corte láser de chapa: 10-20%
   - Plegado de chapa: 0-5% adicional
4. Coste material por pieza = masa con merma × €/kg material × 1.05 (gestión)

Precios €/kg vienen de `config-taller.md` o `references/precios-materiales.md`.

### Paso 2 — Cálculo de operaciones

Para cada operación:
1. Tiempo de operación por pieza (desde análisis técnico)
2. Tiempo de preparación / setup (varía con cantidad):
   - Lote 1-10 piezas: setup completo
   - Lote 10-100: setup amortizado
   - Lote >100: setup mínimo
3. Coste operación = (tiempo × cantidad + setup) × €/hora máquina del taller

Precios €/hora-máquina por tipo de operación están en `config-taller.md`. Valores de referencia en `references/tarifas-referencia.md` si no hay config.

### Paso 3 — Subcontrataciones

Para cada subcontrata (tratamientos, recubrimientos):
1. Coste según tabla en `config-taller.md` o referencia
2. Plazo adicional al lead time total
3. Margen de gestión (típico 10-15% sobre coste subcontrata)

### Paso 4 — Cálculo final por pieza

```
Coste directo unitario = Material + Operaciones + Subcontratas
Coste indirecto = Coste directo × % overhead taller (típico 15-25%)
Coste total unitario = Coste directo + Coste indirecto
PVP unitario = Coste total × (1 + margen objetivo)
```

Margen objetivo según tipo de pieza:
- Estándar: 25-35%
- Alta complejidad: 35-50%
- Urgente: añadir 15-25% extra
- Especial / única: 50-100%

### Paso 5 — Redondeo comercial

Para presentación profesional:
- PVP unitario <50€: redondear a múltiplos de 1€
- 50-500€: múltiplos de 5€
- 500-5.000€: múltiplos de 25€
- >5.000€: múltiplos de 100€

### Paso 6 — Plazo de entrega

Calcular sumando:
- Aprovisionamiento material: 3-15 días según material
- Tiempo de fabricación: tiempos × cantidad ÷ capacidad diaria del taller
- Subcontrataciones: tiempo + transporte si aplican
- Margen de seguridad: 20-30% sobre estimación

Indicar siempre como "plazo estimado, confirmar al pedido".

### Paso 7 — Cálculo de IVA

España estándar: 21% sobre subtotal sin IVA. Verificar excepciones en `config-taller.md` (algunos sectores tienen IVA reducido o régimen especial).

### Paso 8 — Generación del documento

Usar `references/plantilla-presupuesto.md`. Asegurar:
- Marca BORRADOR visible en cabecera
- Datos del taller correctos (no del proveedor de la herramienta)
- Referencia única RFQ-YYYY-NNN
- Fecha actual
- Validez 15 días naturales (configurable)
- Sección "Notas internas" claramente separada y marcada para no enviar

## Reglas críticas

- Todo documento generado lleva la marca "BORRADOR" hasta validación humana del estimador.
- No comprometer plazos sin margen de seguridad.
- Si complejidad es ALTA o MUY ALTA: añadir nota "Requiere análisis detallado por estimador senior antes de envío".
- Si hay subcontratas críticas: marcar la dependencia explícitamente en el plazo.
- Aplicar precios desde `config-taller.md`, NUNCA inventar.
- Si falta dato de coste, marcar `[CONFIRMAR PRECIO]` en lugar de inventar.
- Sección "Notas Internas": SIEMPRE separada y marcada explícitamente.
- Si el cliente pide certificación especial (3.1, 3.2, materiales aero), añadir coste asociado y validarlo con cliente si no estaba presupuestado.
- IVA: verificar régimen del taller (no asumir siempre 21%).

## Validación final

Antes de devolver el presupuesto, comprueba:
- Marca BORRADOR visible en cabecera
- Todos los precios calculados desde config-taller (no inventados)
- Subcontratas listadas con plazo adicional explícito
- Plazo total con margen de seguridad
- IVA calculado correctamente
- Condiciones comerciales completas (forma de pago, validez, embalaje)
- Observaciones técnicas redactadas en lenguaje comercial (no jerga interna)
- Notas internas separadas y marcadas
- Validez del presupuesto indicada (15 días por defecto)

## Errores frecuentes a evitar

- Calcular sin merma de material (subestimar coste)
- Olvidar tiempo de setup en lotes pequeños
- No incluir margen de gestión en subcontratas
- Margen demasiado bajo en piezas complejas (perder dinero en producción)
- Margen demasiado alto en piezas estándar (perder pedido)
- Comprometer plazos sin validar capacidad real del taller
- Calcular IVA mal (excepciones por sector)
- Olvidar marca BORRADOR
- Mezclar notas internas con texto comercial visible al cliente

## Recursos

- `references/plantilla-presupuesto.md` — Plantilla completa del documento de salida
- `references/tabla-densidades.md` — Densidades de materiales para cálculo de masa
- `references/tabla-tiempos-operaciones.md` — Tiempos estándar por operación y material
- `references/tarifas-referencia.md` — €/hora máquina y €/kg material de referencia
- `references/condiciones-comerciales.md` — Plantilla de condiciones comerciales por defecto
- `config-taller.md` — Configuración específica del taller cliente (CRÍTICO, fuera de la skill)
