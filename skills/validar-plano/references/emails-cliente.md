# Plantillas de email al cliente — Validación de plano

Plantillas en español, profesionales, listas para enviar tras una validación fallida o dudosa.

---

## Caso 1: Imagen de mala calidad

Usar cuando el plano tiene resolución baja, está movido, recortado o ilegible.

```
Asunto: Solicitud de plano técnico — RFQ [referencia]

Estimado/a [Nombre],

Hemos recibido vuestro RFQ con referencia [XXX] y agradecemos la 
confianza en nuestro taller.

El plano [nombre archivo] presenta calidad insuficiente para realizar 
una estimación técnica precisa de la pieza. Para garantizar un 
presupuesto ajustado y sin asunciones, necesitaríamos:

- Plano original en formato PDF (preferible) o
- Imagen escaneada con resolución mínima 300 DPI

Una vez recibida la nueva versión, procesaremos el RFQ y os 
remitiremos el presupuesto en un plazo de 24-48 horas laborables.

Quedamos a vuestra disposición.

Un saludo,
[Firma del taller]
```

---

## Caso 2: Información técnica faltante

Usar cuando faltan datos críticos: material, cantidades, tolerancias generales, etc.

```
Asunto: Información adicional necesaria — RFQ [referencia]

Estimado/a [Nombre],

Gracias por vuestro RFQ con referencia [XXX].

Para ofreceros un presupuesto preciso necesitaríamos confirmar los 
siguientes puntos del plano [nombre archivo]:

[Lista numerada con los puntos concretos. Ejemplos:]
1. Material: el plano no especifica designación normalizada. 
   ¿Podéis confirmar (por ejemplo: F-114, AISI 304, EN AW-6082...)?
2. Tolerancias generales: ¿se aplica ISO 2768 mK por defecto, o 
   tenéis otra norma de referencia?
3. Cantidad: ¿qué cantidad necesitáis presupuestar de esta referencia?
4. Plazo de entrega: ¿tenéis fecha objetivo de entrega?
5. Acabado superficial: la cota Ra no aparece en zonas críticas. 
   ¿Aplicamos Ra estándar o tenéis requisitos específicos?

En cuanto recibamos esta información, prepararemos el presupuesto 
en un plazo de 24-48 horas laborables.

Un saludo,
[Firma del taller]
```

---

## Caso 3: Plano correcto pero ambigüedades menores

Usar en validación DUDOSO. Procesamos en paralelo pero pedimos aclaración.

```
Asunto: Confirmación recibida — RFQ [referencia] (con consultas técnicas)

Estimado/a [Nombre],

Hemos recibido vuestro RFQ con referencia [XXX] y estamos preparando 
el presupuesto.

Mientras procesamos la información, nos gustaría aclarar los 
siguientes puntos para precisar mejor la oferta:

[Lista numerada de puntos a aclarar, similares al Caso 2 pero más 
suaves porque no bloquean el procesamiento]

Si necesitáis el presupuesto con urgencia, podemos enviarlo con 
asunciones razonables y revisarlo tras vuestra confirmación.

Recibirás el borrador en las próximas 24-48 horas en cualquier caso.

Un saludo,
[Firma del taller]
```

---

## Caso 4: Múltiples planos, algunos procesables y otros no

Usar cuando llega un RFQ con varios planos y solo algunos tienen calidad.

```
Asunto: RFQ [referencia] — Recepción parcial

Estimado/a [Nombre],

Hemos recibido vuestro RFQ con [N] planos.

Estado de recepción:
- ✅ Planos procesables: [lista por nombre/referencia]
- ❌ Planos a re-enviar: [lista con motivo breve para cada uno]

Vamos a comenzar el análisis de los planos procesables. Cuando nos 
remitáis las versiones correctas de los pendientes, completaremos 
el presupuesto integral.

Plazo estimado para presupuesto parcial: 24-48h.

Un saludo,
[Firma del taller]
```

---

## Reglas de redacción

Todos los emails deben:
- Estar siempre en español castellano (a no ser que el cliente escribiera en otro idioma confirmado).
- Usar tono profesional pero cercano (tuteo a "vosotros", no usteo).
- Incluir referencia del RFQ siempre.
- Especificar plazo concreto de respuesta (24-48h laborables por defecto).
- Acabar con firma del taller, no del proveedor de la herramienta.
- Marcar la propuesta de plazo como "una vez recibido X".

Evitar:
- Lenguaje técnico excesivo si el contacto no es ingeniero.
- Frases que culpabilicen al cliente ("habéis enviado mal").
- Promesas de plazo sin condicionantes ("en 24h tendréis presupuesto" → mejor "en 24-48h una vez recibida la información").
