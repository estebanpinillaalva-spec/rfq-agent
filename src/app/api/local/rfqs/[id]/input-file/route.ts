import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { basename, extname, join } from 'path'
import { safeSalidaDir } from '@/lib/local-store'

const contentTypes = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.pdf', 'application/pdf'],
  ['.dxf', 'text/plain; charset=utf-8'],
  ['.step', 'text/plain; charset=utf-8'],
  ['.stp', 'text/plain; charset=utf-8'],
])

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requested = request.nextUrl.searchParams.get('name') ?? ''
    const name = basename(requested)
    const ext = extname(name).toLowerCase()
    const contentType = contentTypes.get(ext)
    if (!name || !contentType) return NextResponse.json({ error: 'Plano no permitido' }, { status: 400 })

    const file = await readFile(join(safeSalidaDir(params.id), 'input', name)).catch(() => null)
    if (!file) return NextResponse.json({ error: 'Plano no encontrado' }, { status: 404 })

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
