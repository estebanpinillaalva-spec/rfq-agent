---
name: seguimiento-oferta
description: Gestiona el seguimiento de ofertas enviadas sin respuesta. Determina cuándo y cómo hacer follow-up, genera el email de seguimiento adecuado según el tiempo transcurrido y el perfil del cliente. Activa cuando el estimador dice "no han respondido", "cuándo llamo", "haz el follow-up de [REF]" o cuando una oferta lleva más de X días sin respuesta.
---

# Seguimiento de Oferta

Gestión del ciclo post-envío de presupuesto. El seguimiento bien ejecutado aumenta la tasa de conversión en un 20-35% según datos del sector de mecanizado B2B.

## Cuándo activar

- Oferta enviada hace más de 5 días laborables sin respuesta
- El estimador quiere saber si hacer seguimiento
- Hay que preparar el email o guion de llamada de seguimiento
- El cliente ha respondido con preguntas y hay que contestar

## Input necesario

- Referencia del RFQ y fecha de envío de la oferta
- Nombre y empresa del cliente
- Precio total de la oferta
- Si es cliente nuevo o habitual
- Cualquier contexto adicional (¿hubo llamada previa? ¿urgencia mencionada?)

## Protocolo de seguimiento

### Semana 1 (días 1-5): Espera activa

No hacer seguimiento. El cliente necesita tiempo para revisar la oferta internamente.

**Excepción:** Si el cliente mencionó urgencia en el RFQ original → seguimiento telefónico al día 2.

### Semana 2 (días 6-10): Primer contacto

**Formato preferido:** Email (no intrusivo, deja registro).

**Objetivo:** Confirmar recepción y preguntar si hay dudas.

Plantilla:
```
Asunto: Re: Oferta [REF] — ¿Ha tenido ocasión de revisarla?

Estimado/a [Nombre],

Le escribo para confirmar que recibió correctamente nuestra oferta [REF] 
del [FECHA], por importe de [TOTAL] €.

Si tiene alguna pregunta técnica o desea ajustar algún aspecto del 
presupuesto, estamos a su disposición.

En caso de que el proyecto haya cambiado o quieran solicitarnos otra 
cotización, no dude en contactarnos.

Atentamente,
[Firma]
```

### Semana 3-4 (días 11-20): Segundo contacto

**Formato:** Llamada telefónica + email de seguimiento.

**Objetivo:** Entender el estado del proyecto y si hay competencia.

Guion de llamada:
```
"Buenos días [Nombre], soy [Nombre] de [Taller]. Le llamo por la oferta 
[REF] que le enviamos hace [X] días. ¿Ha tenido ocasión de revisarla?

[Escuchar]

¿Hay algún punto que quiera que revisemos o ajustemos?

[Si menciona precio alto]
Podemos revisar la oferta si hay algún volumen mayor o condiciones de 
plazo diferentes.

[Si menciona que están evaluando varias ofertas]
Por supuesto. Si necesitan cualquier información adicional o quieren 
comparar aspectos técnicos, estamos aquí.
```

Email de acompañamiento post-llamada:
```
Asunto: [REF] — Seguimiento de nuestra conversación

Estimado/a [Nombre],

Como comenté por teléfono, quedo a su disposición para [lo que se habló].

[Punto concreto de acción si lo hay]

Un saludo,
[Firma]
```

### Más de 30 días: Cierre del ciclo

Si no hay respuesta tras 2 contactos:
- Email de cierre cortés con oferta de reactivar cuando sea necesario
- Archivar como "sin respuesta" en el pipeline
- Mantener en lista para prospección futura (no eliminar el contacto)

Plantilla de cierre:
```
Asunto: [REF] — Cerramos la oferta — Disponibles para futuros proyectos

Estimado/a [Nombre],

Dado que no hemos recibido noticias sobre la oferta [REF], procedemos 
a cerrarla en nuestro sistema.

Si en el futuro necesitan mecanizado de precisión, no duden en contactarnos. 
Guardaremos sus datos y la documentación técnica para agilizar cualquier 
consulta futura.

Muchas gracias por considerar a [Taller].

Atentamente,
[Firma]
```

## Señales de interés real (priorizar seguimiento)

- El cliente abrió el email con el PDF adjunto (si hay tracking)
- El cliente hizo una pregunta técnica específica → interés real, responder en <2h
- El cliente mencionó fecha de decisión en el RFQ original → llamar 2 días antes
- El cliente es habitual que siempre pide y tarda en responder → esperar más

## Señales de desinterés (no insistir)

- Dos contactos sin respuesta de ningún tipo
- Cliente explicó que el proyecto se ha cancelado o pospuesto indefinidamente
- La oferta estaba fuera de presupuesto del cliente y no hay margen de negociación

## Manejo de objeciones frecuentes

**"Su precio es muy alto"**
- Preguntar qué presupuesto tienen en mente
- Si hay margen: ofrecer revisión de cantidades, material alternativo o plazo más largo
- Si no hay margen: explicar valor diferencial (calidad, trazabilidad, rapidez)
- No bajar precio sin contrapartida: "Puedo revisar el precio si podemos ajustar [plazo/cantidad/material]"

**"Estamos evaluando varias ofertas"**
- Es normal en B2B. No presionar.
- Ofrecer cualquier información técnica adicional que necesiten para comparar
- Preguntar cuándo tienen previsto tomar la decisión

**"Necesito consultarlo con [jefe/dirección/compras]"**
- Ofrecer cualquier documentación técnica adicional para facilitar la decisión interna
- Preguntar si tienen fecha estimada de decisión
- No llamar de nuevo hasta esa fecha

## Reglas

- Output siempre en español
- Nunca presionar de forma agresiva; el sector del mecanizado es pequeño y la reputación importa
- Guardar registro de cada contacto con fecha y resultado
- Si el cliente dice "no", aceptarlo con profesionalidad y mantener la relación
