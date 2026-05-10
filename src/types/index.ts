// Tipos compartidos del proyecto RFQ Agent

export type RFQEstado = 'recibido' | 'procesando' | 'completado' | 'error'

export type ComplejidadNivel = 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA'

export interface Taller {
  id: string
  created_at: string
  nombre: string
  email_owner: string
  email_magico: string
  config: TallerConfig
  activo: boolean
}

export interface TallerConfig {
  nombre_empresa: string
  cif: string
  direccion: string
  telefono: string
  email_comercial: string
  web?: string
  precios_hora_maquina: Record<string, number>
  margen_objetivo: Record<ComplejidadNivel, number>
  plazo_estandar_dias: number
  condiciones_pago: string
  validez_oferta_dias: number
}

export interface RFQ {
  id: string
  created_at: string
  taller_id: string
  email_origen: string
  email_subject: string
  estado: RFQEstado
  planos_urls: string[]
  analisis: AnalisisRFQ | null
  presupuesto: PresupuestoRFQ | null
  pdf_url: string | null
  tiempo_proc_ms: number | null
  error_log: string | null
}

export interface AnalisisRFQ {
  ref_interna: string
  fecha_procesamiento: string
  cliente: {
    empresa: string
    contacto: string
    email: string
    telefono?: string
    idioma_original: string
    plazo_solicitado?: string
    cantidades: Record<string, number>
    condiciones_especiales?: string[]
  }
  piezas: PiezaAnalisis[]
  dfm: {
    riesgos: string[]
    sugerencias: string[]
    ambiguedades: string[]
  }
  estimacion: {
    complejidad_global: ComplejidadNivel
    justificacion: string
    operaciones_criticas: string[]
    subcontratas: string[]
    tiempo_estimado_total_min: number
  }
  email_respuesta: string
  notas_estimador: string[]
}

export interface PiezaAnalisis {
  denominacion: string
  numero_plano: string
  revision: string
  cantidad: number
  material: string
  material_designacion_normalizada: string
  dimensiones: {
    general: string
    volumen_cm3?: number
    peso_kg?: number
  }
  tolerancias: {
    generales: string
    especiales: string[]
    gdt: string[]
  }
  acabado: {
    rugosidad_ra?: string
    recubrimientos: string[]
    tratamientos_termicos: string[]
  }
  operaciones: string[]
  caracteristicas_criticas: string[]
  complejidad: ComplejidadNivel
  tiempo_estimado_min: number
  subcontratas: string[]
  flags_revision: string[]
}

export interface PresupuestoRFQ {
  ref_interna: string
  fecha: string
  validez_dias: number
  cliente: {
    empresa: string
    contacto: string
    email: string
    ref_cliente?: string
  }
  lineas: LineaPresupuesto[]
  totales: {
    subtotal_piezas: number
    embalaje_gestion: number
    total_sin_iva: number
    iva_porcentaje: number
    iva_importe: number
    total_con_iva: number
  }
  plazo_entrega_dias: number
  condiciones: string
  observaciones_tecnicas?: string
  notas_internas?: string
}

export interface LineaPresupuesto {
  denominacion: string
  numero_plano: string
  material: string
  cantidad: number
  pvp_unitario: number
  subtotal: number
  operaciones_principales: string
  plazo_dias: number
  desglose_interno?: {
    coste_material: number
    coste_operaciones: number
    coste_subcontratas: number
    coste_indirecto: number
    margen_porcentaje: number
    beneficio_bruto: number
  }
}

// Payload del webhook de Resend Inbound
export interface ResendInboundPayload {
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  attachments?: ResendAttachment[]
  headers?: Record<string, string>
  messageId?: string
}

export interface ResendAttachment {
  filename: string
  content: string // base64
  contentType: string
  size: number
}
