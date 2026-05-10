import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { PageHeader } from '@/components/ui'
import { EmailSetupClient } from './email-setup-client'

export const dynamic = 'force-dynamic'

interface Check {
  label: string
  ok: boolean
  detail: string
}

export default function EmailSetupPage() {
  const rootEnv = readEnv('.env.local')
  const pilotEnv = readEnv(join('rfq-agent-piloto', '.env.local'))
  const appUrl = valueOf(rootEnv, 'NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
  const lastDebug = readLastInboundDebug()
  const checks: Check[] = [
    {
      label: 'API Resend',
      ok: hasConfiguredValue(rootEnv, 'RESEND_API_KEY') || hasConfiguredValue(pilotEnv, 'RESEND_API_KEY'),
      detail: 'Necesaria para descargar emails y adjuntos desde Resend Receiving.',
    },
    {
      label: 'Webhook Secret',
      ok: hasConfiguredValue(rootEnv, 'RESEND_WEBHOOK_SECRET') && !/PEGA_AQUI/i.test(valueOf(rootEnv, 'RESEND_WEBHOOK_SECRET')),
      detail: 'Lo entrega Resend al crear el webhook email.received.',
    },
    {
      label: 'Proveedor inbound',
      ok: hasConfiguredValue(rootEnv, 'RFQ_INBOUND_PROVIDER'),
      detail: `Actual: ${valueOf(rootEnv, 'RFQ_INBOUND_PROVIDER') || 'no configurado'}. Usa mock para pruebas y gemini para IA real.`,
    },
    {
      label: 'Config taller',
      ok: true,
      detail: valueOf(rootEnv, 'RFQ_INBOUND_CONFIG_PATH') || 'Usa por defecto rfq-agent-piloto/ejemplos/rfq-simple/config-taller.json.',
    },
  ]

  return (
    <div>
      <PageHeader eyebrow="Agente email" title="Activacion del correo autonomo" />

      <section className="grid gap-4 md:grid-cols-4">
        {checks.map((check) => (
          <div key={check.label} className="surface-card rounded-lg p-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{check.label}</div>
            <div className={`mt-2 text-xl font-black ${check.ok ? 'text-ok' : 'text-danger'}`}>{check.ok ? 'Listo' : 'Pendiente'}</div>
            <p className="mt-2 text-sm leading-6 text-steel">{check.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <EmailSetupClient defaultWebhookUrl={`${appUrl.replace(/\/$/, '')}/api/inbound-email`} />
      </section>

      {lastDebug && (
        <section className="surface-card mt-5 rounded-lg p-5">
          <h2 className="text-lg font-black">Ultimo webhook recibido</h2>
          <div className={`mt-3 rounded-md border p-3 text-sm leading-6 ${lastDebug.kind === 'error' ? 'border-danger/25 bg-[#f7dfd8] text-danger' : 'border-ok/25 bg-[#dff0e8] text-ok'}`}>
            <div className="font-black">{lastDebug.kind === 'error' ? 'Error' : 'Evento registrado'}</div>
            <p className="mt-1">{lastDebug.message}</p>
          </div>
        </section>
      )}

      <section className="surface-card mt-5 rounded-lg p-5">
        <h2 className="text-lg font-black">Lo que haces tu</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {[
            'Crear o confirmar una direccion en Resend Receiving.',
            'Exponer localhost:3000 con ngrok o VS Code Port Forwarding.',
            'Crear webhook en Resend con evento email.received.',
            'Pegar RESEND_WEBHOOK_SECRET en .env.local y reiniciar la app.',
            'Enviar un email real con plano .png o .pdf a la direccion de Resend.',
            'Abrir RFQs y revisar el borrador antes de enviar nada al cliente.',
          ].map((item, index) => (
            <div key={item} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-workshop">Paso {index + 1}</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function readEnv(path: string): string {
  const fullPath = join(process.cwd(), path)
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : ''
}

function valueOf(env: string, key: string): string {
  const match = env.match(new RegExp(`^${escapeRegExp(key)}=(.*)$`, 'm'))
  return match?.[1]?.trim() ?? ''
}

function hasConfiguredValue(env: string, key: string): boolean {
  const value = valueOf(env, key)
  return Boolean(value && !/^x+$/i.test(value))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readLastInboundDebug(): { kind: string; message: string } | null {
  const path = join(process.cwd(), 'rfq-agent-piloto', 'inbound-debug', 'events.jsonl')
  if (!existsSync(path)) return null
  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/).filter(Boolean)
  const last = lines.at(-1)
  if (!last) return null
  try {
    const parsed = JSON.parse(last) as { kind?: string; value?: { message?: string; eventType?: string; emailId?: string } }
    const kind = parsed.kind ?? 'unknown'
    const event = parsed.value?.eventType ? `${parsed.value.eventType} ` : ''
    const email = parsed.value?.emailId ? `(${parsed.value.emailId})` : ''
    return {
      kind,
      message: parsed.value?.message ?? (`${event}${email}`.trim() || 'Sin detalle'),
    }
  } catch {
    return { kind: 'error', message: 'No se pudo leer inbound-debug/events.jsonl' }
  }
}
