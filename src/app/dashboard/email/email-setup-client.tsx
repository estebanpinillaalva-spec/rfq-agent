'use client'

import { useMemo, useState } from 'react'

export function EmailSetupClient({ defaultWebhookUrl }: { defaultWebhookUrl: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [publicUrl, setPublicUrl] = useState('')
  const webhookUrl = useMemo(() => {
    const clean = publicUrl.trim().replace(/\/$/, '')
    return clean ? `${clean}/api/inbound-email` : defaultWebhookUrl
  }, [defaultWebhookUrl, publicUrl])

  async function simulateInboundEmail() {
    setBusy(true)
    setMessage('Creando email simulado...')
    try {
      const response = await fetch('/api/local/inbound-test', { method: 'POST' })
      const data = (await response.json()) as { inboxId?: string; processPid?: number; error?: string }
      if (!response.ok) {
        setMessage(data.error || 'No se pudo simular el email entrante.')
        return
      }
      setMessage(`Email simulado creado: ${data.inboxId}\nProceso piloto iniciado: ${data.processPid ?? 'N/D'}\nAbre RFQs y pulsa refrescar en unos segundos.`)
    } finally {
      setBusy(false)
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl)
    setMessage(`URL copiada:\n${webhookUrl}`)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Webhook local</h2>
        <p className="mt-2 text-sm leading-6 text-steel">
          Cuando tengas una URL publica de ngrok o VS Code Port Forwarding, pegala aqui para construir la URL exacta que va en Resend.
        </p>
        <label className="mt-4 block text-sm font-bold text-steel">URL publica temporal</label>
        <input
          className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
          placeholder="https://xxxxx.ngrok-free.app"
          value={publicUrl}
          onChange={(event) => setPublicUrl(event.target.value)}
        />
        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-steel">URL para Resend</div>
          <code className="mt-2 block overflow-auto whitespace-nowrap text-sm font-bold text-ink">{webhookUrl}</code>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={copyWebhookUrl} className="btn-secondary rounded-md px-4 py-2 text-sm font-bold">
            Copiar URL webhook
          </button>
          <button type="button" disabled={busy} onClick={simulateInboundEmail} className="btn-primary rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50">
            {busy ? 'Simulando...' : 'Simular email entrante'}
          </button>
        </div>
        {message && <pre className="mt-4 max-h-52 overflow-auto rounded-md bg-[#1f2933] p-3 text-xs leading-5 text-[#f7f4ef]">{message}</pre>}
      </section>

      <aside className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Paneles externos</h2>
        <div className="mt-4 grid gap-3">
          <ExternalLink href="https://resend.com/emails/receiving">Resend Receiving</ExternalLink>
          <ExternalLink href="https://resend.com/webhooks">Resend Webhooks</ExternalLink>
          <ExternalLink href="https://resend.com/api-keys">Resend API Keys</ExternalLink>
          <ExternalLink href="https://resend.com/domains">Resend Domains</ExternalLink>
          <ExternalLink href="https://ngrok.com/download">Descargar ngrok</ExternalLink>
        </div>
      </aside>
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
