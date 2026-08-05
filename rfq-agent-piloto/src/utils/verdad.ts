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
