import { NextResponse } from 'next/server'
import { spawnSync } from 'child_process'
import { safeSalidaDir, pilotRoot } from '@/lib/local-store'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    safeSalidaDir(params.id)
    const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/scripts/sendTestEmail.ts', `salidas/${params.id}`], {
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
        error: result.error?.message,
      },
      { status: result.status === 0 ? 200 : 500 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
