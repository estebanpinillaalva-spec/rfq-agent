import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN!

// Enviar email de respuesta al taller con análisis + PDF adjunto
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
    subject: asunto || `[${refInterna}] Análisis técnico + presupuesto borrador`,
    html: bodyHtml,
    attachments,
  })
}

// Enviar email pidiendo información al cliente del taller
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
    subject: `[${refInterna}] Información adicional necesaria`,
    html: bodyHtml,
  })
}

// Verificar firma del webhook de Resend Inbound
// Resend envía la firma en el header svix-signature
export function verificarFirmaWebhook(
  payload: string,
  headers: Record<string, string | string[] | undefined>
): boolean {
  // En producción, implementar verificación HMAC con RESEND_WEBHOOK_SECRET
  // Por ahora en desarrollo se puede saltar con una variable de entorno
  if (process.env.NODE_ENV === 'development') return true

  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET no configurado')
    return false
  }

  // TODO: implementar verificación HMAC-SHA256
  // Resend usa el estándar Svix para firmar webhooks
  // Ver: https://docs.resend.com/docs/webhooks
  return true
}
