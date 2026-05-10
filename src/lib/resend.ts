import { Resend } from 'resend'
import type { WebhookEventPayload } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY ?? 're_local_dashboard_placeholder')

const FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN ?? 'example.local'

export async function enviarRespuestaRFQ({
  to,
  refInterna,
  asunto,
  bodyHtml,
  pdfBuffer,
  pdfFilename,
}: {
  to: string
  refInterna: string
  asunto: string
  bodyHtml: string
  pdfBuffer?: Buffer
  pdfFilename?: string
}) {
  const attachments =
    pdfBuffer && pdfFilename
      ? [
          {
            filename: pdfFilename,
            content: pdfBuffer.toString('base64'),
          },
        ]
      : undefined

  return resend.emails.send({
    from: `RFQ Agent <rfq@${FROM_DOMAIN}>`,
    to,
    subject: asunto || `[${refInterna}] Analisis tecnico + presupuesto borrador`,
    html: bodyHtml,
    attachments,
  })
}

export async function enviarSolicitudInfo({
  to,
  refInterna,
  bodyHtml,
}: {
  to: string
  refInterna: string
  bodyHtml: string
}) {
  return resend.emails.send({
    from: `RFQ Agent <rfq@${FROM_DOMAIN}>`,
    to,
    subject: `[${refInterna}] Informacion adicional necesaria`,
    html: bodyHtml,
  })
}

export function verificarFirmaWebhook(
  payload: string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  try {
    const getHeader = (name: string) => {
      const value = headers[name] ?? headers[name.toLowerCase()]
      return Array.isArray(value) ? value[0] : value ?? null
    }
    verificarWebhookResend(payload, { get: getHeader })
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export function verificarWebhookResend(payload: string, headers: { get(name: string): string | null }): WebhookEventPayload {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signature = headers.get('svix-signature')

  if (secret && id && timestamp && signature) {
    return resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    })
  }

  if (process.env.ALLOW_UNVERIFIED_RESEND_WEBHOOKS === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ALLOW_UNVERIFIED_RESEND_WEBHOOKS no esta permitido en produccion. Configura RESEND_WEBHOOK_SECRET.')
    }
    try {
      return JSON.parse(payload) as WebhookEventPayload
    } catch {
      throw new Error('Payload del webhook no es JSON valido.')
    }
  }

  throw new Error('Webhook Resend sin firma valida. Configura RESEND_WEBHOOK_SECRET o usa ALLOW_UNVERIFIED_RESEND_WEBHOOKS=true solo en pruebas locales.')
}
