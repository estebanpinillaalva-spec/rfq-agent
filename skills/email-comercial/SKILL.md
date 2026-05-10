---
name: email-comercial
description: Genera el email comercial profesional para enviar al cliente con el presupuesto adjunto. Sustituye al borrador técnico de email-respuesta.md con un email listo para enviar, en tono B2B español, con tabla de resumen de piezas, precio destacado, plazo y llamada a la acción clara. Activa cuando el estimador dice "redacta el email al cliente", "prepara el email con el presupuesto" o cuando el sistema necesita el email final de envío.
---

# Email Comercial Profesional

Genera el email definitivo para enviar al cliente con el presupuesto. Tono profesional B2B español, claro, directo y con toda la información necesaria para que el cliente pueda tomar una decisión.

## Cuándo activar

- Cuando el borrador técnico (`email-respuesta.md`) necesita transformarse en email real para el cliente
- Cuando el estimador ha validado el presupuesto y quiere enviar
- Cuando hay que enviar un presupuesto por primera vez a un cliente nuevo

**NO activar** cuando la validación ha detectado ambigüedades graves — primero resolver con `revisar-borrador`.

## Input necesario

- `presupuesto.md` o datos del presupuesto completos
- Datos del cliente (empresa, nombre contacto, email)
- Datos del taller (nombre, email, teléfono, CIF, persona firmante + cargo)
- Estado del análisis (si hay observaciones técnicas relevantes)

## Estructura del email

### Línea de asunto
```
Oferta [REF-XXXX] — Presupuesto mecanizado [DENOMINACION_PRINCIPAL] — [TALLER]
```
Ejemplos:
- `Oferta RFQ-2026-031 — Presupuesto mecanizado Eje de transmisión — Talleres García SL`
- `Oferta RFQ-2026-045 — Presupuesto 3 piezas mecanizado CNC — Mecanizados Norte SA`

### Saludo
```
Estimado/a [Nombre contacto],
```
Si no hay nombre: `Estimado/a equipo de compras de [Empresa],`
NUNCA usar "Hola" ni "Buenos días" en emails B2B con cliente nuevo.

### Párrafo de apertura (2 líneas máximo)
Confirmar recepción del RFQ y agradecer el interés. Mencionar fecha de recepción.

### Tabla resumen de piezas — formato HTML

La tabla y el bloque de totales se generan como HTML estilizado. Esto permite pegarlos directamente en Gmail u Outlook y que se vean como un documento profesional, no como texto plano con palitos.

```html
<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;margin:16px 0;">
  <thead>
    <tr style="background:#1a2733;color:#ffffff;">
      <th style="padding:10px 14px;text-align:left;font-weight:600;border:none;">Pieza</th>
      <th style="padding:10px 14px;text-align:center;font-weight:600;border:none;">Cant.</th>
      <th style="padding:10px 14px;text-align:left;font-weight:600;border:none;">Material</th>
      <th style="padding:10px 14px;text-align:center;font-weight:600;border:none;">Plazo</th>
      <th style="padding:10px 14px;text-align:right;font-weight:600;border:none;">PVP unit.</th>
      <th style="padding:10px 14px;text-align:right;font-weight:600;border:none;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    <!-- Filas pares: fondo blanco -->
    <tr style="background:#ffffff;">
      <td style="padding:9px 14px;border-bottom:1px solid #e8e5e0;">[denominacion]</td>
      <td style="padding:9px 14px;text-align:center;border-bottom:1px solid #e8e5e0;">[n]</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e8e5e0;">[material norm]</td>
      <td style="padding:9px 14px;text-align:center;border-bottom:1px solid #e8e5e0;">[X días]</td>
      <td style="padding:9px 14px;text-align:right;border-bottom:1px solid #e8e5e0;">[XXX,XX €]</td>
      <td style="padding:9px 14px;text-align:right;border-bottom:1px solid #e8e5e0;">[YYY,YY €]</td>
    </tr>
    <!-- Filas impares: fondo gris muy suave -->
    <tr style="background:#f7f6f3;">
      <td style="padding:9px 14px;border-bottom:1px solid #e8e5e0;">...</td>
      ...
    </tr>
  </tbody>
</table>
```

Si hay más de 5 piezas, agrupar las similares.

### Bloque de totales (destacado) — formato HTML

```html
<table style="border-collapse:collapse;width:280px;margin-left:auto;font-family:Arial,sans-serif;font-size:13px;margin-top:4px;">
  <tr>
    <td style="padding:6px 14px;color:#555;">Subtotal</td>
    <td style="padding:6px 14px;text-align:right;color:#555;">X.XXX,XX €</td>
  </tr>
  <tr>
    <td style="padding:6px 14px;color:#555;">IVA 21%</td>
    <td style="padding:6px 14px;text-align:right;color:#555;">XXX,XX €</td>
  </tr>
  <tr style="background:#1a2733;color:#ffffff;">
    <td style="padding:10px 14px;font-weight:700;font-size:14px;">TOTAL OFERTA</td>
    <td style="padding:10px 14px;text-align:right;font-weight:700;font-size:14px;">X.XXX,XX €</td>
  </tr>
  <tr>
    <td style="padding:8px 14px;color:#555;font-size:12px;">Plazo de entrega</td>
    <td style="padding:8px 14px;text-align:right;color:#333;font-size:12px;">X días laborables</td>
  </tr>
  <tr>
    <td style="padding:4px 14px;color:#555;font-size:12px;">Validez de la oferta</td>
    <td style="padding:4px 14px;text-align:right;color:#333;font-size:12px;">15 días</td>
  </tr>
</table>
```

### Condiciones de pago
Una línea con las condiciones del taller (ej: "50% a la confirmación, 50% antes del envío").

### Párrafo de observaciones técnicas (solo si hay algo relevante)
- Si hay materiales con precio variable → mencionar que precio de materias primas puede revisarse si el plazo se alarga
- Si hay subcontratas → mencionar que el plazo incluye tratamiento externo
- Si hay incertidumbre técnica → mencionar qué punto necesita confirmación del cliente

Máximo 3 puntos. Si no hay nada relevante, omitir esta sección.

### Llamada a la acción
```
Para confirmar el pedido o solicitar cualquier aclaración, puede contactar con nosotros 
en [email] o [teléfono]. Quedamos a su disposición.
```

### Cierre y firma
```
Atentamente,

[Nombre y apellido]
[Cargo] — [Nombre taller]
Tel: [teléfono directo]
Email: [email]
[Dirección] | CIF: [CIF]
```

## Tono y estilo

**Correcto:**
- Formal pero cercano: "Estimado/a [nombre]"
- Afirmativo: "Adjuntamos nuestra oferta para..."
- Directo: precio y plazo visibles en los primeros 3 segundos de lectura
- Profesional: sin emojis, sin exclamaciones

**Incorrecto:**
- Demasiado técnico: no copiar el análisis Gemini en el email
- Demasiado informal: sin "Hola", sin tuteo salvo clientes habituales que lo prefieran
- Ambiguo en precio: el cliente debe ver el total de un vistazo
- Sin datos de contacto: siempre incluir teléfono y email directo

## Variantes

### Email con aclaraciones pendientes (no enviar presupuesto aún)
Cuando hay ambigüedades no resueltas:
```
Asunto: Consulta técnica — Oferta [REF] en preparación — [TALLER]
```
- Confirmar recepción del RFQ
- Indicar que el presupuesto está en elaboración
- Lista numerada de preguntas técnicas concretas (máximo 5)
- Indicar plazo de respuesta del presupuesto una vez recibidas las aclaraciones

### Email de rechazo cortés
Cuando el RFQ no encaja con la capacidad del taller:
```
Asunto: [REF] — Consulta recibida — [TALLER]
```
- Agradecer el contacto
- Explicar brevemente por qué no se puede ofertar (sin entrar en detalles técnicos)
- Ofrecer derivar a otro taller si se conoce uno adecuado
- Mantener la puerta abierta para futuros RFQs más adecuados

## Reglas

- Output siempre en español, salvo que el email original del cliente sea en otro idioma (en ese caso, bilingüe ES/EN)
- NUNCA incluir costes de producción internos, márgenes ni datos del análisis Gemini en el email al cliente
- La tabla de piezas y el bloque de totales se generan siempre en HTML estilizado (ver plantillas de arriba) — nunca como tabla Markdown con pipes. El HTML se puede pegar directamente en Gmail/Outlook y se ve como un documento profesional.
- El resto del email (texto, saludo, firma) puede ser texto plano o Markdown — solo la tabla necesita HTML
- Si no hay nombre de contacto del cliente → usar "equipo de compras"
- Siempre incluir el número de RFQ en el asunto para facilitar el seguimiento
