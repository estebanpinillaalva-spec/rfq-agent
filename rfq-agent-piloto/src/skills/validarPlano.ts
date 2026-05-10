import type { AiClient } from '../llm/aiClient'
import { validacionPlanoSchema, type LlmResult, type PlanoEntrada, type ValidacionPlano } from '../types'
import { parseJsonDefensivo, RETRY_JSON_SUFFIX } from '../utils/json'
import { cargarPromptSkill } from '../utils/prompts'
import { mockUsage, mockValidacion } from './mock'

export async function validarPlano(
  ai: AiClient,
  email: string,
  planos: PlanoEntrada[]
): Promise<LlmResult<ValidacionPlano>> {
  const principales = planos.filter((plano) => plano.esFuentePrincipal)
  if (principales.length === 0) {
    const data = validacionPlanoSchema.parse({
      resultado: 'NO_PROCESABLE',
      problemas: ['Solo hay STEP/DXF u otros adjuntos de contexto. Falta plano 2D cotado en PDF/PNG/JPG.'],
      email_sugerido:
        'Hola,\n\nPara poder preparar el presupuesto necesitamos el plano 2D cotado en PDF o imagen legible, con material, tolerancias y cantidades. Los archivos STEP/DXF ayudan como contexto, pero no sustituyen al plano de fabricacion.\n\nUn saludo,',
      confidence_score: 0.95,
      requires_human_review: true,
      blocking_reasons: ['Falta plano 2D cotado'],
    }) as ValidacionPlano
    return { data, raw: JSON.stringify(data, null, 2), usage: { provider: ai.provider, inputTokens: 0, outputTokens: 0, estimatedCostEur: 0, durationMs: 0 } }
  }

  if (ai.provider === 'mock') {
    const data = validacionPlanoSchema.parse(mockValidacion(planos)) as ValidacionPlano
    return { data, raw: JSON.stringify(data, null, 2), usage: mockUsage() }
  }

  const prompt = `${cargarPromptSkill('validar-plano')}

---
EMAIL DEL CLIENTE:
${email}

ARCHIVOS:
${planos.map(describirPlano).join('\n')}

REGLAS PARA PDF MULTIPAGINA:
- Si un PDF tiene mas de una pagina, evalua la legibilidad pagina por pagina.
- No asumas que un PDF multipagina es una sola pieza: puede contener varias piezas, conjuntos o revisiones.
- Si hay paginas insuficientes, indica el archivo y pagina aproximada en problemas y blocking_reasons.
- Si el PDF multipagina es legible en general pero requiere revision humana por separacion de piezas, marca DUDOSO, no NO_PROCESABLE.

REGLAS DE LEGIBILIDAD TECNICA:
- Revisa especificamente cajetin/title block, tabla de revisiones, notas generales, tabla de materiales/listado de piezas y detalles ampliados.
- No marques como problema "material no especificado" si aparece en cajetin, notas, tabla de materiales o email.
- Si el material parece estar en el cajetin pero es ilegible, indica archivo, pagina y zona aproximada.
- Si el plano es procesable pero algunos campos criticos requieren confirmacion, marca DUDOSO con blocking_reasons claros.

Devuelve SOLO JSON valido con este formato exacto:
{
  "resultado": "PROCESABLE" | "DUDOSO" | "NO_PROCESABLE",
  "problemas": ["..."],
  "email_sugerido": "...",
  "confidence_score": 0.0,
  "requires_human_review": true,
  "blocking_reasons": ["..."]
}`

  const response = await ai.visionJson(prompt, planos)
  let parsed: ValidacionPlano
  try {
    parsed = parseJsonDefensivo(response.raw, validacionPlanoSchema, 'validarPlano') as ValidacionPlano
  } catch {
    const retryResponse = await ai.visionJson(prompt + RETRY_JSON_SUFFIX, planos)
    parsed = parseJsonDefensivo(retryResponse.raw, validacionPlanoSchema, 'validarPlano') as ValidacionPlano
  }
  const data = normalizarValidacion(parsed, principales)
  return { ...response, data }
}

function describirPlano(plano: PlanoEntrada): string {
  const metadata = Object.entries(plano.metadata)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  return `- ${plano.nombre} (${plano.mimeType}${metadata ? `; ${metadata}` : ''})`
}

function normalizarValidacion(validacion: ValidacionPlano, principales: PlanoEntrada[]): ValidacionPlano {
  if (validacion.resultado !== 'NO_PROCESABLE' || principales.length === 0) return validacion
  const texto = [...validacion.problemas, ...validacion.blocking_reasons].join(' ').toLowerCase()
  const sinPlano = /no hay plano|falta plano|no contiene plano|solo hay step|solo hay dxf/.test(texto)
  const ilegibleTotal = /totalmente ilegible|completamente ilegible|no se puede leer ninguna cota|archivo corrupto/.test(texto)
  if (sinPlano || ilegibleTotal) return validacion

  return {
    ...validacion,
    resultado: 'DUDOSO',
    requires_human_review: true,
    problemas: [
      ...validacion.problemas,
      'Postproceso: hay plano 2D adjunto; se permite generar borrador interno aunque falten aclaraciones.',
    ],
    blocking_reasons: validacion.blocking_reasons.filter((reason) => !/no procesable/i.test(reason)),
  }
}
