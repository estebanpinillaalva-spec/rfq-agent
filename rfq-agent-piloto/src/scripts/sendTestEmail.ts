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
  const testTo = requireEnv('TEST_EMAIL_TO')
  const rawRecipient = process.argv[3]
  const extracted = extractEmail(rawRecipient)
  const to = extracted || testTo
  const isRealRecipient = extracted.length > 0

  console.log(`[DEBUG] rawRecipient="${rawRecipient}" extracted="${extracted}" to="${to}"`)
  console.log(`[DEBUG] from="${from}"`)
  console.log(`[DEBUG] isRealRecipient=${isRealRecipient}`)

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
    throw new Error(`Resend rechazo el envio (to=${to}, from=${from}): ${result.error.message} | code=${JSON.stringify(result.error)}`)
  }

  const label = isRealRecipient ? '(destinatario real)' : '(TEST_EMAIL_TO fallback)'
  console.log(`Email enviado a: ${maskEmail(to)} ${label}`)
  console.log(`ID Resend: ${result.data?.id ?? 'no disponible'}`)
}

function extractEmail(raw?: string): string {
  if (!raw) return ''
  const match = raw.match(/<([^>]+)>/) ?? raw.match(/([^\s]+@[^\s]+)/)
  return match?.[1]?.trim() ?? ''
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
