'use client'

import { useEffect, useState } from 'react'

interface SubcontrataCfg {
  coste_minimo: number
  plazo_dias: number
}

interface ConfigTaller {
  nombre: string
  cif: string
  email: string
  precios_hora: Record<string, number>
  margen_por_complejidad: Record<string, number>
  plazo_estandar_dias: number
  condiciones_pago: string
  iva_porcentaje: number
  validez_dias: number
  overhead_porcentaje: number
  capacidad_diaria_horas: number
  materiales_eur_kg: Record<string, number>
  setup_min_por_operacion: Record<string, number>
  subcontratas: Record<string, SubcontrataCfg>
}

const COMPLEJIDADES = ['BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'] as const

export function ConfigTallerPanel() {
  const [config, setConfig] = useState<ConfigTaller | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/local/config-taller')
      .then((r) => r.json())
      .then((data: { config?: ConfigTaller }) => {
        if (data.config) setConfig(data.config)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!config) return
    setMessage('Guardando...')
    const response = await fetch('/api/local/config-taller', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(config),
    })
    const data = (await response.json()) as { config?: ConfigTaller; error?: string }
    if (!response.ok || !data.config) {
      setMessage(data.error || 'Error al guardar.')
      return
    }
    setConfig(data.config)
    setMessage('Configuracion guardada.')
  }

  function setField<K extends keyof ConfigTaller>(key: K, value: ConfigTaller[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c))
    setMessage('')
  }

  function setRecord(key: 'precios_hora' | 'margen_por_complejidad' | 'materiales_eur_kg' | 'setup_min_por_operacion', field: string, raw: string) {
    const num = parseFloat(raw)
    if (isNaN(num)) return
    setConfig((c) => (c ? { ...c, [key]: { ...c[key], [field]: num } } : c))
    setMessage('')
  }

  if (loading) {
    return (
      <section className="surface-card mt-5 animate-pulse rounded-lg p-5">
        <div className="h-6 w-48 rounded bg-[#e2e8f0]" />
        <div className="mt-4 h-4 w-full rounded bg-[#e2e8f0]" />
      </section>
    )
  }

  if (!config) return null

  return (
    <section className="surface-card mt-5 rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Configuracion del taller</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-steel">
            Tarifas y condiciones por defecto para nuevos RFQs entrantes. Se aplica a cada email con plano recibido.
          </p>
        </div>
        <button type="button" onClick={() => void save()} className="btn-primary rounded-md px-4 py-2 text-sm font-bold">
          Guardar
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-sm font-semibold ${message.includes('Error') ? 'text-danger' : 'text-ok'}`}>{message}</p>
      )}

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Datos del taller</h3>
          <Field label="Nombre" value={config.nombre} onChange={(v) => setField('nombre', v)} />
          <Field label="CIF" value={config.cif} onChange={(v) => setField('cif', v)} />
          <Field label="Email de contacto" value={config.email} onChange={(v) => setField('email', v)} />
          <Field label="Condiciones de pago" value={config.condiciones_pago} onChange={(v) => setField('condiciones_pago', v)} />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Parametros economicos</h3>
          <NumField label="Plazo estandar (dias)" value={config.plazo_estandar_dias} onChange={(v) => setField('plazo_estandar_dias', v)} />
          <NumField label="Validez presupuesto (dias)" value={config.validez_dias} onChange={(v) => setField('validez_dias', v)} />
          <NumField label="IVA (%)" value={config.iva_porcentaje * 100} onChange={(v) => setField('iva_porcentaje', v / 100)} step={0.5} />
          <NumField label="Overhead (%)" value={config.overhead_porcentaje * 100} onChange={(v) => setField('overhead_porcentaje', v / 100)} step={0.5} />
          <NumField label="Capacidad diaria (horas)" value={config.capacidad_diaria_horas} onChange={(v) => setField('capacidad_diaria_horas', v)} step={0.5} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Precios por hora (EUR)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(config.precios_hora).map(([op, precio]) => (
            <div key={op}>
              <label className="block text-xs font-semibold capitalize text-steel">{op.replace(/_/g, ' ')}</label>
              <input
                type="number"
                min={0}
                step={1}
                className="mono mt-1 w-full rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
                value={precio}
                onChange={(e) => setRecord('precios_hora', op, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Margen por complejidad</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMPLEJIDADES.map((nivel) => (
            <div key={nivel}>
              <label className="block text-xs font-semibold text-steel">{nivel}</label>
              <input
                type="number"
                min={0}
                max={2}
                step={0.05}
                className="mono mt-1 w-full rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
                value={config.margen_por_complejidad[nivel] ?? 0}
                onChange={(e) => setRecord('margen_por_complejidad', nivel, e.target.value)}
              />
              <span className="text-xs text-steel">{((config.margen_por_complejidad[nivel] ?? 0) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(config.materiales_eur_kg).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel">Materiales locales (EUR/kg)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(config.materiales_eur_kg).map(([mat, precio]) => (
              <div key={mat}>
                <label className="block text-xs font-semibold text-steel">{mat}</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="mono mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
                  value={precio}
                  onChange={(e) => setRecord('materiales_eur_kg', mat, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-steel">{label}</label>
      <input
        type="text"
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-steel">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        className="mono mt-1 w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
        value={value}
        onChange={(e) => {
          const num = parseFloat(e.target.value)
          if (!isNaN(num)) onChange(num)
        }}
      />
    </div>
  )
}
