import type {
  AnalisisRFQ,
  ConfigTaller,
  LlmUsage,
  NivelComplejidad,
  PlanoEntrada,
  PresupuestoRFQ,
  ValidacionPlano,
} from '../types'

export function mockUsage(): LlmUsage {
  return {
    provider: 'mock',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostEur: 0,
    durationMs: 25,
  }
}

export function mockValidacion(planos: PlanoEntrada[]): ValidacionPlano {
  return {
    resultado: 'PROCESABLE',
    problemas: planos.length > 1 ? ['Demo mock: varios planos detectados y procesables.'] : [],
    email_sugerido: '',
    confidence_score: 0.82,
    requires_human_review: true,
    blocking_reasons: [],
  }
}

export function mockAnalisis(email: string, planos: PlanoEntrada[]): AnalisisRFQ {
  const cantidad = extractCantidad(email)
  const cliente = extractCliente(email)
  const piezasFuente = planos.flatMap((plano) => {
    const pageCount = Number(plano.metadata.page_count)
    if (plano.extension === '.pdf' && Number.isFinite(pageCount) && pageCount > 1) {
      return Array.from({ length: Math.min(pageCount, 4) }, (_, pageIndex) => ({ plano, paginaPdf: pageIndex + 1 }))
    }
    return [{ plano, paginaPdf: plano.extension === '.pdf' ? 1 : null }]
  })

  const piezas = piezasFuente.map(({ plano, paginaPdf }, index) => {
    const esCompleja = piezasFuente.length > 1 && index === 1
    const complejidad: NivelComplejidad = esCompleja ? 'ALTA' : 'MEDIA'
    const denominacion = esCompleja
      ? 'Soporte fresado con taladros cruzados'
      : paginaPdf && paginaPdf > 1
        ? `Pieza mecanizada pagina ${paginaPdf}`
        : 'Eje mecanizado'
    return {
      denominacion,
      numero_plano: `PL-${(index + 1).toString().padStart(3, '0')}`,
      archivo_origen: plano.nombre,
      pagina_pdf: paginaPdf,
      trazabilidad_confianza: paginaPdf
        ? `Mock: pieza asociada a ${plano.nombre}, pagina ${paginaPdf}.`
        : `Mock: pieza asociada a ${plano.nombre} por orden de archivo.`,
      revision_plano: 'Rev A',
      escala: '1:1',
      cajetin_texto: `PL-${(index + 1).toString().padStart(3, '0')} | ${denominacion} | Material Acero F-114 | Rev A`,
      material_fuente: 'Mock: cajetin inferior derecho',
      cantidad_fuente: 'Mock: email del cliente',
      dimensiones_fuente: 'Mock: cotas principales del plano',
      tolerancias_fuente: 'Mock: cajetin/notas generales',
      acabado_fuente: 'Mock: llamada de rugosidad en vista principal',
      revision_fuente: 'Mock: cajetin inferior derecho',
      material: 'Acero F-114',
      dimensiones: esCompleja ? '120 x 80 x 30 mm' : 'Diametro 35 x 120 mm',
      tolerancias_generales: 'ISO 2768-mK asumida para demo; confirmar en plano real.',
      tolerancias_criticas: esCompleja ? ['Alojamiento central H7', 'Posicion de taladros +/-0,05 mm'] : ['Diametro exterior +/-0,02 mm'],
      gdt: esCompleja ? ['Perpendicularidad entre caras mecanizadas'] : [],
      acabado: 'Ra 1,6 en superficies mecanizadas principales',
      tratamientos: [],
      recubrimientos: [],
      roscas: esCompleja ? ['M8-6H'] : ['M10'],
      agujeros: esCompleja ? ['Taladros pasantes laterales', 'Alojamiento central'] : ['Taladro axial'],
      ajustes: esCompleja ? ['Alojamiento H7'] : [],
      chaflanes_radios: ['Chaflanes de entrada segun plano'],
      rugosidades: ['Ra 1,6'],
      notas_plano: ['Confirmar tolerancias criticas antes de fabricar'],
      zonas_revisadas: ['cajetin', 'notas generales', 'vista principal', 'detalle de taladros', 'email'],
      campos_no_encontrados: [],
      operaciones: esCompleja
        ? ['corte_material', 'fresado_3_ejes', 'taladrado', 'roscado', 'desbarbado', 'control_calidad']
        : ['corte_barra', 'torno_cnc', 'taladrado', 'roscado', 'desbarbado', 'control_calidad'],
      caracteristicas_criticas: esCompleja ? ['Taladros cruzados', 'Alojamiento ajustado'] : ['Rosca M10', 'Chaflanes de entrada'],
      complejidad,
      tiempo_estimado_min: esCompleja ? 42 : 28,
      subcontratas: [],
      flags: ['BORRADOR - demo mock, pendiente de revisar contra plano real'],
    }
  })

  const tiempoTotal = piezas.reduce((sum, pieza) => sum + pieza.tiempo_estimado_min * cantidad, 0)
  const complejidadGlobal: NivelComplejidad = piezas.some((pieza) => pieza.complejidad === 'ALTA') ? 'ALTA' : 'MEDIA'

  return {
    ref_interna: `RFQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    timestamp: new Date().toISOString(),
    cliente,
    cantidades: Object.fromEntries(piezas.map((pieza) => [pieza.denominacion, cantidad])),
    plazo_solicitado: extractPlazo(email),
    piezas,
    dfm: {
      riesgos: ['Confirmar tolerancias criticas antes de lanzar fabricacion.'],
      sugerencias: ['Agrupar el mecanizado por lote para reducir tiempos de preparacion.'],
      ambiguedades: ['Material y tratamiento final deben validarse con el cliente si el plano real no lo especifica.'],
    },
    complejidad_global: complejidadGlobal,
    tiempo_total_min: tiempoTotal,
    subcontratas_necesarias: [],
    email_respuesta: `Hola ${cliente.contacto},\n\nHemos recibido vuestra solicitud y los planos adjuntos. Hemos preparado un analisis tecnico preliminar y un presupuesto BORRADOR pendiente de validacion final por el estimador.\n\nUn saludo,\nEquipo de presupuestos`,
    confidence_score: 0.78,
    requires_human_review: true,
    blocking_reasons: [],
  }
}

export function mockPresupuesto(analisis: AnalisisRFQ, config: ConfigTaller): PresupuestoRFQ {
  const lineas = analisis.piezas.map((pieza) => {
    const cantidad = analisis.cantidades[pieza.denominacion] ?? 1
    const precioHora = precioHoraMedio(config)
    const costeOperacion = (pieza.tiempo_estimado_min / 60) * precioHora
    const costeMaterial = pieza.complejidad === 'ALTA' ? 8 : 5
    const margen = config.margen_por_complejidad[pieza.complejidad] ?? 0.35
    const pvpUnitario = roundCommercial((costeOperacion + costeMaterial) * (1 + margen))
    const costeSetup = ((config.setup_min_por_operacion[pieza.operaciones[0] ?? ''] ?? 30) / 60) * precioHora
    const overhead = (costeOperacion + costeMaterial + costeSetup) * config.overhead_porcentaje
    return {
      denominacion: pieza.denominacion,
      cantidad,
      pvp_unitario: pvpUnitario,
      subtotal: pvpUnitario * cantidad,
      operaciones: pieza.operaciones.join(', '),
      plazo_dias: pieza.complejidad === 'ALTA' ? config.plazo_estandar_dias + 3 : config.plazo_estandar_dias,
      desglose: {
        coste_material: roundCurrency(costeMaterial),
        coste_operaciones: roundCurrency(costeOperacion),
        coste_setup: roundCurrency(costeSetup),
        coste_subcontratas: 0,
        overhead: roundCurrency(overhead),
        margen,
      },
    }
  })

  const subtotal = roundCurrency(lineas.reduce((sum, linea) => sum + linea.subtotal, 0))
  const iva = roundCurrency(subtotal * config.iva_porcentaje)
  const total = roundCurrency(subtotal + iva)
  const plazo = Math.max(...lineas.map((linea) => linea.plazo_dias))
  const fecha = new Date().toISOString().slice(0, 10)

  const presupuestoBase = {
    ref_interna: analisis.ref_interna,
    fecha,
    validez_dias: config.validez_dias,
    lineas,
    subtotal,
    iva,
    total,
    plazo_entrega_dias: plazo,
    condiciones: config.condiciones_pago,
    observaciones_tecnicas:
      'BORRADOR generado en modo demo. Requiere validacion humana del estimador antes de envio al cliente final.',
    confidence_score: 0.76,
    requires_human_review: true,
    blocking_reasons: [],
  }

  return {
    ...presupuestoBase,
    markdown: buildMarkdown(presupuestoBase, analisis, config),
  }
}

function extractCantidad(email: string): number {
  const match = email.match(/(\d+)\s*(?:unidades|uds)/i) ?? email.match(/(\d+)\s*piezas/i)
  return match ? Number(match[1]) : 1
}

function extractPlazo(email: string): string {
  const match = email.match(/(?:para|antes del|entrega)\s+([^\n.]+)/i)
  return match?.[1]?.trim() ?? 'No especificado'
}

function extractCliente(email: string): AnalisisRFQ['cliente'] {
  const emailMatch = email.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const lines = email
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/^(de|from|asunto|subject):/i.test(line))
    .filter(Boolean)
  const contacto = lines.find((line) => /^juan|^maria|^maría|^carlos|^ana/i.test(line)) ?? 'Contacto cliente'
  const empresa =
    lines.find((line) => /\b(?:s\.?l\.?|s\.?a\.?)\b|taller|automotriz|mecanizados/i.test(line)) ?? 'Empresa cliente'

  return {
    empresa,
    contacto,
    email: emailMatch?.[0] ?? 'no-especificado@cliente.es',
    idioma: 'es',
  }
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

function buildMarkdown(
  presupuesto: Omit<PresupuestoRFQ, 'markdown'>,
  analisis: AnalisisRFQ,
  config: ConfigTaller
): string {
  const lineas = presupuesto.lineas
    .map(
      (linea) =>
        `| ${linea.denominacion} | ${linea.cantidad} | ${linea.pvp_unitario.toFixed(2)} EUR | ${linea.subtotal.toFixed(2)} EUR | ${linea.plazo_dias} dias |`
    )
    .join('\n')

  return `# BORRADOR - Presupuesto ${presupuesto.ref_interna}

**Fecha:** ${presupuesto.fecha}  
**Taller:** ${config.nombre} (${config.cif})  
**Cliente:** ${analisis.cliente.empresa} - ${analisis.cliente.contacto}

## Lineas

| Pieza | Cantidad | PVP unitario | Subtotal | Plazo |
|---|---:|---:|---:|---:|
${lineas}

## Totales

- Subtotal: ${presupuesto.subtotal.toFixed(2)} EUR
- IVA 21%: ${presupuesto.iva.toFixed(2)} EUR
- Total: ${presupuesto.total.toFixed(2)} EUR

## Condiciones

${presupuesto.condiciones}

Validez de la oferta: ${presupuesto.validez_dias} dias.  
Plazo estimado de entrega: ${presupuesto.plazo_entrega_dias} dias laborables desde confirmacion de pedido y recepcion de material.

## Observaciones tecnicas

${presupuesto.observaciones_tecnicas}

## Notas internas - no enviar al cliente sin revisar

- Complejidad global: ${analisis.complejidad_global}
- Tiempo total estimado: ${analisis.tiempo_total_min} min
- Documento generado en modo piloto local.
`
}
