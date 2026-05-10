import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { PageHeader } from '@/components/ui'
import { readMaterialLibrary } from '@/lib/material-store'
import { ConfigTallerPanel } from './config-taller-panel'
import { MaterialsPanel } from './materials-panel'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const rootEnvPath = join(process.cwd(), '.env.local')
  const pilotEnvPath = join(process.cwd(), 'rfq-agent-piloto', '.env.local')
  const rootEnv = existsSync(rootEnvPath) ? readFileSync(rootEnvPath, 'utf8') : ''
  const pilotEnv = existsSync(pilotEnvPath) ? readFileSync(pilotEnvPath, 'utf8') : ''
  const materialLibrary = await readMaterialLibrary()
  const status = {
    Gemini: /GOOGLE_GEMINI_API_KEY=.+/.test(rootEnv) || /GOOGLE_GEMINI_API_KEY=.+/.test(pilotEnv),
    Resend: /RESEND_API_KEY=.+/.test(rootEnv) || /RESEND_API_KEY=.+/.test(pilotEnv),
    'Webhook secret': /RESEND_WEBHOOK_SECRET=(?!whsec_PEGA_AQUI|$).+/.test(rootEnv),
    'Email test': /TEST_EMAIL_TO=.+/.test(pilotEnv),
  }

  return (
    <div>
      <PageHeader eyebrow="Configuracion" title="Ajustes locales" />
      <section className="grid gap-5 lg:grid-cols-3">
        {Object.entries(status).map(([label, ok]) => (
          <div key={label} className="surface-card rounded-lg p-5">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</div>
            <div className={`mt-3 text-xl font-black ${ok ? 'text-ok' : 'text-danger'}`}>{ok ? 'Configurado' : 'Pendiente'}</div>
          </div>
        ))}
      </section>
      <section className="surface-card mt-5 rounded-lg p-5">
        <h2 className="text-lg font-black">Archivos esperados</h2>
        <p className="mt-2 text-sm leading-6 text-steel">Rellena claves localmente. No pegues claves en el chat ni las subas al repo.</p>
        <pre className="mt-4 overflow-auto rounded-md bg-[#1f2933] p-4 text-sm leading-6 text-[#f7f4ef]">{`rfq-agent-piloto/.env.local

RFQ_AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-pro
GOOGLE_GEMINI_API_KEY=

RESEND_API_KEY=
RESEND_FROM=RFQ Agent <onboarding@resend.dev>
TEST_EMAIL_TO=

.env.local

RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
RFQ_INBOUND_PROVIDER=mock
ALLOW_UNVERIFIED_RESEND_WEBHOOKS=false`}</pre>
      </section>

      <section className="surface-card mt-5 rounded-lg p-5">
        <h2 className="text-lg font-black">Enlaces para activar email</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExternalLink href="https://resend.com/emails/receiving">Resend Receiving</ExternalLink>
          <ExternalLink href="https://resend.com/webhooks">Resend Webhooks</ExternalLink>
          <ExternalLink href="https://resend.com/api-keys">Resend API Keys</ExternalLink>
          <ExternalLink href="https://ngrok.com/download">ngrok</ExternalLink>
        </div>
        <p className="mt-4 text-sm leading-6 text-steel">
          Para pruebas locales, publica el puerto 3000 y usa la URL HTTPS generada con la ruta <code>/api/inbound-email</code>.
        </p>
      </section>
      <ConfigTallerPanel />
      <MaterialsPanel initialLibrary={materialLibrary} />
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="btn-secondary rounded-md px-3 py-2 text-center text-sm font-bold" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}
