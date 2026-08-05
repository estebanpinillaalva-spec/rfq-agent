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
