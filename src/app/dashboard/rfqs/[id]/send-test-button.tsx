'use client'

import { useState } from 'react'

export function SendTestButton({ id, disabled }: { id: string; disabled: boolean }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function send() {
    setBusy(true)
    setMessage('Enviando...')
    try {
      const response = await fetch(`/api/local/rfqs/${id}/send-test`, { method: 'POST' })
      const data = (await response.json()) as { stdout?: string; stderr?: string; error?: string }
      setMessage(data.stdout || data.stderr || data.error || (response.ok ? 'Enviado' : 'Error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4">
      <button disabled={disabled || busy} onClick={send} className="btn-primary w-full rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50">
        {busy ? 'Enviando...' : 'Enviar email de prueba'}
      </button>
      {message && <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-[#1f2933] p-3 text-xs leading-5 text-[#f7f4ef]">{message}</pre>}
    </div>
  )
}
