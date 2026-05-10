import { NextRequest, NextResponse } from 'next/server'
import { materialLibrarySchema, readMaterialLibrary, writeMaterialLibrary } from '@/lib/material-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const library = await readMaterialLibrary()
    return NextResponse.json({ library })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown
    const library = materialLibrarySchema.parse(body)
    const saved = await writeMaterialLibrary(library)
    return NextResponse.json({ library: saved })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
