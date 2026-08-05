# Reshape del RFQ Agent: buzón medible

Fecha: 2026-08-05
Estado: aprobado, pendiente de plan de implementación

## Por qué

El piloto genera presupuestos que nadie ha comparado nunca contra un presupuesto humano. No sabemos si el número que sale es útil o está a 3x, y sin ese dato no se puede decidir nada: ni si el producto vale, ni cuánto relajar la revisión humana, ni qué enseñar primero en la UI.

Además, el coste depende de un valor que inventa el modelo. En `rfq-agent-piloto/src/utils/costingEngine.ts:20`:

```ts
const costeOperaciones = (pieza.tiempo_estimado_min / 60) * precioHora
```

`tiempo_estimado_min` sale del análisis del LLM y se multiplica directamente contra el precio/hora del taller. La regla 8 de `AGENTS.md` dice que el coste debe venir de configuración local; hoy se cumple para el material y para el setup (`setup_min_por_operacion`), pero no para el tiempo de operación.

Este reshape hace dos cosas: monta un arnés que mide, y deja de presentar como equivalentes los datos leídos del plano y los inventados por el modelo.

## Decisiones cerradas

| Decisión | Elección |
|---|---|
| Dataset | CAD público con plano generado por nosotros ahora; planos reales de taller cuando lleguen, sin rehacer el arnés |
| Alcance | Arnés + UI + motor de coste, en un solo spec |
| Precio automático | Se mantiene, etiquetado como estimación no validada |
| Métrica | Núcleo comercial de 7 campos |
| Ubicación de UI | Reforma de la vista de RFQ existente, sin pantalla nueva |

Riesgo asumido explícitamente: los componentes 4 y 5 se diseñan antes de que exista el número del componente 3. Si el benchmark sale catastrófico, la UI puede quedar obsoleta.

## Componente 1 — Dataset con verdad conocida

Ubicación: `rfq-agent-piloto/benchmark/casos/<id>/`

Cada caso contiene lo mismo que un caso de inbox normal (`email.txt`, `config-taller.json`, el plano) más dos ficheros:

- `verdad.json` — los 7 campos núcleo y el precio de referencia
- `origen.md` — de dónde salió el CAD, su licencia, y quién dio el precio

**Invariante de diseño:** un caso de benchmark es un caso normal más `verdad.json`. El arnés invoca el mismo pipeline que producción, sin ruta paralela ni modo especial. Si el arnés necesita código que producción no ejecuta, el diseño está mal.

### Schema de `verdad.json`

Vive en `rfq-agent-piloto/src/types.ts` junto al resto de contratos Zod.

```ts
export const formaPiezaSchema = z.enum(['prismatica', 'cilindrica'])

export const verdadDimensionesSchema = z.object({
  forma: formaPiezaSchema,
  // prismatica: 3 cotas. cilindrica: [diametro, longitud], en ese orden.
  cotas_mm: z.array(z.number().positive()).min(2).max(3),
})

export const verdadPrecioReferenciaSchema = z.object({
  valor_eur: z.number().positive(),
  cantidad: z.number().int().positive(),
  fuente: z.string().min(1),
  fecha: z.string(),
})

export const verdadCasoSchema = z.object({
  version: z.literal('1.0'),
  caso_id: z.string().min(1),
  procedencia: z.enum(['cad_publico_plano_generado', 'taller_real_anonimizado']),
  numero_plano: z.string().min(1),
  material: z.string().min(1),
  cantidad: z.number().int().positive(),
  dimensiones: verdadDimensionesSchema,
  tolerancia_general: z.string().min(1),
  acabado: z.string().min(1),
  plazo_dias: z.number().int().positive().nullable(),
  precio_referencia: verdadPrecioReferenciaSchema.nullable(),
})
```

`cotas_mm` debe tener 3 elementos si `forma` es `prismatica` y 2 si es `cilindrica`; se valida con un `superRefine`.

El precio de referencia se obtiene a mano de un motor de presupuesto instantáneo público (Xometry, Protolabs, Hubs, Spanflug, CloudNC Quote Agent) y se anota con su fuente y fecha. No se automatiza ni se scrapea ninguno de esos servicios.

## Componente 2 — Comparador

Fichero nuevo: `rfq-agent-piloto/src/utils/benchmarkCompare.ts`

### Refactor previo necesario

`estimarPesoKg` en `rfq-agent-piloto/src/utils/materiales.ts:114` ya parsea cadenas de dimensiones, pero devuelve un peso y no expone las cotas. Se extrae el parser:

```ts
export function parseDimensiones(texto: string): { forma: FormaPieza; cotas_mm: number[] } | null
```

`estimarPesoKg` pasa a usarlo. No se escribe un segundo parser: dos parsers de dimensiones divergen y el benchmark acabaría midiendo algo distinto de lo que calcula el motor de coste.

### Reglas por campo

Cada campo devuelve `ACIERTO`, `FALLO` o `NO_ENCONTRADO`.

| Campo | Regla |
|---|---|
| `numero_plano` | Normalizado con `normalize()` (mayúsculas, sin espacios ni guiones), comparación exacta |
| `material` | `buscarMaterial()` sobre ambos valores; aciertan si devuelven el mismo `id`. Si el de la verdad no resuelve, el caso es inválido y se reporta como error de dataset, no como fallo del modelo |
| `cantidad` | Numérico exacto |
| `dimensiones` | `parseDimensiones()` sobre la salida del modelo. Si la forma no coincide, `FALLO`. Cotas prismáticas ordenadas de mayor a menor antes de comparar; cilíndricas en orden fijo. Tolerancia por cota: ±2% o ±0,5 mm, la que sea mayor |
| `tolerancia_general` | Se extrae la clase ISO 2768 (`f`/`m`/`c`/`v` lineal, y `H`/`K`/`L` geométrica). Se comparan solo las clases que declara la verdad: si la verdad dice `2768-mK` y el modelo devuelve `2768-m`, es `FALLO` porque perdió la clase geométrica. Se compara la clase, nunca la frase |
| `acabado` | Ambos valores se mapean a un vocabulario cerrado; aciertan si caen en el mismo término |
| `plazo_dias` | Numérico, ±1 día |

Vocabulario cerrado de acabado: `mecanizado`, `pulido`, `granallado`, `anodizado`, `cincado`, `niquelado`, `cromado`, `pintado`, `temple`, `sin_tratamiento`. Un valor que no encaje se marca `NO_CLASIFICABLE` y **cuenta como `FALLO`**, no se descarta. Descartarlo convertiría el vocabulario incompleto en acierto gratis.

### Las dos métricas

`ACIERTO`, `FALLO` y `NO_ENCONTRADO` se cuentan por separado y **nunca se promedian entre sí**. De ahí salen dos porcentajes:

- **% acierto** = ACIERTO / total de campos
- **% invención** = FALLO / (ACIERTO + FALLO), es decir: de las veces que el modelo se atrevió a dar un valor, cuántas eran falsas

`NO_ENCONTRADO` no penaliza el % de invención a propósito. Que el modelo diga "no sé leer esto" es el comportamiento que queremos y es lo que el comprador pide; inventar un valor plausible es lo que destruye la confianza. Las dos cifras se reportan siempre juntas: un 95% de acierto con 40% de invención es peor producto que un 70% con 5%.

## Componente 3 — Informe

Fichero nuevo: `rfq-agent-piloto/src/scripts/benchmark.ts`, siguiendo el patrón de `src/scripts/testFixtures.ts` (recorre casos, lanza el pipeline por subproceso, escribe informe).

Salida: `rfq-agent-piloto/benchmark/informes/<fecha>-<proveedor>.md` y `.json`.

Contenido:

- Tabla campo × caso con `ACIERTO` / `FALLO` / `NO_ENCONTRADO`
- % acierto y % invención **por campo**, para identificar el eslabón débil
- Desviación de precio por caso, **siempre sobre precio unitario** para no comparar lotes distintos: `(pvp_unitario − valor_eur / precio_referencia.cantidad) / (valor_eur / precio_referencia.cantidad)`. Se reportan mediana y peor caso. Los casos con `precio_referencia: null` se excluyen de esta sección y se cuentan aparte
- Coste y duración por caso, desde `LlmUsage`
- Errores de dataset (material de la verdad que no resuelve, `verdad.json` inválido) en su propia sección, separados de los fallos del modelo

Proveedor por defecto `mock`, igual que `testFixtures.ts`, vía `RFQ_BENCHMARK_PROVIDER`. Gemini solo bajo petición explícita, para no gastar cuota.

Script en `package.json` del piloto: `npm.cmd run benchmark`.

## Componente 4 — Honestidad sobre el tiempo

El campo va en `lineaPresupuestoSchema.desglose`, **no** en `piezaAnalisisSchema`. `piezaAnalisis` es la salida del modelo validada con Zod; `desglose` es lo que calcula el motor, y ahí es donde ya vive `estado_material`, que resuelve exactamente el mismo problema para el material:

```ts
fuente_tiempo: z.enum(['estimacion_modelo', 'tabla_taller']).optional()
```

`configTallerSchema` gana una tabla análoga a la de setup que ya existe:

```ts
minutos_por_operacion: z.record(z.number()).default({})
```

`costingEngine` calcula el tiempo desde `minutos_por_operacion` cuando hay entrada para las operaciones de la pieza, y marca `tabla_taller`. En cualquier otro caso conserva `tiempo_estimado_min` del modelo y marca `estimacion_modelo`.

El precio no desaparece: se etiqueta.

`qualityGate` emite un issue de severidad `AVISO` en la categoría `Coste/plazo` mientras alguna línea del presupuesto tenga `desglose.fuente_tiempo === 'estimacion_modelo'`. La maquinaria de categorías y severidades ya existe; solo se añade la regla.

## Componente 5 — UI

Estado verificado antes de diseñar: la app **ya renderiza** los campos de fuente y `camposNoEncontrados` en `src/app/dashboard/rfqs/[id]/rfq-detail-tabs.tsx:713-722`. No hay datos ocultos que sacar a la luz. Los problemas son otros tres.

### 5.1 · La capa de datos aplana la ausencia

`src/lib/local-store.ts:588-593` sustituye cualquier valor ausente por `'Sin fuente declarada'`. Ese default borra la diferencia entre "el modelo no declaró fuente" y "el campo no está en el plano", que es justo la distinción que la UI necesita mostrar.

Los campos `materialFuente`, `cantidadFuente`, `dimensionesFuente`, `toleranciasFuente`, `acabadoFuente` y `revisionFuente` pasan a `string | null`. El texto de relleno se decide en el componente que pinta, no en la capa de datos.

### 5.2 · No hay estado por campo

Se deriva, por cada uno de los 7 campos núcleo, un estado de tres valores:

- `LEIDO_DEL_PLANO` — hay texto de fuente no vacío
- `DEDUCIDO` — hay valor pero no hay fuente
- `NO_ENCONTRADO` — el campo aparece en `camposNoEncontrados`

Se pinta con color y forma, no solo con texto, para que sea legible de un vistazo.

### 5.3 · Lo que importa está a cuatro pestañas

El orden de pestañas es `resumen, plano, piezas, calidad, presupuesto, email`, con `resumen` activa por defecto (`rfq-detail-tabs.tsx:35-45`). Los 7 campos núcleo con su estado suben a **Resumen**. No se crea pestaña ni ruta nueva.

En la pestaña Presupuesto, aviso visible mientras alguna línea tenga `desglose.fuente_tiempo === 'estimacion_modelo'`: los tiempos son estimación del modelo, sin validar.

## Fuera de alcance

- Fine-tuning o reentrenamiento de cualquier modelo
- Lectura de STEP/IGES o geometría 3D. Si el CAD público viene en STEP, el plano PDF se genera manualmente; el pipeline sigue comiendo PDF/PNG/JPG
- Automatizar o scrapear motores de presupuesto instantáneo
- UI de benchmark. El informe es un fichero
- Cualquier reintroducción de Supabase, Anthropic/Claude API, OpenAI runtime o cloud, según `AGENTS.md`

## Orden de implementación

Por dependencias, no por comodidad:

1. `verdadCasoSchema` en `types.ts` y un caso de ejemplo completo en `benchmark/casos/` — define el contrato del que todo lo demás depende
2. `parseDimensiones` extraído de `estimarPesoKg`, y `benchmarkCompare.ts`
3. `scripts/benchmark.ts` y el informe — aquí sale el número
4. `fuente_tiempo` en `types.ts`, `costingEngine.ts` y `qualityGate.ts`
5. UI: `local-store.ts` primero, `rfq-detail-tabs.tsx` después

## Reparto

Codex implementa, según `.planning/WORKING.md` y petición explícita del usuario. Claude Code escribe el spec, los briefs autocontenidos por paso, y verifica.

## Verificación

Raíz:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Piloto:

```powershell
cd rfq-agent-piloto
npm.cmd run typecheck
npm.cmd run test:fixtures
npm.cmd run benchmark
```

QA visual obligatorio tras el paso 5, según `AGENTS.md`: desktop 1440×1100 y mobile 390×950, comprobando que no hay Server Error, texto solapado, overflow horizontal ni pérdida de identificación de RFQs.

Criterio de aceptación del reshape: `npm.cmd run benchmark` produce un informe con % de acierto y % de invención por campo sobre al menos un caso real del dataset, y la ficha de RFQ distingue visualmente un campo leído del plano de uno deducido.
