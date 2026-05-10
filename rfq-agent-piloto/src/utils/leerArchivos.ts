import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import pdfParse from 'pdf-parse'
import { configTallerSchema, type ConfigTaller, type PlanoEntrada, type RFQEntrada } from '../types'

const PLAN_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg'])
const CONTEXT_EXTENSIONS = new Set(['.step', '.stp', '.dxf'])
const MAX_FILE_BYTES = 50 * 1024 * 1024

export async function leerEntradaRFQ(carpetaArg: string): Promise<RFQEntrada> {
  const carpeta = resolve(carpetaArg)
  const info = await stat(carpeta).catch(() => null)
  if (!info?.isDirectory()) {
    throw new Error(`La carpeta no existe: ${carpetaArg}. Ejemplo: npm run dev`)
  }

  const emailPath = join(carpeta, 'email.txt')
  const configPath = join(carpeta, 'config-taller.json')

  const email = await readFile(emailPath, 'utf8').catch(() => {
    throw new Error(`Falta email.txt en ${carpetaArg}. Crea un archivo con el correo del cliente.`)
  })

  const configRaw = await readFile(configPath, 'utf8').catch(() => {
    throw new Error(`Falta config-taller.json en ${carpetaArg}. Copia el ejemplo de rfq-simple y ajusta precios.`)
  })

  const config = parseConfig(configRaw)
  const archivos = await readdir(carpeta)
  const planosPaths = archivos
    .filter((name) => PLAN_EXTENSIONS.has(extname(name).toLowerCase()) || CONTEXT_EXTENSIONS.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'es'))

  if (planosPaths.length === 0) {
    throw new Error(`No hay planos en ${carpetaArg}. Anade al menos un .pdf, .png, .jpg, .jpeg, .step, .stp o .dxf.`)
  }

  const planos = await Promise.all(planosPaths.map((nombre) => leerPlano(join(carpeta, nombre), nombre)))

  return {
    carpeta,
    nombreCarpeta: carpeta.split(/[\\/]/).at(-1) ?? 'rfq',
    email,
    planos,
    config,
  }
}

function parseConfig(raw: string): ConfigTaller {
  try {
    const parsed: unknown = JSON.parse(raw)
    return configTallerSchema.parse(parsed)
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error)
    throw new Error(`config-taller.json no es valido: ${detalle}`)
  }
}

async function leerPlano(ruta: string, nombre: string): Promise<PlanoEntrada> {
  const extension = extname(nombre).toLowerCase()
  const fileInfo = await stat(ruta)
  if (fileInfo.size > MAX_FILE_BYTES) {
    throw new Error(`${nombre} supera 50 MB. Reduce el archivo o usa un PDF/plano mas ligero.`)
  }

  const buffer = await readFile(ruta)
  const base64 = buffer.toString('base64')

  if (extension === '.pdf') {
    const parsed = await pdfParse(buffer).catch(() => null)
    const pageCount = parsed?.numpages ?? 0
    return {
      nombre,
      ruta,
      extension,
      mimeType: 'application/pdf',
      base64,
      textoExtraido: parsed?.text?.trim() || undefined,
      esFuentePrincipal: true,
      metadata: {
        size_bytes: String(fileInfo.size),
        page_count: pageCount > 0 ? String(pageCount) : 'desconocido',
        tipo: pageCount > 1 ? 'pdf_multipagina' : 'pdf',
        texto_extraido_chars: String(parsed?.text?.trim().length ?? 0),
      },
    }
  }

  if (extension === '.dxf') {
    const text = buffer.toString('utf8').slice(0, 20000)
    return {
      nombre,
      ruta,
      extension,
      mimeType: 'application/dxf',
      base64,
      textoExtraido: text,
      esFuentePrincipal: false,
      metadata: { size_bytes: String(fileInfo.size), uso: 'contexto_no_cotado' },
    }
  }

  if (extension === '.step' || extension === '.stp') {
    const text = buffer.toString('utf8').slice(0, 20000)
    return {
      nombre,
      ruta,
      extension,
      mimeType: 'model/step',
      base64,
      textoExtraido: text,
      esFuentePrincipal: false,
      metadata: { size_bytes: String(fileInfo.size), uso: 'contexto_3d_no_cotado' },
    }
  }

  return {
    nombre,
    ruta,
    extension,
    mimeType: extension === '.png' ? 'image/png' : 'image/jpeg',
    base64,
    esFuentePrincipal: true,
    metadata: { size_bytes: String(fileInfo.size) },
  }
}
