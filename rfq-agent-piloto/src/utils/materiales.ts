import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { normalize } from './normalize'
import {
  materialBibliotecaSchema,
  type FormaPieza,
  type MaterialBiblioteca,
  type MaterialBibliotecaItem,
  type PiezaAnalisis,
} from '../types'

export interface MaterialCostEstimate {
  material: MaterialBibliotecaItem | null
  estado: 'calculado' | 'orientativo' | 'requiere_revision'
  pesoEstimadoKg: number | null
  kgCompra: number | null
  costeMaterialTotal: number
  costeMaterialUnitario: number
  precioEurKg: number | null
  desperdicioPct: number
  avisos: string[]
}

export function cargarBibliotecaMateriales(): MaterialBiblioteca {
  const path = resolve(process.env.RFQ_MATERIALS_PATH || 'config/materiales.json')
  if (!existsSync(path)) return materialBibliotecaSchema.parse(defaultLibrary())
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
  return materialBibliotecaSchema.parse(parsed)
}

export function estimarCosteMaterial(params: {
  pieza: PiezaAnalisis
  cantidad: number
  biblioteca?: MaterialBiblioteca
}): MaterialCostEstimate {
  const biblioteca = params.biblioteca ?? cargarBibliotecaMateriales()
  const material = buscarMaterial(params.pieza.material, biblioteca)
  const avisos: string[] = []

  if (!material) {
    return {
      material: null,
      estado: 'requiere_revision',
      pesoEstimadoKg: null,
      kgCompra: null,
      costeMaterialTotal: 0,
      costeMaterialUnitario: 0,
      precioEurKg: null,
      desperdicioPct: 0,
      avisos: [`Material sin precio local fiable: ${params.pieza.material}`],
    }
  }

  if (isStale(material.fecha_actualizacion, biblioteca.stale_after_days)) {
    avisos.push(`Precio de material caducado o antiguo: ${material.fecha_actualizacion}`)
  }

  if (material.confianza !== 'ALTA') {
    avisos.push(`Confianza de precio ${material.confianza}; revisar proveedor antes de enviar.`)
  }

  const peso = estimarPesoKg(params.pieza.dimensiones, material.densidad_g_cm3)
  if (peso === null) {
    const costeOrientativoTotal = material.minimo_compra_kg * material.precio_eur_kg
    return {
      material,
      estado: 'orientativo',
      pesoEstimadoKg: null,
      kgCompra: material.minimo_compra_kg,
      costeMaterialTotal: roundCurrency(costeOrientativoTotal),
      costeMaterialUnitario: roundCurrency(costeOrientativoTotal / Math.max(params.cantidad, 1)),
      precioEurKg: material.precio_eur_kg,
      desperdicioPct: material.desperdicio_pct,
      avisos: [...avisos, `No se pudo estimar peso desde dimensiones: ${params.pieza.dimensiones}`],
    }
  }

  const kgNecesarios = peso * Math.max(params.cantidad, 1) * (1 + material.desperdicio_pct)
  const kgCompra = Math.max(kgNecesarios, material.minimo_compra_kg)
  const costeMaterialTotal = kgCompra * material.precio_eur_kg

  return {
    material,
    estado: avisos.length ? 'orientativo' : 'calculado',
    pesoEstimadoKg: roundWeight(peso),
    kgCompra: roundWeight(kgCompra),
    costeMaterialTotal: roundCurrency(costeMaterialTotal),
    costeMaterialUnitario: roundCurrency(costeMaterialTotal / Math.max(params.cantidad, 1)),
    precioEurKg: material.precio_eur_kg,
    desperdicioPct: material.desperdicio_pct,
    avisos,
  }
}

export function buscarMaterial(texto: string, biblioteca: MaterialBiblioteca): MaterialBibliotecaItem | null {
  const normalized = normalize(texto)
  if (!normalized || /noespecificado|sinmaterial|n\/d/.test(normalized)) return null

  const indexed = biblioteca.materiales.map((material) => ({
    material,
    candidates: [material.nombre, material.id, ...material.aliases].map(normalize).filter(Boolean),
  }))

  const exact = indexed.find(({ candidates }) => candidates.some((candidate) => candidate === normalized))
  if (exact) return exact.material

  const partial = indexed
    .flatMap(({ material, candidates }) => candidates.map((candidate) => ({ material, candidate })))
    .filter(({ candidate }) => normalized.includes(candidate) || candidate.includes(normalized))
    .sort((a, b) => b.candidate.length - a.candidate.length)

  return partial[0]?.material ?? null
}

export function parseDimensiones(texto: string): { forma: FormaPieza; cotas_mm: number[] } | null {
  // Las cotas con ajuste ISO ("148h8", "130 k5", "30H7") meterian el grado de
  // tolerancia como si fuera una cota mas. Se quita la clase y se deja el numero.
  const AJUSTE_ISO = /(\d+(?:\.\d+)?)\s?(?:js|[a-hj-np-uy-z])(\d{1,2})(?![\d.])/gi
  const normalized = texto.toLowerCase().replace(/,/g, '.').replace(/ø/g, 'diametro').replace(AJUSTE_ISO, '$1')
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

function volumeToKg(volumeMm3: number, densidadGCm3: number): number {
  const volumeCm3 = volumeMm3 / 1000
  return (volumeCm3 * densidadGCm3) / 1000
}


function isStale(date: string, staleAfterDays: number): boolean {
  const parsed = Date.parse(date)
  if (!Number.isFinite(parsed)) return true
  return Date.now() - parsed > staleAfterDays * 24 * 60 * 60 * 1000
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function roundWeight(value: number): number {
  return Math.round(value * 1000) / 1000
}

function defaultLibrary(): MaterialBiblioteca {
  return {
    version: '1.0',
    moneda: 'EUR',
    unidad_precio: 'kg',
    updated_at: new Date().toISOString(),
    stale_after_days: 45,
    fuentes_publicas: [],
    materiales: [],
  }
}
