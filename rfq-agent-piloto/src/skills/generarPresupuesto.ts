import type { AiClient } from '../llm/aiClient'
import {
  presupuestoRFQSchema,
  type AnalisisRFQ,
  type ConfigTaller,
  type LlmResult,
  type PresupuestoRFQ,
} from '../types'
import { generarPresupuestoDeterminista } from '../utils/costingEngine'

export async function generarPresupuesto(
  ai: AiClient,
  analisis: AnalisisRFQ,
  config: ConfigTaller
): Promise<LlmResult<PresupuestoRFQ>> {
  const started = Date.now()
  const data = presupuestoRFQSchema.parse(generarPresupuestoDeterminista(analisis, config)) as PresupuestoRFQ
  return {
    data,
    raw: JSON.stringify(data, null, 2),
    usage: {
      provider: ai.provider,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostEur: 0,
      durationMs: Date.now() - started,
    },
  }
}
