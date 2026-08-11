# ejemplo-002

- Origen: juego de planos industrial real aportado por el usuario
- Documento: `S01 - Piezas adicionales.pdf`
- Paginas: 7
- Fecha del juego de planos: 1999
- Empresa: MAPIPU. Conjunto `RUEDA GIRO PORTICO`, conjunto n.º 11.00
- PDF raster sin capa de texto: `pdf-parse` extrae 0 caracteres, todo depende de la vision del modelo

## Correspondencia pagina - plano, leida del cajetin

| Pagina | Plano n.º | Titulo | Material |
|---|---|---|---|
| 1 | 11.01 | Plataforma anclaje | F-1120 |
| 2 | 11.02 | Rueda de giro | F-1280 |
| 3 | 11.03 | (por confirmar) | F-1250 |
| 4 | 11.04 | Tapeta de cierre | F-1150 |
| 5 | 11.05 | (por confirmar) | F-1150 |
| 6 | 11.06 | Casquillo distanciador | C-6440 |
| 7 | **11.08** | Plataforma de giro | F-1120 |

**No existe una pagina 11.07 en este documento.** La numeracion salta del 11.06 al 11.08.

## Revisiones pendientes de `verdad.json`

Las tres se detectaron comparando la referencia con el plano original, no con la salida
del modelo. En los tres casos el modelo acertaba y la transcripcion no.

1. **RESUELTO** — pieza de la pagina 4: el espesor envolvente es 40, no 24. La cadena de
   cotas de la seccion lleva 12, 24 y 40, y la linea de cota exterior, la que abarca de
   cara a cara, es la de 40. El 24 es un escalon parcial.
2. **RESUELTO** — pieza de la pagina 2: el diametro exterior es 515, no 536. Es un tronco
   de cono de 515 a 480; la envolvente de un cono es el cilindro de su diametro mayor.
3. **PENDIENTE** — pieza de la pagina 7: figura como `11.07` y su numero de plano real es
   `11.08`. Ademas el cajetin declara **dos marcas**, la 8 (`Plataforma de giro 1`) y la 9
   (`Plataforma de giro 2`), cada una de 1 pieza, sobre el mismo plano y el mismo material.
   La verdad recoge una sola pieza con cantidad 1.

   Consecuencia de este error: la deteccion se reporta como 6 de 7 con una pieza
   "no detectada" y dos "sobrantes" llamadas 11.08. El modelo estaba leyendo bien el
   numero de plano y detectando bien las dos marcas; lo que fallaba era la referencia.

   Decision del usuario: o una entrada `11.08` con `cantidad: 2`, o dos entradas con el
   mismo numero de plano (que el schema rechaza por duplicado, asi que habria que
   revisar esa regla). No lo resuelve ningun agente.

## Notas

- `C-6440`, material del casquillo distanciador de la pagina 6, no aparece en ninguna
  fuente publica accesible. UNE 37103 cubre aleaciones de cobre para moldeo pero sus
  designaciones no estan publicadas abiertamente. Falta el dato del taller o del proveedor.
- Precio de referencia: sin pedir. Todas las piezas van con `precio_referencia: null`, asi
  que el caso mide extraccion y no desviacion de precio.
