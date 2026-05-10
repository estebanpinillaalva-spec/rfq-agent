# Revision de Presupuesto - RFQ-2026-041

**Fecha de revision:** 2026-05-08  
**Revisor:** Agente CAD (sin skill)  
**Estado final:** APROBADO PARA ENVIO (con observaciones menores)

---

## 1. Identificacion del presupuesto

| Campo | Valor | Estado |
|-------|-------|--------|
| Referencia | RFQ-2026-041 | OK |
| Cliente | Hidraulica del Norte SL | OK |
| Contacto | Marta Solano | OK |
| Email contacto | marta.solano@hidranorte.es | OK |

---

## 2. Verificacion de datos tecnicos

### 2.1 Material
- **Declarado:** Aluminio A6082 / 6082  
- **Confianza:** ALTA (segun sistema)  
- **Observacion:** La denominacion A6082 es correcta para aluminio EN-AW-6082 (equivalente a AlSiMgMn). Ampliamente usado en bloques hidraulicos por su maquinabilidad y resistencia a la corrosion. SIN PROBLEMA.

### 2.2 Tolerancias y acabados
- **Tolerancia general:** ISO 2768-m (media). Adecuada para bloques hidraulicos de uso general.  
- **GD&T:** No aplica segun brief. Verificar con cliente si hay pasajes hidraulicos con ajustes criticos (ej. sedes de valvulas, roscas NPT/BSP) que requieran tolerancias individuales.  
- **Rugosidad:** Ra 3.2 general. ACEPTABLE para superficies exteriores; si hay superficies de sellado o asientos de junta, Ra 3.2 puede ser insuficiente (normalmente se requiere Ra 0.8 o Ra 1.6). PUNTO A CONFIRMAR con cliente antes de produccion, aunque no bloquea el envio del presupuesto si se aclara en condiciones.

### 2.3 Tiempo de mecanizado
- **45 min/pieza** para bloque hidraulico aluminio 6082 en serie de 10 uds.  
- Razonable si la pieza es de complejidad media (canales interiores sencillos, sin roscas multiples de alta precision). Si la pieza lleva muchos taladros roscados o canales cruzados, revisar el tiempo antes de produccion. Para el presupuesto, el valor es DEFENDIBLE.

---

## 3. Verificacion economica

### 3.1 Calculo de precios

| Concepto | Valor declarado | Verificacion |
|----------|----------------|--------------|
| Precio unitario | 185,00 EUR | - |
| Cantidad | 10 uds | - |
| Total sin IVA | 1.850,00 EUR | 185 x 10 = **1.850,00 EUR** OK |
| Margen declarado | 22% | Ver nota abajo |
| IVA (21%) | 388,50 EUR | 1.850 x 0,21 = **388,50 EUR** OK |
| Total con IVA | 2.238,50 EUR | 1.850 + 388,50 = **2.238,50 EUR** OK |

**Nota sobre margen:** El margen del 22% es un dato interno. No aparece en el documento enviado al cliente (correcto). Los calculos aritmeticos son exactos. No hay error de calculo.

### 3.2 IVA
IVA al 21% aplicado correctamente. Coherente con operaciones en territorio peninsular espanol. Si el cliente tuviera sede en Canarias, Ceuta o Melilla, o fuera una operacion intracomunitaria, el tipo seria diferente. Con el dominio `.es` y el nombre "del Norte" no hay indicios de regimen especial, pero verificar CIF del cliente (si empieza por ESB = sociedad limitada nacional, OK).

---

## 4. Verificacion de condiciones comerciales

| Campo | Valor | Evaluacion |
|-------|-------|-----------|
| Plazo de entrega | 8 dias laborables | Razonable para serie de 10 uds sin subcontratas |
| Subcontratas | Ninguna | Simplifica trazabilidad y riesgo |
| Condiciones de pago | 50/50 | Estandar para cliente nuevo o pedido medio. Correcto. |

**Pago 50/50:** 50% a la confirmacion del pedido, 50% a la entrega. Protege al taller frente a impagos en pieza personalizada. CORRECTO para RFQ de este importe.

---

## 5. Verificacion del email borrador

| Elemento | Estado |
|----------|--------|
| Asunto incluye RFQ-2026-041 | Confirmado OK |
| Destinatario correcto | marta.solano@hidranorte.es OK |
| Firma con telefono del taller | Confirmado OK |
| Firma con CIF del taller | Confirmado OK |
| Presupuesto en estado BORRADOR | Correcto - requiere revision humana antes de envio definitivo |

---

## 6. Puntos de atencion (no bloquean envio)

1. **Rugosidad en superficies de sellado:** Si el bloque tiene superficies de asiento de junta plana o sedes de valvula, especificar Ra mas fino (Ra 0.8 o Ra 1.6) en esas superficies antes de fabricar. Recomendable aclararlo en la nota tecnica del presupuesto o confirmarlo con el cliente en la aceptacion del pedido.

2. **Tolerancias de agujeros hidraulicos:** ISO 2768-m no cubre ajustes de precision. Si hay racores o componentes hidraulicos normalizados que requieran H7/g6 u otros ajustes ISO, deben especificarse individualmente en el plano. Incluir clausula en presupuesto: *"Tolerancias individuales segun plano del cliente; presupuesto basado en ISO 2768-m salvo indicacion contraria."*

3. **Verificacion CIF cliente:** Confirmar que el CIF de Hidraulica del Norte SL es valido y coincide con la facturacion. No es bloqueante pero es buena practica.

---

## 7. Errores criticos detectados

**NINGUNO.**

Todos los calculos aritmeticos son correctos. Los datos tecnicos son coherentes. El email borrador cumple los requisitos minimos (referencia, destinatario, firma completa).

---

## 8. Veredicto

**GREEN LIGHT - APROBADO PARA ENVIO**

El presupuesto RFQ-2026-041 puede enviarse a Marta Solano (marta.solano@hidranorte.es) sin modificaciones obligatorias. Se recomienda incorporar la clausula de tolerancias individuales (punto 2 de observaciones) antes del envio final si el taller dispone de los planos del cliente.

---

*Revision generada automaticamente por agente CAD - 2026-05-08. Requiere validacion humana antes del envio definitivo.*
