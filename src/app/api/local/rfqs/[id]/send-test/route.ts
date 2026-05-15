import { NextResponse } from 'next/server'
import { spawnSync } from 'child_process'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { safeSalidaDir, pilotRoot } from '@/lib/local-store'

async function resolveRecipient(id: string, fromBody: string): Promise<string> {
  if (fromBody) return fromBody

  const dir = safeSalidaDir(id)

  // 1. Intentar raw/email.txt
  try {
    const emailTxt = await readFile(join(dir, 'raw', 'email.txt'), 'utf8')
    const match = emailTxt.match(/^De:\s*(.+)$/im)
    if (match?.[1]) {
      const addr = match[1].trim().match(/<([^>]+)>/) ?? match[1].trim().match(/([^\s]+@[^\s]+)/)
      if (addr?.[1]) return addr[1].trim()
      if (match[1].includes('@')) return match[1].trim()
    }
  } catch { /* no email.txt */ }

  // 2. Intentar analisis.json → analisis.cliente.email
  try {
    const raw = await readFile(join(dir, 'analisis.json'), 'utf8')
    const json = JSON.parse(raw) as Record<string, unknown>
    const analisis = (json.analisis ?? json) as Record<string, unknown>
    const cliente = analisis.cliente as Record<string, unknown> | undefined
    if (typeof cliente?.email === 'string' && cliente.email.includes('@')) {
      return cliente.email
    }
  } catch { /* no analisis.json */ }

  return ''
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    safeSalidaDir(params.id)
    const body = await request.json().catch(() => ({})) as { recipientEmail?: string }
    const fromBody = typeof body.recipientEmail === 'string' ? body.recipientEmail : ''
    const recipientEmail = await resolveRecipient(params.id, fromBody)

    const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/scripts/sendTestEmail.ts', `salidas/${params.id}`, recipientEmail], {
      cwd: pilotRoot,
      encoding: 'utf8',
      env: { ...process.env },
      timeout: 60000,
      windowsHide: true,
    })

    const output = [result.stdout, result.stderr, result.error?.message].filter(Boolean).join('\n')
    return NextResponse.json(
      {
        ok: result.status === 0,
        stdout: output,
        stderr: result.stderr,
        error: result.error?.message,
      },
      { status: result.status === 0 ? 200 : 500 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
