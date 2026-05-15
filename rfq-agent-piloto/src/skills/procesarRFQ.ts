import type { AiClient } from '../llm/aiClient'
import { analisisRFQSchema, type AnalisisRFQ, type LlmResult, type PlanoEntrada, type ValidacionPlano } from '../types'
import { parseJsonDefensivo, RETRY_JSON_SUFFIX } from '../utils/json'
import { buscarMaterial, cargarBibliotecaMateriales } from '../utils/materiales'
import { normalize } from '../utils/normalize'
import { cargarPromptSkill, cargarReferencia } from '../utils/prompts'
import { mockAnalisis, mockUsage } from './mock'

export async function procesarRFQ(
  ai: AiClient,
  email: string,
  planos: PlanoEntrada[],
  validacion: ValidacionPlano
): Promise<LlmResult<AnalisisRFQ>> {
  if (ai.provider === 'mock') {
    const data = analisisRFQSchema.parse(mockAnalisis(email, planos)) as AnalisisRFQ
    return { data, raw: JSON.stringify(data, null, 2), usage: mockUsage() }
  }

  if (validacion.resultado === 'NO_PROCESABLE') {
    throw new Error('La validacion marco NO_PROCESABLE. No se debe procesar el RFQ.')
  }

  const tablaOperaciones = cargarReferencia('procesar-rfq', 'tabla-operaciones.md')
  const tablaMateriales = cargarReferencia('procesar-rfq', 'tabla-materiales.md')
  const tablaGdt = cargarReferencia('procesar-rfq', 'tabla-gdt.md')
  const tablaTiempos = cargarReferencia('procesar-rfq', 'tabla-tiempos.md')

  const referenciasSufijo = [
    tablaOperaciones ? `\n\n---\nREFERENCIA — TABLA DE OPERACIONES:\n${tablaOperaciones}` : '',
    tablaMateriales ? `\n\n---\nREFERENCIA — TABLA DE MATERIALES:\n${tablaMateriales}` : '',
    tablaGdt ? `\n\n---\nREFERENCIA — TABLA GD&T:\n${tablaGdt}` : '',
    tablaTiempos ? `\n\n---\nREFERENCIA — TIEMPOS ESTIMADOS (OBLIGATORIO):\n${tablaTiempos}` : '',
  ].join('')

  const prompt = `${cargarPromptSkill('procesar-rfq')}${referenciasSufijo}

---
EMAIL DEL CLIENTE:
${email}

VALIDACION PREVIA:
${JSON.stringify(validacion, null, 2)}

ARCHIVOS:
${planos.map(describirPlano).join('\n')}

REGLAS PARA PDF MULTIPAGINA Y VARIOS PLANOS:
- Analiza cada archivo y cada pagina de PDF multipagina por separado.
- No asumas que un PDF multipagina representa una sola pieza.
- Si una pagina contiene una pieza distinta, crea una entrada separada en "piezas".
- Si varias paginas pertenecen a la misma pieza, agrupalas en una sola pieza y explica la relacion en "flags" y "dfm.ambiguedades".
- Para cada pieza, rellena "archivo_origen" con el nombre del archivo y "pagina_pdf" con la pagina estimada si procede; si no procede, usa null.
- Usa "trazabilidad_confianza" para explicar brevemente por que asignas esa pieza a ese archivo/pagina.
- Si no puedes separar piezas con seguridad, manten requires_human_review=true y anade un blocking_reason concreto.

REGLA UNREADABLE — PLANO ILEGIBLE O DE BAJA CALIDAD:
- Si una imagen o pagina PDF esta completamente ilegible (borrosa, muy oscura, corrompida, resolucion insuficiente para leer cotas o cajetin) → marca esa pieza con flag "PLANO_ILEGIBLE", pon requires_human_review=true, confidence_score<0.2, y anade blocking_reason="Plano ilegible: [motivo especifico]".
- NO inventes cotas, materiales ni tolerancias cuando el plano no es legible. Deja los campos vacios y pon cajetin_texto="ILEGIBLE: [motivo]".
- Si el plano es PARCIALMENTE legible, extrae lo que puedas y precede cada valor dudoso con "?" (ej: "?C45", "?ISO 2768-m"). Anade flag "LECTURA_PARCIAL".

DETECCION MULTI-IDIOMA EN CAJETINES:
- Los planos pueden venir en ES, EN, DE, FR o PT. Detecta el idioma del cajetin automaticamente y extrae el valor independientemente de la etiqueta.
- Equivalencias de campos por idioma:
  ES: Material / Denominacion / Escala / Revision / N° Plano / Peso / Cantidad
  EN: Material / Title / Scale / Revision / Drawing No. / Weight / Qty
  DE: Werkstoff / Benennung / Massstab / Anderung / Zeichnungsnr. / Gewicht / Anzahl
  FR: Matiere / Designation / Echelle / Indice / N° Plan / Masse / Quantite
  PT: Material / Denominacao / Escala / Revisao / N° Desenho / Peso / Quantidade
- Si el cajetin esta en otro idioma no listado, aplica el mismo razonamiento semantico.

METODO DE EXTRACCION EXHAUSTIVA OBLIGATORIO:
- Trabaja como estimador mecanico. Antes de declarar "No especificado", revisa de forma explicita: cajetin/title block, tabla de revisiones, notas generales, tabla de materiales/listado de piezas, vistas/cortes/detalles, llamadas de mecanizado y el email.
- El material suele estar en cajetin, notas, tabla de lista de piezas o email. Busca variantes como "Material", "Mat.", "MATERIAL:", "Werkstoff:", "Matiere:", "Acero", "F-114", "F114", "AISI", "Al", "6082", "7075", "Inox", "1.4301", "C45", "S275", "Ti-6Al-4V", "Grade 5", "PEEK", "PTFE". Si aparece en cualquier zona, extraelo y explica la fuente.
- Para cada pieza, rellena "cajetin_texto" con los textos legibles clave del cajetin aunque sean parciales: denominacion, material, revision, escala, peso, numero de plano.
- Para cada campo critico rellena su fuente: material_fuente, cantidad_fuente, dimensiones_fuente, tolerancias_fuente, acabado_fuente, revision_fuente. Ejemplo: "cajetin inferior derecho pagina 3", "nota general pagina 1", "email del cliente".
- Extrae tambien: revision_plano, escala, tratamientos, recubrimientos, roscas, agujeros, ajustes, chaflanes_radios, rugosidades y notas_plano.
- En "zonas_revisadas" enumera las zonas que has mirado. En "campos_no_encontrados" enumera solo lo que no aparece tras revisar esas zonas.
- Si detectas conflicto entre email y plano, conserva el dato del plano como principal, marca el conflicto en flags y anade una pregunta al cliente.
- No inventes tolerancias ni materiales. Si asumes algo para estimar, dilo explicitamente en flags y manten requires_human_review=true.
- La respuesta debe ser densa: arrays con todos los elementos tecnicos visibles, no solo un resumen.

Devuelve SOLO JSON valido que cumpla este contrato:
{
  "ref_interna": "RFQ-YYYY-NNN",
  "timestamp": "ISO-8601",
  "cliente": { "empresa": "...", "contacto": "...", "email": "...", "idioma": "es" },
  "cantidades": { "referencia": 1 },
  "plazo_solicitado": "...",
  "piezas": [{
    "denominacion": "...",
    "numero_plano": "...",
    "archivo_origen": "...",
    "pagina_pdf": 1,
    "trazabilidad_confianza": "...",
    "revision_plano": "...",
    "escala": "...",
    "cajetin_texto": "...",
    "material_fuente": "...",
    "cantidad_fuente": "...",
    "dimensiones_fuente": "...",
    "tolerancias_fuente": "...",
    "acabado_fuente": "...",
    "revision_fuente": "...",
    "material": "...",
    "dimensiones": "...",
    "tolerancias_generales": "...",
    "tolerancias_criticas": ["..."],
    "gdt": ["..."],
    "acabado": "...",
    "tratamientos": ["..."],
    "recubrimientos": ["..."],
    "roscas": ["..."],
    "agujeros": ["..."],
    "ajustes": ["..."],
    "chaflanes_radios": ["..."],
    "rugosidades": ["..."],
    "notas_plano": ["..."],
    "zonas_revisadas": ["..."],
    "campos_no_encontrados": ["..."],
    "operaciones": ["..."],
    "caracteristicas_criticas": ["..."],
    "complejidad": "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA",
    "tiempo_estimado_min": 0,
    "subcontratas": ["..."],
    "flags": ["BORRADOR"]
  }],
  "dfm": { "riesgos": ["..."], "sugerencias": ["..."], "ambiguedades": ["..."] },
  "complejidad_global": "BAJA" | "MEDIA" | "ALTA" | "MUY_ALTA",
  "tiempo_total_min": 0,
  "subcontratas_necesarias": ["..."],
  "email_respuesta": "...",
  "confidence_score": 0.0,
  "requires_human_review": true,
  "blocking_reasons": ["..."]
}`

  const response = await ai.visionJson(prompt, planos)
  let parsed: AnalisisRFQ
  try {
    parsed = parseJsonDefensivo(response.raw, analisisRFQSchema, 'procesarRFQ') as AnalisisRFQ
  } catch {
    const retryResponse = await ai.visionJson(prompt + RETRY_JSON_SUFFIX, planos)
    parsed = parseJsonDefensivo(retryResponse.raw, analisisRFQSchema, 'procesarRFQ') as AnalisisRFQ
  }
  const data = validarMateriales(normalizarAnalisis(parsed))
  return { ...response, data }
}

function describirPlano(plano: PlanoEntrada): string {
  const metadata = Object.entries(plano.metadata)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  return `- ${plano.nombre} (${plano.mimeType}${metadata ? `; ${metadata}` : ''})`
}

function normalizarAnalisis(analisis: AnalisisRFQ): AnalisisRFQ {
  return {
    ...analisis,
    piezas: analisis.piezas.map((pieza) => {
      if (!/no especificado/i.test(pieza.material)) return pieza
      const material = extraerMaterialDesdeTexto([
        pieza.cajetin_texto,
        pieza.material_fuente,
        pieza.notas_plano.join('\n'),
        pieza.flags.join('\n'),
      ].join('\n'))
      if (!material) return pieza
      return {
        ...pieza,
        material,
        material_fuente:
          pieza.cajetin_texto && /cajetin|no especificado|sin fuente/i.test(pieza.material_fuente)
            ? 'Inferido automaticamente del cajetin/title block'
            : pieza.material_fuente,
        campos_no_encontrados: limpiarCampoNoEncontrado(pieza.campos_no_encontrados, 'material'),
        flags: [...pieza.flags, `Material inferido por postproceso desde texto del plano: ${material}`],
      }
    }),
  }
}

function extraerMaterialDesdeTexto(texto: string): string | null {
  const patterns = [
    /\bF[-\s]?\d{3,4}\b/i,
    /\bC[-\s]?\d{3,4}\b/i,
    /\bAISI\s?\d{3,4}\b/i,
    /\bSAE\s?\d{3,4}\b/i,
    /\b(?:AL|ALUMINIO)\s?\d{4}\s?(?:T\d)?\b/i,
    /\b\d\.\d{4}\b/,
    /\bS275\b/i,
    /\bS355\b/i,
    /\bC45\b/i,
    /\bINOX(?:IDABLE)?\s?[A-Z0-9.-]*\b/i,
  ]
  for (const pattern of patterns) {
    const match = texto.match(pattern)
    if (match?.[0]) return match[0].replace(/\s+/g, ' ').replace(/([A-Z])\s?-\s?(\d)/i, '$1-$2').trim()
  }
  return null
}

function limpiarCampoNoEncontrado(campos: string[], campoARetirar: string): string[] {
  return campos
    .flatMap((campo) => campo.split(',').map((item) => item.trim()))
    .filter((campo) => campo && normalize(campo) !== normalize(campoARetirar))
}

function validarMateriales(analisis: AnalisisRFQ): AnalisisRFQ {
  const biblioteca = cargarBibliotecaMateriales()
  return {
    ...analisis,
    piezas: analisis.piezas.map((pieza) => {
      const materialTexto = pieza.material.trim()
      if (!materialTexto || /no especificado|sin fuente|no aplica/i.test(materialTexto)) return pieza

      const encontrado = buscarMaterial(materialTexto, biblioteca)
      if (encontrado) {
        return {
          ...pieza,
          flags: [
            ...pieza.flags.filter((f) => !f.startsWith('Material verificado:')),
            `Material verificado en BD: ${encontrado.nombre} (${encontrado.id})`,
          ],
        }
      }

      // Material devuelto por Gemini no está en la base de datos local
      return {
        ...pieza,
        requires_human_review: true,
        flags: [...pieza.flags, `MATERIAL_NO_VERIFICADO_EN_BD: "${materialTexto}" — confirmar designacion normalizada`],
      }
    }),
  }
}

