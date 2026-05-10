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

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(iso))
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
              <div key={cliente.slug} className="surface-card rounded-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)]">
                  <h2 className="truncate font-black text-ink text-base" title={cliente.empresa}>
                    {cliente.empresa}
                  </h2>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-bold text-ink">
                      {cliente.rfqCount} RFQ{cliente.rfqCount !== 1 ? 's' : ''}
                    </span>
                    {cliente.valorTotal > 0 && (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-bold text-[var(--ok)]">
                        {formatMoney(cliente.valorTotal)}
                      </span>
                    )}
                    <span className="text-[11px] text-steel ml-auto">{cliente.ultimaActividadLabel}</span>
                  </div>
                </div>

                {/* Lista de RFQs */}
                <div className="flex flex-col divide-y divide-[var(--border)]">
                  {cliente.rfqs.slice(0, 3).map((rfq) => (
                    <Link
                      key={rfq.id}
                      href={`/dashboard/rfqs/${rfq.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-ink">
                          {rfq.emailSubject || rfq.cliente || rfq.emailFrom || rfq.id}
                        </div>
                        <div className="text-[10px] text-steel mt-0.5">{formatDateShort(rfq.createdAt)}</div>
                      </div>
                      <span className="shrink-0">
                        <StatusBadge status={rfq.status} />
                      </span>
                    </Link>
                  ))}
                  {cliente.rfqs.length > 3 && (
                    <div className="px-4 py-2 text-[11px] text-steel">
                      +{cliente.rfqs.length - 3} más
                    </div>
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
