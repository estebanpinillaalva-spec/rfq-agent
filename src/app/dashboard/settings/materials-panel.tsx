'use client'

import { useMemo, useState } from 'react'
import type { MaterialItem, MaterialLibrary } from '@/lib/material-store'

export function MaterialsPanel({ initialLibrary }: { initialLibrary: MaterialLibrary }) {
  const [library, setLibrary] = useState(initialLibrary)
  const [selectedId, setSelectedId] = useState(initialLibrary.materiales[0]?.id ?? '')
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(initialLibrary, null, 2))
  const [message, setMessage] = useState('')
  const selected = useMemo(() => library.materiales.find((material) => material.id === selectedId) ?? library.materiales[0] ?? null, [library, selectedId])
  const staleCount = library.materiales.filter((material) => isStale(material.fecha_actualizacion, library.stale_after_days)).length
  const lowConfidenceCount = library.materiales.filter((material) => material.confianza !== 'ALTA').length

  async function save(nextLibrary = library) {
    setMessage('Guardando...')
    const response = await fetch('/api/local/materials', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(nextLibrary),
    })
    const data = (await response.json()) as { library?: MaterialLibrary; error?: string }
    if (!response.ok || !data.library) {
      setMessage(data.error || 'No se pudo guardar la biblioteca.')
      return
    }
    setLibrary(data.library)
    setJsonDraft(JSON.stringify(data.library, null, 2))
    setMessage('Biblioteca guardada.')
  }

  function updateSelected(patch: Partial<MaterialItem>) {
    if (!selected) return
    setLibrary((current) => ({
      ...current,
      materiales: current.materiales.map((material) => (material.id === selected.id ? { ...material, ...patch } : material)),
    }))
  }

  function importJson() {
    try {
      const parsed = JSON.parse(jsonDraft) as MaterialLibrary
      setLibrary(parsed)
      setSelectedId(parsed.materiales[0]?.id ?? '')
      setMessage('JSON importado en pantalla. Pulsa Guardar para persistirlo.')
    } catch {
      setMessage('JSON no valido.')
    }
  }

  return (
    <section className="surface-card mt-5 rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Materiales y precios locales</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Esta tabla manda sobre cualquier fuente online. Las referencias publicas solo sirven para comparar tendencia antes de enviar un presupuesto real.
          </p>
        </div>
        <button type="button" onClick={() => void save()} className="btn-primary rounded-md px-4 py-2 text-sm font-bold">
          Guardar materiales
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Materiales" value={String(library.materiales.length)} />
        <Metric label="Precios caducados" value={String(staleCount)} tone={staleCount ? 'warn' : 'ok'} />
        <Metric label="Revisar confianza" value={String(lowConfidenceCount)} tone={lowConfidenceCount ? 'warn' : 'ok'} />
      </div>

      {message && <p className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm font-semibold text-steel">{message}</p>}

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black">Biblioteca</h3>
            <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-black text-steel">{library.moneda}/kg</span>
          </div>
          <div className="grid max-h-[560px] gap-2 overflow-auto pr-1">
            {library.materiales.map((material) => (
              <button
                key={material.id}
                type="button"
                onClick={() => setSelectedId(material.id)}
                className={`rounded-md border p-3 text-left text-sm ${
                  selected?.id === material.id ? 'border-workshop bg-[#fff7ed]' : 'border-[var(--border)] bg-white hover:border-workshop'
                }`}
              >
                <span className="block break-words font-black text-ink">{material.nombre}</span>
                <span className="mt-1 block text-xs leading-5 text-steel">
                  {material.precio_eur_kg.toFixed(2)} EUR/kg | {material.confianza}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {selected ? (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Nombre" value={selected.nombre} onChange={(value) => updateSelected({ nombre: value })} />
                <NumberInput label="Precio EUR/kg" value={selected.precio_eur_kg} onChange={(value) => updateSelected({ precio_eur_kg: value })} />
                <NumberInput label="Densidad g/cm3" value={selected.densidad_g_cm3} onChange={(value) => updateSelected({ densidad_g_cm3: value })} />
                <NumberInput label="Desperdicio %" value={selected.desperdicio_pct * 100} onChange={(value) => updateSelected({ desperdicio_pct: value / 100 })} />
                <NumberInput label="Minimo compra kg" value={selected.minimo_compra_kg} onChange={(value) => updateSelected({ minimo_compra_kg: value })} />
                <TextInput label="Proveedor" value={selected.proveedor} onChange={(value) => updateSelected({ proveedor: value })} />
                <TextInput label="Fecha actualizacion" value={selected.fecha_actualizacion} onChange={(value) => updateSelected({ fecha_actualizacion: value })} />
                <SelectInput label="Confianza" value={selected.confianza} values={['ALTA', 'MEDIA', 'BAJA']} onChange={(value) => updateSelected({ confianza: value as MaterialItem['confianza'] })} />
                <TextInput label="Formato habitual" value={selected.formato_habitual} onChange={(value) => updateSelected({ formato_habitual: value })} />
                <TextInput label="Familia" value={selected.familia} onChange={(value) => updateSelected({ familia: safeFamily(value) })} />
              </div>
              <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-steel">Aliases</label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-[var(--border)] bg-white p-3 text-sm"
                value={selected.aliases.join(', ')}
                onChange={(event) => updateSelected({ aliases: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
              />
              <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-steel">Notas</label>
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-[var(--border)] bg-white p-3 text-sm"
                value={selected.notas}
                onChange={(event) => updateSelected({ notas: event.target.value })}
              />
            </div>
          ) : (
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-steel">No hay materiales en la biblioteca.</div>
          )}

          <details className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <summary className="cursor-pointer font-black text-ink">Importar / exportar JSON</summary>
            <p className="mt-2 text-sm leading-6 text-steel">Puedes pegar aqui una biblioteca completa. Importar no guarda hasta pulsar Guardar materiales.</p>
            <textarea
              className="mt-3 min-h-80 w-full rounded-md border border-[var(--border)] bg-white p-3 font-mono text-xs"
              value={jsonDraft}
              onChange={(event) => setJsonDraft(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={importJson} className="btn-secondary rounded-md px-3 py-2 text-sm font-bold">
                Importar JSON
              </button>
              <button type="button" onClick={() => setJsonDraft(JSON.stringify(library, null, 2))} className="btn-secondary rounded-md px-3 py-2 text-sm font-bold">
                Exportar actual
              </button>
            </div>
          </details>

          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <h3 className="font-black">Fuentes publicas de referencia</h3>
            <div className="mt-3 grid gap-2">
              {library.fuentes_publicas.map((source) => (
                <a key={source.url} className="rounded-md border border-[var(--border)] bg-white p-3 text-sm hover:border-workshop" href={source.url} target="_blank" rel="noreferrer">
                  <span className="block font-black text-ink">{source.nombre}</span>
                  <span className="mt-1 block leading-5 text-steel">{source.uso}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  const cls = tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-[#8a4a20]' : 'text-ink'
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</div>
      <div className={`mt-1 text-2xl font-black ${cls}`}>{value}</div>
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</span>
      <input className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function SelectInput({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</span>
      <select className="mt-2 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  )
}

function safeFamily(value: string): MaterialItem['familia'] {
  const allowed: MaterialItem['familia'][] = ['acero', 'aluminio', 'inox', 'laton', 'cobre', 'plastico_tecnico', 'otro']
  return allowed.includes(value as MaterialItem['familia']) ? (value as MaterialItem['familia']) : 'otro'
}

function isStale(date: string, staleAfterDays: number): boolean {
  const parsed = Date.parse(date)
  if (!Number.isFinite(parsed)) return true
  return Date.now() - parsed > staleAfterDays * 24 * 60 * 60 * 1000
}
