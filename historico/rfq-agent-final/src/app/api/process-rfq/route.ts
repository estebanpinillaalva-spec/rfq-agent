import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { geminiVision } from '@/lib/gemini'
import { claudeText } from '@/lib/claude'
import { enviarRespuestaRFQ } from '@/lib/resend'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { TallerConfig, AnalisisRFQ } from '@/types'

// Carga el contenido de una skill como prompt
function cargarSkill(nombreSkill: string): string {
  const skillPath = join(process.cwd(), 'skills', nombreSkill, 'SKILL.md')
  try {
    return readFileSync(skillPath, 'utf-8')
  } catch {
    console.warn(`Skill ${nombreSkill} no encontrada en ${skillPath}`)
    return ''
  }
}

export async function POST(request: NextRequest) {
  const inicioMs = Date.now()

  // Verificar que la llamada viene del sistema interno
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { rfq_id, taller_id, email_origen, email_body, taller_config } =
    await request.json()

  try {
    // Obtener URLs de planos del RFQ
    const { data: rfq } = await supabaseAdmin
      .from('rfqs')
      .select('planos_urls')
      .eq('id', rfq_id)
      .single()

    if (!rfq) throw new Error('RFQ no encontrado')

    // ── PASO 1: Validar cada plano con skill validar-plano ──────────────
    const skillValidar = cargarSkill('validar-plano')
    const planosParaValidar = rfq.planos_urls as string[]

    // Descargar planos como base64 para enviar a Gemini
    const planosBase64 = await Promise.all(
      planosParaValidar.map(async (url) => {
        const res = await fetch(url)
        const buffer = Buffer.from(await res.arrayBuffer())
        const mimeType = url.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
        return { data: buffer.toString('base64'), mimeType, url }
      })
    )

    const promptValidacion = `
${skillValidar}

---
EMAIL DEL CLIENTE:
${email_body}

Valida los planos adjuntos siguiendo la skill y devuelve el resultado en JSON con este formato:
{
  "resultado": "PROCESABLE" | "DUDOSO" | "NO_PROCESABLE",
  "problemas": ["..."],
  "email_cliente": "... (si aplica)"
}
`
    const validacionRaw = await geminiVision(
      promptValidacion,
      planosBase64.map((p) => ({ data: p.data, mimeType: p.mimeType }))
    )

    let validacion: { resultado: string; problemas: string[]; email_cliente?: string }
    try {
      const jsonMatch = validacionRaw.match(/\{[\s\S]*\}/)
      validacion = jsonMatch ? JSON.parse(jsonMatch[0]) : { resultado: 'NO_PROCESABLE', problemas: ['Error parseando respuesta'] }
    } catch {
      validacion = { resultado: 'NO_PROCESABLE', problemas: ['Error parseando respuesta de Gemini'] }
    }

    if (validacion.resultado === 'NO_PROCESABLE') {
      await supabaseAdmin.from('rfqs').update({ estado: 'error', error_log: validacion.problemas.join(', ') }).eq('id', rfq_id)
      // TODO: enviar email pidiendo mejor plano usando validacion.email_cliente
      return NextResponse.json({ ok: true, resultado: 'NO_PROCESABLE' })
    }

    // ── PASO 2: Procesar RFQ con skill procesar-rfq ──────────────────────
    const skillProcesar = cargarSkill('procesar-rfq')
    const tablaOperaciones = cargarSkill('procesar-rfq') // TODO: cargar references/tabla-operaciones.md
    const tablaMateriales = cargarSkill('procesar-rfq')  // TODO: cargar references/tabla-materiales.md

    const promptProcesar = `
${skillProcesar}

---
EMAIL DEL CLIENTE:
${email_body}

Analiza los planos adjuntos y devuelve el análisis completo en JSON siguiendo la plantilla de la skill.
Responde SOLO con el JSON, sin texto adicional.
`
    const analisisRaw = await geminiVision(
      promptProcesar,
      planosBase64.map((p) => ({ data: p.data, mimeType: p.mimeType }))
    )

    let analisis: AnalisisRFQ
    try {
      const jsonMatch = analisisRaw.match(/\{[\s\S]*\}/)
      analisis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      throw new Error('Error parseando análisis de Gemini')
    }

    if (!analisis) throw new Error('Análisis vacío')

    // ── PASO 3: Generar presupuesto con skill generar-presupuesto ────────
    const skillPresupuesto = cargarSkill('generar-presupuesto')

    const promptPresupuesto = `
${skillPresupuesto}

---
ANÁLISIS DEL RFQ:
${JSON.stringify(analisis, null, 2)}

CONFIGURACIÓN DEL TALLER:
${JSON.stringify(taller_config as TallerConfig, null, 2)}

Genera el presupuesto en JSON siguiendo exactamente la plantilla de la skill.
Responde SOLO con el JSON, sin texto adicional.
`
    const presupuestoRaw = await claudeText(promptPresupuesto)

    let presupuesto
    try {
      const jsonMatch = presupuestoRaw.match(/\{[\s\S]*\}/)
      presupuesto = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      throw new Error('Error parseando presupuesto de Claude')
    }

    // ── PASO 4: Guardar en BD ────────────────────────────────────────────
    const tiempoMs = Date.now() - inicioMs
    await supabaseAdmin
      .from('rfqs')
      .update({
        estado: 'completado',
        analisis,
        presupuesto,
        tiempo_proc_ms: tiempoMs,
      })
      .eq('id', rfq_id)

    // ── PASO 5: Enviar email respuesta ───────────────────────────────────
    // TODO: generar PDF con Puppeteer (sprint 3)
    // Por ahora enviamos el análisis en texto
    const bodyHtml = `
      <h2>Análisis RFQ — ${analisis.ref_interna}</h2>
      <p>Tiempo de procesamiento: ${Math.round(tiempoMs / 1000)}s</p>
      <pre style="font-family: monospace; white-space: pre-wrap;">
${JSON.stringify(analisis, null, 2)}
      </pre>
      <hr/>
      <p><em>⚠️ BORRADOR — pendiente de validación del estimador</em></p>
    `

    await enviarRespuestaRFQ({
      to: email_origen,
      refInterna: analisis.ref_interna,
      asunto: `[${analisis.ref_interna}] Análisis técnico listo`,
      bodyHtml,
    })

    return NextResponse.json({
      ok: true,
      rfq_id,
      tiempo_ms: tiempoMs,
      complejidad: analisis.estimacion?.complejidad_global,
    })

  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error procesando RFQ:', error)

    await supabaseAdmin
      .from('rfqs')
      .update({ estado: 'error', error_log: mensaje })
      .eq('id', rfq_id)

    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
