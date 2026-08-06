import type { AnalisisRFQ, PiezaAnalisis } from '../types'

export const CAMPOS_DECLARABLES = [
  'numero_plano',
  'material',
  'cantidad',
  'dimensiones',
  'tolerancia_general',
  'acabado',
  'plazo',
  'revision',
  'escala',
  'gdt',
  'tolerancias_criticas',
  'roscas',
  'agujeros',
  'tratamientos',
  'recubrimientos',
  'rugosidades',
] as const
export type CampoDeclarable = (typeof CAMPOS_DECLARABLES)[number]

const CAMPOS_DECLARABLES_SET = new Set<string>(CAMPOS_DECLARABLES)

const ETIQUETAS_LEGACY: Record<string, CampoDeclarable> = {
  revision_del_plano: 'revision',
  numero_de_plano: 'numero_plano',
  acabado_superficial: 'acabado',
  cantidad_especifica_por_pieza: 'cantidad',
  tolerancia_general_clase_exacta: 'tolerancia_general',
}

const CAMPOS_TEXTO: ReadonlyArray<{
  clave: CampoDeclarable
  propiedad: 'material' | 'dimensiones' | 'tolerancias_generales' | 'acabado'
}> = [
  { clave: 'material', propiedad: 'material' },
  { clave: 'dimensiones', propiedad: 'dimensiones' },
  { clave: 'tolerancia_general', propiedad: 'tolerancias_generales' },
  { clave: 'acabado', propiedad: 'acabado' },
]

export function contieneAsuncion(valor: string): boolean {
  const normalizado = sinAcentos(valor.toLowerCase())
  return /\b(?:asumido|asumida|supuesto|supuesta|por\s+defecto)\b/.test(normalizado)
}

export function reconciliarHonestidad(analisis: AnalisisRFQ): AnalisisRFQ {
  const piezas = analisis.piezas.map(reconciliarPieza)
  const plazoNoEncontrado = piezas.some((pieza) => pieza.campos_no_encontrados.includes('plazo'))

  return {
    ...analisis,
    plazo_solicitado: plazoNoEncontrado ? '' : analisis.plazo_solicitado,
    piezas,
  }
}

function reconciliarPieza(pieza: PiezaAnalisis): PiezaAnalisis {
  const declarados = new Set<CampoDeclarable>()
  for (const etiqueta of pieza.campos_no_encontrados) {
    const clave = normalizarCampoDeclarado(etiqueta)
    if (clave) declarados.add(clave)
  }

  for (const { clave, propiedad } of CAMPOS_TEXTO) {
    if (contieneAsuncion(pieza[propiedad])) declarados.add(clave)
  }

  return {
    ...pieza,
    numero_plano: declarados.has('numero_plano') ? '' : pieza.numero_plano,
    material: declarados.has('material') ? '' : pieza.material,
    dimensiones: declarados.has('dimensiones') ? '' : pieza.dimensiones,
    tolerancias_generales: declarados.has('tolerancia_general') ? '' : pieza.tolerancias_generales,
    acabado: declarados.has('acabado') ? '' : pieza.acabado,
    campos_no_encontrados: [...declarados],
  }
}

function normalizarCampoDeclarado(etiqueta: string): CampoDeclarable | null {
  const normalizada = sinAcentos(etiqueta.toLowerCase())
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const legacy = ETIQUETAS_LEGACY[normalizada]
  if (legacy) return legacy
  return CAMPOS_DECLARABLES_SET.has(normalizada) ? (normalizada as CampoDeclarable) : null
}

function sinAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
