import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pilotRoot } from '@/lib/local-store'

export const dynamic = 'force-dynamic'

const configPath = () => {
  const configured = process.env.RFQ_INBOUND_CONFIG_PATH?.trim()
  return configured ? resolve(configured) : resolve(pilotRoot, 'ejemplos', 'rfq-simple', 'config-taller.json')
}

const configSchema = z.object({
  nombre: z.string().min(1),
  cif: z.string(),
  email: z.string(),
  precios_hora: z.record(z.number().nonnegative()),
  margen_por_complejidad: z.record(z.number().nonnegative()),
  plazo_estandar_dias: z.number().int().positive(),
  condiciones_pago: z.string(),
  iva_porcentaje: z.number().min(0).max(1),
  validez_dias: z.number().int().positive(),
  overhead_porcentaje: z.number().min(0).max(1),
  capacidad_diaria_horas: z.number().positive(),
  materiales_eur_kg: z.record(z.number().nonnegative()).optional().default({}),
  setup_min_por_operacion: z.record(z.number().nonnegative()).optional().default({}),
  subcontratas: z
    .record(z.object({ coste_minimo: z.number().nonnegative(), plazo_dias: z.number().int().nonnegative() }))
    .optional()
    .default({}),
})

export async function GET() {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const config = JSON.parse(raw) as unknown
    return NextResponse.json({ ok: true, config })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown
    const validated = configSchema.parse(body)
    await writeFile(configPath(), `${JSON.stringify(validated, null, 2)}\n`, 'utf8')
    return NextResponse.json({ ok: true, config: validated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
