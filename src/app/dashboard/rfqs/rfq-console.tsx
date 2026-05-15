'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { LocalRfqSummary } from '@/lib/local-store'
import { EmptyState, StatusBadge, formatMoney } from '@/components/ui'

type DateFilter = 'all' | 'today' | 'week' | 'month'
type StatusFilter = 'all' | 'PROCESANDO' | 'COMPLETADO' | 'REVISAR' | 'ERROR_RECUPERABLE' | 'BLOQUEADO_CON_MOTIVO'
type ScoreFilter = 'all' | 'high' | 'medium' | 'low' | 'none'

function matchesSearch(rfq: LocalRfqSummary, q: string): boolean {
  if (!q) return true
  const haystack = [rfq.emailSubject, rfq.cliente, rfq.refInterna, rfq.emailFrom].join(' ').toLowerCase()
  const normalized = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return normalized.split(/\s+/).filter(Boolean).every((term) =>
    haystack.normalize('NFD').replace(/[̀-ͯ]/g, '').includes(term)
  )
}

function matchesDate(rfq: LocalRfqSummary, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const created = new Date(rfq.createdAt).getTime()
  const now = Date.now()
  const day = 86400000
  if (filter === 'today') return now - created < day
  if (filter === 'week') return now - created < 7 * day
  if (filter === 'month') return now - created < 30 * day
  return true
}

function matchesStatus(rfq: LocalRfqSummary, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  return rfq.status === filter
}

function matchesScore(rfq: LocalRfqSummary, filter: ScoreFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'none') return rfq.qualityScore === null
  if (rfq.qualityScore === null) return false
  if (filter === 'high') return rfq.qualityScore >= 85
  if (filter === 'medium') return rfq.qualityScore >= 70 && rfq.qualityScore < 85
  if (filter === 'low') return rfq.qualityScore < 70
  return true
}

export function RfqConsole({ initialRfqs }: { initialRfqs: LocalRfqSummary[] }) {
  const [rfqs, setRfqs] = useState(initialRfqs)
  const [inputPath, setInputPath] = useState('./ejemplos/rfq-simple')
  const [provider, setProvider] = useState<'mock' | 'gemini'>('mock')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')

  const filtered = useMemo(
    () => rfqs.filter((rfq) =>
      matchesSearch(rfq, search) &&
      matchesDate(rfq, dateFilter) &&
      matchesStatus(rfq, statusFilter) &&
      matchesScore(rfq, scoreFilter)
    ),
    [rfqs, search, dateFilter, statusFilter, scoreFilter]
  )

  const groups = useMemo(() => {
    return {
      procesando: filtered.filter((rfq) => rfq.status === 'PROCESANDO' || rfq.status === 'ERROR_RECUPERABLE'),
      revisar: filtered.filter((rfq) => rfq.status === 'REVISAR' || rfq.status === 'COMPLETADO'),
      bloqueado: filtered.filter((rfq) => rfq.status === 'BLOQUEADO_CON_MOTIVO'),
    }
  }, [filtered])

  // Auto-polling: cuando hay RFQs procesando, refrescar cada 3s sin intervención del usuario
  useEffect(() => {
    const hasPending = rfqs.some((r) => r.status === 'PROCESANDO')
    if (!hasPending || busy) return
    const id = window.setInterval(() => { void fetchRfqs() }, 3000) // eslint-disable-line react-hooks/exhaustive-deps
    return () => window.clearInterval(id)
  }, [rfqs, busy]) // fetchRfqs es estable (no usa useState externo)

  async function fetchRfqs() {
    const response = await fetch('/api/local/rfqs', { cache: 'no-store' })
    const data = (await response.json()) as { rfqs: LocalRfqSummary[] }
    setRfqs(data.rfqs)
    return data.rfqs
  }

  async function refresh() {
    await fetchRfqs()
  }

  async function waitForInboxCompletion(inboxId: string, label: string) {
    const timeoutMs = 120000
    const pollMs = 2500
    const startedAt = Date.now()
    let lastMessage = ''

    while (Date.now() - startedAt < timeoutMs) {
      await sleep(pollMs)
      const latestRfqs = await fetchRfqs()
      const completed = latestRfqs.find(
        (rfq) => rfq.id.includes(inboxId) && (rfq.status === 'REVISAR' || rfq.status === 'COMPLETADO')
      )

      if (completed) {
        setLog(`Proceso terminado.\nRFQ: ${completed.refInterna}\nAbriendo detalle automaticamente...`)
        window.setTimeout(() => {
          window.location.href = `/dashboard/rfqs/${completed.id}`
        }, 700)
        return
      }

      const pending = latestRfqs.find((rfq) => rfq.id === inboxId)
      if (pending?.status === 'ERROR_RECUPERABLE') {
        setLog(`${label}\nNo se pudo terminar el proceso.\n${pending.processMessage || 'Revisa process.log en la carpeta inbox.'}`)
        return
      }

      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000)
      const providerLabel = pending?.processProvider ? ` con ${pending.processProvider}` : ''
      const currentMessage = `${label}\nProcesando${providerLabel}... ${elapsedSeconds}s\nTe aviso y abro el RFQ cuando termine.`
      if (currentMessage !== lastMessage) {
        setLog(currentMessage)
        lastMessage = currentMessage
      }
    }

    setLog(`${label}\nEl proceso sigue en marcha o esta tardando mas de lo normal.\nPulsa Refrescar en unos segundos para comprobar el estado.`)
  }

  async function processRfq() {
    setBusy(true)
    setLog('Procesando...')
    try {
      const response = await fetch('/api/local/rfqs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inputPath, provider }),
      })
      const data = (await response.json()) as { stdout?: string; stderr?: string; salidaId?: string; error?: string }
      const output = data.stdout || data.stderr || data.error || 'Proceso terminado'
      setLog(data.salidaId ? `${output}\n\nProceso terminado. Abriendo RFQ automaticamente...` : output)
      await refresh()
      if (data.salidaId) {
        window.setTimeout(() => {
          window.location.href = `/dashboard/rfqs/${data.salidaId}`
        }, 700)
      }
    } finally {
      setBusy(false)
    }
  }

  async function retryInbox(id: string, providerName: 'mock' | 'gemini') {
    setBusy(true)
    setLog(`Reprocesando ${id} con ${providerName}...`)
    try {
      const response = await fetch(`/api/local/inbox/${encodeURIComponent(id)}/process`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: providerName }),
      })
      const data = (await response.json()) as { processPid?: number; error?: string; provider?: string }
      if (!response.ok) {
        setLog(data.error || 'No se pudo reprocesar el inbox.')
        return
      }
      await waitForInboxCompletion(
        id,
        `Reproceso iniciado con ${data.provider ?? providerName}. PID: ${data.processPid ?? 'N/D'}`
      )
    } finally {
      setBusy(false)
    }
  }

  async function simulateInboundEmail() {
    setBusy(true)
    setLog('Simulando email entrante...')
    try {
      const response = await fetch('/api/local/inbound-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const data = (await response.json()) as { inboxId?: string; processPid?: number; error?: string }
      if (!response.ok) {
        setLog(data.error || 'Error simulando email entrante')
        return
      }
      if (!data.inboxId) {
        setLog('Email simulado creado, pero no se recibio el ID de inbox para seguir el proceso.')
        await refresh()
        return
      }
      await waitForInboxCompletion(
        data.inboxId,
        `Email simulado creado en inbox: ${data.inboxId}\nProceso piloto iniciado PID: ${data.processPid ?? 'N/D'}`
      )
    } finally {
      setBusy(false)
    }
  }

  async function cleanScreen() {
    const confirmed = window.confirm('Esto solo oculta los RFQs actuales de la pantalla. No borra salidas, inbox ni PDFs. Los nuevos emails volveran a aparecer.')
    if (!confirmed) return
    setBusy(true)
    setLog('Limpiando pantalla...')
    try {
      const response = await fetch('/api/local/rfqs/visibility', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'hide_current' }),
      })
      const data = (await response.json()) as { hiddenCount?: number; error?: string }
      if (!response.ok) {
        setLog(data.error || 'No se pudo limpiar la pantalla.')
        return
      }
      setLog(`Pantalla limpiada: ${data.hiddenCount ?? 0} RFQs ocultados. Los datos siguen guardados en rfq-agent-piloto/.`)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function restoreScreen() {
    setBusy(true)
    setLog('Restaurando RFQs ocultos...')
    try {
      const response = await fetch('/api/local/rfqs/visibility', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'restore_all' }),
      })
      const data = (await response.json()) as { visibleCount?: number; error?: string }
      if (!response.ok) {
        setLog(data.error || 'No se pudo restaurar la pantalla.')
        return
      }
      await refresh()
      setLog(`RFQs restaurados. Visibles ahora: ${data.visibleCount ?? 'N/D'}.`)
    } finally {
      setBusy(false)
    }
  }

  async function archiveOld() {
    const confirmed = window.confirm('Ocultara RFQs con mas de 90 dias. Los datos siguen guardados en disco. Continuar?')
    if (!confirmed) return
    setBusy(true)
    setLog('Archivando RFQs antiguos...')
    try {
      const response = await fetch('/api/local/rfqs/visibility', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'archive_old', older_than_days: 90 }),
      })
      const data = (await response.json()) as { archivedCount?: number; error?: string }
      if (!response.ok) {
        setLog(data.error || 'No se pudo archivar.')
        return
      }
      await refresh()
      setLog(`Archivados ${data.archivedCount ?? 0} RFQs con mas de 90 dias.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <section className="surface-card rounded-lg p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_180px] xl:items-end">
          <div>
            <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Procesar RFQ local</h2>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Carpeta dentro de rfq-agent-piloto
            </label>
            <input
              className="mono mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
              value={inputPath}
              onChange={(event) => setInputPath(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Proveedor IA
            </label>
            <select
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
              value={provider}
              onChange={(event) => setProvider(event.target.value as 'mock' | 'gemini')}
            >
              <option value="mock">mock — €0</option>
              <option value="gemini">Gemini (real)</option>
            </select>
          </div>
          <button disabled={busy} onClick={processRfq} className="btn-primary rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50">
            {busy ? 'Procesando…' : 'Procesar'}
          </button>
          <button disabled={busy} onClick={simulateInboundEmail} className="btn-secondary rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50">
            Simular email
          </button>
          <button disabled={busy} onClick={refresh} className="btn-secondary rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50">
            Refrescar
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={busy || rfqs.length === 0} onClick={cleanScreen} className="btn-secondary rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50">
            Limpiar pantalla
          </button>
          <button disabled={busy} onClick={restoreScreen} className="btn-secondary rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50">
            Restaurar ocultos
          </button>
          <button disabled={busy} onClick={archiveOld} className="btn-secondary rounded-md px-3 py-2 text-xs font-bold disabled:opacity-50">
            Archivar &gt;90 dias
          </button>
          <span className="self-center text-xs text-steel">Oculta la vista actual sin borrar archivos ni resultados.</span>
        </div>
        {log && <pre className="code-block mt-4 max-h-72">{log}</pre>}
      </section>

      <section className="surface-card rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda texto */}
          <div className="relative min-w-48 flex-1">
            <input
              type="search"
              placeholder="Buscar por cliente, asunto, referencia…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
            />
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtro fecha */}
          <div className="flex gap-1">
            {(['all', 'today', 'week', 'month'] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${dateFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              >
                {f === 'all' ? 'Todo' : f === 'today' ? 'Hoy' : f === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          {/* Filtro estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border px-2 py-1.5 text-xs font-bold"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)', color: 'var(--ink)' }}
          >
            <option value="all">Todos los estados</option>
            <option value="PROCESANDO">Procesando</option>
            <option value="REVISAR">Revisar</option>
            <option value="COMPLETADO">Completado</option>
            <option value="ERROR_RECUPERABLE">Error</option>
            <option value="BLOQUEADO_CON_MOTIVO">Bloqueado</option>
          </select>

          {/* Filtro score calidad */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
            className="rounded-md border px-2 py-1.5 text-xs font-bold"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)', color: 'var(--ink)' }}
          >
            <option value="all">Cualquier score</option>
            <option value="high">≥85 (Borrador)</option>
            <option value="medium">70–84 (Aclarar)</option>
            <option value="low">&lt;70 (Revisar)</option>
            <option value="none">Sin quality gate</option>
          </select>

          {/* Contador y limpiar */}
          {(search || dateFilter !== 'all' || statusFilter !== 'all' || scoreFilter !== 'all') && (
            <span className="text-xs text-steel">
              {filtered.length} de {rfqs.length} RFQs
              <button
                onClick={() => { setSearch(''); setDateFilter('all'); setStatusFilter('all'); setScoreFilter('all') }}
                className="ml-2 underline hover:text-ink"
              >
                Limpiar filtros
              </button>
            </span>
          )}
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
        <KanbanColumn title="Recibidos / procesando" items={groups.procesando} onRetry={retryInbox} disabled={busy} />
        <KanbanColumn title="Revisar / completados" items={groups.revisar} />
        <KanbanColumn title="Bloqueados" items={groups.bloqueado} onRetry={retryInbox} disabled={busy} />
      </section>
    </div>
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function KanbanColumn({
  title,
  items,
  onRetry,
  disabled = false,
}: {
  title: string
  items: LocalRfqSummary[]
  onRetry?: (id: string, provider: 'mock' | 'gemini') => void
  disabled?: boolean
}) {
  return (
    <div className="surface-card min-w-0 rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="min-w-0 break-words text-sm font-bold" style={{ color: '#0f172a' }}>{title}</h2>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: '#f1f5f9', color: '#64748b' }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Sin RFQs" body="Procesa un ejemplo o coloca salidas generadas para verlas aqui." />
      ) : (
        <div className="grid gap-3">
          {items.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} onRetry={onRetry} disabled={disabled} />
          ))}
        </div>
      )}
    </div>
  )
}

function RfqCard({
  rfq,
  onRetry,
  disabled = false,
}: {
  rfq: LocalRfqSummary
  onRetry?: (id: string, provider: 'mock' | 'gemini') => void
  disabled?: boolean
}) {
  const title = rfq.emailSubject || rfq.refInterna
  const hasEmailIdentity = Boolean(rfq.emailSubject || rfq.emailFrom || rfq.receivedAtLabel)
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words font-black">{title}</div>
          <div className="mt-1 break-words text-sm text-steel">{rfq.cliente}</div>
        </div>
        <span className="shrink-0">
          <StatusBadge status={rfq.status} />
        </span>
      </div>
      {hasEmailIdentity && (
        <div className="mt-3 grid gap-1.5 rounded-md border border-[#ded6ca] bg-[#fffdf8] p-2.5 text-xs leading-5">
          {rfq.emailSubject && <IdentityLine label="Asunto" value={rfq.emailSubject} />}
          {rfq.emailFrom && <IdentityLine label="De" value={rfq.emailFrom} />}
          {rfq.receivedAtLabel && <IdentityLine label="Recibido" value={rfq.receivedAtLabel} />}
        </div>
      )}
      <div className="mt-3 flex justify-between gap-3 text-xs text-steel">
        <span>{rfq.complejidad}</span>
        <span className="whitespace-nowrap">{rfq.total ? formatMoney(rfq.total) : 'Sin total'}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {rfq.qualityScore === null ? (
          <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: '#f1f5f9', color: '#94a3b8' }}>Sin Quality Gate</span>
        ) : (
          <>
            <span className={`rounded-md px-2.5 py-1 text-xs font-black ${scoreClass(rfq.qualityScore)}`}>{rfq.qualityScore}/100</span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-black ${verdictClass(rfq.qualityVerdict)}`}>{displayVerdict(rfq.qualityVerdict)}</span>
            {rfq.qualityIssueCount > 0 && (
              <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: '#fffbeb', color: '#92400e' }}>{rfq.qualityIssueCount} aclarac.</span>
            )}
          </>
        )}
      </div>
      {rfq.status === 'PROCESANDO' && (
        <p className="mt-2 text-xs leading-5 text-steel">
          {rfq.processMessage || 'El email ya entro. Pulsa refrescar en unos segundos para ver la salida final.'}
        </p>
      )}
      {rfq.status === 'ERROR_RECUPERABLE' && (
        <>
          <p className="mt-2 text-xs leading-5 text-danger">{rfq.processMessage || 'El proceso no termino correctamente. Revisa el log del inbox.'}</p>
          {rfq.processProvider && <p className="mt-1 text-xs leading-5 text-steel">Ultimo proveedor: {rfq.processProvider}</p>}
        </>
      )}
      {(rfq.status === 'ERROR_RECUPERABLE' || rfq.status === 'PROCESANDO') && onRetry && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRetry(rfq.id, 'mock')}
            className="btn-secondary rounded-md px-2 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Reintentar mock
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRetry(rfq.id, 'gemini')}
            className="btn-secondary rounded-md px-2 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Reintentar Gemini
          </button>
        </div>
      )}
    </>
  )

  const cardCls =
    'min-w-0 rounded-md border p-3 transition-all duration-150'
  const cardStyle = { borderColor: 'var(--border)', background: 'var(--surface)' }

  if (rfq.status === 'PROCESANDO' || rfq.status === 'ERROR_RECUPERABLE') {
    return <div className={cardCls} style={cardStyle}>{content}</div>
  }

  return (
    <Link
      href={`/dashboard/rfqs/${rfq.id}`}
      className={`${cardCls} hover:-translate-y-0.5 hover:border-workshop hover:shadow-sm`}
      style={cardStyle}
    >
      {content}
    </Link>
  )
}

function IdentityLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
      <span className="font-black uppercase tracking-[0.08em] text-steel">{label}</span>
      <span className="break-words font-semibold text-ink">{value}</span>
    </div>
  )
}

function displayVerdict(verdict: string | null): string {
  if (verdict === 'BORRADOR_INTERNO') return 'Borrador'
  if (verdict === 'ACLARACIONES_NECESARIAS') return 'Aclarar'
  if (verdict === 'NO_PROCESABLE') return 'No procesable'
  return 'Sin veredicto'
}

function verdictClass(verdict: string | null): string {
  if (verdict === 'BORRADOR_INTERNO') return 'bg-[#dff0e8] text-ok'
  if (verdict === 'NO_PROCESABLE') return 'bg-[#f7dfd8] text-danger'
  return 'bg-[#f8e7d8] text-[#8a4a20]'
}

function scoreClass(score: number): string {
  if (score >= 85) return 'bg-[#dff0e8] text-ok'
  if (score < 35) return 'bg-[#f7dfd8] text-danger'
  return 'bg-[#f8e7d8] text-[#8a4a20]'
}
