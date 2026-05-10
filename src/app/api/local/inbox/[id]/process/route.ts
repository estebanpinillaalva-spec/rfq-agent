import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { basename, resolve } from 'path'
import { inboxRoot } from '@/lib/local-store'
import { startPilotProcess } from '@/lib/inbound-local'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { provider?: string }
    const provider = body.provider === 'gemini' ? 'gemini' : 'mock'
    const inboxPath = resolve(inboxRoot, basename(params.id))
    if (!inboxPath.startsWith(resolve(inboxRoot)) || !existsSync(inboxPath)) {
      return NextResponse.json({ error: 'Inbox no encontrado.' }, { status: 404 })
    }

    const processPid = await startPilotProcess(inboxPath, provider)
    return NextResponse.json({ ok: true, inboxId: params.id, processPid, provider })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
