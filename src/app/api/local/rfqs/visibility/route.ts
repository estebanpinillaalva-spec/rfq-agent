import { NextRequest, NextResponse } from 'next/server'
import { clearHiddenRfqIds, hideRfqIds, listRfqs } from '@/lib/local-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string }

    if (body.action === 'hide_current') {
      const current = await listRfqs()
      await hideRfqIds(current.map((rfq) => rfq.id))
      return NextResponse.json({ ok: true, action: body.action, hiddenCount: current.length })
    }

    if (body.action === 'restore_all') {
      await clearHiddenRfqIds()
      const restored = await listRfqs()
      return NextResponse.json({ ok: true, action: body.action, visibleCount: restored.length })
    }

    return NextResponse.json({ error: 'Accion no soportada.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
