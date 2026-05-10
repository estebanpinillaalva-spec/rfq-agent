import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { crearRfqLocalDePrueba } from '@/lib/inbound-local'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { provider?: string }
    const provider = body.provider === 'gemini' ? 'gemini' : body.provider === 'mock' ? 'mock' : undefined
    const result = await crearRfqLocalDePrueba(provider)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
