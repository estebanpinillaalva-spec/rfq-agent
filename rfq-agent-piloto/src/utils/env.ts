import { config as loadEnv } from 'dotenv'

export function loadLocalEnv(): void {
  loadEnv({ path: '.env.local' })
  loadEnv()
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta ${name} en .env.local`)
  return value
}
