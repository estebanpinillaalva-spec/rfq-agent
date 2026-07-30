import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verificarFirmaWebhook } from '@/lib/resend'
import type { ResendInboundPayload } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // 1. Verificar que el webhook viene de Resend
    const headers: Record<string, string | undefined> = {}
    request.headers.forEach((value, key) => { headers[key] = value })

    if (!verificarFirmaWebhook(body, headers)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const payload: ResendInboundPayload = JSON.parse(body)

    // 2. Identificar el taller por el email destino
    // El email mágico tiene formato: rfq-{slug}@dominio.com
    const emailTo = Array.isArray(payload.to) ? payload.to[0] : payload.to
    const { data: taller, error: tallerError } = await supabaseAdmin
      .from('talleres')
      .select('*')
      .eq('email_magico', emailTo)
      .eq('activo', true)
      .single()

    if (tallerError || !taller) {
      console.error('Taller no encontrado para email:', emailTo)
      return NextResponse.json({ error: 'Taller no encontrado' }, { status: 404 })
    }

    // 3. Crear registro del RFQ en la BD
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .insert({
        taller_id: taller.id,
        email_origen: payload.from,
        email_subject: payload.subject,
        estado: 'recibido',
        planos_urls: [],
      })
      .select()
      .single()

    if (rfqError || !rfq) {
      console.error('Error creando RFQ:', rfqError)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // 4. Subir los planos adjuntos a Supabase Storage
    const planosUrls: string[] = []

    for (const attachment of payload.attachments ?? []) {
      const isPdf = attachment.contentType === 'application/pdf'
      const isImage = attachment.contentType.startsWith('image/')
      if (!isPdf && !isImage) continue

      const buffer = Buffer.from(attachment.content, 'base64')
      const path = `rfqs/${rfq.id}/${attachment.filename}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('planos')
        .upload(path, buffer, { contentType: attachment.contentType })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('planos')
          .getPublicUrl(path)
        planosUrls.push(urlData.publicUrl)
      }
    }

    // 5. Actualizar el RFQ con las URLs de los planos
    await supabaseAdmin
      .from('rfqs')
      .update({ planos_urls: planosUrls, estado: 'procesando' })
      .eq('id', rfq.id)

    // 6. Disparar el procesamiento async (fire and forget)
    // En producción esto debería ser una queue (Inngest, BullMQ, Supabase Edge Functions)
    // Por ahora llamamos al endpoint de procesamiento sin await
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    fetch(`${appUrl}/api/process-rfq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
      },
      body: JSON.stringify({
        rfq_id: rfq.id,
        taller_id: taller.id,
        email_origen: payload.from,
        email_body: payload.text ?? payload.html ?? '',
        taller_config: taller.config,
      }),
    }).catch((err) => console.error('Error disparando procesamiento:', err))

    // 7. Responder rápido a Resend (debe ser <5s)
    return NextResponse.json({ ok: true, rfq_id: rfq.id }, { status: 200 })

  } catch (error) {
    console.error('Error en inbound-email:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
