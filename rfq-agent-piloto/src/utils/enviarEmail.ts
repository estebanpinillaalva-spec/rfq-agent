import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Resend } from 'resend'

export interface ResultadoEnvio {
  enviado: boolean
  motivo?: string
  resendId?: string
  destinatario?: string
}

export async function enviarEmailSalida(directorio: string): Promise<ResultadoEnvio> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM?.trim()
  const testTo = process.env.TEST_EMAIL_TO?.trim()

  if (!apiKey || !from || !testTo) {
    const faltantes = [!apiKey && 'RESEND_API_KEY', !from && 'RESEND_FROM', !testTo && 'TEST_EMAIL_TO']
      .filter(Boolean)
      .join(', ')
    return { enviado: false, motivo: `Faltan variables en .env.local: ${faltantes}` }
  }

  const emailBody = await readFile(join(directorio, 'email-respuesta.md'), 'utf8')
  const pdf = await readFile(join(directorio, 'presupuesto.pdf'))
  const subjectMatch = emailBody.match(/^Asunto:\s*(.+)$/m)
  const subject = subjectMatch?.[1]?.trim() ?? 'RFQ Agent - Presupuesto borrador'

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to: testTo,
    subject,
    text: emailBody,
    attachments: [
      {
        filename: 'presupuesto-borrador.pdf',
        content: pdf.toString('base64'),
      },
    ],
  })

  if (result.error) {
    return { enviado: false, motivo: `Resend rechazo: ${result.error.message}` }
  }

  return {
    enviado: true,
    resendId: result.data?.id,
    destinatario: maskEmail(testTo),
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return '[email oculto]'
  return `${name.slice(0, 2)}***@${domain}`
}
