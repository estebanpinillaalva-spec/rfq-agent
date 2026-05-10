import Link from 'next/link'
import { listRfqs } from '@/lib/local-store'
import { PageHeader, formatMoney, StatusBadge } from '@/components/ui'

export const dynamic = 'force-dynamic'

interface ClientSummary {
  empresa: string
  slug: string
  rfqCount: number
  valorTotal: number
  ultimaActividad: string
  ultimaActividadLabel: string
  rfqs: Awaited<ReturnType<typeof listRfqs>>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(new Date(iso))
}

export default async function ClientesPage() {
  const rfqs = await listRfqs()

  const clientMap = new Map<string, ClientSummary>()

  for (const rfq of rfqs) {
    const empresa = rfq.cliente?.trim() || rfq.emailFrom || 'Sin identificar'
    const key = slugify(empresa)
    const existing = clientMap.get(key)
    if (existing) {
      existing.rfqCount += 1
      existing.valorTotal += rfq.total ?? 0
      if (rfq.createdAt > existing.ultimaActividad) {
        existing.ultimaActividad = rfq.createdAt
        existing.ultimaActividadLabel = formatDate(rfq.createdAt)
      }
      existing.rfqs.push(rfq)
    } else {
      clientMap.set(key, {
        empresa,
        slug: key,
        rfqCount: 1,
        valorTotal: rfq.total ?? 0,
        ultimaActividad: rfq.createdAt,
        ultimaActividadLabel: formatDate(rfq.createdAt),
        rfqs: [rfq],
      })
    }
  }

  const clientes = Array.from(clientMap.values()).sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad))

  return (
    <div>
      <PageHeader eyebrow="CRM" title="Clientes" />

      {clientes.length === 0 ? (
        <div className="surface-card mt-4 rounded-lg p-12 text-center">
          <p className="text-sm text-steel">Sin clientes todavía. Procesa RFQs para que aparezcan aquí.</p>
          <Link href="/dashboard/rfqs" className="mt-4 inline-block btn-primary rounded-md px-4 py-2 text-sm font-bold">
            Ir a RFQs
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-5">
          <p className="text-sm text-steel">{clientes.length} empresa{clientes.length !== 1 ? 's' : ''} con actividad registrada.</p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clientes.map((cliente) => (
              <div key={cliente.slug} className="surface-card rounded-lg p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-black text-ink">{cliente.empresa}</h2>
                    <p className="mt-1 text-xs text-steel">Última actividad: {cliente.ultimaActividadLabel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-black text-ink">{cliente.rfqCount}</div>
                    <div className="text-xs text-steel">RFQ{cliente.rfqCount !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {cliente.valorTotal > 0 && (
                  <div className="mt-3 rounded-md bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-steel">Valor total cotizado</span>
                    <div className="mt-0.5 font-black text-ink">{formatMoney(cliente.valorTotal)}</div>
                  </div>
                )}

                <div className="mt-4 grid gap-2">
                  {cliente.rfqs.slice(0, 3).map((rfq) => (
                    <Link
                      key={rfq.id}
                      href={`/dashboard/rfqs/${rfq.id}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs hover:border-workshop transition-colors"
                    >
                      <span className="min-w-0 truncate font-mono font-bold text-ink">{rfq.refInterna}</span>
                      <span className="shrink-0">
                        <StatusBadge status={rfq.status} />
                      </span>
                    </Link>
                  ))}
                  {cliente.rfqs.length > 3 && (
                    <p className="text-xs font-bold text-steel">+{cliente.rfqs.length - 3} más</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
