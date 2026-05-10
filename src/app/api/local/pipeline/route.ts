import { NextRequest, NextResponse } from 'next/server'
import { readPipeline, updatePipelineRow, appendPipelineRow } from '@/lib/local-store'

export async function GET() {
  const pipeline = await readPipeline()
  return NextResponse.json(pipeline)
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { index?: number; patch?: Record<string, string> }
  if (typeof body.index !== 'number' || !body.patch) {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
  }
  await updatePipelineRow(body.index, body.patch)
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { row?: Record<string, string> }
  if (!body.row) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
  await appendPipelineRow(body.row)
  return NextResponse.json({ ok: true })
}
