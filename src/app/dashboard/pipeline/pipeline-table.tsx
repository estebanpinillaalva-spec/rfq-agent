'use client'

import { useState, useMemo } from 'react'
import type { PipelineRow } from '@/lib/local-store'

const VISIBLE = ['empresa', 'estado', 'ticket_estimado', 'probabilidad_cierre', 'proxima_accion', 'fecha_proxima_accion', 'contacto', 'observaciones']

const LABEL: Record<string, string> = {
  empresa: 'Empresa',
  estado: 'Estado',
  ticket_estimado: 'Ticket (€)',
  probabilidad_cierre: 'Prob. %',
  proxima_accion: 'Próxima acción',
  fecha_proxima_accion: 'Fecha',
  contacto: 'Contacto',
  observaciones: 'Notas',
}

const ESTADO_STYLE: Record<string, string> = {
  nuevo:             'bg-blue-50 text-blue-700 border border-blue-200',
  contactado:        'bg-yellow-50 text-yellow-700 border border-yellow-200',
  propuesta:         'bg-orange-50 text-orange-700 border border-orange-200',
  'negociación':     'bg-purple-50 text-purple-700 border border-purple-200',
  negociacion:       'bg-purple-50 text-purple-700 border border-purple-200',
  cerrado:           'bg-green-50 text-green-700 border border-green-200',
  ganado:            'bg-green-50 text-green-700 border border-green-200',
  descartado:        'bg-gray-100 text-gray-400 border border-gray-200',
  'oferta borrador': 'bg-amber-50 text-amber-700 border border-amber-200',
}

function extractRfqId(observaciones: string | undefined): string | null {
  const match = (observaciones ?? '').match(/\[RFQ:([^\]]+)\]/)
  return match?.[1] ?? null
}

function estadoStyle(estado: string): string {
  const key = (estado ?? '').toLowerCase().trim()
  return ESTADO_STYLE[key] ?? 'bg-[var(--surface-2)] text-[var(--steel)] border border-[var(--border)]'
}

function formatFecha(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
}

type FilterEstado = 'todos' | string

export function PipelineTable({
  initialHeaders,
  initialRows,
  hoy,
}: {
  initialHeaders: string[]
  initialRows: PipelineRow[]
  hoy: string
}) {
  const headers = VISIBLE.filter((h) => initialHeaders.includes(h))
  const [rows, setRows] = useState(initialRows)
  const [saving, setSaving] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<FilterEstado>('todos')

  const estados = useMemo(() => {
    const set = new Set(rows.map((r) => r.estado ?? '').filter(Boolean))
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() =>
    filtro === 'todos' ? rows : rows.filter((r) => (r.estado ?? '') === filtro),
    [rows, filtro]
  )

  async function update(realIndex: number, key: string, value: string) {
    const next = rows.map((row, i) => (i === realIndex ? { ...row, [key]: value } : row))
    setRows(next)
    setSaving(realIndex)
    await fetch('/api/local/pipeline', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ index: realIndex, patch: { [key]: value } }),
    })
    setSaving(null)
  }

  async function addRow() {
    const empty: PipelineRow = Object.fromEntries(initialHeaders.map((h) => [h, '']))
    await fetch('/api/local/pipeline', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ row: empty }),
    })
    setRows((prev) => [...prev, empty])
  }

  if (rows.length === 0) {
    return (
      <div className="surface-card rounded-lg p-12 text-center">
        <p className="text-sm text-[var(--steel)]">Sin prospectos todavía. Añade el primero para empezar.</p>
        <button onClick={addRow} className="btn-primary mt-4 rounded-md px-4 py-2 text-sm font-bold">
          + Nuevo prospecto
        </button>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-lg overflow-hidden">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap border-b border-[var(--border)] px-4 py-3">
        <span className="text-xs font-bold text-[var(--steel)] uppercase tracking-wider mr-1">Estado</span>
        {['todos', ...estados].map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold border transition-colors ${
              filtro === e
                ? 'bg-[var(--workshop)] text-white border-[var(--workshop)]'
                : 'border-[var(--border)] text-[var(--steel)] hover:border-[var(--workshop)] hover:text-[var(--ink)]'
            }`}
          >
            {e === 'todos' ? 'Todos' : e}
          </button>
        ))}
        <button
          onClick={addRow}
          className="ml-auto text-xs font-bold text-[var(--workshop)] hover:opacity-75 transition-opacity"
        >
          + Nuevo prospecto
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="tbl-header">
            <tr>
              {headers.map((h) => (
                <th key={h} className="p-3 font-bold whitespace-nowrap">{LABEL[h] ?? h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const realIndex = rows.indexOf(row)
              const vencida = row.fecha_proxima_accion && row.fecha_proxima_accion < hoy
              return (
                <tr
                  key={realIndex}
                  className={`tbl-row ${vencida ? 'bg-[rgba(178,74,53,0.03)]' : ''}`}
                >
                  {headers.map((header) => {
                    if (header === 'estado') {
                      return (
                        <td key={header} className="p-2 align-top">
                          <select
                            value={row[header] ?? ''}
                            onChange={(e) => update(realIndex, header, e.target.value)}
                            className={`w-full rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer ${estadoStyle(row[header] ?? '')}`}
                          >
                            {['nuevo', 'contactado', 'propuesta', 'negociación', 'cerrado', 'descartado', 'Oferta borrador', row[header] ?? '']
                              .filter((v, i, a) => v && a.indexOf(v) === i)
                              .map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                          {saving === realIndex && <span className="mt-1 block text-[10px] text-[var(--workshop)]">Guardando…</span>}
                        </td>
                      )
                    }

                    if (header === 'fecha_proxima_accion') {
                      return (
                        <td key={header} className="p-2 align-top">
                          <input
                            type="date"
                            value={row[header] ?? ''}
                            onChange={(e) => update(realIndex, header, e.target.value)}
                            className={`w-full rounded-md border bg-transparent px-2 py-1 text-xs ${
                              vencida
                                ? 'border-[var(--danger)] text-[var(--danger)] font-bold'
                                : 'border-transparent hover:border-[var(--border-strong)]'
                            }`}
                          />
                        </td>
                      )
                    }

                    if (header === 'empresa') {
                      const rfqId = extractRfqId(row.observaciones)
                      return (
                        <td key={header} className="p-2 align-top min-w-[140px]">
                          <textarea
                            className="w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-[var(--ink)] leading-5 hover:border-[var(--border-strong)]"
                            rows={1}
                            value={row[header] ?? ''}
                            onChange={(e) => update(realIndex, header, e.target.value)}
                          />
                          {rfqId && (
                            <a
                              href={`/dashboard/rfqs/${rfqId}`}
                              className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--workshop)] hover:opacity-75 transition-opacity"
                            >
                              Ver RFQ →
                            </a>
                          )}
                        </td>
                      )
                    }

                    if (header === 'ticket_estimado' || header === 'probabilidad_cierre') {
                      return (
                        <td key={header} className="p-2 align-top w-24">
                          <input
                            type="number"
                            className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-mono font-bold text-[var(--ink)] hover:border-[var(--border-strong)]"
                            value={row[header] ?? ''}
                            onChange={(e) => update(realIndex, header, e.target.value)}
                          />
                        </td>
                      )
                    }

                    return (
                      <td key={header} className="p-2 align-top">
                        <textarea
                          className="min-h-9 w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-5 text-[var(--ink)] hover:border-[var(--border-strong)]"
                          value={row[header] ?? ''}
                          onChange={(e) => update(realIndex, header, e.target.value)}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
