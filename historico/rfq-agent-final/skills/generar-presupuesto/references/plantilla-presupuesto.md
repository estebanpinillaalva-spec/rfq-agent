# Plantilla de presupuesto comercial

Estructura exacta del documento de presupuesto. Copiar y rellenar.

```markdown
# PRESUPUESTO

⚠️ **BORRADOR — Pendiente validación del estimador**

---

## Datos del taller

[Logo/imagen si está disponible]

**[Nombre del taller]**
[Dirección completa]
[CP - Ciudad, Provincia]
[CIF: B-XXXXXXXX]

📞 [Teléfono]
✉️ [Email comercial]
🌐 [Web]

---

## Datos del presupuesto

| Campo | Valor |
|-------|-------|
| **Referencia interna** | RFQ-[YYYY]-[NNN] |
| **Fecha** | [DD/MM/YYYY] |
| **Validez oferta** | 15 días naturales |
| **Plazo de entrega** | [X días laborables tras confirmación pedido] |
| **Forma de pago** | [Por defecto: 50% confirmación, 50% antes envío] |

---

## Datos del cliente

**[Empresa cliente]**
A/A: [Persona contacto]
[Email contacto]
[Teléfono si aparece]

Vuestra ref. RFQ: [si tienen referencia propia]

---

## Detalle de las piezas

### Pieza 1 — [Denominación]

| Campo | Valor |
|-------|-------|
| **Plano de referencia** | [Nº plano + revisión] |
| **Material** | [Designación normalizada] |
| **Cantidad** | [unidades] |
| **Operaciones principales** | [resumen breve, máx 1 línea] |
| **Plazo unitario** | [días desde confirmación] |

| Concepto | Importe |
|----------|---------|
| PVP unitario | XX,XX € |
| Cantidad | [N] uds |
| **Subtotal Pieza 1** | **XXX,XX €** |

[Repetir bloque "Pieza N" para cada referencia]

---

## Resumen económico

| Concepto | Importe |
|----------|---------|
| Subtotal piezas | XXX,XX € |
| Embalaje y gestión | XX,XX € |
| **Total sin IVA** | **XXX,XX €** |
| IVA 21% | XX,XX € |
| **TOTAL CON IVA** | **XXX,XX €** |

---

## Condiciones comerciales

### Forma de pago
50% a la confirmación del pedido (recepción de orden de compra y anticipo). 50% restante antes del envío de la mercancía.

Pago mediante transferencia bancaria a la cuenta indicada en factura.

### Plazo de entrega
[X] días laborables desde confirmación de pedido y recepción del anticipo.

El plazo es estimación basada en disponibilidad actual de material y capacidad de taller. Se confirmará al recibir el pedido formal.

### Lugar de entrega
[Según condiciones por defecto del taller. Habitualmente: EXW taller. Otras opciones: FCA, CPT, según cliente.]

### Embalaje
Embalaje estándar industrial incluido en oferta. Embalaje especial (palet aero, caja personalizada) bajo petición con coste adicional.

### Validez
La presente oferta tiene validez de 15 días naturales desde la fecha de emisión. Pasado este plazo, los precios podrían verse afectados por variaciones del mercado de materias primas.

### Certificaciones incluidas
[Indicar las certificaciones presupuestadas. Ejemplo:]
- ✅ Certificado de conformidad
- ✅ Certificado material 2.2 (declaración del proveedor)
- ⚠️ Certificado material 3.1 (con coste adicional, especificar si requerido)
- ⚠️ ITP, declaraciones especiales (bajo petición)

### Cláusulas adicionales
- Los planos suministrados se consideran propiedad del cliente y se devolverán con la entrega o se destruirán bajo confirmación.
- Cualquier modificación posterior a la confirmación del pedido podría afectar precio y plazo.
- Las propiedades del material quedan garantizadas según normas indicadas en oferta.
- Garantía de fabricación: 12 meses desde entrega contra defectos de fabricación, no aplicable a desgaste por uso.

---

## Observaciones técnicas

[Aquí se vuelcan las recomendaciones DFM relevantes para el cliente, redactadas en lenguaje comercial y no técnico interno.]

[Ejemplos:]

> **Optimizaciones sugeridas**
> Hemos identificado que la tolerancia ISO 2768 fK aplicada a la pieza [X] podría flexibilizarse a mK sin afectar la función, lo que reduciría el coste un 12%. Si os interesa esta opción, generamos oferta alternativa.

> **Aclaraciones técnicas**
> Las roscas M10 indicadas en plano [Y] se ejecutarán según norma ISO general (paso 1.5mm) salvo indicación contraria. Si requerís paso fino (1.0mm), por favor confirmadlo.

> **Materiales alternativos**
> El acero 42CrMo4 especificado puede sustituirse por C45+temple+revenido para ciertas aplicaciones, con reducción de coste del 25%. Quedamos a vuestra disposición si os interesa evaluar.

---

## Aceptación del presupuesto

Para aceptar la presente oferta, podéis responder a este email confirmando o enviar orden de compra firmada a [email comercial].

Quedamos a vuestra disposición para cualquier aclaración técnica o comercial.

Atentamente,

[Nombre del estimador]
[Cargo]
[Taller]

---
---

# 🔧 NOTAS INTERNAS — NO ENVIAR AL CLIENTE

⚠️ Esta sección es solo para el estimador. **Eliminar antes de enviar al cliente.**

## Asunciones técnicas realizadas
- [Asunción 1: ej. "Tolerancia general ISO 2768 mK asumida (no aparecía en cajetín)"]
- [Asunción 2: ej. "Material F-114 asumido al decir el plano solo 'acero medio'"]
- [Asunción 3: ej. "Cantidad 50 uds del email, no las 100 del plano"]

## Riesgos de fabricación
- [Riesgo 1: ej. "Tolerancia 0.02 en Ø interior puede requerir rectificado, no solo torneado fino"]
- [Riesgo 2]

## Margen aplicado
- Pieza 1: complejidad MEDIA → margen 30%
- Pieza 2: complejidad ALTA → margen 42%
- Pieza N: ...

## Costes desglosados (para revisión interna)
- Material total: XXX,XX €
- Operaciones in-house: XXX,XX € (XXh máquina)
- Subcontratas: XXX,XX €
- Indirectos: XXX,XX €
- **Coste directo total: XXX,XX €**
- **Margen aplicado: XX%**
- **Beneficio bruto: XXX,XX €**

## Subcontratas y proveedores recomendados
- [Subcontrata 1]: [Proveedor habitual] → [coste] / [plazo]
- [Subcontrata 2]: ...

## Recomendación comercial
- [Si margen fue forzado a la baja, justificar]
- [Si se anticipa negociación, posición límite]
- [Si es cliente nuevo, acciones de seguimiento]

## Validación final estimador
- [ ] He revisado las asunciones técnicas
- [ ] He validado los costes calculados
- [ ] He confirmado disponibilidad de material y capacidad
- [ ] He validado los plazos
- [ ] El margen aplicado es coherente con la política comercial
- [ ] Las observaciones técnicas son apropiadas para el cliente

**Validado por:** [Nombre]
**Fecha:** [DD/MM/YYYY]
```

## Reglas de uso

- La marca **BORRADOR** debe ser visible inmediatamente al abrir el documento.
- La sección "Notas Internas" debe estar **claramente separada** con líneas de separación y marcada explícitamente.
- Eliminar la sección de Notas Internas SIEMPRE antes de enviar al cliente. Si el documento se exporta a PDF, comprobar que no se incluye.
- Los datos del taller deben venir de `config-taller.md`, no inventados.
- La fecha siempre es la del momento de generación.
- Validez: 15 días por defecto. Modificable por taller en `config-taller.md`.
- Si el cliente pide múltiples piezas, mantener el formato bloque a bloque por pieza, no agruparlas.
