'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { DocLink, formatMoney } from '@/components/ui'
import type {
  CompletenessCheck,
  LocalBudgetLine,
  LocalPlano,
  LocalQualityGroup,
  LocalQualityIssue,
  LocalQualityReport,
  PlanoExtractionSummary,
} from '@/lib/local-store'
import { SendTestButton } from './send-test-button'

type TabKey = 'resumen' | 'plano' | 'piezas' | 'calidad' | 'presupuesto' | 'email'

interface RfqDetailTabsProps {
  id: string
  hasPdf: boolean
  hasEmail: boolean
  emailFrom: string
  planos: LocalPlano[]
  extracciones: PlanoExtractionSummary[]
  completitud: CompletenessCheck[]
  quality: LocalQualityReport | null
  presupuestoLineas: LocalBudgetLine[]
  presupuestoMd: string
  checklistMd: string
  emailMd: string
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'plano', label: 'Plano' },
  { key: 'piezas', label: 'Piezas' },
  { key: 'calidad', label: 'Calidad' },
  { key: 'presupuesto', label: 'Presupuesto' },
  { key: 'email', label: 'Email' },
]

export function RfqDetailTabs(props: RfqDetailTabsProps) {
  const [active, setActive] = useState<TabKey>('resumen')
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(0)
  const selectedSummary = props.extracciones[selectedPieceIndex] ?? props.extracciones[0] ?? null
  const selectedPlano = useMemo(() => {
    if (!selectedSummary || selectedSummary.archivoOrigen === 'No especificado') return props.planos[0] ?? null
    return props.planos.find((plano) => plano.name === selectedSummary.archivoOrigen) ?? props.planos[0] ?? null
  }, [props.planos, selectedSummary])
  const hasEstimatedTimes = props.presupuestoLineas.some(
    (linea) => linea.desglose?.fuente_tiempo === 'estimacion_modelo'
  )

  return (
    <section className="mt-5">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`rounded-md px-3 py-2 text-sm font-bold ${active === tab.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'resumen' && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            <QualityHero quality={props.quality} piezas={props.extracciones.length} hasPdf={props.hasPdf} hasEmail={props.hasEmail} />
            <CoreFieldsPanel summary={selectedSummary} />
            <TopIssuesPanel quality={props.quality} />
            <IssueGroupGrid groups={props.quality?.grupos ?? []} compact />
          </div>
          <aside className="grid content-start gap-5">
            <CompletenessPanel checks={props.completitud} compact />
            <SafeActions id={props.id} disabled={!props.hasPdf || !props.hasEmail} emailFrom={props.emailFrom} />
          </aside>
        </div>
      )}

      {active === 'plano' && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="surface-card self-start rounded-lg p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black">Plano recibido</h2>
              <AttachmentLinks id={props.id} planos={props.planos} />
            </div>
            <PlanoViewer plano={selectedPlano} page={selectedSummary?.paginaPdf ?? null} />
          </div>
          <aside className="grid content-start gap-5">
            <PieceSelector summaries={props.extracciones} selectedIndex={selectedSummary?.index ?? 0} onSelect={setSelectedPieceIndex} />
            <PieceQuickCard summary={selectedSummary} />
          </aside>
        </div>
      )}

      {active === 'piezas' && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <PieceSelector summaries={props.extracciones} selectedIndex={selectedSummary?.index ?? 0} onSelect={setSelectedPieceIndex} />
          <ExtractionPanel summary={selectedSummary} totalPieces={props.extracciones.length} />
        </div>
      )}

      {active === 'calidad' && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <QualityPanel quality={props.quality} />
          <aside className="grid content-start gap-5">
            <CompletenessPanel checks={props.completitud} />
            <div className="surface-card rounded-lg p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <DocLink href={`/api/local/rfqs/${props.id}/file?name=quality-report.md`}>Quality MD</DocLink>
                <DocLink href={`/api/local/rfqs/${props.id}/file?name=quality-report.json`}>Quality JSON</DocLink>
                <DocLink href={`/api/local/rfqs/${props.id}/file?name=revision-checklist.md`}>Checklist</DocLink>
              </div>
              <h2 className="text-lg font-black">Checklist humano</h2>
              <pre className="mt-3 max-h-[380px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-steel">
                {props.checklistMd || 'Sin checklist.'}
              </pre>
            </div>
          </aside>
        </div>
      )}

      {active === 'presupuesto' && (
        <div className="mt-5 grid gap-5">
          {hasEstimatedTimes && (
            <div className="rounded-md border border-workshop/25 bg-[#f8e7d8] p-4 text-sm font-semibold leading-6 text-[#8a4a20]">
              Los tiempos de operación son estimación del modelo, sin validar contra la tabla del taller
            </div>
          )}
          <EditableBudgetPanel id={props.id} lineas={props.presupuestoLineas} />
          <div className="surface-card rounded-lg p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {props.hasPdf && <DocLink href={`/api/local/rfqs/${props.id}/file?name=presupuesto.pdf`}>Abrir PDF</DocLink>}
              <DocLink href={`/api/local/rfqs/${props.id}/file?name=analisis.json`}>Analisis JSON</DocLink>
              <DocLink href={`/api/local/rfqs/${props.id}/file?name=presupuesto.md`}>Presupuesto MD</DocLink>
            </div>
            <h2 className="text-lg font-black">Desglose de coste</h2>
            <BudgetBreakdownPanel lineas={props.presupuestoLineas} />
            <pre className="mt-3 max-h-[640px] overflow-auto rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-ink">
              {props.presupuestoMd || 'No hay presupuesto Markdown.'}
            </pre>
          </div>
        </div>
      )}

      {active === 'email' && (
        <div className="mt-5 grid gap-5">
          <ApprovalPanel id={props.id} hasEmail={props.hasEmail} />
          <div className="surface-card rounded-lg p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <DocLink href={`/api/local/rfqs/${props.id}/file?name=email-respuesta.md`}>Abrir email MD</DocLink>
              {props.hasEmail && <DocLink href={`/api/local/rfqs/${props.id}/file?name=email-respuesta.html`}>Abrir email HTML</DocLink>}
            </div>
            <h2 className="text-lg font-black">Email generado para revision</h2>
            <pre className="mt-3 max-h-[640px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-steel">
              {props.emailMd || 'Sin email.'}
            </pre>
          </div>
        </div>
      )}
    </section>
  )
}

function CoreFieldsPanel({ summary }: { summary: PlanoExtractionSummary | null }) {
  if (!summary) {
    return (
      <section className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black text-ink">Campos núcleo</h2>
        <p className="mt-2 text-sm leading-6 text-steel">Sin extracción estructurada para evaluar los campos.</p>
      </section>
    )
  }

  const cantidad = summary.cantidad === null ? 'No especificado' : String(summary.cantidad)

  return (
    <section className="surface-card rounded-lg p-5">
      <div>
        <h2 className="text-lg font-black text-ink">Campos núcleo</h2>
        <p className="mt-1 text-sm leading-6 text-steel">Procedencia de los datos usados para revisar {summary.pieza}.</p>
      </div>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        <FieldConEstado
          label="Número de plano"
          valor={summary.numeroPlano}
          fuente={null}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['numero_plano', 'numero de plano', 'referencia', 'plano']}
        />
        <FieldConEstado
          label="Material"
          valor={summary.material}
          fuente={summary.materialFuente}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['material']}
        />
        <FieldConEstado
          label="Cantidad"
          valor={cantidad}
          fuente={summary.cantidadFuente}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['cantidad', 'unidades']}
        />
        <FieldConEstado
          label="Dimensiones"
          valor={summary.dimensiones}
          fuente={summary.dimensionesFuente}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['dimensiones', 'medidas', 'cotas']}
        />
        <FieldConEstado
          label="Tolerancia general"
          valor={summary.toleranciasGenerales}
          fuente={summary.toleranciasFuente}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['tolerancia_general', 'tolerancias generales', 'tolerancia']}
        />
        <FieldConEstado
          label="Acabado"
          valor={summary.acabado}
          fuente={summary.acabadoFuente}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['acabado', 'tratamiento', 'recubrimiento']}
        />
        <FieldConEstado
          label="Plazo"
          valor={summary.plazo}
          fuente={null}
          camposNoEncontrados={summary.camposNoEncontrados}
          alias={['plazo_dias', 'plazo', 'entrega']}
        />
      </dl>
    </section>
  )
}

function EditableBudgetPanel({ id, lineas }: { id: string; lineas: LocalBudgetLine[] }) {
  const router = useRouter()
  const [prices, setPrices] = useState<Record<number, string>>(() =>
    Object.fromEntries(lineas.map((l, i) => [i, String(l.pvp_unitario)]))
  )
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'warn' | 'error'>('idle')
  const [saveMsg, setSaveMsg] = useState('')

  const IVA = 0.21
  const liveLineas = lineas.map((l, i) => {
    const pvp = parseFloat(prices[i] ?? String(l.pvp_unitario)) || 0
    const subtotal = Math.round(pvp * (l.cantidad || 1) * 100) / 100
    return { ...l, pvp_unitario: pvp, subtotal }
  })
  const subtotal = Math.round(liveLineas.reduce((s, l) => s + l.subtotal, 0) * 100) / 100
  const iva = Math.round(subtotal * IVA * 100) / 100
  const total = Math.round(subtotal * (1 + IVA) * 100) / 100

  const hasChanges = lineas.some((l, i) => {
    const edited = parseFloat(prices[i] ?? '') || 0
    return Math.abs(edited - l.pvp_unitario) > 0.001
  }) || observaciones.trim().length > 0

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const editedLineas = lineas
        .map((l, i) => ({ index: i, pvp_unitario: parseFloat(prices[i] ?? String(l.pvp_unitario)) || l.pvp_unitario }))
        .filter((e, i) => Math.abs(e.pvp_unitario - lineas[i].pvp_unitario) > 0.001)
      const body: { lineas?: { index: number; pvp_unitario: number }[]; observaciones?: string } = {}
      if (editedLineas.length > 0) body.lineas = editedLineas
      if (observaciones.trim()) body.observaciones = observaciones.trim()
      const res = await fetch(`/api/local/rfqs/${id}/presupuesto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { ok?: boolean; total?: number; error?: string; regenError?: string }
      if (!res.ok && data.regenError) {
        setSaveStatus('warn')
        setSaveMsg(`Cambios guardados pero PDF NO regenerado. Reprocesa el RFQ. Detalle: ${data.regenError}`)
      } else if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Error al guardar')
      } else {
        setSaveStatus('ok')
        setSaveMsg(`Guardado y PDF regenerado. Total: ${formatMoney(data.total ?? total)}`)
      }
      setObservaciones('')
      router.refresh()
    } catch (err) {
      setSaveStatus('error')
      setSaveMsg(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (lineas.length === 0) {
    return (
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Editar precios</h2>
        <p className="mt-3 text-sm leading-6 text-steel">Sin lineas de presupuesto. Reprocesa el RFQ para generar desglose.</p>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Editar precios unitarios</h2>
          <p className="mt-1 text-sm leading-6 text-steel">Ajusta los precios antes de generar el PDF final. Los totales se recalculan en tiempo real.</p>
        </div>
        {saveStatus === 'ok' && <span className="rounded-md bg-[#dff0e8] px-3 py-1.5 text-xs font-black text-ok">{saveMsg}</span>}
        {saveStatus === 'warn' && <span className="rounded-md bg-[#f8e7d8] px-3 py-1.5 text-xs font-black text-[#8a4a20]">{saveMsg}</span>}
        {saveStatus === 'error' && <span className="rounded-md bg-[#f7dfd8] px-3 py-1.5 text-xs font-black text-danger">{saveMsg}</span>}
      </div>

      <div className="mt-4 grid gap-3">
        {liveLineas.map((linea, i) => (
          <div key={linea.denominacion} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words font-black text-ink">{linea.denominacion}</div>
                <div className="mt-1 text-xs text-steel">{linea.cantidad} uds | {linea.operaciones}</div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.1em] text-steel">Precio unitario (EUR)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={prices[i] ?? ''}
                    onChange={(e) => setPrices((prev) => ({ ...prev, [i]: e.target.value }))}
                    className="mt-1 w-32 rounded-md border border-[var(--border-strong)] bg-white px-3 py-1.5 text-sm font-black text-ink focus:border-workshop focus:outline-none"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-[0.1em] text-steel">Subtotal</div>
                  <div className="mt-1 text-lg font-black text-ink">{formatMoney(linea.subtotal)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-steel">Subtotal</div>
            <div className="mt-1 text-xl font-black text-ink">{formatMoney(subtotal)}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-steel">IVA (21%)</div>
            <div className="mt-1 text-xl font-black text-ink">{formatMoney(iva)}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-steel">Total</div>
            <div className="mt-1 text-2xl font-black text-workshop">{formatMoney(total)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-bold uppercase tracking-[0.1em] text-steel">Observaciones tecnicas (opcional)</label>
        <textarea
          rows={3}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Notas adicionales para el presupuesto..."
          className="mt-1 w-full rounded-md border border-[var(--border-strong)] bg-white px-3 py-2 text-sm leading-6 text-ink focus:border-workshop focus:outline-none"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          disabled={saving || !hasChanges}
          onClick={handleSave}
          className="btn-primary rounded-md px-5 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {hasChanges && (
          <button
            onClick={() => {
              setPrices(Object.fromEntries(lineas.map((l, i) => [i, String(l.pvp_unitario)])))
              setObservaciones('')
              setSaveStatus('idle')
            }}
            className="btn-secondary rounded-md px-5 py-2.5 text-sm font-bold"
          >
            Descartar
          </button>
        )}
      </div>
    </div>
  )
}

function BudgetBreakdownPanel({ lineas }: { lineas: LocalBudgetLine[] }) {
  if (lineas.length === 0) {
    return <p className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm leading-6 text-steel">Sin desglose estructurado de costes. Reprocesa el RFQ para usar el motor local de materiales.</p>
  }

  return (
    <div className="mt-4 grid gap-3">
      {lineas.map((linea) => {
        const desglose = linea.desglose
        return (
          <div key={linea.denominacion} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-black text-ink">{linea.denominacion}</h3>
                <p className="mt-1 text-xs leading-5 text-steel">{linea.cantidad} uds | {linea.plazo_dias} dias | {linea.operaciones}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-ink">{formatMoney(linea.subtotal)}</div>
                <div className="text-xs text-steel">{formatMoney(linea.pvp_unitario)} / ud</div>
              </div>
            </div>
            {desglose ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile label="Material" value={desglose.material_normalizado} />
                  <MetricTile label="Peso unit." value={desglose.peso_estimado_kg === null ? 'N/D' : `${desglose.peso_estimado_kg} kg`} />
                  <MetricTile label="Precio material" value={desglose.precio_material_eur_kg === null ? 'N/D' : `${desglose.precio_material_eur_kg.toFixed(2)} EUR/kg`} />
                  <MetricTile label="Estado" value={displayMaterialStatus(desglose.estado_material)} />
                </div>
                <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                  <CostLine label="Material unitario" value={desglose.coste_material} />
                  <CostLine label="Operaciones" value={desglose.coste_operaciones} />
                  <CostLine label="Setup prorrateado" value={desglose.coste_setup} />
                  <CostLine label="Subcontratas" value={desglose.coste_subcontratas} />
                  <CostLine label="Overhead" value={desglose.overhead} />
                  <CostLine label="Margen + riesgo" value={(desglose.margen + (desglose.riesgo_pct ?? 0)) * 100} suffix="%" />
                </div>
                <TokenList title="Avisos material" values={desglose.avisos_material} tone="warning" limit={4} />
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-steel">Esta linea no tiene desglose de coste estructurado.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function QualityHero({ quality, piezas, hasPdf, hasEmail }: { quality: LocalQualityReport | null; piezas: number; hasPdf: boolean; hasEmail: boolean }) {
  const score = quality?.score_global ?? null
  const veredicto = quality?.veredicto ?? 'SIN_QUALITY_GATE'
  const summary =
    quality?.resumen_ejecutivo || 'Este RFQ todavia no tiene Quality Gate. Reprocesa el caso para generar score, veredicto y grupos de incidencias.'

  return (
    <div className="surface-card overflow-hidden rounded-lg">
      <div className="grid gap-5 p-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-5 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Quality Gate</div>
          <div className="mt-3 text-5xl font-black text-ink">{score === null ? '--' : score}</div>
          <div className="mt-1 text-sm font-bold text-steel">sobre 100</div>
          <div className="mt-4">
            <QualityBadge verdict={veredicto} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${piezas} pieza(s)`} />
            <StatusPill label={hasPdf ? 'PDF generado' : 'Sin PDF'} tone={hasPdf ? 'ok' : 'warn'} />
            <StatusPill label={hasEmail ? 'Email borrador' : 'Sin email'} tone={hasEmail ? 'ok' : 'warn'} />
            <StatusPill label="Revision humana obligatoria" tone="warn" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-ink">Resumen ejecutivo del RFQ</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-steel">{summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Aclaraciones" value={String(quality?.grupos.reduce((sum, group) => sum + group.total, 0) ?? 0)} />
            <MetricTile label="Revision final" value={quality?.listo_para_envio_cliente ? 'Lista' : 'Pendiente'} />
            <MetricTile label="Estado envio" value="Solo borrador" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CostLine({ label, value, suffix = ' EUR' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</div>
      <div className="mt-1 font-black text-ink">{suffix === '%' ? `${value.toFixed(0)}%` : `${value.toFixed(2)}${suffix}`}</div>
    </div>
  )
}

function displayMaterialStatus(status: string): string {
  if (status === 'calculado') return 'Calculado'
  if (status === 'orientativo') return 'Orientativo'
  return 'Requiere revision'
}

function TopIssuesPanel({ quality }: { quality: LocalQualityReport | null }) {
  const issues = quality?.top_issues ?? []
  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Prioridad de revision</h2>
          <p className="mt-1 text-sm leading-6 text-steel">Los puntos mas importantes aparecen aqui; el resto queda agrupado en Calidad.</p>
        </div>
        <span className="rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-black text-steel">{issues.length}</span>
      </div>
      {issues.length === 0 ? (
        <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-steel">
          Sin incidencias prioritarias registradas por el Quality Gate.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {issues.slice(0, 5).map((issue, index) => (
            <IssueCard key={`${issue.campo}-${index}`} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

function IssueGroupGrid({ groups, compact = false }: { groups: LocalQualityGroup[]; compact?: boolean }) {
  if (groups.length === 0) {
    return (
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Riesgos agrupados</h2>
        <p className="mt-3 text-sm leading-6 text-steel">Sin grupos de incidencias. Reprocesa con Quality Gate si esta salida es antigua.</p>
      </div>
    )
  }

  const visibleGroups = compact ? groups.slice(0, 5) : groups
  return (
    <div className="surface-card rounded-lg p-5">
      <h2 className="text-lg font-black">Riesgos agrupados</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleGroups.map((group) => (
          <div key={group.categoria} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-black text-ink">{group.categoria}</div>
                <p className="mt-1 text-xs leading-5 text-steel">{group.resumen}</p>
              </div>
              <SeverityPill severity={group.severidad_maxima} count={group.total} />
            </div>
            {!compact && (
              <div className="mt-3 grid gap-2">
                {group.issues.slice(0, 8).map((issue, index) => (
                  <IssueLine key={`${issue.campo}-${index}`} issue={issue} />
                ))}
                {group.issues.length > 8 && <p className="text-xs font-bold text-steel">+{group.issues.length - 8} mas en el reporte completo</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function QualityPanel({ quality }: { quality: LocalQualityReport | null }) {
  if (!quality) {
    return (
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Quality Gate</h2>
        <p className="mt-2 text-sm leading-6 text-steel">Esta salida es anterior al Quality Gate. Reprocesa el RFQ para generar score y veredicto.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <QualityHero quality={quality} piezas={quality.piezas_total} hasPdf hasEmail />
      <IssueGroupGrid groups={quality.grupos} />
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Score por pieza</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {quality.piezas.map((piece) => (
            <div key={piece.pieza} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-black text-ink">{piece.pieza}</div>
                  <div className="mt-1 text-xs text-steel">{piece.issues.length} punto(s) a revisar</div>
                </div>
                <span className="shrink-0 rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-black text-ink">{piece.score}/100</span>
              </div>
              <div className="mt-3 grid gap-2">
                {piece.issues.slice(0, 4).map((issue, index) => (
                  <IssueLine key={`${issue.campo}-${index}`} issue={issue} />
                ))}
                {piece.issues.length > 4 && <p className="text-xs font-bold text-steel">+{piece.issues.length - 4} mas agrupados en el reporte.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Preguntas sugeridas al cliente</h2>
        <div className="mt-4 grid gap-2">
          {quality.preguntas_cliente.length ? (
            quality.preguntas_cliente.slice(0, 8).map((question) => (
              <p key={question} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm leading-6 text-steel">
                {question}
              </p>
            ))
          ) : (
            <p className="text-sm leading-6 text-steel">Sin preguntas sugeridas.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanoViewer({ plano, page }: { plano: LocalPlano | null; page: number | null }) {
  if (!plano) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-6 text-center text-sm leading-6 text-steel">
        No hay plano copiado para este RFQ. Reprocesa el caso con la version actual del piloto para que se guarde en salidas/input.
      </div>
    )
  }

  if (plano.kind === 'image') {
    return (
      <div className="relative h-[680px] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
        <Image src={plano.href} alt={`Plano ${plano.name}`} fill sizes="(min-width: 1280px) 65vw, 100vw" className="object-contain p-3" priority unoptimized />
      </div>
    )
  }

  if (plano.kind === 'pdf') {
    const href = page ? `${plano.href}#page=${page}` : plano.href
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-6 text-center">
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-steel">PDF recibido</p>
          <h3 className="mt-2 break-words text-xl font-black text-ink">{plano.name}</h3>
          <p className="mt-2 text-sm leading-6 text-steel">
            {page ? `Pagina asociada a la pieza seleccionada: ${page}.` : 'Sin pagina asociada a la pieza seleccionada.'}
          </p>
          <div className="mt-4">
            <DocLink href={href}>Abrir PDF</DocLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm leading-6 text-steel">
      Este archivo es CAD/texto tecnico y se abre mejor como descarga o en visor CAD externo:{' '}
      <a className="font-bold text-workshop underline" href={plano.href}>
        {plano.name}
      </a>
    </div>
  )
}

function PieceSelector({
  summaries,
  selectedIndex,
  onSelect,
}: {
  summaries: PlanoExtractionSummary[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (summaries.length === 0) return null

  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Piezas detectadas</h2>
          <p className="mt-1 text-sm leading-6 text-steel">{summaries.length} pieza(s) en este RFQ.</p>
        </div>
        <span className="rounded-md bg-[#dff0e8] px-2.5 py-1 text-xs font-black text-ok">{summaries.length}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {summaries.map((summary) => (
          <button
            key={`${summary.index}-${summary.pieza}`}
            type="button"
            onClick={() => onSelect(summary.index)}
            className={`rounded-md border p-3 text-left text-sm transition ${
              selectedIndex === summary.index
                ? 'border-workshop bg-[#fff7ed] text-ink'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-steel hover:border-workshop'
            }`}
          >
            <span className="block break-words font-black text-ink">{summary.pieza}</span>
            <span className="mt-1 block break-words text-xs leading-5">
              {summary.archivoOrigen}
              {summary.paginaPdf ? ` | pag. ${summary.paginaPdf}` : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PieceQuickCard({ summary }: { summary: PlanoExtractionSummary | null }) {
  if (!summary) {
    return (
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Ficha de pieza</h2>
        <p className="mt-2 text-sm leading-6 text-steel">No hay datos estructurados para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-lg p-5">
      <h2 className="text-lg font-black">Ficha rapida</h2>
      <div className="mt-4 grid gap-3">
        <Field label="Pieza" value={summary.pieza} />
        <Field label="Material" value={summary.material} />
        <Field label="Cantidad" value={summary.cantidad ? `${summary.cantidad} uds` : 'No detectada'} />
        <Field label="Plano/pagina" value={`${summary.numeroPlano}${summary.paginaPdf ? ` | pag. ${summary.paginaPdf}` : ''}`} />
        <Field label="Tolerancias" value={summary.toleranciasGenerales} />
        <Field label="Operaciones" value={summary.operaciones.slice(0, 4).join(', ') || 'No definidas'} />
      </div>
    </div>
  )
}

function ExtractionPanel({ summary, totalPieces }: { summary: PlanoExtractionSummary | null; totalPieces: number }) {
  if (!summary) {
    return (
      <div className="surface-card rounded-lg p-5">
        <h2 className="text-lg font-black">Datos extraidos</h2>
        <p className="mt-2 text-sm leading-6 text-steel">No hay analisis estructurado en este RFQ.</p>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Datos extraidos</h2>
          <p className="mt-1 text-sm leading-6 text-steel">
            Pieza {summary.index + 1} de {Math.max(totalPieces, 1)}
          </p>
        </div>
        <StatusPill label={summary.confidence === null ? 'Confianza N/D' : `Confianza ${Math.round(summary.confidence * 100)}%`} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricTile label="Material" value={summary.material} />
        <MetricTile label="Cantidad" value={summary.cantidad ? `${summary.cantidad} uds` : 'No detectada'} />
        <MetricTile label="Plano" value={summary.numeroPlano} />
        <MetricTile label="Pagina" value={summary.paginaPdf ? String(summary.paginaPdf) : 'No aplica'} />
        <MetricTile label="Tolerancias" value={summary.toleranciasGenerales} />
        <MetricTile label="Acabado" value={summary.acabado} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="font-black text-ink">Ruta de fabricacion</h3>
          <TokenList title="Operaciones" values={summary.operaciones} limit={8} />
          <TokenList title="Caracteristicas criticas" values={summary.caracteristicasCriticas} limit={8} />
        </section>
        <section className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h3 className="font-black text-ink">Geometria y requisitos</h3>
          <TokenList title="Tolerancias criticas" values={summary.toleranciasCriticas} limit={8} />
          <TokenList title="Roscas" values={summary.roscas} limit={8} />
          <TokenList title="Agujeros" values={summary.agujeros} limit={8} />
          <TokenList title="Rugosidades" values={summary.rugosidades} limit={8} />
        </section>
      </div>

      <details className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <summary className="cursor-pointer font-black text-ink">Evidencias y campos leidos</summary>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Field label="Archivo" value={summary.archivoOrigen} />
          <Field label="Revision" value={summary.revisionPlano} />
          <Field label="Escala" value={summary.escala} />
          <Field label="Cajetin leido" value={summary.cajetinTexto} />
          <Field label="Fuente material" value={summary.materialFuente} />
          <Field label="Fuente cantidad" value={summary.cantidadFuente} />
          <Field label="Fuente dimensiones" value={summary.dimensionesFuente} />
          <Field label="Fuente tolerancias" value={summary.toleranciasFuente} />
          <Field label="Fuente acabado" value={summary.acabadoFuente} />
          <Field label="Trazabilidad" value={summary.trazabilidadConfianza} />
        </dl>
        <TokenList title="Zonas revisadas" values={summary.zonasRevisadas} limit={10} />
        <TokenList title="Notas del plano" values={summary.notasPlano} limit={10} />
        <TokenList title="Campos no encontrados" values={summary.camposNoEncontrados} tone="warning" limit={10} />
      </details>

      <details className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <summary className="cursor-pointer font-black text-ink">Riesgos, ambiguedades y extras</summary>
        <TokenList title="Tratamientos" values={summary.tratamientos} limit={8} />
        <TokenList title="Recubrimientos" values={summary.recubrimientos} limit={8} />
        <TokenList title="Ajustes" values={summary.ajustes} limit={8} />
        <TokenList title="Chaflanes / radios" values={summary.chaflanesRadios} limit={8} />
        <TokenList title="Riesgos DFM" values={summary.riesgos} tone="warning" limit={8} />
        <TokenList title="Ambiguedades" values={summary.ambiguedades} tone="danger" limit={8} />
      </details>
    </div>
  )
}

function CompletenessPanel({ checks, compact = false }: { checks: CompletenessCheck[]; compact?: boolean }) {
  const failed = checks.filter((check) => !check.ok)
  const visible = compact ? [...failed, ...checks.filter((check) => check.ok)].slice(0, 6) : checks

  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Revision tecnica</h2>
          <p className="mt-1 text-sm leading-6 text-steel">
            {failed.length === 0 ? 'Sin faltantes criticos detectados.' : 'Borrador tecnico: necesita revisar puntos antes del envio final.'}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-black ${failed.length === 0 ? 'bg-[#dff0e8] text-ok' : 'bg-[#f7dfd8] text-danger'}`}>
          {failed.length === 0 ? 'OK' : `${failed.length} faltan`}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {visible.map((check) => (
          <div key={check.label} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${check.ok ? 'bg-ok' : 'bg-danger'}`} />
              <span className="text-sm font-black text-ink">{check.label}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-steel">{check.detail || 'Sin detalle'}</p>
          </div>
        ))}
        {compact && checks.length > visible.length && <p className="text-xs font-bold text-steel">+{checks.length - visible.length} comprobaciones en Calidad</p>}
      </div>
    </div>
  )
}

function SafeActions({ id, disabled, emailFrom }: { id: string; disabled: boolean; emailFrom: string }) {
  return (
    <div className="surface-card rounded-lg p-5">
      <h2 className="text-lg font-black">Enviar presupuesto</h2>
      <p className="mt-2 text-sm leading-6 text-steel">Envía el PDF de presupuesto por email al remitente original del RFQ.</p>
      <SendTestButton id={id} disabled={disabled} recipientEmail={emailFrom} />
    </div>
  )
}

function ApprovalPanel({ id, hasEmail }: { id: string; hasEmail: boolean }) {
  const [decision, setDecision] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function handleApprove() {
    setBusy(true)
    setLog('Enviando email de prueba...')
    try {
      const response = await fetch(`/api/local/rfqs/${id}/send-test`, { method: 'POST' })
      const data = (await response.json()) as { stdout?: string; stderr?: string; error?: string }
      const msg = data.stdout || data.stderr || data.error || (response.ok ? 'Enviado correctamente' : 'Error en envio')
      setLog(msg)
      if (response.ok) setDecision('aprobado')
    } finally {
      setBusy(false)
    }
  }

  function handleReject() {
    setDecision('rechazado')
    setShowRejectForm(false)
    setLog(`Motivo: ${rejectNote || 'Sin motivo especificado'}`)
  }

  const stateColors = {
    pendiente: { bg: '#f8e7d8', text: '#8a4a20', label: 'Pendiente de revision' },
    aprobado: { bg: '#dff0e8', text: '#1a6340', label: 'Aprobado y enviado (test)' },
    rechazado: { bg: '#f7dfd8', text: '#8b2a1a', label: 'Rechazado' },
  }
  const state = stateColors[decision]

  return (
    <div className="surface-card rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">Decision de envio</h2>
          <p className="mt-1 text-sm leading-6 text-steel">Revisa el email abajo y confirma si esta listo para enviar.</p>
        </div>
        <span className="rounded-md px-3 py-1.5 text-xs font-black" style={{ background: state.bg, color: state.text }}>
          {state.label}
        </span>
      </div>

      {decision === 'pendiente' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={busy || !hasEmail}
            onClick={handleApprove}
            className="btn-primary rounded-md px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {busy ? 'Enviando…' : 'Aprobar y enviar (test)'}
          </button>
          <button
            disabled={busy}
            onClick={() => setShowRejectForm(!showRejectForm)}
            className="btn-secondary rounded-md px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            Rechazar
          </button>
          {!hasEmail && <p className="self-center text-xs text-danger">Sin email generado. Reprocesa el RFQ primero.</p>}
        </div>
      )}

      {showRejectForm && decision === 'pendiente' && (
        <div className="mt-4 grid gap-3">
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm leading-6"
            style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
            rows={3}
            placeholder="Motivo del rechazo (opcional)…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleReject} className="btn-primary rounded-md px-4 py-2 text-sm font-bold" style={{ background: '#8b2a1a' }}>
              Confirmar rechazo
            </button>
            <button onClick={() => setShowRejectForm(false)} className="btn-secondary rounded-md px-4 py-2 text-sm font-bold">Cancelar</button>
          </div>
        </div>
      )}

      {log && (
        <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-[#1f2933] p-3 text-xs leading-5 text-[#f7f4ef]">{log}</pre>
      )}

      {decision !== 'pendiente' && (
        <button onClick={() => { setDecision('pendiente'); setLog('') }} className="mt-4 text-xs underline text-steel hover:text-ink">
          Revertir decision
        </button>
      )}
    </div>
  )
}

function AttachmentLinks({ id, planos }: { id: string; planos: LocalPlano[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {planos.map((plano) => (
        <DocLink key={plano.name} href={plano.href}>
          {plano.name}
        </DocLink>
      ))}
      <DocLink href={`/api/local/rfqs/${id}/file?name=input-metadata.json`}>Metadata</DocLink>
    </div>
  )
}

type EstadoCampo = 'LEIDO_DEL_PLANO' | 'DEDUCIDO' | 'NO_ENCONTRADO'

function estadoCampo(valor: string, fuente: string | null, camposNoEncontrados: string[], alias: string[]): EstadoCampo {
  const declarados = camposNoEncontrados.map((campo) => campo.toLowerCase())
  if (alias.some((clave) => declarados.some((campo) => campo.includes(clave)))) return 'NO_ENCONTRADO'
  if (!valor || valor === 'No especificado') return 'NO_ENCONTRADO'
  return fuente ? 'LEIDO_DEL_PLANO' : 'DEDUCIDO'
}

function FieldConEstado({
  label,
  valor,
  fuente,
  camposNoEncontrados,
  alias,
}: {
  label: string
  valor: string
  fuente: string | null
  camposNoEncontrados: string[]
  alias: string[]
}) {
  const estado = estadoCampo(valor, fuente, camposNoEncontrados, alias)
  const containerClass =
    estado === 'LEIDO_DEL_PLANO'
      ? 'border-ok/25 bg-[#eef7f2]'
      : estado === 'DEDUCIDO'
        ? 'border-dashed border-workshop/25 bg-[#f8e7d8]'
        : 'border-2 border-danger/25 bg-[#f7dfd8]'
  const badgeClass =
    estado === 'LEIDO_DEL_PLANO'
      ? 'bg-[#dff0e8] text-ok'
      : estado === 'DEDUCIDO'
        ? 'bg-white/70 text-[#8a4a20]'
        : 'rounded-full bg-white/70 text-danger'
  const estadoLabel =
    estado === 'LEIDO_DEL_PLANO'
      ? 'Leído del plano'
      : estado === 'DEDUCIDO'
        ? 'Deducido · sin fuente en el plano'
        : 'No encontrado'

  return (
    <div className={`min-w-0 rounded-md border p-4 ${containerClass}`}>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</dt>
      <dd className="mt-1 break-words font-black leading-6 text-ink">{valor}</dd>
      <span className={`mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-black ${badgeClass}`}>{estadoLabel}</span>
      {estado === 'LEIDO_DEL_PLANO' && fuente && (
        <p className="mt-2 break-words text-xs leading-5 text-steel">Fuente: {fuente}</p>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-ink">
        {value === null ? (
          <span className="inline-flex rounded-md border border-workshop/25 bg-[#f8e7d8] px-2.5 py-1 text-xs font-black text-[#8a4a20]">
            No declarada por el modelo
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</div>
      <div className="mt-1 break-words text-sm font-black leading-6 text-ink">{value}</div>
    </div>
  )
}

function TokenList({
  title,
  values,
  tone = 'normal',
  limit = 6,
}: {
  title: string
  values: string[]
  tone?: 'normal' | 'warning' | 'danger'
  limit?: number
}) {
  if (values.length === 0) return null
  const cls =
    tone === 'danger'
      ? 'border-danger/25 bg-[#f7dfd8] text-danger'
      : tone === 'warning'
        ? 'border-workshop/25 bg-[#f8e7d8] text-[#8a4a20]'
        : 'border-[var(--border)] bg-white text-ink'
  const visible = values.slice(0, limit)

  return (
    <div className="mt-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {visible.map((value, index) => (
          <span key={`${value}-${index}`} className={`max-w-full break-words rounded-md border px-2.5 py-1 text-xs font-semibold leading-5 ${cls}`}>
            {value}
          </span>
        ))}
        {values.length > visible.length && (
          <span className="rounded-md border border-[var(--border)] bg-[#f1f5f9] px-2.5 py-1 text-xs font-black text-steel">+{values.length - visible.length} mas</span>
        )}
      </div>
    </div>
  )
}

function QualityBadge({ verdict }: { verdict: string }) {
  const label = displayVerdict(verdict)
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${verdictClasses(verdict)}`}>{label}</span>
}

function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  const cls = tone === 'ok' ? 'bg-[#dff0e8] text-ok' : tone === 'warn' ? 'bg-[#f8e7d8] text-[#8a4a20]' : 'bg-[#f1f5f9] text-steel'
  return <span className={`rounded-md px-2.5 py-1 text-xs font-black ${cls}`}>{label}</span>
}

function SeverityPill({ severity, count }: { severity: string; count: number }) {
  return <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-black ${severityClasses(severity)}`}>{count}</span>
}

function IssueCard({ issue }: { issue: LocalQualityIssue }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-words font-black text-ink">{issue.campo}</div>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-steel">{issue.pieza || issue.categoria}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-black ${severityClasses(issue.severidad)}`}>{issue.severidad}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-steel">{issue.mensaje}</p>
    </div>
  )
}

function IssueLine({ issue }: { issue: LocalQualityIssue }) {
  return (
    <div className="rounded-md bg-[var(--surface-2)] p-3 text-xs leading-5 text-steel">
      <span className="font-black text-ink">{issue.campo}</span>
      {issue.pieza ? <span> | {issue.pieza}</span> : null}
      <span>: {issue.mensaje}</span>
    </div>
  )
}

function displayVerdict(verdict: string): string {
  if (verdict === 'BORRADOR_INTERNO') return 'Borrador interno'
  if (verdict === 'ACLARACIONES_NECESARIAS') return 'Necesita aclaraciones'
  if (verdict === 'NO_PROCESABLE') return 'No procesable'
  return 'Sin Quality Gate'
}

function verdictClasses(verdict: string): string {
  if (verdict === 'BORRADOR_INTERNO') return 'bg-[#dff0e8] text-ok'
  if (verdict === 'NO_PROCESABLE') return 'bg-[#f7dfd8] text-danger'
  return 'bg-[#f8e7d8] text-[#8a4a20]'
}

function severityClasses(severity: string): string {
  if (severity === 'CRITICO') return 'bg-[#f7dfd8] text-danger'
  if (severity === 'AVISO') return 'bg-[#f8e7d8] text-[#8a4a20]'
  return 'bg-[#dff0e8] text-ok'
}
