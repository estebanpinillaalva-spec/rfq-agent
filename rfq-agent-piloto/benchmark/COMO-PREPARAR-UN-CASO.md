# Cómo preparar un caso de benchmark

Un caso de benchmark es **un caso de entrada normal más un `verdad.json`**. El arnés lanza el mismo pipeline que producción; no hay modo especial ni ruta paralela. Si algo aquí exige código que producción no ejecuta, está mal.

## Estructura de la carpeta

```
benchmark/casos/<id>/
  email.txt            OBLIGATORIO
  config-taller.json   OBLIGATORIO
  plano.pdf            OBLIGATORIO (al menos un .pdf, .png, .jpg o .jpeg)
  pieza.step           opcional
  verdad.json          OBLIGATORIO para medir
  origen.md            recomendado
```

Los tres primeros los exige `leerEntradaRFQ` (`src/utils/leerArchivos.ts`) y el pipeline aborta sin ellos. Los dos últimos los usa solo el arnés.

Usa un `<id>` corto y estable: `taller-a-001`, `cad-publico-002`. Aparece tal cual en el informe.

## Qué archivos se cotizan y cuáles no

| Extensión | Trato |
|---|---|
| `.pdf`, `.png`, `.jpg`, `.jpeg` | Fuente principal: se analiza y se cotiza |
| `.step`, `.stp` | Contexto 3D, **no se cotiza** |
| `.dxf` | Contexto, **no se cotiza** |

Esto importa si bajas la pieza de GrabCAD: puedes dejar el STEP en la carpeta junto al PDF sin que contamine la medición. El modelo lo ve como contexto y el precio sigue saliendo del plano.

Límite de 50 MB por archivo. Los planos se ordenan alfabéticamente, así que si hay varios, nómbralos `01-plano.pdf`, `02-plano.pdf`.

## `email.txt` — el error que arruina la medición

Formato libre, es texto que va al modelo. Plantilla mínima:

```
De: compras@cliente-ejemplo.es
Asunto: Solicitud presupuesto pieza <referencia>

Hola,

Adjuntamos plano para presupuestar.
Necesitamos 10 unidades para el 20 de septiembre.

Saludos,
Nombre Apellido
Cliente Ejemplo SL
```

**No repitas en el correo lo que debe salir del plano.** Es el fallo más fácil de cometer y deja el benchmark sin valor: si escribes "material acero F-114" en el email, ya no estás midiendo si el sistema sabe leer un cajetín, estás midiendo si sabe leer una frase en castellano. Reparto correcto:

- **Vienen del correo, y ahí deben estar:** cantidad y plazo. En un RFQ real también llegan así.
- **Vienen del plano, y solo del plano:** número de plano, material, dimensiones, tolerancia general y acabado.

Si el taller te pasa correos reales, déjalos tal cual aunque mencionen el material: ahí la contaminación es la realidad y medirla es legítimo. Anótalo en `origen.md`.

## `config-taller.json`

Copia `ejemplos/rfq-simple/config-taller.json` y ajusta `precios_hora`, `margen_por_complejidad` y `overhead_porcentaje` a los del taller que estés midiendo. Comparar tu precio contra el de un taller usando las tarifas de otro no mide nada.

Si añades la tabla opcional `minutos_por_operacion`, el motor calcula el tiempo desde ahí y el desglose queda marcado como `tabla_taller` en vez de `estimacion_modelo`. Sin esa tabla, los minutos los estima el modelo y el Quality Gate lo avisa: es correcto y está declarado a propósito.

## `verdad.json`

El contrato lo valida `verdadCasoSchema` (`src/types.ts`).

Un caso lleva **un array de piezas**, porque un RFQ real es un PDF con varias. Una entrada por página.

```json
{
  "version": "2.0",
  "caso_id": "cad-publico-002",
  "procedencia": "cad_publico_plano_generado",
  "piezas": [
    {
      "_pagina": 1,
      "numero_plano": "PL-0002",
      "material": "AISI 304",
      "cantidad": 10,
      "dimensiones": { "forma": "prismatica", "cotas_mm": [120, 80, 25] },
      "tolerancia_general": "ISO 2768-mK",
      "acabado": "mecanizado",
      "plazo_dias": 15,
      "precio_referencia": {
        "valor_eur": 480,
        "cantidad": 10,
        "fuente": "Xometry instant quote",
        "fecha": "2026-08-05"
      }
    }
  ]
}
```

`_pagina` es tu marcador para saber cuál transcribes; Zod lo descarta al validar. El comparador empareja las piezas **por número de plano**, nunca por orden de página, así que dos piezas no pueden repetir número: el schema lo rechaza.

Reglas que el schema rechaza si incumples:

- `forma: "prismatica"` exige exactamente 3 cotas; `"cilindrica"` exige 2, en orden **diámetro y luego longitud**.
- `procedencia` solo admite `cad_publico_plano_generado` o `taller_real_anonimizado`.
- `plazo_dias` es entero positivo o `null`. Ponlo a `null` si el correo no da plazo: el comparador lo trata como acierto en vez de penalizar algo que no existe.
- `precio_referencia` es `null` si aún no has pedido precio. El caso sigue midiendo extracción; solo queda fuera de la sección de desviación de precio.
- `valor_eur` y `cantidad` van **juntos y coherentes**: el comparador divide uno entre otro para obtener el unitario. Si el precio de 480 € era por las 10 unidades, pon `cantidad: 10`, no `1`.

Valores que anotas mirando el plano, no lo que crees recordar. La verdad es la referencia contra la que se juzga todo; si la rellenas de memoria, el informe mide tu memoria.

## Precio de referencia

A mano, sin automatizar ni scrapear. Gratuitos con cupo mensual: CloudNC Quote Agent (20 piezas/mes), Spanflug MAKE (5/mes). Con registro: Xometry, Protolabs, Hubs, PCBWay.

Anota siempre `fuente` y `fecha`: un presupuesto de hace ocho meses no es comparable con el de hoy.

Si el precio viene del taller, `fuente` es algo como `"Presupuesto humano taller A, oferta 2026-04-118"`.

## Ejecutar

```powershell
cd rfq-agent-piloto
npm.cmd run benchmark
```

Sale con `mock` por defecto para no gastar cuota. Para medir de verdad contra visión real:

```powershell
$env:RFQ_BENCHMARK_PROVIDER = "gemini"; npm.cmd run benchmark
```

**Una sola corrida no es una medición.** El modelo no es determinista ni con la temperatura a 0: se han visto corridas idénticas dando 308 y 184 para un mismo espesor, y un campo pasando del 83% al 0%. Para sacar conclusiones, repite:

```powershell
$env:RFQ_BENCHMARK_PROVIDER = "gemini"; $env:RFQ_BENCHMARK_REPETICIONES = "3"; npm.cmd run benchmark
```

Con más de una repetición el informe muestra la mediana y el rango por campo, y cada celda de la tabla lleva el recuento `aciertos/fallos/no encontrados`. Un `3/0/0` es estable; un `1/2/0` te está diciendo que ese campo no es fiable aunque la mediana parezca decente.

Los informes van a `benchmark/informes/<fecha>-<proveedor>.md` y `.json`.

## Leer el informe

Dos números, y **nunca uno sin el otro**:

- **% acierto** — de todos los campos, cuántos salieron bien.
- **% invención** — de las veces que el modelo se atrevió a dar un valor, cuántas eran falsas.

Un 95% de acierto con 40% de invención es peor producto que un 70% con 5%. Que el sistema diga "no sé leer esto" es el comportamiento que se quiere; inventar un valor plausible es lo que hace que un taller pierda dinero y deje de usarlo.

`Sin datos` no es cero. Significa que no se midió nada, y el JSON lo distingue con `null`.

La sección **Errores de dataset** son fallos tuyos, no del modelo: falta un archivo, `verdad.json` inválido, el material de la verdad no resuelve en la biblioteca. Nunca cuentan como fallos del modelo. Vacíala antes de sacar conclusiones.

## Lo que este benchmark no te dice

Los planos generados desde CAD público salen limpios, rectos y vectoriales. Un RFQ real llega escaneado a 200 dpi, torcido, con notas manuscritas, tolerancias generales en una esquina y referencias a un plano que no te han mandado.

Esto mide el **suelo**. Si con un plano perfecto ya te desvías mucho, has terminado. Si aciertas, solo significa que todavía no lo sabes: hasta que no pasen planos reales de taller, el número es una cota superior optimista.
