import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { safeSalidaDir } from '@/lib/local-store'

const allowed = new Map([
  ['presupuesto.pdf', 'application/pdf'],
  ['presupuesto.html', 'text/html; charset=utf-8'],
  ['presupuesto.md', 'text/markdown; charset=utf-8'],
  ['email-respuesta.md', 'text/markdown; charset=utf-8'],
  ['revision-checklist.md', 'text/markdown; charset=utf-8'],
  ['analisis.json', 'application/json; charset=utf-8'],
  ['error.json', 'application/json; charset=utf-8'],
  ['quality-report.json', 'application/json; charset=utf-8'],
  ['quality-report.md', 'text/markdown; charset=utf-8'],
  ['input-metadata.json', 'application/json; charset=utf-8'],
])

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const name = request.nextUrl.searchParams.get('name') ?? ''
    const contentType = allowed.get(name)
    if (!contentType) return NextResponse.json({ error: 'Archivo no permitido' }, { status: 400 })

    const dir = safeSalidaDir(params.id)
    const file = await readFile(join(dir, name)).catch(() => null)
    if (!file) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })

    return new NextResponse(file, {
      headers: {
        'content-type': contentType,
        'content-disposition': `inline; filename="${name}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
