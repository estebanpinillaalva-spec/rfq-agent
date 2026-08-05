import type { AnalisisRFQ, ConfigTaller, LineaPresupuesto, NivelComplejidad, PresupuestoRFQ } from '../types'
import { cargarBibliotecaMateriales, estimarCosteMaterial } from './materiales'
import { normalize } from './normalize'

export function generarPresupuestoDeterminista(analisis: AnalisisRFQ, config: ConfigTaller): PresupuestoRFQ {
  const biblioteca = cargarBibliotecaMateriales()
  const blockingReasons: string[] = []

  const lineas = analisis.piezas.map((pieza): LineaPresupuesto => {
    const cantidad = analisis.cantidades[pieza.denominacion] ?? 0
    const cantidadSegura = cantidad > 0 ? cantidad : 1
    if (cantidad <= 0) blockingReasons.push(`Falta cantidad fiable para ${pieza.denominacion}.`)

    const material = estimarCosteMaterial({ pieza, cantidad: cantidadSegura, biblioteca })
    if (material.estado === 'requiere_revision') {
      blockingReasons.push(`Falta precio local fiable de material para ${pieza.denominacion}: ${pieza.material}.`)
    }

    const precioHora = precioHoraParaOperaciones(config, pieza.operaciones)
    const minutosTabla = minutosDeTabla(config, pieza.operaciones)
    const minutos = minutosTabla ?? pieza.tiempo_estimado_min
    const fuenteTiempo = minutosTabla === null ? 'estimacion_modelo' : 'tabla_taller'
    const costeOperaciones = (minutos / 60) * precioHora
    const costeSetupTotal = costeSetup(config, pieza.operaciones)
    const costeSetupUnitario = costeSetupTotal / cantidadSegura
    const costeSubcontratasTotal = costeSubcontratas(config, [...pieza.subcontratas, ...pieza.tratamientos, ...pieza.recubrimientos])
    const costeSubcontratasUnitario = costeSubcontratasTotal / cantidadSegura
    const baseUnitario = material.costeMaterialUnitario + costeOperaciones + costeSetupUnitario + costeSubcontratasUnitario
    const overhead = baseUnitario * config.overhead_porcentaje
    const margenPct = config.margen_por_complejidad[pieza.complejidad] ?? 0.35
    const riesgoPct = riesgoPorComplejidad(pieza.complejidad) + (material.estado === 'orientativo' ? 0.04 : 0)
    const pvpUnitario = roundCommercial((baseUnitario + overhead) * (1 + margenPct + riesgoPct))

    return {
      denominacion: pieza.denominacion,
      cantidad: cantidadSegura,
      pvp_unitario: pvpUnitario,
      subtotal: roundCurrency(pvpUnitario * cantidadSegura),
      operaciones: pieza.operaciones.join(', '),
      plazo_dias: plazoPieza(config, pieza.complejidad, costeSubcontratasTotal > 0),
      desglose: {
        coste_material: material.costeMaterialUnitario,
        coste_material_total: material.costeMaterialTotal,
        coste_operaciones: roundCurrency(costeOperaciones),
        coste_setup: roundCurrency(costeSetupUnitario),
        coste_subcontratas: roundCurrency(costeSubcontratasUnitario),
        overhead: roundCurrency(overhead),
        margen: margenPct,
        riesgo_pct: riesgoPct,
        peso_estimado_kg: material.pesoEstimadoKg,
        precio_material_eur_kg: material.precioEurKg,
        desperdicio_pct: material.desperdicioPct,
        estado_material: material.estado,
        fuente_tiempo: fuenteTiempo,
        material_normalizado: material.material?.nombre ?? pieza.material,
        material_confianza: material.material?.confianza,
        avisos_material: material.avisos,
      },
    }
  })

  const subtotal = roundCurrency(lineas.reduce((sum, linea) => sum + linea.subtotal, 0))
  const iva = roundCurrency(subtotal * config.iva_porcentaje)
  const total = roundCurrency(subtotal + iva)
  const plazo = Math.max(...lineas.map((linea) => linea.plazo_dias), config.plazo_estandar_dias)
  const fecha = new Date().toISOString().slice(0, 10)
  const materialWarnings = lineas.flatMap((linea) => linea.desglose?.avisos_material ?? [])

  const presupuestoBase: Omit<PresupuestoRFQ, 'markdown'> = {
    ref_interna: analisis.ref_interna,
    fecha,
    validez_dias: config.validez_dias,
    lineas,
    subtotal,
    iva,
    total,
    plazo_entrega_dias: plazo,
    condiciones: config.condiciones_pago,
    observaciones_tecnicas: buildObservaciones(materialWarnings, blockingReasons),
    confidence_score: blockingReasons.length ? 0.58 : materialWarnings.length ? 0.68 : 0.82,
    requires_human_review: true,
    blocking_reasons: blockingReasons,
  }

  return {
    ...presupuestoBase,
    markdown: buildMarkdown(presupuestoBase, analisis, config),
  }
}

function precioHoraParaOperaciones(config: ConfigTaller, operaciones: string[]): number {
  const precios = operaciones.map((operacion) => precioHoraOperacion(config, operacion)).filter((value): value is number => value !== null)
  if (precios.length === 0) return precioHoraMedio(config)
  return precios.reduce((sum, value) => sum + value, 0) / precios.length
}

function precioHoraOperacion(config: ConfigTaller, operacion: string): number | null {
  const normalized = normalize(operacion)
  const exact = Object.entries(config.precios_hora).find(([key]) => normalize(key) === normalized)
  if (exact) return exact[1]
  const candidates: Array<[RegExp, string]> = [
    [/torno|cilindr|barra/, 'torno_cnc'],
    [/centro|fres|3ejes|mecanizado/, 'centro_mecanizado_3ejes'],
    [/taladr|rosc|avellan/, 'taladrado'],
    [/rectific/, 'rectificado'],
    [/sold/, 'soldadura_tig'],
  ]
  const match = candidates.find(([pattern]) => pattern.test(normalized))
  return match ? config.precios_hora[match[1]] ?? null : null
}

// Devuelve null cuando ninguna operacion de la pieza tiene minutos en la
// config; en ese caso el tiempo sigue viniendo del modelo y se declara.
function minutosDeTabla(config: ConfigTaller, operaciones: string[]): number | null {
  const entradas = Object.entries(config.minutos_por_operacion)
  const minutos = operaciones
    .map((operacion) => entradas.find(([key]) => normalize(key) === normalize(operacion))?.[1])
    .filter((valor): valor is number => typeof valor === 'number')
  return minutos.length === 0 ? null : minutos.reduce((sum, valor) => sum + valor, 0)
}

function costeSetup(config: ConfigTaller, operaciones: string[]): number {
  return unique(operaciones.map((operacion) => setupKey(operacion)))
    .map((key) => ((config.setup_min_por_operacion[key] ?? 20) / 60) * (config.precios_hora[key] ?? precioHoraMedio(config)))
    .reduce((sum, value) => sum + value, 0)
}

function setupKey(operacion: string): string {
  const normalized = normalize(operacion)
  if (/torno|cilindr|barra/.test(normalized)) return 'torno_cnc'
  if (/centro|fres|3ejes|mecanizado/.test(normalized)) return 'centro_mecanizado_3ejes'
  if (/taladr|rosc|avellan/.test(normalized)) return 'taladrado'
  if (/rectific/.test(normalized)) return 'rectificado'
  if (/sold/.test(normalized)) return 'soldadura_tig'
  return operacion
}

function costeSubcontratas(config: ConfigTaller, conceptos: string[]): number {
  return unique(conceptos.map(normalize))
    .map((concepto) => {
      const match = Object.entries(config.subcontratas).find(([key]) => concepto.includes(normalize(key)) || normalize(key).includes(concepto))
      return match?.[1].coste_minimo ?? 0
    })
    .reduce((sum, value) => sum + value, 0)
}

function plazoPieza(config: ConfigTaller, complejidad: NivelComplejidad, hasSubcontract: boolean): number {
  const extra = complejidad === 'MUY_ALTA' ? 8 : complejidad === 'ALTA' ? 4 : complejidad === 'MEDIA' ? 2 : 0
  return config.plazo_estandar_dias + extra + (hasSubcontract ? 5 : 0)
}

function riesgoPorComplejidad(complejidad: NivelComplejidad): number {
  if (complejidad === 'MUY_ALTA') return 0.18
  if (complejidad === 'ALTA') return 0.12
  if (complejidad === 'MEDIA') return 0.07
  return 0.03
}

function buildObservaciones(materialWarnings: string[], blockingReasons: string[]): string {
  const lines = [
    'BORRADOR generado con motor local de costes. Requiere validacion humana del estimador antes de envio al cliente final.',
    'La base de precios local del taller manda sobre cualquier referencia online.',
    ...materialWarnings.map((warning) => `Material: ${warning}`),
    ...blockingReasons.map((reason) => `Bloqueo: ${reason}`),
  ]
  return lines.join('\n')
}

function buildMarkdown(
  presupuesto: Omit<PresupuestoRFQ, 'markdown'>,
  analisis: AnalisisRFQ,
  config: ConfigTaller
): string {
  const lineas = presupuesto.lineas
    .map((linea) => {
      const desglose = linea.desglose
      const materialStatus = desglose?.estado_material ?? 'requiere_revision'
      return `| ${linea.denominacion} | ${linea.cantidad} | ${linea.pvp_unitario.toFixed(2)} EUR | ${linea.subtotal.toFixed(2)} EUR | ${materialStatus} | ${linea.plazo_dias} dias |`
    })
    .join('\n')

  const desglose = presupuesto.lineas
    .map((linea) => {
      const item = linea.desglose
      if (!item) return `### ${linea.denominacion}\n\nSin desglose disponible.`
      return `### ${linea.denominacion}

- Material normalizado: ${item.material_normalizado ?? 'No especificado'}
- Estado material: ${item.estado_material ?? 'requiere_revision'}
- Peso estimado unitario: ${item.peso_estimado_kg ?? 'N/D'} kg
- Precio material: ${item.precio_material_eur_kg ?? 'N/D'} EUR/kg
- Coste material total lote: ${item.coste_material_total?.toFixed(2) ?? item.coste_material.toFixed(2)} EUR
- Coste material unitario: ${item.coste_material.toFixed(2)} EUR
- Coste operaciones unitario: ${item.coste_operaciones.toFixed(2)} EUR
- Setup prorrateado unitario: ${item.coste_setup.toFixed(2)} EUR
- Subcontratas unitarias: ${item.coste_subcontratas.toFixed(2)} EUR
- Overhead unitario: ${item.overhead.toFixed(2)} EUR
- Margen: ${Math.round(item.margen * 100)}%
- Riesgo: ${Math.round((item.riesgo_pct ?? 0) * 100)}%
- Avisos material: ${(item.avisos_material ?? []).join('; ') || 'Sin avisos'}
`
    })
    .join('\n')

  return `# BORRADOR - Presupuesto ${presupuesto.ref_interna}

**Fecha:** ${presupuesto.fecha}  
**Taller:** ${config.nombre} (${config.cif})  
**Cliente:** ${analisis.cliente.empresa} - ${analisis.cliente.contacto}

## Lineas

| Pieza | Cantidad | PVP unitario | Subtotal | Material | Plazo |
|---|---:|---:|---:|---|---:|
${lineas}

## Totales

- Subtotal: ${presupuesto.subtotal.toFixed(2)} EUR
- IVA ${Math.round(config.iva_porcentaje * 100)}%: ${presupuesto.iva.toFixed(2)} EUR
- Total: ${presupuesto.total.toFixed(2)} EUR

## Desglose interno de coste

${desglose}

## Condiciones

${presupuesto.condiciones}

Validez de la oferta: ${presupuesto.validez_dias} dias.  
Plazo estimado de entrega: ${presupuesto.plazo_entrega_dias} dias laborables desde confirmacion de pedido y recepcion de material.

## Observaciones tecnicas

${presupuesto.observaciones_tecnicas}

## Notas internas - no enviar al cliente sin revisar

- Complejidad global: ${analisis.complejidad_global}
- Tiempo total estimado: ${analisis.tiempo_total_min} min
- Documento generado con base de materiales local editable.
`
}

function precioHoraMedio(config: ConfigTaller): number {
  const values = Object.values(config.precios_hora)
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function roundCommercial(value: number): number {
  if (value < 50) return Math.ceil(value)
  if (value < 500) return Math.ceil(value / 5) * 5
  return Math.ceil(value / 25) * 25
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}
