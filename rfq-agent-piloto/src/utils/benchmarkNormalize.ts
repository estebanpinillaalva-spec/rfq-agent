export interface ClaseToleranciaGeneral {
  lineal: string | null
  geometrica: string | null
}

export function claseToleranciaGeneral(texto: string): ClaseToleranciaGeneral {
  const compacto = texto.toLowerCase().replace(/\s+/g, '')
  const match = compacto.match(/(?:2768|7168)-?([fmcv])([hkl])?/)
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
  [/ra\d|rugosidad/, 'mecanizado'],
  [/n(1[0-2]|[1-9])(?![0-9])/, 'mecanizado'],
]

export function clasificarAcabado(texto: string): Acabado {
  const compacto = texto.toLowerCase().replace(/\s+/g, '')
  const match = PATRONES_ACABADO.find(([patron]) => patron.test(compacto))
  return match ? match[1] : 'NO_CLASIFICABLE'
}
