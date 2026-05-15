import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { Resend } from 'resend'
import { loadLocalEnv, requireEnv } from '../utils/env'

async function main(): Promise<void> {
  loadLocalEnv()
  const salidaArg = process.argv[2]
  if (!salidaArg) throw new Error('Uso: npm run send:test -- salidas/<carpeta>')

  const salidaDir = resolve(salidaArg)
  const apiKey = requireEnv('RESEND_API_KEY')
  const from = requireEnv('RESEND_FROM')
  const to = requireEnv('TEST_EMAIL_TO')

  const emailBody = await readFile(join(salidaDir, 'email-respuesta.md'), 'utf8')
  const pdf = await readFile(join(salidaDir, 'presupuesto.pdf'))
  const subjectMatch = emailBody.match(/^Asunto:\s*(.+)$/m)
  const subject = subjectMatch?.[1]?.trim() ?? 'RFQ Agent - Email de prueba'

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to,
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
    throw new Error(`Resend rechazo el envio: ${result.error.message}`)
  }

  console.log(`Email enviado a: ${maskEmail(to)}`)
  console.log(`ID Resend: ${result.data?.id ?? 'no disponible'}`)
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return '[email oculto]'
  return `${name.slice(0, 2)}***@${domain}`
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
})
