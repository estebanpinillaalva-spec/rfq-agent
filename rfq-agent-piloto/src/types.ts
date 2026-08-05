import { z } from 'zod'

export const resultadoValidacionSchema = z.enum(['PROCESABLE', 'DUDOSO', 'NO_PROCESABLE'])
export type ResultadoValidacion = z.infer<typeof resultadoValidacionSchema>

export const nivelComplejidadSchema = z.enum(['BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'])
export type NivelComplejidad = z.infer<typeof nivelComplejidadSchema>

export const estadoProcesoSchema = z.enum(['COMPLETADO', 'BLOQUEADO_CON_MOTIVO', 'ERROR_RECUPERABLE'])
export type EstadoProceso = z.infer<typeof estadoProcesoSchema>

const optionalTextSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? '')

const requiredTextSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? 'No especificado')

const optionalStringArraySchema = z
  .array(z.string())
  .nullable()
  .optional()
  .transform((value) => value ?? [])

export const validacionPlanoSchema = z.object({
  resultado: resultadoValidacionSchema,
  problemas: z.array(z.string()),
  email_sugerido: z.string().nullable().transform((value) => value ?? ''),
  confidence_score: z.number().min(0).max(1).default(0.75),
  requires_human_review: z.boolean().default(true),
  blocking_reasons: z.array(z.string()).default([]),
})
export type ValidacionPlano = z.infer<typeof validacionPlanoSchema>

export const piezaAnalisisSchema = z.object({
  denominacion: requiredTextSchema,
  numero_plano: requiredTextSchema,
  archivo_origen: z.string().optional(),
  pagina_pdf: z.number().int().positive().nullable().optional(),
  trazabilidad_confianza: z.string().optional(),
  revision_plano: optionalTextSchema,
  escala: optionalTextSchema,
  cajetin_texto: optionalTextSchema,
  material_fuente: optionalTextSchema,
  cantidad_fuente: optionalTextSchema,
  dimensiones_fuente: optionalTextSchema,
  tolerancias_fuente: optionalTextSchema,
  acabado_fuente: optionalTextSchema,
  revision_fuente: optionalTextSchema,
  material: requiredTextSchema,
  dimensiones: requiredTextSchema,
  tolerancias_generales: requiredTextSchema,
  tolerancias_criticas: z.array(z.string()),
  gdt: z.array(z.string()),
  acabado: requiredTextSchema,
  tratamientos: optionalStringArraySchema,
  recubrimientos: optionalStringArraySchema,
  roscas: optionalStringArraySchema,
  agujeros: optionalStringArraySchema,
  ajustes: optionalStringArraySchema,
  chaflanes_radios: optionalStringArraySchema,
  rugosidades: optionalStringArraySchema,
  notas_plano: optionalStringArraySchema,
  zonas_revisadas: optionalStringArraySchema,
  campos_no_encontrados: optionalStringArraySchema,
  operaciones: z.array(z.string()),
  caracteristicas_criticas: z.array(z.string()),
  complejidad: nivelComplejidadSchema,
  tiempo_estimado_min: z.number(),
  subcontratas: z.array(z.string()),
  flags: z.array(z.string()),
})
export type PiezaAnalisis = z.infer<typeof piezaAnalisisSchema>

export const analisisRFQSchema = z.object({
  ref_interna: requiredTextSchema,
  timestamp: requiredTextSchema,
  cliente: z.object({
    empresa: requiredTextSchema,
    contacto: requiredTextSchema,
    email: requiredTextSchema,
    idioma: requiredTextSchema,
  }),
  cantidades: z.record(z.number()),
  plazo_solicitado: requiredTextSchema,
  piezas: z.array(piezaAnalisisSchema),
  dfm: z.object({
    riesgos: z.array(z.string()),
    sugerencias: z.array(z.string()),
    ambiguedades: z.array(z.string()),
  }),
  complejidad_global: nivelComplejidadSchema,
  tiempo_total_min: z.number(),
  subcontratas_necesarias: z.array(z.string()),
  email_respuesta: requiredTextSchema,
  confidence_score: z.number().min(0).max(1).default(0.75),
  requires_human_review: z.boolean().default(true),
  blocking_reasons: z.array(z.string()).default([]),
})
export type AnalisisRFQ = z.infer<typeof analisisRFQSchema>

export const lineaPresupuestoSchema = z.object({
  denominacion: z.string(),
  cantidad: z.number(),
  pvp_unitario: z.number(),
  subtotal: z.number(),
  operaciones: z.string(),
  plazo_dias: z.number(),
  desglose: z
    .object({
      coste_material: z.number(),
      coste_operaciones: z.number(),
      coste_setup: z.number(),
      coste_subcontratas: z.number(),
      overhead: z.number(),
      margen: z.number(),
      coste_material_total: z.number().optional(),
      peso_estimado_kg: z.number().nullable().optional(),
      precio_material_eur_kg: z.number().nullable().optional(),
      desperdicio_pct: z.number().optional(),
      estado_material: z.enum(['calculado', 'orientativo', 'requiere_revision']).optional(),
      material_normalizado: z.string().optional(),
      material_confianza: z.enum(['ALTA', 'MEDIA', 'BAJA']).optional(),
      avisos_material: z.array(z.string()).optional(),
      riesgo_pct: z.number().optional(),
    })
    .optional(),
})
export type LineaPresupuesto = z.infer<typeof lineaPresupuestoSchema>

export const materialConfianzaSchema = z.enum(['ALTA', 'MEDIA', 'BAJA'])
export type MaterialConfianza = z.infer<typeof materialConfianzaSchema>

export const materialFamiliaSchema = z.enum(['acero', 'aluminio', 'inox', 'laton', 'cobre', 'plastico_tecnico', 'otro'])
export type MaterialFamilia = z.infer<typeof materialFamiliaSchema>

export const materialBibliotecaItemSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  familia: materialFamiliaSchema,
  aliases: z.array(z.string()).default([]),
  densidad_g_cm3: z.number().positive(),
  formato_habitual: z.string(),
  precio_eur_kg: z.number().nonnegative(),
  desperdicio_pct: z.number().min(0).max(1).default(0.15),
  minimo_compra_kg: z.number().nonnegative().default(1),
  proveedor: z.string().default('Proveedor local'),
  fecha_actualizacion: z.string(),
  confianza: materialConfianzaSchema.default('MEDIA'),
  fuente_referencia: z.string().default('Precio local editable del taller'),
  notas: z.string().default(''),
})
export type MaterialBibliotecaItem = z.infer<typeof materialBibliotecaItemSchema>

export const materialBibliotecaSchema = z.object({
  version: z.enum(['1.0', '1.1']),
  moneda: z.literal('EUR'),
  unidad_precio: z.literal('kg'),
  updated_at: z.string(),
  stale_after_days: z.number().int().positive().default(45),
  fuentes_publicas: z.array(z.object({ nombre: z.string(), url: z.string(), uso: z.string() })).default([]),
  materiales: z.array(materialBibliotecaItemSchema),
})
export type MaterialBiblioteca = z.infer<typeof materialBibliotecaSchema>

export const presupuestoRFQSchema = z.object({
  ref_interna: z.string(),
  fecha: z.string(),
  validez_dias: z.number(),
  lineas: z.array(lineaPresupuestoSchema),
  subtotal: z.number(),
  iva: z.number(),
  total: z.number(),
  plazo_entrega_dias: z.number(),
  condiciones: z.string(),
  observaciones_tecnicas: z.string(),
  markdown: z.string(),
  confidence_score: z.number().min(0).max(1).default(0.75),
  requires_human_review: z.boolean().default(true),
  blocking_reasons: z.array(z.string()).default([]),
})
export type PresupuestoRFQ = z.infer<typeof presupuestoRFQSchema>

export const qualityVerdictSchema = z.enum(['BORRADOR_INTERNO', 'ACLARACIONES_NECESARIAS', 'NO_PROCESABLE'])
export type QualityVerdict = z.infer<typeof qualityVerdictSchema>

export const qualitySeveritySchema = z.enum(['INFO', 'AVISO', 'CRITICO'])
export type QualitySeverity = z.infer<typeof qualitySeveritySchema>

export const qualityCategorySchema = z.enum(['Datos comerciales', 'Plano/cajetin', 'Fabricacion', 'Riesgos DFM', 'Coste/plazo'])
export type QualityCategory = z.infer<typeof qualityCategorySchema>

export const qualityIssueSchema = z.object({
  categoria: qualityCategorySchema,
  severidad: qualitySeveritySchema,
  pieza: z.string().optional(),
  campo: z.string(),
  mensaje: z.string(),
})
export type QualityIssue = z.infer<typeof qualityIssueSchema>

export const qualityPieceScoreSchema = z.object({
  pieza: z.string(),
  score: z.number().min(0).max(100),
  veredicto: qualityVerdictSchema,
  issues: z.array(qualityIssueSchema),
})
export type QualityPieceScore = z.infer<typeof qualityPieceScoreSchema>

export const qualityGroupSchema = z.object({
  categoria: qualityCategorySchema,
  severidad_maxima: qualitySeveritySchema,
  total: z.number(),
  resumen: z.string(),
  issues: z.array(qualityIssueSchema),
})
export type QualityGroup = z.infer<typeof qualityGroupSchema>

export const qualityReportSchema = z.object({
  version: z.literal('1.0'),
  ref_interna: z.string(),
  generated_at: z.string(),
  score_global: z.number().min(0).max(100),
  veredicto: qualityVerdictSchema,
  resumen_ejecutivo: z.string(),
  piezas_total: z.number(),
  piezas: z.array(qualityPieceScoreSchema),
  grupos: z.array(qualityGroupSchema),
  top_issues: z.array(qualityIssueSchema),
  preguntas_cliente: z.array(z.string()),
  listo_para_envio_cliente: z.boolean(),
  requiere_revision_humana: z.boolean(),
})
export type QualityReport = z.infer<typeof qualityReportSchema>

export const configTallerSchema = z.object({
  nombre: z.string(),
  cif: z.string(),
  email: z.string(),
  precios_hora: z.record(z.number()),
  margen_por_complejidad: z.record(nivelComplejidadSchema, z.number()),
  plazo_estandar_dias: z.number(),
  condiciones_pago: z.string(),
  iva_porcentaje: z.number().default(0.21),
  validez_dias: z.number().default(15),
  overhead_porcentaje: z.number().default(0.18),
  capacidad_diaria_horas: z.number().default(7),
  materiales_eur_kg: z.record(z.number()).default({}),
  setup_min_por_operacion: z.record(z.number()).default({}),
  subcontratas: z.record(z.object({ coste_minimo: z.number(), plazo_dias: z.number() })).default({}),
})
export type ConfigTaller = z.infer<typeof configTallerSchema>

export const planoEntradaSchema = z.object({
  nombre: z.string(),
  ruta: z.string(),
  extension: z.string(),
  mimeType: z.string(),
  base64: z.string(),
  textoExtraido: z.string().optional(),
  esFuentePrincipal: z.boolean().default(true),
  metadata: z.record(z.string()).default({}),
})
export type PlanoEntrada = z.infer<typeof planoEntradaSchema>

export interface RFQEntrada {
  carpeta: string
  nombreCarpeta: string
  email: string
  planos: PlanoEntrada[]
  config: ConfigTaller
}

export interface ResultadoProceso {
  estado: EstadoProceso
  validacion?: ValidacionPlano
  analisis?: AnalisisRFQ
  presupuesto?: PresupuestoRFQ
  blocking_reasons: string[]
  error?: string
}

export interface LlmUsage {
  provider: 'mock' | 'gemini'
  inputTokens: number
  outputTokens: number
  estimatedCostEur: number
  durationMs: number
}

export interface LlmResult<T> {
  data: T
  raw: string
  usage: LlmUsage
}

export type AiProviderName = 'mock' | 'gemini'

export const formaPiezaSchema = z.enum(['prismatica', 'cilindrica'])
export type FormaPieza = z.infer<typeof formaPiezaSchema>

export const verdadDimensionesSchema = z.object({
  forma: formaPiezaSchema,
  cotas_mm: z.array(z.number().positive()).min(2).max(3),
})

export const verdadPrecioReferenciaSchema = z.object({
  valor_eur: z.number().positive(),
  cantidad: z.number().int().positive(),
  fuente: z.string().min(1),
  fecha: z.string().min(1),
})

export const verdadCasoSchema = z
  .object({
    version: z.literal('1.0'),
    caso_id: z.string().min(1),
    procedencia: z.enum(['cad_publico_plano_generado', 'taller_real_anonimizado']),
    numero_plano: z.string().min(1),
    material: z.string().min(1),
    cantidad: z.number().int().positive(),
    dimensiones: verdadDimensionesSchema,
    tolerancia_general: z.string().min(1),
    acabado: z.string().min(1),
    plazo_dias: z.number().int().positive().nullable(),
    precio_referencia: verdadPrecioReferenciaSchema.nullable(),
  })
  .superRefine((valor, ctx) => {
    const esperadas = valor.dimensiones.forma === 'prismatica' ? 3 : 2
    if (valor.dimensiones.cotas_mm.length !== esperadas) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dimensiones', 'cotas_mm'],
        message: `La forma ${valor.dimensiones.forma} exige ${esperadas} cotas`,
      })
    }
  })
export type VerdadCaso = z.infer<typeof verdadCasoSchema>
