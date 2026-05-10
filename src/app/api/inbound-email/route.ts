import { NextRequest, NextResponse } from 'next/server'
import { appendFile, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { crearRfqLocalDesdeEmail } from '@/lib/inbound-local'
import { pilotRoot } from '@/lib/local-store'
import { verificarWebhookResend } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString()
  const payload = await request.text()
  let eventType = 'unknown'
  let emailId = 'unknown'

  try {
    const event = verificarWebhookResend(payload, request.headers)
    eventType = event.type
    emailId = 'data' in event && 'email_id' in event.data ? String(event.data.email_id) : 'unknown'
    await writeInboundDebug('received', { receivedAt, eventType, emailId })

    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true, ignored: event.type })
    }

    const result = await crearRfqLocalDesdeEmail(event)
    await writeInboundDebug('processed', { receivedAt, eventType, emailId, result })
    return NextResponse.json({ ok: true, mode: 'local-pilot', ...result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error en inbound-email:', error)
    await writeInboundDebug('error', { receivedAt, eventType, emailId, message, stack: error instanceof Error ? error.stack : null })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function writeInboundDebug(kind: string, value: unknown): Promise<void> {
  const dir = join(pilotRoot, 'inbound-debug')
  await mkdir(dir, { recursive: true })
  // Un fichero por evento para evitar corrupción con escrituras concurrentes
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${kind}.json`
  await writeFile(join(dir, filename), `${JSON.stringify({ kind, value }, null, 2)}\n`, 'utf8')
}
