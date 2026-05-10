'use client'

import { useState } from 'react'
import type { PipelineRow } from '@/lib/local-store'

const visible = ['empresa', 'contacto', 'sector_especifico', 'estado', 'proxima_accion', 'fecha_proxima_accion', 'probabilidad_cierre', 'observaciones']

export function PipelineTable({ initialHeaders, initialRows }: { initialHeaders: string[]; initialRows: PipelineRow[] }) {
  const headers = visible.filter((header) => initialHeaders.includes(header))
  const [rows, setRows] = useState(initialRows)
  const [saving, setSaving] = useState<number | null>(null)

  async function update(index: number, key: string, value: string) {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    setRows(next)
    setSaving(index)
    await fetch('/api/local/pipeline', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ index, patch: { [key]: value } }),
    })
    setSaving(null)
  }

  return (
    <div className="surface-card overflow-hidden rounded-lg">
      <div className="border-b border-[var(--border)] p-4 text-sm text-steel">
        Edita estados y proximas acciones directamente sobre <code>prospectos/pipeline.csv</code>.
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="tbl-header">
            <tr>{headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.email}-${index}`} className="tbl-row">
                {headers.map((header) => (
                  <td key={header} className="p-2 align-top">
                    <textarea
                      className="min-h-10 w-full resize-y rounded-md border border-transparent bg-transparent p-2 text-sm leading-5 hover:border-[var(--border-strong)] focus:border-workshop"
                      value={row[header] ?? ''}
                      onChange={(event) => update(index, header, event.target.value)}
                    />
                  </td>
                ))}
                {saving === index && <td className="p-2 text-xs text-workshop">Guardando</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
