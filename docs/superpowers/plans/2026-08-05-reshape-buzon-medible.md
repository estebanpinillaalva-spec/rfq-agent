# Reshape a buzón medible — Plan de implementación

> **Para agentes ejecutores:** este plan lo ejecuta Codex vía la skill `codex-delegate`, una tarea por brief. Los pasos usan casillas (`- [ ]`) para seguimiento. Claude Code especifica y verifica; no escribe el código.

**Objetivo:** Medir cuánto acierta y cuánto se inventa el pipeline sobre planos con verdad conocida, y dejar de presentar como equivalentes los datos leídos del plano y los estimados por el modelo.

**Arquitectura:** Un caso de benchmark es un caso de inbox normal más un `verdad.json`; el arnés lanza el mismo pipeline de producción por subproceso, lee `salidas/<id>/analisis.json` y compara siete campos núcleo contra la verdad. En paralelo, el desglose del presupuesto gana `fuente_tiempo` para declarar si los minutos vienen de la tabla del taller o del modelo, y la ficha de RFQ pinta el estado de cada campo.

**Stack:** TypeScript estricto, Zod para contratos, Vitest 2.1.9 en el piloto, Next.js 14 y Tailwind en la app.

## Restricciones globales

- Sin `any` en TypeScript (`AGENTS.md`, regla 4).
- Todo output de IA validado con Zod o parseo defensivo (regla 5).
- El coste sale de configuración y materiales locales, no del modelo (regla 8).
- Presupuesto siempre `BORRADOR` con revisión humana (regla 9).
- No reintroducir Supabase, Anthropic/Claude API, OpenAI runtime ni cloud.
- Proveedor por defecto del arnés: `mock`. Gemini solo bajo `RFQ_BENCHMARK_PROVIDER=gemini` explícito, para no gastar cuota.
- Tests del piloto en español, colocados junto al fuente como `<nombre>.test.ts`, con `describe`/`it`/`expect` de Vitest. Patrón de referencia: `rfq-agent-piloto/src/utils/json.test.ts`.
- No tocar `.env.local` ni imprimir claves.

## Nota sobre verificación de las tareas 7 y 8

El `package.json` de la raíz no tiene runner de tests: solo `typecheck`, `lint` y `build`. Las tareas de UI **no llevan test unitario** porque añadir Vitest a la app es una expansión de alcance que este spec no contempla. Su puerta de calidad es la que ya define `AGENTS.md`: typecheck, lint, build y QA visual a 1440×1100 y 390×950. Está declarado a propósito, no omitido.

## Tarea humana previa (no la hace Codex)

El dataset necesita al menos un plano real. Es trabajo manual y bloquea la Tarea 5, no las anteriores:

1. Descargar una pieza mecanizable de CAD público (GrabCAD, Traceparts, dataset ABC), anotando licencia.
2. Generar el plano 2D en PDF desde Fusion o FreeCAD, con cajetín: número de plano, material, cantidad, tolerancia general ISO 2768 y acabado.
3. Pedir precio a un motor de presupuesto instantáneo público (Xometry, Protolabs, Hubs, Spanflug, CloudNC Quote Agent) a mano, sin automatizar ni scrapear.
4. Rellenar `verdad.json` y `origen.md` del caso con los valores reales y la fuente del precio.

---

### Tarea 1: Contrato de la verdad

**Ficheros:**
- Modificar: `rfq-agent-piloto/src/types.ts`
- Crear: `rfq-agent-piloto/src/utils/verdad.ts`
- Crear: `rfq-agent-piloto/src/utils/verdad.test.ts`
- Crear: `rfq-agent-piloto/benchmark/casos/ejemplo-001/verdad.json`
- Crear: `rfq-agent-piloto/benchmark/casos/ejemplo-001/origen.md`

**Interfaces:**
- Produce: `formaPiezaSchema`, `FormaPieza`, `verdadCasoSchema`, `VerdadCaso` en `types.ts`; `cargarVerdadCaso(carpeta: string): Promise<VerdadCaso | null>` en `utils/verdad.ts`.

- [ ] **Paso 1: Escribir el test que falla**

Crear `rfq-agent-piloto/src/utils/verdad.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { verdadCasoSchema } from '../types'

const base = {
  version: '1.0' as const,
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado' as const,
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

describe('verdadCasoSchema', () => {
  it('acepta un caso prismatico con tres cotas', () => {
    expect(verdadCasoSchema.parse(base).caso_id).toBe('ejemplo-001')
  })

  it('acepta un caso cilindrico con dos cotas en orden diametro-longitud', () => {
    const caso = { ...base, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120] } }
    expect(verdadCasoSchema.parse(caso).dimensiones.cotas_mm).toEqual([40, 120])
  })

  it('rechaza un prismatico con solo dos cotas', () => {
    const caso = { ...base, dimensiones: { forma: 'prismatica' as const, cotas_mm: [120, 80] } }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('rechaza un cilindrico con tres cotas', () => {
    const caso = { ...base, dimensiones: { forma: 'cilindrica' as const, cotas_mm: [40, 120, 10] } }
    expect(() => verdadCasoSchema.parse(caso)).toThrow()
  })

  it('acepta precio de referencia con fuente y fecha', () => {
    const caso = {
      ...base,
      precio_referencia: { valor_eur: 480, cantidad: 10, fuente: 'Xometry instant quote', fecha: '2026-08-05' },
    }
    expect(verdadCasoSchema.parse(caso).precio_referencia?.valor_eur).toBe(480)
  })

  it('rechaza plazo_dias en cero', () => {
    expect(() => verdadCasoSchema.parse({ ...base, plazo_dias: 0 })).toThrow()
  })
})
```

- [ ] **Paso 2: Ejecutar el test y comprobar que falla**

```powershell
cd rfq-agent-piloto
npm.cmd run test:unit -- verdad
```

Esperado: FAIL, `verdadCasoSchema` no existe en `../types`.

- [ ] **Paso 3: Añadir los schemas a `types.ts`**

Al final de `rfq-agent-piloto/src/types.ts`, siguiendo el estilo del fichero (schema exportado y `type` inferido justo debajo):

```ts
export const formaPiezaSchema = z.enum(['prismatica', 'cilindrica'])
export type FormaPieza = z.infer<typeof formaPiezaSchema>

export const verdadDimensionesSchema = z.object({
  forma: formaPiezaSchema,
  cotas_mm: z.array(z.number().positive()).min(2).max(3),
})

export const verdadPrecioReferenciaSchema = z.object({
  valor_eur: z.number().positive(),
  cantidad: z.number().int().positive(),
  fuente: z.string().min(1),
  fecha: z.string().min(1),
})

export const verdadCasoSchema = z
  .object({
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
  .superRefine((valor, ctx) => {
    const esperadas = valor.dimensiones.forma === 'prismatica' ? 3 : 2
    if (valor.dimensiones.cotas_mm.length !== esperadas) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dimensiones', 'cotas_mm'],
        message: `La forma ${valor.dimensiones.forma} exige ${esperadas} cotas`,
      })
    }
  })
export type VerdadCaso = z.infer<typeof verdadCasoSchema>
```

- [ ] **Paso 4: Ejecutar el test y comprobar que pasa**

```powershell
npm.cmd run test:unit -- verdad
```

Esperado: 6 tests en verde.

- [ ] **Paso 5: Escribir el cargador**

Crear `rfq-agent-piloto/src/utils/verdad.ts`:

```ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { verdadCasoSchema, type VerdadCaso } from '../types'

// Devuelve null cuando la carpeta no es un caso de benchmark; lanza cuando
// el fichero existe pero incumple el contrato, para que el arnes lo reporte
// como error de dataset y no como fallo del modelo.
export async function cargarVerdadCaso(carpeta: string): Promise<VerdadCaso | null> {
  const texto = await readFile(join(carpeta, 'verdad.json'), 'utf8').catch(() => '')
  if (!texto) return null
  return verdadCasoSchema.parse(JSON.parse(texto) as unknown)
}
```

- [ ] **Paso 6: Crear el caso de ejemplo**

`rfq-agent-piloto/benchmark/casos/ejemplo-001/verdad.json`:

```json
{
  "version": "1.0",
  "caso_id": "ejemplo-001",
  "procedencia": "cad_publico_plano_generado",
  "numero_plano": "PL-0001",
  "material": "AISI 304",
  "cantidad": 10,
  "dimensiones": { "forma": "prismatica", "cotas_mm": [120, 80, 25] },
  "tolerancia_general": "ISO 2768-mK",
  "acabado": "mecanizado",
  "plazo_dias": 15,
  "precio_referencia": null
}
```

`rfq-agent-piloto/benchmark/casos/ejemplo-001/origen.md`:

```markdown
# ejemplo-001

- Origen del CAD: pendiente de la tarea humana previa
- Licencia: pendiente
- Plano PDF: pendiente de generar
- Precio de referencia: sin pedir todavia (`precio_referencia: null`)

Este caso existe para fijar el formato. Hasta que tenga plano, el arnes lo
reporta en la seccion de errores de dataset.
```

- [ ] **Paso 7: Verificar y commitear**

```powershell
npm.cmd run typecheck
npm.cmd run test:unit
```

```bash
git add rfq-agent-piloto/src/types.ts rfq-agent-piloto/src/utils/verdad.ts rfq-agent-piloto/src/utils/verdad.test.ts rfq-agent-piloto/benchmark
git commit -m "feat(benchmark): contrato verdad.json y cargador de casos"
```

---

### Tarea 2: Extraer el parser de dimensiones

`estimarPesoKg` ya parsea cadenas de dimensiones pero solo devuelve un peso. El comparador necesita las cotas. Se extrae el parser y `estimarPesoKg` pasa a consumirlo, para que benchmark y motor de coste midan sobre el mismo parseo.

**Ficheros:**
- Modificar: `rfq-agent-piloto/src/utils/materiales.ts:114-137`
- Crear: `rfq-agent-piloto/src/utils/materiales.test.ts`

**Interfaces:**
- Consume: `FormaPieza` de la Tarea 1.
- Produce: `parseDimensiones(texto: string): { forma: FormaPieza; cotas_mm: number[] } | null`

- [ ] **Paso 1: Escribir el test que falla**

Crear `rfq-agent-piloto/src/utils/materiales.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { estimarPesoKg, parseDimensiones } from './materiales'

describe('parseDimensiones', () => {
  it('parsea un prismatico de tres cotas', () => {
    expect(parseDimensiones('120 x 80 x 25 mm')).toEqual({ forma: 'prismatica', cotas_mm: [120, 80, 25] })
  })

  it('parsea un cilindrico con simbolo de diametro', () => {
    expect(parseDimensiones('Ø40 x 120 mm')).toEqual({ forma: 'cilindrica', cotas_mm: [40, 120] })
  })

  it('parsea un cilindrico escrito con la palabra diametro', () => {
    expect(parseDimensiones('diametro 40, longitud 120')).toEqual({ forma: 'cilindrica', cotas_mm: [40, 120] })
  })

  it('acepta coma decimal', () => {
    expect(parseDimensiones('120,5 x 80 x 25')).toEqual({ forma: 'prismatica', cotas_mm: [120.5, 80, 25] })
  })

  it('devuelve null si no hay cotas suficientes', () => {
    expect(parseDimensiones('pieza pequena')).toBeNull()
  })
})

describe('estimarPesoKg sigue funcionando tras la extraccion', () => {
  it('respeta un peso declarado explicitamente', () => {
    expect(estimarPesoKg('peso: 2.5 kg', 7.9)).toBe(2.5)
  })

  it('calcula el peso de un prismatico', () => {
    // 100 x 100 x 100 mm = 1000 cm3; a 7.9 g/cm3 son 7.9 kg
    expect(estimarPesoKg('100 x 100 x 100', 7.9)).toBeCloseTo(7.9, 3)
  })

  it('calcula el peso de un cilindro', () => {
    const esperado = (Math.PI * 20 ** 2 * 100) / 1000 / 1000 * 7.9
    expect(estimarPesoKg('Ø40 x 100', 7.9)).toBeCloseTo(esperado, 3)
  })

  it('devuelve null cuando no puede parsear', () => {
    expect(estimarPesoKg('sin cotas', 7.9)).toBeNull()
  })
})
```

- [ ] **Paso 2: Ejecutar el test y comprobar que falla**

```powershell
npm.cmd run test:unit -- materiales
```

Esperado: FAIL, `parseDimensiones` no está exportado.

- [ ] **Paso 3: Extraer el parser y reescribir `estimarPesoKg`**

Sustituir el cuerpo actual de `estimarPesoKg` (`materiales.ts:114-137`) por:

```ts
export function parseDimensiones(texto: string): { forma: FormaPieza; cotas_mm: number[] } | null {
  const normalized = texto.toLowerCase().replace(/,/g, '.').replace(/ø/g, 'diametro')
  const numbers = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)/g))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (/diam|d[=\s]|\bradio\b|cilind|barra redonda/.test(normalized)) {
    if (numbers.length < 2) return null
    return { forma: 'cilindrica', cotas_mm: [numbers[0], numbers[1]] }
  }

  if (numbers.length >= 3) {
    return { forma: 'prismatica', cotas_mm: [numbers[0], numbers[1], numbers[2]] }
  }

  return null
}

export function estimarPesoKg(dimensiones: string, densidadGCm3: number): number | null {
  const normalized = dimensiones.toLowerCase().replace(/,/g, '.')
  const peso = normalized.match(/(?:peso|weight)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*kg/)
  if (peso) return Number(peso[1])

  const parsed = parseDimensiones(dimensiones)
  if (!parsed) return null

  if (parsed.forma === 'cilindrica') {
    const [diametro, longitud] = parsed.cotas_mm
    return volumeToKg(Math.PI * (diametro / 2) ** 2 * longitud, densidadGCm3)
  }

  const [a, b, c] = parsed.cotas_mm
  return volumeToKg(a * b * c, densidadGCm3)
}
```

Añadir `FormaPieza` al import de `../types` que ya existe en el fichero.

- [ ] **Paso 4: Ejecutar los tests y comprobar que pasan**

```powershell
npm.cmd run test:unit -- materiales
npm.cmd run test:unit
```

Esperado: todo en verde, incluidos los tests previos de `json.test.ts`.

- [ ] **Paso 5: Comprobar que el pipeline real no se rompió**

```powershell
npm.cmd run typecheck
npm.cmd run test:fixtures
```

Esperado: `reporte-validacion.md` generado sin errores nuevos. `estimarPesoKg` alimenta el coste de material, así que una regresión aquí mueve precios.

- [ ] **Paso 6: Commitear**

```bash
git add rfq-agent-piloto/src/utils/materiales.ts rfq-agent-piloto/src/utils/materiales.test.ts
git commit -m "refactor(materiales): extraer parseDimensiones de estimarPesoKg"
```

---

### Tarea 3: Normalizadores de tolerancia y acabado

**Ficheros:**
- Crear: `rfq-agent-piloto/src/utils/benchmarkNormalize.ts`
- Crear: `rfq-agent-piloto/src/utils/benchmarkNormalize.test.ts`

Desviación consciente respecto al spec, que nombraba un único `benchmarkCompare.ts`: los normalizadores van en su propio fichero para que el comparador quede legible y ambos se puedan testear por separado.

**Interfaces:**
- Produce: `ClaseISO2768`, `claseISO2768(texto: string): ClaseISO2768`, `ACABADOS`, `Acabado`, `clasificarAcabado(texto: string): Acabado`

- [ ] **Paso 1: Escribir el test que falla**

Crear `rfq-agent-piloto/src/utils/benchmarkNormalize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { claseISO2768, clasificarAcabado } from './benchmarkNormalize'

describe('claseISO2768', () => {
  it('extrae clase lineal y geometrica', () => {
    expect(claseISO2768('ISO 2768-mK')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('tolera espacios y minusculas', () => {
    expect(claseISO2768('iso 2768 mk')).toEqual({ lineal: 'm', geometrica: 'K' })
  })

  it('extrae solo la lineal cuando no hay geometrica', () => {
    expect(claseISO2768('ISO 2768-f')).toEqual({ lineal: 'f', geometrica: null })
  })

  it('devuelve nulos cuando no reconoce la norma', () => {
    expect(claseISO2768('segun plano')).toEqual({ lineal: null, geometrica: null })
  })
})

describe('clasificarAcabado', () => {
  it('reconoce mecanizado', () => {
    expect(clasificarAcabado('Mecanizado')).toBe('mecanizado')
  })

  it('reconoce anodizado con matices', () => {
    expect(clasificarAcabado('anodizado duro negro')).toBe('anodizado')
  })

  it('reconoce cincado escrito como zincado', () => {
    expect(clasificarAcabado('zincado')).toBe('cincado')
  })

  it('marca NO_CLASIFICABLE lo que no encaja', () => {
    expect(clasificarAcabado('segun norma interna del cliente')).toBe('NO_CLASIFICABLE')
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

```powershell
npm.cmd run test:unit -- benchmarkNormalize
```

Esperado: FAIL, el módulo no existe.

- [ ] **Paso 3: Implementar los normalizadores**

Crear `rfq-agent-piloto/src/utils/benchmarkNormalize.ts`:

```ts
export interface ClaseISO2768 {
  lineal: string | null
  geometrica: string | null
}

export function claseISO2768(texto: string): ClaseISO2768 {
  const compacto = texto.toLowerCase().replace(/\s+/g, '')
  const match = compacto.match(/2768-?([fmcv])([hkl])?/)
  if (!match) return { lineal: null, geometrica: null }
  return { lineal: match[1], geometrica: match[2] ? match[2].toUpperCase() : null }
}

export const ACABADOS = [
  'mecanizado',
  'pulido',
  'granallado',
  'anodizado',
  'cincado',
  'niquelado',
  'cromado',
  'pintado',
  'temple',
  'sin_tratamiento',
] as const
export type Acabado = (typeof ACABADOS)[number] | 'NO_CLASIFICABLE'

const PATRONES_ACABADO: Array<[RegExp, Acabado]> = [
  [/anodiz/, 'anodizado'],
  [/(cinc|zinc)/, 'cincado'],
  [/niquel/, 'niquelado'],
  [/crom/, 'cromado'],
  [/pintad|pintura|lacad/, 'pintado'],
  [/pulid|lapead/, 'pulido'],
  [/granall|chorread|arenad/, 'granallado'],
  [/templ|bonificad|nitrurad/, 'temple'],
  [/sintrat|sinacabad|enbruto|bruto/, 'sin_tratamiento'],
  [/mecaniz|fresad|torneadoacabado|rectificad/, 'mecanizado'],
]

export function clasificarAcabado(texto: string): Acabado {
  const compacto = texto.toLowerCase().replace(/\s+/g, '')
  const match = PATRONES_ACABADO.find(([patron]) => patron.test(compacto))
  return match ? match[1] : 'NO_CLASIFICABLE'
}
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

```powershell
npm.cmd run test:unit -- benchmarkNormalize
```

Esperado: 8 tests en verde.

- [ ] **Paso 5: Commitear**

```bash
git add rfq-agent-piloto/src/utils/benchmarkNormalize.ts rfq-agent-piloto/src/utils/benchmarkNormalize.test.ts
git commit -m "feat(benchmark): normalizadores de clase ISO 2768 y acabado"
```

---

### Tarea 4: Comparador y métricas

**Ficheros:**
- Crear: `rfq-agent-piloto/src/utils/benchmarkCompare.ts`
- Crear: `rfq-agent-piloto/src/utils/benchmarkCompare.test.ts`

**Interfaces:**
- Consume: `VerdadCaso` (Tarea 1), `parseDimensiones` (Tarea 2), `claseISO2768` y `clasificarAcabado` (Tarea 3), `buscarMaterial` de `materiales.ts`, `AnalisisRFQ` y `MaterialBiblioteca` de `types.ts`.
- Produce:
  - `type EstadoCampo = 'ACIERTO' | 'FALLO' | 'NO_ENCONTRADO'`
  - `CAMPOS_NUCLEO`, `CampoNucleo`
  - `interface ResultadoCampo { campo: CampoNucleo; estado: EstadoCampo; esperado: string; obtenido: string }`
  - `interface ResultadoCaso { caso_id: string; campos: ResultadoCampo[]; errores_dataset: string[] }`
  - `interface Metricas { aciertos: number; fallos: number; no_encontrados: number; acierto_pct: number; invencion_pct: number }`
  - `compararCaso(verdad: VerdadCaso, analisis: AnalisisRFQ, biblioteca: MaterialBiblioteca): ResultadoCaso`
  - `calcularMetricas(campos: ResultadoCampo[]): Metricas`

- [ ] **Paso 1: Escribir el test que falla**

Crear `rfq-agent-piloto/src/utils/benchmarkCompare.test.ts`. Construye un `AnalisisRFQ` mínimo con un helper local para no repetir 25 campos en cada test:

```ts
import { describe, expect, it } from 'vitest'
import { calcularMetricas, compararCaso } from './benchmarkCompare'
import type { AnalisisRFQ, MaterialBiblioteca, PiezaAnalisis, VerdadCaso } from '../types'

const biblioteca: MaterialBiblioteca = {
  version: '1.1',
  moneda: 'EUR',
  unidad_precio: 'kg',
  updated_at: '2026-08-01',
  stale_after_days: 45,
  fuentes_publicas: [],
  materiales: [
    {
      id: 'inox_304',
      nombre: 'AISI 304',
      familia: 'inox',
      aliases: ['X5CrNi18-10', '1.4301'],
      densidad_g_cm3: 7.9,
      formato_habitual: 'chapa',
      precio_eur_kg: 6,
      desperdicio_pct: 0.15,
      minimo_compra_kg: 1,
      proveedor: 'Proveedor local',
      fecha_actualizacion: '2026-08-01',
      confianza: 'ALTA',
      fuente_referencia: 'Precio local editable del taller',
      notas: '',
    },
  ],
}

const verdad: VerdadCaso = {
  version: '1.0',
  caso_id: 'ejemplo-001',
  procedencia: 'cad_publico_plano_generado',
  numero_plano: 'PL-0001',
  material: 'AISI 304',
  cantidad: 10,
  dimensiones: { forma: 'prismatica', cotas_mm: [120, 80, 25] },
  tolerancia_general: 'ISO 2768-mK',
  acabado: 'mecanizado',
  plazo_dias: 15,
  precio_referencia: null,
}

function pieza(overrides: Partial<PiezaAnalisis>): PiezaAnalisis {
  return {
    denominacion: 'Placa base',
    numero_plano: 'PL-0001',
    revision_plano: '',
    escala: '',
    cajetin_texto: '',
    material_fuente: '',
    cantidad_fuente: '',
    dimensiones_fuente: '',
    tolerancias_fuente: '',
    acabado_fuente: '',
    revision_fuente: '',
    material: 'AISI 304',
    dimensiones: '120 x 80 x 25 mm',
    tolerancias_generales: 'ISO 2768-mK',
    tolerancias_criticas: [],
    gdt: [],
    acabado: 'mecanizado',
    tratamientos: [],
    recubrimientos: [],
    roscas: [],
    agujeros: [],
    ajustes: [],
    chaflanes_radios: [],
    rugosidades: [],
    notas_plano: [],
    zonas_revisadas: [],
    campos_no_encontrados: [],
    operaciones: ['fresado'],
    caracteristicas_criticas: [],
    complejidad: 'MEDIA',
    tiempo_estimado_min: 45,
    subcontratas: [],
    flags: [],
    ...overrides,
  }
}

function analisis(overrides: Partial<PiezaAnalisis>, plazo = '15 dias'): AnalisisRFQ {
  return {
    ref_interna: 'RFQ-001',
    timestamp: '2026-08-05T10:00:00.000Z',
    cliente: { empresa: 'Cliente', contacto: 'Contacto', email: 'a@b.c', idioma: 'es' },
    cantidades: { 'Placa base': 10 },
    plazo_solicitado: plazo,
    piezas: [pieza(overrides)],
    dfm: { riesgos: [], sugerencias: [], ambiguedades: [] },
    complejidad_global: 'MEDIA',
    tiempo_total_min: 45,
    subcontratas_necesarias: [],
    email_respuesta: '',
    confidence_score: 0.8,
    requires_human_review: true,
    blocking_reasons: [],
  }
}

function estadoDe(resultado: ReturnType<typeof compararCaso>, campo: string): string {
  return resultado.campos.find((item) => item.campo === campo)?.estado ?? 'AUSENTE'
}

describe('compararCaso', () => {
  it('acierta los siete campos cuando todo coincide', () => {
    const resultado = compararCaso(verdad, analisis({}), biblioteca)
    expect(resultado.campos).toHaveLength(7)
    expect(resultado.campos.every((campo) => campo.estado === 'ACIERTO')).toBe(true)
  })

  it('acierta el material por alias normalizado', () => {
    const resultado = compararCaso(verdad, analisis({ material: '1.4301' }), biblioteca)
    expect(estadoDe(resultado, 'material')).toBe('ACIERTO')
  })

  it('acierta dimensiones aunque las cotas vengan desordenadas', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: '25 x 120 x 80' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('ACIERTO')
  })

  it('acepta una cota dentro de la banda del 2 por ciento', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: '121 x 80 x 25' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('ACIERTO')
  })

  it('falla si la forma no coincide', () => {
    const resultado = compararCaso(verdad, analisis({ dimensiones: 'Ø120 x 80' }), biblioteca)
    expect(estadoDe(resultado, 'dimensiones')).toBe('FALLO')
  })

  it('falla si pierde la clase geometrica de la tolerancia', () => {
    const resultado = compararCaso(verdad, analisis({ tolerancias_generales: 'ISO 2768-m' }), biblioteca)
    expect(estadoDe(resultado, 'tolerancia_general')).toBe('FALLO')
  })

  it('falla si el acabado no es clasificable', () => {
    const resultado = compararCaso(verdad, analisis({ acabado: 'segun norma interna' }), biblioteca)
    expect(estadoDe(resultado, 'acabado')).toBe('FALLO')
  })

  it('marca NO_ENCONTRADO lo que el modelo declara no haber encontrado', () => {
    const resultado = compararCaso(verdad, analisis({ campos_no_encontrados: ['acabado'] }), biblioteca)
    expect(estadoDe(resultado, 'acabado')).toBe('NO_ENCONTRADO')
  })

  it('anota error de dataset si el analisis trae mas de una pieza', () => {
    const base = analisis({})
    const conDos: AnalisisRFQ = { ...base, piezas: [base.piezas[0], base.piezas[0]] }
    expect(compararCaso(verdad, conDos, biblioteca).errores_dataset).toHaveLength(1)
  })
})

describe('calcularMetricas', () => {
  it('separa acierto de invencion', () => {
    const metricas = calcularMetricas([
      { campo: 'material', estado: 'ACIERTO', esperado: '', obtenido: '' },
      { campo: 'cantidad', estado: 'ACIERTO', esperado: '', obtenido: '' },
      { campo: 'acabado', estado: 'FALLO', esperado: '', obtenido: '' },
      { campo: 'plazo_dias', estado: 'NO_ENCONTRADO', esperado: '', obtenido: '' },
    ])
    expect(metricas.acierto_pct).toBe(50)
    // 1 fallo sobre 3 valores arriesgados
    expect(metricas.invencion_pct).toBeCloseTo(33.33, 1)
  })

  it('no divide por cero cuando el modelo no arriesgo nada', () => {
    const metricas = calcularMetricas([{ campo: 'material', estado: 'NO_ENCONTRADO', esperado: '', obtenido: '' }])
    expect(metricas.invencion_pct).toBe(0)
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

```powershell
npm.cmd run test:unit -- benchmarkCompare
```

Esperado: FAIL, el módulo no existe.

- [ ] **Paso 3: Implementar el comparador**

Crear `rfq-agent-piloto/src/utils/benchmarkCompare.ts`:

```ts
import type { AnalisisRFQ, MaterialBiblioteca, PiezaAnalisis, VerdadCaso } from '../types'
import { buscarMaterial, parseDimensiones } from './materiales'
import { claseISO2768, clasificarAcabado } from './benchmarkNormalize'
import { normalize } from './normalize'

export type EstadoCampo = 'ACIERTO' | 'FALLO' | 'NO_ENCONTRADO'

export const CAMPOS_NUCLEO = [
  'numero_plano',
  'material',
  'cantidad',
  'dimensiones',
  'tolerancia_general',
  'acabado',
  'plazo_dias',
] as const
export type CampoNucleo = (typeof CAMPOS_NUCLEO)[number]

export interface ResultadoCampo {
  campo: CampoNucleo
  estado: EstadoCampo
  esperado: string
  obtenido: string
}

export interface ResultadoCaso {
  caso_id: string
  campos: ResultadoCampo[]
  errores_dataset: string[]
}

export interface Metricas {
  aciertos: number
  fallos: number
  no_encontrados: number
  acierto_pct: number
  invencion_pct: number
}

// El modelo puede declarar un campo como no encontrado con nombres distintos
// a los del schema; se mapean aqui para no depender de su literal exacto.
const ALIAS_CAMPO: Record<CampoNucleo, string[]> = {
  numero_plano: ['numeroplano', 'plano', 'referencia'],
  material: ['material'],
  cantidad: ['cantidad'],
  dimensiones: ['dimensiones', 'medidas', 'cotas'],
  tolerancia_general: ['toleranciageneral', 'toleranciasgenerales', 'tolerancias'],
  acabado: ['acabado', 'tratamiento', 'recubrimiento'],
  plazo_dias: ['plazo', 'plazodias', 'plazoentrega'],
}

export function compararCaso(
  verdad: VerdadCaso,
  analisis: AnalisisRFQ,
  biblioteca: MaterialBiblioteca
): ResultadoCaso {
  const errores: string[] = []
  if (analisis.piezas.length !== 1) {
    errores.push(`El analisis trae ${analisis.piezas.length} piezas; se compara la primera`)
  }
  const pieza = analisis.piezas[0]
  if (!pieza) {
    return { caso_id: verdad.caso_id, campos: [], errores_dataset: [...errores, 'El analisis no trae ninguna pieza'] }
  }

  const materialVerdad = buscarMaterial(verdad.material, biblioteca)
  if (!materialVerdad) {
    errores.push(`El material "${verdad.material}" de la verdad no resuelve en la biblioteca`)
  }

  const campos: ResultadoCampo[] = [
    evaluar('numero_plano', pieza, verdad.numero_plano, pieza.numero_plano, () =>
      normalizarReferencia(verdad.numero_plano) === normalizarReferencia(pieza.numero_plano)
    ),
    evaluar('material', pieza, verdad.material, pieza.material, () => {
      const obtenido = buscarMaterial(pieza.material, biblioteca)
      return materialVerdad !== null && obtenido !== null && obtenido.id === materialVerdad.id
    }),
    evaluar('cantidad', pieza, String(verdad.cantidad), String(cantidadDe(analisis, pieza)), () =>
      cantidadDe(analisis, pieza) === verdad.cantidad
    ),
    evaluar('dimensiones', pieza, verdad.dimensiones.cotas_mm.join(' x '), pieza.dimensiones, () =>
      dimensionesCoinciden(verdad, pieza.dimensiones)
    ),
    evaluar('tolerancia_general', pieza, verdad.tolerancia_general, pieza.tolerancias_generales, () =>
      toleranciasCoinciden(verdad.tolerancia_general, pieza.tolerancias_generales)
    ),
    evaluar('acabado', pieza, verdad.acabado, pieza.acabado, () => {
      const esperado = clasificarAcabado(verdad.acabado)
      const obtenido = clasificarAcabado(pieza.acabado)
      return obtenido !== 'NO_CLASIFICABLE' && obtenido === esperado
    }),
    evaluar('plazo_dias', pieza, String(verdad.plazo_dias ?? ''), analisis.plazo_solicitado, () => {
      if (verdad.plazo_dias === null) return true
      const obtenido = primerEntero(analisis.plazo_solicitado)
      return obtenido !== null && Math.abs(obtenido - verdad.plazo_dias) <= 1
    }),
  ]

  return { caso_id: verdad.caso_id, campos, errores_dataset: errores }
}

function evaluar(
  campo: CampoNucleo,
  pieza: PiezaAnalisis,
  esperado: string,
  obtenido: string,
  acierta: () => boolean
): ResultadoCampo {
  if (declaradoNoEncontrado(campo, pieza) || esVacio(obtenido)) {
    return { campo, estado: 'NO_ENCONTRADO', esperado, obtenido }
  }
  return { campo, estado: acierta() ? 'ACIERTO' : 'FALLO', esperado, obtenido }
}

function declaradoNoEncontrado(campo: CampoNucleo, pieza: PiezaAnalisis): boolean {
  const declarados = pieza.campos_no_encontrados.map(normalize)
  return ALIAS_CAMPO[campo].some((alias) => declarados.some((declarado) => declarado.includes(alias)))
}

function esVacio(valor: string): boolean {
  const compacto = normalize(valor)
  return compacto === '' || compacto === 'noespecificado' || compacto === 'nd'
}

function normalizarReferencia(valor: string): string {
  return valor.toUpperCase().replace(/[\s\-_.]/g, '')
}

function cantidadDe(analisis: AnalisisRFQ, pieza: PiezaAnalisis): number {
  const directa = analisis.cantidades[pieza.denominacion]
  if (typeof directa === 'number') return directa
  const valores = Object.values(analisis.cantidades)
  return valores.length === 1 ? valores[0] : 0
}

function dimensionesCoinciden(verdad: VerdadCaso, texto: string): boolean {
  const obtenido = parseDimensiones(texto)
  if (!obtenido || obtenido.forma !== verdad.dimensiones.forma) return false
  const esperadas = ordenarCotas(verdad.dimensiones.forma, verdad.dimensiones.cotas_mm)
  const medidas = ordenarCotas(obtenido.forma, obtenido.cotas_mm)
  if (esperadas.length !== medidas.length) return false
  return esperadas.every((cota, indice) => dentroDeBanda(cota, medidas[indice]))
}

// Las prismaticas no tienen orden canonico de cotas; las cilindricas si
// (diametro y despues longitud), asi que solo se ordenan las primeras.
function ordenarCotas(forma: VerdadCaso['dimensiones']['forma'], cotas: number[]): number[] {
  return forma === 'prismatica' ? [...cotas].sort((a, b) => b - a) : cotas
}

function dentroDeBanda(esperado: number, obtenido: number): boolean {
  const banda = Math.max(esperado * 0.02, 0.5)
  return Math.abs(esperado - obtenido) <= banda
}

function toleranciasCoinciden(esperado: string, obtenido: string): boolean {
  const claseEsperada = claseISO2768(esperado)
  const claseObtenida = claseISO2768(obtenido)
  if (claseEsperada.lineal === null) return false
  if (claseEsperada.lineal !== claseObtenida.lineal) return false
  if (claseEsperada.geometrica === null) return true
  return claseEsperada.geometrica === claseObtenida.geometrica
}

function primerEntero(texto: string): number | null {
  const match = texto.match(/(\d+)/)
  return match ? Number(match[1]) : null
}

export function calcularMetricas(campos: ResultadoCampo[]): Metricas {
  const aciertos = campos.filter((campo) => campo.estado === 'ACIERTO').length
  const fallos = campos.filter((campo) => campo.estado === 'FALLO').length
  const noEncontrados = campos.filter((campo) => campo.estado === 'NO_ENCONTRADO').length
  const arriesgados = aciertos + fallos
  return {
    aciertos,
    fallos,
    no_encontrados: noEncontrados,
    acierto_pct: campos.length === 0 ? 0 : (aciertos / campos.length) * 100,
    invencion_pct: arriesgados === 0 ? 0 : (fallos / arriesgados) * 100,
  }
}
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

```powershell
npm.cmd run test:unit -- benchmarkCompare
npm.cmd run typecheck
```

Esperado: 11 tests en verde y typecheck limpio. `normalize.ts` exporta `normalize(value: string): string`, que pasa a minúsculas, quita acentos y elimina todo lo que no sea alfanumérico; es la misma función que ya usa `costingEngine.ts:94`.

- [ ] **Paso 5: Commitear**

```bash
git add rfq-agent-piloto/src/utils/benchmarkCompare.ts rfq-agent-piloto/src/utils/benchmarkCompare.test.ts
git commit -m "feat(benchmark): comparador de 7 campos con metricas de acierto e invencion"
```

---

### Tarea 5: Arnés e informe

**Ficheros:**
- Crear: `rfq-agent-piloto/src/scripts/benchmark.ts`
- Modificar: `rfq-agent-piloto/package.json` (script `benchmark`)

**Interfaces:**
- Consume: `cargarVerdadCaso` (T1), `compararCaso` y `calcularMetricas` (T4), `cargarBibliotecaMateriales` de `materiales.ts`.
- Produce: `rfq-agent-piloto/benchmark/informes/<fecha>-<proveedor>.md` y `.json`.

Patrón de referencia obligatorio: `rfq-agent-piloto/src/scripts/testFixtures.ts`. Reutiliza su forma (listar salidas antes, lanzar `src/index.ts <carpeta>` por subproceso, detectar la salida nueva). El fichero a leer es `salidas/<id>/analisis.json`, que contiene `{ validacion, analisis, presupuesto }` (`guardarSalida.ts:50-62`).

- [ ] **Paso 1: Escribir el script**

Crear `rfq-agent-piloto/src/scripts/benchmark.ts` con esta estructura:

```ts
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { analisisRFQSchema, presupuestoRFQSchema } from '../types'
import { cargarBibliotecaMateriales } from '../utils/materiales'
import { cargarVerdadCaso } from '../utils/verdad'
import { calcularMetricas, compararCaso, CAMPOS_NUCLEO, type ResultadoCaso } from '../utils/benchmarkCompare'

interface FilaCaso {
  resultado: ResultadoCaso
  desviacionPrecio: number | null
  durationMs: number
}

async function main(): Promise<void> {
  const casosDir = resolve('benchmark', 'casos')
  const proveedor = process.env.RFQ_BENCHMARK_PROVIDER ?? 'mock'
  const biblioteca = cargarBibliotecaMateriales()
  const nombres = (await readdir(casosDir).catch(() => [])).filter((n) => !n.startsWith('.'))

  const filas: FilaCaso[] = []
  const erroresDataset: string[] = []

  for (const nombre of nombres) {
    const carpeta = join(casosDir, nombre)
    let verdad
    try {
      verdad = await cargarVerdadCaso(carpeta)
    } catch (error) {
      erroresDataset.push(`${nombre}: verdad.json invalido - ${mensaje(error)}`)
      continue
    }
    if (!verdad) {
      erroresDataset.push(`${nombre}: sin verdad.json`)
      continue
    }

    const antes = await listarSalidas()
    const inicio = Date.now()
    const proceso = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', carpeta], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, RFQ_AI_PROVIDER: proveedor },
    })
    const durationMs = Date.now() - inicio

    if (proceso.status !== 0) {
      erroresDataset.push(`${nombre}: el pipeline fallo - ${(proceso.stderr || proceso.stdout).split(/\r?\n/).slice(-3).join(' ')}`)
      continue
    }

    const salida = await salidaNueva(antes)
    if (!salida) {
      erroresDataset.push(`${nombre}: no se detecto salida nueva`)
      continue
    }

    const crudo = await readFile(join(resolve('salidas'), salida, 'analisis.json'), 'utf8')
    const contenido = JSON.parse(crudo) as { analisis: unknown; presupuesto: unknown }
    const analisis = analisisRFQSchema.parse(contenido.analisis)
    const presupuesto = presupuestoRFQSchema.parse(contenido.presupuesto)

    filas.push({
      resultado: compararCaso(verdad, analisis, biblioteca),
      desviacionPrecio: desviacion(verdad, presupuesto.lineas[0]?.pvp_unitario ?? null),
      durationMs,
    })
  }

  await escribirInforme(proveedor, filas, erroresDataset)
}
```

Funciones auxiliares que el fragmento usa y no define:

- `listarSalidas()` y `salidaNueva(antes)` — copiar literalmente `listSalidaDirs` y `findNewSalida` de `src/scripts/testFixtures.ts:59-69`, traduciendo el nombre. Son la forma que el proyecto ya usa para localizar la salida recién creada.
- `mensaje(error: unknown): string` — el mismo patrón que el `catch` de `testFixtures.ts:53-57`: `error instanceof Error ? error.message : String(error)`.
- `desviacion(verdad, pvpUnitario)` y `escribirInforme(...)` — implementar según las reglas de abajo.

Reglas que el informe debe cumplir:

- La desviación de precio se calcula **siempre sobre precio unitario**: `unitarioReferencia = precio_referencia.valor_eur / precio_referencia.cantidad`, y `desviacion = (pvp_unitario - unitarioReferencia) / unitarioReferencia`. Devuelve `null` si `precio_referencia` es `null` o si no hay línea de presupuesto.
- El markdown incluye, en este orden: tabla campo × caso con `ACIERTO`/`FALLO`/`NO_ENCONTRADO`; una tabla de `% acierto` y `% invención` **por campo** recorriendo `CAMPOS_NUCLEO`; métricas globales; desviación de precio con mediana y peor caso, contando aparte los casos excluidos por no tener precio de referencia; duración por caso; y una sección final "Errores de dataset" con `erroresDataset` más los `errores_dataset` de cada `ResultadoCaso`.
- Los errores de dataset **nunca** se cuentan como fallos del modelo.
- El `.json` lleva la misma información en crudo, para poder comparar informes entre proveedores más adelante.
- Ambos ficheros van a `benchmark/informes/<YYYY-MM-DD>-<proveedor>.md|json`, creando el directorio con `mkdir(..., { recursive: true })`.

- [ ] **Paso 2: Añadir el script a `package.json`**

En `rfq-agent-piloto/package.json`, dentro de `scripts`:

```json
"benchmark": "ts-node src/scripts/benchmark.ts"
```

- [ ] **Paso 3: Ejecutar sobre el dataset**

```powershell
cd rfq-agent-piloto
npm.cmd run typecheck
npm.cmd run benchmark
```

Esperado con el dataset actual: el informe se genera y `ejemplo-001` aparece en "Errores de dataset" porque todavía no tiene plano. **Eso es el resultado correcto**, no un fallo del script. Cuando la tarea humana previa aporte el plano, el mismo comando produce métricas reales.

- [ ] **Paso 4: Commitear**

```bash
git add rfq-agent-piloto/src/scripts/benchmark.ts rfq-agent-piloto/package.json rfq-agent-piloto/benchmark
git commit -m "feat(benchmark): arnes que mide acierto, invencion y desviacion de precio"
```

---

### Tarea 6: `fuente_tiempo` en el desglose

**Ficheros:**
- Modificar: `rfq-agent-piloto/src/types.ts` (`lineaPresupuestoSchema.desglose`, `configTallerSchema`)
- Modificar: `rfq-agent-piloto/src/utils/costingEngine.ts:19-23`
- Modificar: `rfq-agent-piloto/src/utils/qualityGate.ts`
- Crear: `rfq-agent-piloto/src/utils/costingEngine.test.ts`

**Interfaces:**
- Produce: `desglose.fuente_tiempo?: 'estimacion_modelo' | 'tabla_taller'`, `configTaller.minutos_por_operacion: Record<string, number>`

- [ ] **Paso 1: Escribir el test que falla**

La función exportada es `generarPresupuestoDeterminista(analisis: AnalisisRFQ, config: ConfigTaller): PresupuestoRFQ` (`costingEngine.ts:5`). El test asierta solo sobre `coste_operaciones` y `fuente_tiempo`: el coste de material lo calcula `estimarCosteMaterial` leyendo la biblioteca real del disco, así que el total no es estable en un test unitario, pero el coste de operaciones sí.

`precios_hora` usa la clave `fresado` a propósito: `precioHoraOperacion` la resuelve por igualdad exacta de `normalize()` (`costingEngine.ts:95`), sin entrar en las reglas de patrón, así que el precio/hora es determinista y vale 60.

Crear `rfq-agent-piloto/src/utils/costingEngine.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generarPresupuestoDeterminista } from './costingEngine'
import type { AnalisisRFQ, ConfigTaller, PiezaAnalisis } from '../types'

function config(minutosPorOperacion: Record<string, number>): ConfigTaller {
  return {
    nombre: 'Taller de prueba',
    cif: 'B00000000',
    email: 'taller@ejemplo.es',
    precios_hora: { fresado: 60 },
    margen_por_complejidad: { BAJA: 0.3, MEDIA: 0.35, ALTA: 0.4, MUY_ALTA: 0.5 },
    plazo_estandar_dias: 15,
    condiciones_pago: '30 dias',
    iva_porcentaje: 0.21,
    validez_dias: 15,
    overhead_porcentaje: 0.18,
    capacidad_diaria_horas: 7,
    materiales_eur_kg: {},
    setup_min_por_operacion: {},
    subcontratas: {},
    minutos_por_operacion: minutosPorOperacion,
  }
}

function pieza(): PiezaAnalisis {
  return {
    denominacion: 'Placa base',
    numero_plano: 'PL-0001',
    revision_plano: '',
    escala: '',
    cajetin_texto: '',
    material_fuente: '',
    cantidad_fuente: '',
    dimensiones_fuente: '',
    tolerancias_fuente: '',
    acabado_fuente: '',
    revision_fuente: '',
    material: 'AISI 304',
    dimensiones: '120 x 80 x 25 mm',
    tolerancias_generales: 'ISO 2768-mK',
    tolerancias_criticas: [],
    gdt: [],
    acabado: 'mecanizado',
    tratamientos: [],
    recubrimientos: [],
    roscas: [],
    agujeros: [],
    ajustes: [],
    chaflanes_radios: [],
    rugosidades: [],
    notas_plano: [],
    zonas_revisadas: [],
    campos_no_encontrados: [],
    operaciones: ['fresado'],
    caracteristicas_criticas: [],
    complejidad: 'MEDIA',
    tiempo_estimado_min: 45,
    subcontratas: [],
    flags: [],
  }
}

function analisis(): AnalisisRFQ {
  return {
    ref_interna: 'RFQ-001',
    timestamp: '2026-08-05T10:00:00.000Z',
    cliente: { empresa: 'Cliente', contacto: 'Contacto', email: 'a@b.c', idioma: 'es' },
    cantidades: { 'Placa base': 10 },
    plazo_solicitado: '15 dias',
    piezas: [pieza()],
    dfm: { riesgos: [], sugerencias: [], ambiguedades: [] },
    complejidad_global: 'MEDIA',
    tiempo_total_min: 45,
    subcontratas_necesarias: [],
    email_respuesta: '',
    confidence_score: 0.8,
    requires_human_review: true,
    blocking_reasons: [],
  }
}

describe('generarPresupuestoDeterminista y la fuente del tiempo', () => {
  it('marca estimacion_modelo y usa los minutos del modelo cuando la config no trae tabla', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({}))
    const desglose = presupuesto.lineas[0].desglose
    expect(desglose?.fuente_tiempo).toBe('estimacion_modelo')
    // 45 min a 60 EUR/h
    expect(desglose?.coste_operaciones).toBeCloseTo(45, 2)
  })

  it('marca tabla_taller y usa los minutos de la config cuando existen', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({ fresado: 90 }))
    const desglose = presupuesto.lineas[0].desglose
    expect(desglose?.fuente_tiempo).toBe('tabla_taller')
    // 90 min de la tabla a 60 EUR/h, ignorando los 45 del modelo
    expect(desglose?.coste_operaciones).toBeCloseTo(90, 2)
  })

  it('resuelve la clave de la tabla ignorando mayusculas y acentos', () => {
    const presupuesto = generarPresupuestoDeterminista(analisis(), config({ Fresado: 90 }))
    expect(presupuesto.lineas[0].desglose?.fuente_tiempo).toBe('tabla_taller')
  })
})
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

```powershell
npm.cmd run test:unit -- costingEngine
```

- [ ] **Paso 3: Añadir los campos al schema**

En `lineaPresupuestoSchema`, dentro del objeto `desglose`, junto a `estado_material`:

```ts
fuente_tiempo: z.enum(['estimacion_modelo', 'tabla_taller']).optional(),
```

En `configTallerSchema`, junto a `setup_min_por_operacion`:

```ts
minutos_por_operacion: z.record(z.number()).default({}),
```

- [ ] **Paso 4: Calcular el tiempo desde la tabla cuando exista**

En `costingEngine.ts`, sustituir la línea 20 por una resolución previa. Añadir el helper siguiendo el estilo de `costeSetup`, que ya resuelve claves de operación:

```ts
// Devuelve null cuando ninguna operacion de la pieza tiene minutos en la
// config; en ese caso el tiempo sigue viniendo del modelo y se declara.
function minutosDeTabla(config: ConfigTaller, operaciones: string[]): number | null {
  const entradas = Object.entries(config.minutos_por_operacion)
  const minutos = operaciones
    .map((operacion) => entradas.find(([key]) => normalize(key) === normalize(operacion))?.[1])
    .filter((valor): valor is number => typeof valor === 'number')
  return minutos.length === 0 ? null : minutos.reduce((sum, valor) => sum + valor, 0)
}
```

Resuelve la clave con `normalize()`, igual que la rama exacta de `precioHoraOperacion` (`costingEngine.ts:95`). No usa `setupKey`: esa función tiene su propia lógica de agrupación por familia de operación y haría el resultado dependiente de un detalle ajeno a esta tabla.

Y en el cálculo:

```ts
const minutosTabla = minutosDeTabla(config, pieza.operaciones)
const minutos = minutosTabla ?? pieza.tiempo_estimado_min
const fuenteTiempo = minutosTabla === null ? 'estimacion_modelo' : 'tabla_taller'
const costeOperaciones = (minutos / 60) * precioHora
```

Propagar `fuenteTiempo` al `desglose` que la función construye.

- [ ] **Paso 5: Añadir la regla al Quality Gate**

En `qualityGate.ts`, emitir un `QualityIssue` cuando alguna línea tenga `desglose.fuente_tiempo === 'estimacion_modelo'`:

```ts
{
  categoria: 'Coste/plazo',
  severidad: 'AVISO',
  campo: 'fuente_tiempo',
  mensaje: 'Los tiempos de operacion son estimacion del modelo, sin validar contra la tabla del taller',
}
```

Seguir el patrón de construcción de issues que ya usa el fichero; no inventar una vía nueva.

- [ ] **Paso 6: Verificar**

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:fixtures
```

Esperado: tests en verde y el reporte de fixtures sin errores nuevos. La configuración existente no trae `minutos_por_operacion`, así que todas las líneas deben salir con `estimacion_modelo` y el Quality Gate debe mostrar el aviso.

- [ ] **Paso 7: Commitear**

```bash
git add rfq-agent-piloto/src/types.ts rfq-agent-piloto/src/utils/costingEngine.ts rfq-agent-piloto/src/utils/costingEngine.test.ts rfq-agent-piloto/src/utils/qualityGate.ts
git commit -m "feat(coste): declarar si los minutos vienen del modelo o de la tabla del taller"
```

---

### Tarea 7: La capa de datos deja de aplanar la ausencia

**Ficheros:**
- Modificar: `src/lib/local-store.ts:584-609`

Sin test unitario: la raíz no tiene runner. Puerta de calidad: `typecheck`, `lint` y `build`.

- [ ] **Paso 1: Cambiar el tipo de los campos de fuente**

En el mapeo de piezas, los seis campos de fuente pasan de `stringOr(..., 'Sin fuente declarada')` a devolver `string | null`:

```ts
materialFuente: textoONull(pieza.material_fuente),
cantidadFuente: textoONull(pieza.cantidad_fuente),
dimensionesFuente: textoONull(pieza.dimensiones_fuente),
toleranciasFuente: textoONull(pieza.tolerancias_fuente),
acabadoFuente: textoONull(pieza.acabado_fuente),
revisionFuente: textoONull(pieza.revision_fuente),
```

Con el helper, junto a `stringOr` que ya existe:

```ts
// La UI necesita distinguir "el modelo no declaro fuente" de "el campo no
// esta en el plano"; un texto de relleno aqui borraria esa diferencia.
function textoONull(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor : null
}
```

`trazabilidadConfianza` se deja como está: no es un campo por-campo y su relleno actual no oculta nada.

- [ ] **Paso 2: Actualizar el tipo de la interfaz que consume la UI**

En la interfaz del resumen de pieza declarada en el mismo fichero, los seis campos pasan a `string | null`. TypeScript señalará los puntos de uso en `rfq-detail-tabs.tsx`; se arreglan en la Tarea 8.

- [ ] **Paso 3: Verificar**

```powershell
npm.cmd run typecheck
```

Esperado: errores **solo** en `rfq-detail-tabs.tsx`, donde los `Field` reciben ahora `string | null`. Es el resultado correcto en este punto; la Tarea 8 los resuelve. No silenciar con `?? ''` aquí.

- [ ] **Paso 4: No commitear todavía**

El árbol queda con typecheck en rojo hasta la Tarea 8. Las tareas 7 y 8 se commitean juntas.

---

### Tarea 8: Estado por campo en la ficha de RFQ

**Ficheros:**
- Modificar: `src/app/dashboard/rfqs/[id]/rfq-detail-tabs.tsx`

Sin test unitario, por lo mismo. Puerta de calidad: `typecheck`, `lint`, `build` y QA visual.

- [ ] **Paso 1: Añadir el derivador de estado**

En `rfq-detail-tabs.tsx`, junto a los componentes auxiliares que ya viven al final del fichero (`Field`, `TokenList`, `MetricTile`):

```tsx
type EstadoCampo = 'LEIDO_DEL_PLANO' | 'DEDUCIDO' | 'NO_ENCONTRADO'

function estadoCampo(valor: string, fuente: string | null, camposNoEncontrados: string[], alias: string[]): EstadoCampo {
  const declarados = camposNoEncontrados.map((campo) => campo.toLowerCase())
  if (alias.some((clave) => declarados.some((campo) => campo.includes(clave)))) return 'NO_ENCONTRADO'
  if (!valor || valor === 'No especificado') return 'NO_ENCONTRADO'
  return fuente ? 'LEIDO_DEL_PLANO' : 'DEDUCIDO'
}
```

- [ ] **Paso 2: Componente que pinta un campo con su estado**

Un `FieldConEstado` que muestre valor, estado y, cuando exista, el texto de fuente. Tres tratamientos visuales distinguibles **por color y por forma**, no solo por color, siguiendo las clases Tailwind que el fichero ya usa para `tone="warning"` en `TokenList`:

- `LEIDO_DEL_PLANO` — tono neutro/positivo, con el texto de fuente visible
- `DEDUCIDO` — tono de aviso, con la etiqueta "sin fuente en el plano"
- `NO_ENCONTRADO` — tono de alerta, con la etiqueta "no encontrado"

- [ ] **Paso 3: Subir los siete campos a Resumen**

En la pestaña `resumen` (activa por defecto, `rfq-detail-tabs.tsx:35-45`), añadir un bloque con los siete campos núcleo usando `FieldConEstado`: número de plano, material, cantidad, dimensiones, tolerancia general, acabado y plazo. No se crea pestaña ni ruta nueva. El detalle existente en la pestaña Piezas se mantiene tal cual.

- [ ] **Paso 4: Aviso de tiempos en Presupuesto**

En la pestaña `presupuesto`, aviso visible mientras alguna línea tenga `desglose.fuente_tiempo === 'estimacion_modelo'`: "Los tiempos de operación son estimación del modelo, sin validar contra la tabla del taller". Reutilizar el estilo de aviso que el fichero ya emplea; no introducir un componente de alerta nuevo.

- [ ] **Paso 5: Verificar en la raíz**

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Esperado: los tres en verde. Si `typecheck` sigue rojo por los `string | null` de la Tarea 7, resolverlos aquí mostrando el estado, nunca con `?? 'Sin fuente declarada'`.

- [ ] **Paso 6: QA visual obligatorio**

```powershell
npm.cmd run dev:clean
```

Capturar `/dashboard/rfqs/<id>` a 1440×1100 y 390×950. Comprobar: sin Server Error, sin texto solapado, sin overflow horizontal, cards enteras, y que el RFQ sigue mostrando asunto, remitente y fecha. Si aparece `Cannot find module './*.js'`, limpiar `.next` y relanzar con `dev:clean` (`AGENTS.md`, regla 10).

- [ ] **Paso 7: Commitear tareas 7 y 8 juntas**

```bash
git add src/lib/local-store.ts "src/app/dashboard/rfqs/[id]/rfq-detail-tabs.tsx"
git commit -m "feat(ui): estado por campo (leido / deducido / no encontrado) en la ficha de RFQ"
```

---

## Criterio de aceptación del plan

1. `npm.cmd run test:unit` en el piloto pasa con los tests de las tareas 1 a 4 y 6.
2. `npm.cmd run benchmark` produce `benchmark/informes/<fecha>-mock.md` con % de acierto y % de invención por campo, o con el caso listado en errores de dataset si aún no tiene plano.
3. `npm.cmd run test:fixtures` sigue sin errores nuevos: el refactor de `estimarPesoKg` no movió precios.
4. En la raíz, `typecheck`, `lint` y `build` en verde, y la ficha de RFQ distingue visualmente un campo leído del plano de uno deducido.
