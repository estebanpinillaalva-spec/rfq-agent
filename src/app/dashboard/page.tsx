import Link from 'next/link'
import { listRfqs, readPipeline } from '@/lib/local-store'
import { MetricCard, PageHeader, StatusBadge, formatMoney } from '@/components/ui'

export const dynamic = 'force-dynamic'

function buildWeeklyActivity(rfqs: Awaited<ReturnType<typeof listRfqs>>) {
  const days: { label: string; count: number }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('es-ES', { weekday: 'short' })
    const dateStr = d.toISOString().slice(0, 10)
    const count = rfqs.filter((rfq) => rfq.createdAt.startsWith(dateStr)).length
    days.push({ label, count })
  }
  return days
}

export default async function DashboardPage() {
  const [rfqs, pipeline] = await Promise.all([listRfqs(), readPipeline()])

  const now = Date.now()
  const day = 86400000
  const blocked = rfqs.filter((rfq) => rfq.status === 'BLOQUEADO_CON_MOTIVO').length
  const thisWeek = rfqs.filter((rfq) => now - new Date(rfq.createdAt).getTime() < 7 * day).length
  const withEmail = rfqs.filter((rfq) => rfq.hasEmail).length
  const totalValue = rfqs.reduce((sum, rfq) => sum + (rfq.total ?? 0), 0)
  const scoredRfqs = rfqs.filter((rfq) => rfq.qualityScore !== null)
  const avgScore = scoredRfqs.length > 0 ? Math.round(scoredRfqs.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / scoredRfqs.length) : null
  const activeProspects = pipeline.rows.filter((row) => !/descart/i.test(row.estado ?? '')).length
  const latest = rfqs.slice(0, 5)
  const weekActivity = buildWeeklyActivity(rfqs)
  const maxActivity = Math.max(...weekActivity.map((d) => d.count), 1)

  return (
    <div>
      <PageHeader eyebrow="Cabina de mando" title="Panel operativo">
        <Link href="/dashboard/rfqs" className="btn-primary rounded-md px-4 py-2 text-sm font-bold">
          Ver RFQs
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Esta semana" value={String(thisWeek)} hint={`${rfqs.length} total`} />
        <MetricCard label="Listos para enviar" value={String(withEmail)} hint="Con email borrador" />
        <MetricCard label="Valor total cotizado" value={totalValue > 0 ? formatMoney(totalValue) : '—'} hint="Suma presupuestos" />
        <MetricCard
          label="Quality score medio"
          value={avgScore !== null ? `${avgScore}/100` : '—'}
          hint={scoredRfqs.length > 0 ? `${scoredRfqs.length} RFQs analizados` : 'Sin datos aun'}
        />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard label="Bloqueados" value={String(blocked)} hint="Requieren accion" />
        <MetricCard label="Prospectos activos" value={String(activeProspects)} hint="Pipeline CSV" />
        <MetricCard label="Total RFQs" value={String(rfqs.length)} hint="Carpetas en salidas" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="surface-card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">RFQs recientes</h2>
            <Link className="text-sm font-bold text-workshop hover:opacity-80" href="/dashboard/rfqs">
              Abrir lista
            </Link>
          </div>
          {latest.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm text-steel">Sin RFQs todavía. Procesa un ejemplo para empezar.</p>
              <Link href="/dashboard/rfqs" className="mt-4 inline-block btn-primary rounded-md px-4 py-2 text-sm font-bold">Ir a RFQs</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-[var(--border)]">
              <table className="w-full text-left text-sm">
                <thead className="tbl-header">
                  <tr>
                    <th className="p-3">Referencia</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((rfq) => (
                    <tr key={rfq.id} className="tbl-row">
                      <td className="p-3 font-mono text-xs font-bold">
                        <Link href={`/dashboard/rfqs/${rfq.id}`} className="hover:text-workshop">
                          {rfq.refInterna}
                        </Link>
                      </td>
                      <td className="p-3 text-steel">{rfq.cliente}</td>
                      <td className="p-3">
                        <StatusBadge status={rfq.status} />
                      </td>
                      <td className="whitespace-nowrap p-3 text-right font-mono text-xs">{formatMoney(rfq.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="surface-card rounded-lg p-5">
          <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Actividad — últimos 7 días</h2>
          <div className="mt-5 flex items-end justify-between gap-1.5 h-28">
            {weekActivity.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-steel">{day.count || ''}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${Math.max((day.count / maxActivity) * 80, day.count > 0 ? 8 : 2)}px`,
                    background: day.count > 0 ? 'var(--workshop)' : 'var(--border)',
                    opacity: day.count > 0 ? 1 : 0.4,
                  }}
                />
                <span className="text-[10px] font-semibold text-steel">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-xs text-steel">
              {thisWeek === 0
                ? 'Sin actividad esta semana. Procesa un RFQ para empezar.'
                : `${thisWeek} RFQ${thisWeek !== 1 ? 's' : ''} procesado${thisWeek !== 1 ? 's' : ''} esta semana.`}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
