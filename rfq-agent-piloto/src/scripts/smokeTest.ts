import { spawnSync } from 'node:child_process'

const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/index.ts', './ejemplos/rfq-simple'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  env: { ...process.env, RFQ_AI_PROVIDER: 'mock' },
})

if (result.status !== 0) {
  console.error(result.stderr || result.stdout)
  process.exitCode = result.status ?? 1
} else {
  console.log('Smoke test OK: rfq-simple procesado en modo mock.')
}
