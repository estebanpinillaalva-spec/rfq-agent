import { NextRequest, NextResponse } from 'next/server'
import { spawnSync } from 'child_process'
import { readdir } from 'fs/promises'
import { basename, resolve } from 'path'
import { listRfqs, pilotRoot } from '@/lib/local-store'

export async function GET() {
  const rfqs = await listRfqs()
  return NextResponse.json({ rfqs })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { inputPath?: string; provider?: string }
    const inputPath = body.inputPath?.trim()
    const provider = body.provider === 'gemini' ? 'gemini' : 'mock'

    if (!inputPath) {
      return NextResponse.json({ error: 'Falta inputPath' }, { status: 400 })
    }

    const before = await salidaNames()
    const target = safeInputPath(inputPath)
    const result = runPilot(target, provider)
    const finalResult =
      result.status !== 0 && provider === 'gemini' && isGeminiQuotaError(`${result.stdout}\n${result.stderr}`)
        ? runPilot(target, 'mock')
        : result

    const after = await salidaNames()
    const created = after.find((name) => !before.includes(name)) ?? null
    const usedFallback = finalResult !== result

    return NextResponse.json(
      {
        ok: finalResult.status === 0,
        salidaId: created,
        stdout: usedFallback
          ? [
              'Gemini no tiene cuota disponible. Se ha generado un borrador local con mock para que puedas seguir revisando.',
              '',
              finalResult.stdout,
            ].join('\n')
          : finalResult.stdout,
        stderr: finalResult.stderr,
        error: finalResult.error?.message,
        provider: usedFallback ? 'mock' : provider,
        fallback: usedFallback,
      },
      { status: finalResult.status === 0 ? 200 : 500 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function runPilot(target: string, provider: 'mock' | 'gemini') {
  return spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', target], {
    cwd: pilotRoot,
    encoding: 'utf8',
    env: { ...process.env, RFQ_AI_PROVIDER: provider },
    timeout: 180000,
    windowsHide: true,
  })
}

function isGeminiQuotaError(output: string): boolean {
  return /429 Too Many Requests|Quota exceeded|generate_content_free_tier_requests/i.test(output)
}

function safeInputPath(inputPath: string): string {
  const normalized = inputPath.replace(/^["']|["']$/g, '')
  const resolved = resolve(pilotRoot, normalized)
  if (!resolved.startsWith(resolve(pilotRoot))) {
    throw new Error('La carpeta debe estar dentro de rfq-agent-piloto')
  }
  return resolved
}

async function salidaNames(): Promise<string[]> {
  const entries = await readdir(resolve(pilotRoot, 'salidas'), { withFileTypes: true }).catch(() => [])
  return entries.filter((entry) => entry.isDirectory()).map((entry) => basename(entry.name))
}
