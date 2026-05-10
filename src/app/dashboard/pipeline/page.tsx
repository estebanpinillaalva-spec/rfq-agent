import { readPipeline } from '@/lib/local-store'
import { PageHeader, MetricCard, formatMoney } from '@/components/ui'
import { PipelineTable } from './pipeline-table'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const pipeline = await readPipeline()
  const rows = pipeline.rows
  const hoy = new Date().toISOString().slice(0, 10)

  const activos = rows.filter((r) => !/descart/i.test(r.estado ?? ''))
  const totalValor = activos.reduce((s, r) => s + (parseFloat(r.ticket_estimado ?? '0') || 0), 0)
  const vencidos = activos.filter((r) => r.fecha_proxima_accion && r.fecha_proxima_accion < hoy).length
  const probabilidades = activos.map((r) => parseFloat(r.probabilidad_cierre ?? '0') || 0).filter((p) => p > 0)
  const mediaProb = probabilidades.length > 0 ? Math.round(probabilidades.reduce((s, p) => s + p, 0) / probabilidades.length) : 0

  return (
    <div>
      <PageHeader eyebrow="Ventas" title="Pipeline comercial" />

      <section className="mt-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Prospectos activos"
          value={String(activos.length)}
          hint={`${rows.length} en total`}
        />
        <MetricCard
          label="Valor estimado"
          value={totalValor > 0 ? formatMoney(totalValor) : '—'}
          hint="Suma tickets estimados"
        />
        <MetricCard
          label="Acciones vencidas"
          value={String(vencidos)}
          hint={vencidos > 0 ? 'Requieren atención' : 'Todo al día'}
        />
        <MetricCard
          label="Prob. media cierre"
          value={mediaProb > 0 ? `${mediaProb}%` : '—'}
          hint="Prospectos activos"
        />
      </section>

      <div className="mt-5">
        <PipelineTable initialHeaders={pipeline.headers} initialRows={pipeline.rows} hoy={hoy} />
      </div>
    </div>
  )
}
