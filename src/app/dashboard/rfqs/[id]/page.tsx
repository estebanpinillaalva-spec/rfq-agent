import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRfqDetail } from '@/lib/local-store'
import { PageHeader, StatusBadge, formatMoney } from '@/components/ui'
import { RfqDetailTabs } from './rfq-detail-tabs'

export const dynamic = 'force-dynamic'

export default async function RfqDetailPage({ params }: { params: { id: string } }) {
  const rfq = await getRfqDetail(params.id)
  if (!rfq) notFound()

  return (
    <div>
      <PageHeader eyebrow="Detalle RFQ" title={rfq.refInterna}>
        <Link href="/dashboard/rfqs" className="btn-secondary rounded-md px-4 py-2 text-sm font-bold">
          Volver
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="surface-card rounded-lg p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Cliente</div>
          <div className="mt-2 font-black">{rfq.cliente}</div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Estado</div>
          <div className="mt-2">
            <StatusBadge status={rfq.status} />
          </div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Complejidad</div>
          <div className="mt-2 font-black">{rfq.complejidad}</div>
        </div>
        <div className="surface-card rounded-lg p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Total</div>
          <div className="mt-2 font-black">{formatMoney(rfq.total)}</div>
        </div>
      </section>

      {rfq.error && <div className="mt-5 rounded-lg border border-danger/25 bg-[#f7dfd8] p-4 text-sm font-semibold text-danger">{rfq.error}</div>}

      <RfqDetailTabs
        id={rfq.id}
        hasPdf={rfq.hasPdf}
        hasEmail={rfq.hasEmail}
        planos={rfq.planos}
        extracciones={rfq.extracciones}
        completitud={rfq.completitud}
        quality={rfq.quality}
        presupuestoLineas={rfq.presupuestoLineas}
        presupuestoMd={rfq.presupuestoMd}
        checklistMd={rfq.checklistMd}
        emailMd={rfq.emailMd}
      />
    </div>
  )
}
