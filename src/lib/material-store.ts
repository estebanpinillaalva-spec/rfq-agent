import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { z } from 'zod'
import { pilotRoot } from './local-store'

export const materialPath = join(pilotRoot, 'config', 'materiales.json')

const confidenceSchema = z.enum(['ALTA', 'MEDIA', 'BAJA'])
const familySchema = z.enum(['acero', 'aluminio', 'inox', 'laton', 'cobre', 'plastico_tecnico', 'otro'])

export const materialItemSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  familia: familySchema,
  aliases: z.array(z.string()).default([]),
  densidad_g_cm3: z.number().positive(),
  formato_habitual: z.string(),
  precio_eur_kg: z.number().nonnegative(),
  desperdicio_pct: z.number().min(0).max(1).default(0.15),
  minimo_compra_kg: z.number().nonnegative().default(1),
  proveedor: z.string().default('Proveedor local'),
  fecha_actualizacion: z.string(),
  confianza: confidenceSchema.default('MEDIA'),
  fuente_referencia: z.string().default('Precio local editable del taller'),
  notas: z.string().default(''),
})

export const materialLibrarySchema = z.object({
  version: z.enum(['1.0', '1.1']),
  moneda: z.literal('EUR'),
  unidad_precio: z.literal('kg'),
  updated_at: z.string(),
  stale_after_days: z.number().int().positive().default(45),
  fuentes_publicas: z.array(z.object({ nombre: z.string(), url: z.string(), uso: z.string() })).default([]),
  materiales: z.array(materialItemSchema),
})

export type MaterialItem = z.infer<typeof materialItemSchema>
export type MaterialLibrary = z.infer<typeof materialLibrarySchema>

export async function readMaterialLibrary(): Promise<MaterialLibrary> {
  if (!existsSync(materialPath)) return emptyLibrary()
  const text = await readFile(materialPath, 'utf8')
  return materialLibrarySchema.parse(JSON.parse(text) as unknown)
}

export async function writeMaterialLibrary(library: MaterialLibrary): Promise<MaterialLibrary> {
  const clean = materialLibrarySchema.parse({ ...library, updated_at: new Date().toISOString() })
  const target = resolve(materialPath)
  if (!target.startsWith(resolve(pilotRoot))) throw new Error('Ruta de materiales no permitida')
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, `${JSON.stringify(clean, null, 2)}\n`, 'utf8')
  return clean
}

function emptyLibrary(): MaterialLibrary {
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
