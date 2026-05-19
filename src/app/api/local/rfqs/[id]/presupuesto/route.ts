import { NextResponse } from 'next/server'
import { spawnSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { safeSalidaDir, pilotRoot } from '@/lib/local-store'

interface LineaEdit {
  index: number
  pvp_unitario: number
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const dir = safeSalidaDir(params.id)
    const body = (await request.json()) as { lineas?: LineaEdit[]; observaciones?: string }

    const analysisPath = join(dir, 'analisis.json')
    const raw = await readFile(analysisPath, 'utf8')
    const data = JSON.parse(raw) as Record<string, unknown>
    const presupuesto = data.presupuesto as Record<string, unknown> | undefined
    if (!presupuesto) return NextResponse.json({ error: 'Sin presupuesto en analisis.json' }, { status: 400 })

    const lineas = presupuesto.lineas as Array<Record<string, unknown>> | undefined
    if (Array.isArray(lineas) && Array.isArray(body.lineas)) {
      for (const edit of body.lineas) {
        const linea = lineas[edit.index]
        if (!linea) continue
        linea.pvp_unitario = edit.pvp_unitario
        linea.subtotal = Math.round(edit.pvp_unitario * (Number(linea.cantidad) || 1) * 100) / 100
      }
      const subtotal = lineas.reduce((sum, l) => sum + (Number(l.subtotal) || 0), 0)
      const iva = typeof presupuesto.iva_porcentaje === 'number' ? presupuesto.iva_porcentaje : 0.21
      presupuesto.subtotal = Math.round(subtotal * 100) / 100
      presupuesto.iva = Math.round(subtotal * iva * 100) / 100
      presupuesto.total = Math.round(subtotal * (1 + iva) * 100) / 100
    }

    if (typeof body.observaciones === 'string') {
      presupuesto.observaciones_tecnicas = body.observaciones
    }

    await writeFile(analysisPath, JSON.stringify(data, null, 2), 'utf8')

    const regen = spawnSync(
      process.execPath,
      ['-r', 'ts-node/register', 'src/scripts/regenerarSalida.ts', '--dir', dir],
      {
        cwd: pilotRoot,
        encoding: 'utf8',
        env: { ...process.env },
        timeout: 60000,
        windowsHide: true,
      }
    )

    const regenOutput = [regen.stdout, regen.stderr, regen.error?.message].filter(Boolean).join('\n')

    if (regen.status !== 0) {
      return NextResponse.json(
        {
          ok: false,
          subtotal: presupuesto.subtotal,
          iva: presupuesto.iva,
          total: presupuesto.total,
          regenError: regenOutput || 'No se pudo regenerar el PDF',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      subtotal: presupuesto.subtotal,
      iva: presupuesto.iva,
      total: presupuesto.total,
      regen: regenOutput,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
