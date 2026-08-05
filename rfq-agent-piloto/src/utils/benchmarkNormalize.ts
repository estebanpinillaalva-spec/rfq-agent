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
