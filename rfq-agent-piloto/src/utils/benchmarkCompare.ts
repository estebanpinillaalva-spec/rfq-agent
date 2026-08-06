import type { AnalisisRFQ, MaterialBiblioteca, PiezaAnalisis, VerdadCaso, VerdadPieza } from '../types'
import { buscarMaterial, parseDimensiones } from './materiales'
import { claseToleranciaGeneral, clasificarAcabado } from './benchmarkNormalize'
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

export interface PiezaComparada {
  numero_plano: string
  campos: ResultadoCampo[]
}

export interface MetricasDeteccion {
  esperadas: number
  detectadas: number
  no_detectadas: string[]
  sobrantes: string[]
}

export interface ResultadoCaso {
  caso_id: string
  piezas: PiezaComparada[]
  deteccion: MetricasDeteccion
  errores_dataset: string[]
}

export interface Metricas {
  aciertos: number
  fallos: number
  no_encontrados: number
  acierto_pct: number
  invencion_pct: number
}

// Las etiquetas de campos_no_encontrados vienen en lenguaje natural, asi que
// se comparan por palabras completas: "Revision del plano" no debe activar
// numero_plano solo porque contenga la palabra "plano".
const ALIAS_CAMPO: Record<CampoNucleo, string[][]> = {
  numero_plano: [
    ['numero', 'plano'],
    ['plano', 'numero'],
    ['referencia', 'plano'],
  ],
  material: [['material']],
  cantidad: [['cantidad'], ['numero', 'piezas'], ['unidades']],
  dimensiones: [['dimensiones'], ['medidas'], ['cotas']],
  tolerancia_general: [
    ['tolerancia', 'general'],
    ['tolerancias', 'generales'],
    ['tolerancia', 'no', 'indicada'],
    ['tolerancias', 'no', 'indicadas'],
  ],
  acabado: [['acabado'], ['rugosidad'], ['tratamiento'], ['recubrimiento']],
  plazo_dias: [['plazo']],
}

// Etiquetas como "tolerancia_general_especifica" o "cantidad de agujeros" hablan
// de otra cosa. Si aparece un calificador, la coincidencia no cuenta.
const CALIFICADORES_AJENOS = ['especifica', 'especificas', 'especifico', 'especificos', 'revision', 'critica', 'criticas']

export function compararCaso(
  verdad: VerdadCaso,
  analisis: AnalisisRFQ,
  biblioteca: MaterialBiblioteca
): ResultadoCaso {
  const errores: string[] = []
  const usadas = new Set<number>()
  const piezas: PiezaComparada[] = []
  const noDetectadas: string[] = []

  for (const piezaVerdad of verdad.piezas) {
    const indice = analisis.piezas.findIndex(
      (pieza, posicion) =>
        !usadas.has(posicion) && normalizarReferencia(pieza.numero_plano) === normalizarReferencia(piezaVerdad.numero_plano)
    )
    if (indice === -1) {
      noDetectadas.push(piezaVerdad.numero_plano)
      continue
    }
    usadas.add(indice)
    piezas.push({
      numero_plano: piezaVerdad.numero_plano,
      campos: compararPieza(piezaVerdad, analisis.piezas[indice], analisis, biblioteca, errores),
    })
  }

  return {
    caso_id: verdad.caso_id,
    piezas,
    deteccion: {
      esperadas: verdad.piezas.length,
      detectadas: piezas.length,
      no_detectadas: noDetectadas,
      sobrantes: analisis.piezas.filter((_, indice) => !usadas.has(indice)).map((pieza) => pieza.numero_plano),
    },
    errores_dataset: errores,
  }
}

function compararPieza(
  verdad: VerdadPieza,
  pieza: PiezaAnalisis,
  analisis: AnalisisRFQ,
  biblioteca: MaterialBiblioteca,
  errores: string[]
): ResultadoCampo[] {
  const materialVerdad = buscarMaterial(verdad.material, biblioteca)
  if (!materialVerdad) {
    errores.push(`El material "${verdad.material}" de la pieza "${verdad.numero_plano}" no resuelve en la biblioteca`)
  }

  return [
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

function palabras(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function declaradoNoEncontrado(campo: CampoNucleo, pieza: PiezaAnalisis): boolean {
  const declarados = pieza.campos_no_encontrados
    .map(palabras)
    .filter(
      (declarado) =>
        (campo === 'cantidad' && declarado.some((palabra) => palabra === 'pieza' || palabra === 'piezas')) ||
        !declarado.some((palabra) => CALIFICADORES_AJENOS.includes(palabra))
    )
  return ALIAS_CAMPO[campo].some((alias) =>
    declarados.some((declarado) => alias.every((palabra) => declarado.includes(palabra)))
  )
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

function dimensionesCoinciden(verdad: VerdadPieza, texto: string): boolean {
  const obtenido = parseDimensiones(texto)
  if (!obtenido || obtenido.forma !== verdad.dimensiones.forma) return false
  const esperadas = ordenarCotas(verdad.dimensiones.forma, verdad.dimensiones.cotas_mm)
  const medidas = ordenarCotas(obtenido.forma, obtenido.cotas_mm)
  if (esperadas.length !== medidas.length) return false
  return esperadas.every((cota, indice) => dentroDeBanda(cota, medidas[indice]))
}

// Las prismaticas no tienen orden canonico de cotas; las cilindricas si
// (diametro y despues longitud), asi que solo se ordenan las primeras.
function ordenarCotas(forma: VerdadPieza['dimensiones']['forma'], cotas: number[]): number[] {
  return forma === 'prismatica' ? [...cotas].sort((a, b) => b - a) : cotas
}

function dentroDeBanda(esperado: number, obtenido: number): boolean {
  const banda = Math.max(esperado * 0.02, 0.5)
  return Math.abs(esperado - obtenido) <= banda
}

function toleranciasCoinciden(esperado: string, obtenido: string): boolean {
  const claseEsperada = claseToleranciaGeneral(esperado)
  const claseObtenida = claseToleranciaGeneral(obtenido)
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
