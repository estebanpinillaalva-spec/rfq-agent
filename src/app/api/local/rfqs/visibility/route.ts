import { NextRequest, NextResponse } from 'next/server'
import { clearHiddenRfqIds, hideRfqIds, listRfqs } from '@/lib/local-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string; older_than_days?: number }

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

    if (body.action === 'archive_old') {
      const days = typeof body.older_than_days === 'number' && body.older_than_days > 0 ? body.older_than_days : 90
      const cutoff = Date.now() - days * 86400000
      const all = await listRfqs({ includeHidden: true })
      const old = all.filter((rfq) => new Date(rfq.createdAt).getTime() < cutoff)
      if (old.length > 0) await hideRfqIds(old.map((rfq) => rfq.id))
      return NextResponse.json({ ok: true, action: body.action, archivedCount: old.length, olderThanDays: days })
    }

    return NextResponse.json({ error: 'Accion no soportada.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
