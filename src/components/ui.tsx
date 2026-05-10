import Link from 'next/link'

export function PageHeader(props: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-workshop">{props.eyebrow}</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">{props.title}</h1>
      </div>
      {props.children}
    </header>
  )
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface-card rounded-lg p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</div>
      <div className="mt-2 text-3xl font-black text-ink">{value}</div>
      <div className="mt-1 text-sm text-steel">{hint}</div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'BLOQUEADO_CON_MOTIVO'
      ? 'border-danger/25 bg-[#f7dfd8] text-danger'
      : status === 'COMPLETADO'
        ? 'border-ok/25 bg-[#dff0e8] text-ok'
        : status === 'PROCESANDO'
          ? 'border-[#7aa5c8]/30 bg-[#e4eef6] text-[#245b82]'
          : status === 'ERROR_RECUPERABLE'
            ? 'border-danger/25 bg-[#f7dfd8] text-danger'
            : 'border-workshop/25 bg-[#f8e7d8] text-[#8a4a20]'
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${cls}`}>
      {status === 'PROCESANDO' && (
        <span className="badge-dot-processing h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4a90c4]" />
      )}
      {displayStatus(status)}
    </span>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-card rounded-lg p-8 text-center">
      <div className="text-lg font-bold text-ink">{title}</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-steel">{body}</p>
    </div>
  )
}

export function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="btn-secondary inline-flex rounded-md px-3 py-2 text-sm font-bold" href={href} target="_blank">
      {children}
    </Link>
  )
}

export function formatMoney(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

function displayStatus(status: string): string {
  if (status === 'BLOQUEADO_CON_MOTIVO') return 'Bloqueado'
  if (status === 'ERROR_RECUPERABLE') return 'Error recuperable'
  if (status === 'COMPLETADO') return 'Completado'
  if (status === 'REVISAR') return 'Revisar'
  if (status === 'PROCESANDO') return 'Procesando'
  return status
}
