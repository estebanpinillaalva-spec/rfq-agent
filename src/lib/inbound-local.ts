import { spawn } from 'child_process'
import { createWriteStream } from 'fs'
import { access, copyFile, mkdir, writeFile } from 'fs/promises'
import { basename, extname, join, resolve } from 'path'
import type { AttachmentData, EmailReceivedEvent } from 'resend'
import { appendPipelineRowFromRfq, pilotRoot } from '@/lib/local-store'
import { resend } from '@/lib/resend'

const allowedPlanExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.step', '.stp', '.dxf'])
const maxAttachmentBytes = 50 * 1024 * 1024

export interface InboundLocalResult {
  emailId: string
  inboxId: string
  inboxPath: string
  attachmentsSaved: number
  ignoredAttachments: string[]
  processingStarted: boolean
  processPid: number | null
}

export async function crearRfqLocalDesdeEmail(event: EmailReceivedEvent): Promise<InboundLocalResult> {
  const emailId = event.data.email_id
  const emailResponse = await resend.emails.receiving.get(emailId)
  if (emailResponse.error || !emailResponse.data) {
    throw new Error(`No se pudo descargar el email recibido: ${emailResponse.error?.message ?? 'sin datos'}`)
  }

  const email = emailResponse.data
  // emailId es único por email en Resend — lo usamos completo para evitar colisiones
  const safeEmailId = emailId.replace(/[^a-zA-Z0-9]/g, '').slice(-16)
  const inboxId = `${timestampId()}-${slugify(email.subject || 'rfq')}-${safeEmailId}`
  const inboxPath = resolve(pilotRoot, 'inbox', inboxId)
  await mkdir(inboxPath, { recursive: true })

  await writeFile(join(inboxPath, 'email.txt'), buildEmailText(email), 'utf8')
  await copyDefaultConfig(inboxPath, email.to)

  const attachmentsResponse = await resend.emails.receiving.attachments.list({ emailId })
  const attachments = attachmentsResponse.data?.data ?? []
  const fallbackAttachments = attachments.length > 0 ? [] : event.data.attachments

  const ignoredAttachments: string[] = []
  let attachmentsSaved = 0
  for (const attachment of attachments) {
    const saved = await saveAttachment(inboxPath, attachment)
    if (saved) attachmentsSaved += 1
    else ignoredAttachments.push(attachment.filename ?? attachment.id)
  }

  for (const attachment of fallbackAttachments) {
    const saved = await saveAttachmentById(inboxPath, emailId, attachment)
    if (saved) attachmentsSaved += 1
    else ignoredAttachments.push(attachment.filename ?? attachment.id)
  }

  if (attachmentsResponse.error && attachmentsSaved === 0) {
    throw new Error(`No se pudieron descargar adjuntos: ${attachmentsResponse.error.message}`)
  }

  await writeFile(
    join(inboxPath, 'metadata.json'),
    `${JSON.stringify({ event, email, attachments_saved: attachmentsSaved, ignored_attachments: ignoredAttachments }, null, 2)}\n`,
    'utf8'
  )

  if (attachmentsSaved === 0) {
    await writeProcessStatus(inboxPath, {
      status: 'BLOQUEADO_SIN_ADJUNTOS',
      provider: null,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      message: 'El email llego, pero no habia planos adjuntos permitidos para procesar.',
    })
    const fromAddress = extractEmailAddress(email.from)
    if (fromAddress && process.env.RESEND_FROM_DOMAIN) {
      const { enviarSolicitudInfo } = await import('@/lib/resend')
      const ref = inboxId.slice(0, 24)
      await enviarSolicitudInfo({
        to: fromAddress,
        refInterna: ref,
        bodyHtml: `<p>Hemos recibido su email pero no encontramos ningun plano adjunto en formato valido (PDF, PNG, JPG).</p><p>Por favor, reenvie el mensaje incluyendo el plano tecnico como adjunto.</p><p>Referencia: ${ref}</p>`,
      }).catch(() => undefined) // no bloquear si falla el envio
    }
  }

  const processPid = attachmentsSaved > 0 ? await startPilotProcess(inboxPath) : null
  return {
    emailId,
    inboxId,
    inboxPath,
    attachmentsSaved,
    ignoredAttachments,
    processingStarted: processPid !== null,
    processPid,
  }
}

export async function crearRfqLocalDePrueba(providerOverride?: 'mock' | 'gemini'): Promise<InboundLocalResult> {
  const emailId = `local-test-${Date.now()}`
  const inboxId = `${timestampId()}-email-entrante-demo-${emailId.slice(-8)}`
  const inboxPath = resolve(pilotRoot, 'inbox', inboxId)
  await mkdir(inboxPath, { recursive: true })

  const email = {
    from: 'Cliente Demo <compras@cliente-demo.es>',
    to: ['rfq-demo@resend.local'],
    cc: null,
    subject: 'RFQ demo recibido por email',
    text: [
      'Hola,',
      '',
      'Adjuntamos plano para presupuestar 10 unidades.',
      'Material preferente: Acero F-114.',
      'Necesitamos una primera respuesta esta semana.',
      '',
      'Gracias.',
    ].join('\n'),
    html: null,
    message_id: `<${emailId}@local>`,
    created_at: new Date().toISOString(),
  }

  await writeFile(join(inboxPath, 'email.txt'), buildEmailText(email), 'utf8')
  await copyDefaultConfig(inboxPath)
  await copyFile(
    resolve(pilotRoot, 'ejemplos', 'rfq-simple', 'pieza1.png'),
    join(inboxPath, 'plano-demo-email.png')
  )
  await writeFile(
    join(inboxPath, 'metadata.json'),
    `${JSON.stringify({ local_test: true, email, attachments_saved: 1, ignored_attachments: [] }, null, 2)}\n`,
    'utf8'
  )

  const processPid = await startPilotProcess(inboxPath, providerOverride)
  return {
    emailId,
    inboxId,
    inboxPath,
    attachmentsSaved: 1,
    ignoredAttachments: [],
    processingStarted: processPid !== null,
    processPid,
  }
}

async function saveAttachment(inboxPath: string, attachment: AttachmentData): Promise<boolean> {
  const filename = await uniqueFilename(inboxPath, sanitizeFilename(attachment.filename ?? attachment.id))
  const extension = extname(filename).toLowerCase()
  if (!allowedPlanExtensions.has(extension)) return false
  if (attachment.size > maxAttachmentBytes) return false

  const response = await fetch(attachment.download_url)
  if (!response.ok) return false

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > maxAttachmentBytes) return false
  if (!validarMagicBytes(buffer, extension)) return false

  await writeFile(join(inboxPath, filename), buffer)
  return true
}

function validarMagicBytes(buffer: Buffer, extension: string): boolean {
  if (buffer.length < 4) return false
  if (extension === '.pdf') return buffer.slice(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46])) // %PDF
  if (extension === '.png') return buffer.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) // \x89PNG
  if (extension === '.jpg' || extension === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 // FFD8
  return true // .step, .stp, .dxf — texto plano, no tienen magic bytes fijos
}

async function saveAttachmentById(
  inboxPath: string,
  emailId: string,
  attachment: { id: string; filename: string | null; content_type: string | null }
): Promise<boolean> {
  const attachmentResponse = await resend.emails.receiving.attachments.get({ emailId, id: attachment.id })
  if (attachmentResponse.error || !attachmentResponse.data) return false
  return saveAttachment(inboxPath, attachmentResponse.data)
}

async function copyDefaultConfig(inboxPath: string, toAddresses: string[] = []): Promise<void> {
  // Buscar config por cliente: rfq-[cliente]@dominio → config/clientes/[cliente].json
  const clientesDir = resolve(pilotRoot, 'config', 'clientes')
  for (const address of toAddresses) {
    const localPart = address.split('@')[0]?.toLowerCase() ?? ''
    const clientKey = localPart.startsWith('rfq-') ? localPart.slice(4) : localPart
    const clientConfig = resolve(clientesDir, `${clientKey}.json`)
    const found = await access(clientConfig).then(() => true).catch(() => false)
    if (found) {
      await copyFile(clientConfig, join(inboxPath, 'config-taller.json'))
      return
    }
  }
  // Fallback: env var o config por defecto
  const configured = process.env.RFQ_INBOUND_CONFIG_PATH?.trim()
  const source = configured
    ? resolve(configured)
    : resolve(pilotRoot, 'ejemplos', 'rfq-simple', 'config-taller.json')
  await copyFile(source, join(inboxPath, 'config-taller.json'))
}

export async function startPilotProcess(inboxPath: string, providerOverride?: 'mock' | 'gemini'): Promise<number | null> {
  const resolvedInboxPath = resolve(inboxPath)
  if (!resolvedInboxPath.startsWith(resolve(pilotRoot, 'inbox'))) {
    throw new Error('La carpeta de inbox no es valida.')
  }
  const provider = providerOverride ?? process.env.RFQ_INBOUND_PROVIDER ?? process.env.RFQ_AI_PROVIDER ?? 'mock'
  const startedAt = new Date().toISOString()
  const logPath = join(resolvedInboxPath, 'process.log')

  await writeProcessStatus(resolvedInboxPath, {
    status: 'PROCESANDO',
    provider,
    started_at: startedAt,
    finished_at: null,
    message: 'Proceso piloto iniciado en segundo plano.',
  })

  const child = spawn(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', resolvedInboxPath], {
    cwd: pilotRoot,
    env: { ...process.env, RFQ_AI_PROVIDER: provider },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  const log = createWriteStream(logPath, { flags: 'a' })
  const chunks: string[] = []
  const append = (chunk: Buffer | string) => {
    const text = chunk.toString()
    chunks.push(text)
    log.write(text)
  }
  log.write(`\n[${startedAt}] Inicio RFQ inbound. Provider=${provider}\n`)
  child.stdout?.on('data', append)
  child.stderr?.on('data', append)
  child.on('error', (error) => {
    const finishedAt = new Date().toISOString()
    log.write(`\n[${finishedAt}] Error lanzando proceso: ${error.message}\n`)
    void writeProcessStatus(resolvedInboxPath, {
      status: 'ERROR',
      provider,
      started_at: startedAt,
      finished_at: finishedAt,
      message: error.message,
    })
  })
  child.on('exit', (code, signal) => {
    const finishedAt = new Date().toISOString()
    const ok = code === 0
    const output = chunks.join('')
    const shouldFallbackToMock = !ok && provider === 'gemini' && isGeminiQuotaError(output)
    log.write(`\n[${finishedAt}] Fin proceso. code=${code ?? 'null'} signal=${signal ?? 'null'}\n`)
    log.end()

    if (shouldFallbackToMock) {
      void writeProcessStatus(resolvedInboxPath, {
        status: 'PROCESANDO',
        provider: 'mock',
        started_at: startedAt,
        finished_at: null,
        exit_code: code,
        signal,
        message: 'Gemini no tiene cuota disponible. Fallback mock iniciado para generar un borrador local revisable.',
      }).then(() => startPilotProcess(resolvedInboxPath, 'mock'))
      return
    }

    void writeProcessStatus(resolvedInboxPath, {
      status: ok ? 'COMPLETADO' : 'ERROR',
      provider,
      started_at: startedAt,
      finished_at: finishedAt,
      exit_code: code,
      signal,
      message: ok ? 'Proceso completado. Revisa salidas/ para el RFQ generado.' : 'El proceso fallo. Revisa process.log.',
    })

    if (ok) {
      void appendPipelineRowFromRfq(basename(resolvedInboxPath)).catch(() => undefined)
    }
  })
  return child.pid ?? null
}

function isGeminiQuotaError(output: string): boolean {
  return /429 Too Many Requests|Quota exceeded|generate_content_free_tier_requests|Timeout tras \d+s/i.test(output)
}

async function writeProcessStatus(inboxPath: string, value: Record<string, unknown>): Promise<void> {
  await writeFile(join(inboxPath, 'process-status.json'), `${JSON.stringify(value, null, 2)}\n`, 'utf8').catch(() => undefined)
}

function buildEmailText(email: {
  from: string
  to: string[]
  cc: string[] | null
  subject: string
  text: string | null
  html: string | null
  message_id: string
  created_at: string
}): string {
  const body = email.text?.trim() || stripHtml(email.html ?? '').trim() || '(sin cuerpo de email)'
  return [
    `De: ${email.from}`,
    `Para: ${email.to.join(', ')}`,
    email.cc?.length ? `CC: ${email.cc.join(', ')}` : '',
    `Asunto: ${email.subject}`,
    `Fecha: ${email.created_at}`,
    `Message-ID: ${email.message_id}`,
    '',
    body,
    '',
  ]
    .filter(Boolean)
    .join('\n')
}

function sanitizeFilename(value: string): string {
  const clean = basename(value).replace(/[^a-zA-Z0-9._-]/g, '_')
  return clean || `plano-${Date.now()}.dat`
}

async function uniqueFilename(inboxPath: string, filename: string): Promise<string> {
  const extension = extname(filename)
  const stem = extension ? filename.slice(0, -extension.length) : filename
  let candidate = filename
  let index = 2
  while (await exists(join(inboxPath, candidate))) {
    candidate = `${stem}-${index}${extension}`
    index += 1
  }
  return candidate
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  )
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 42) || 'rfq'
  )
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
}

function extractEmailAddress(from: string): string | null {
  const match = from.match(/<([^>]+)>/) ?? from.match(/([^\s@,]+@[^\s@,]+)/)
  return match?.[1]?.trim() ?? null
}

function timestampId(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}
