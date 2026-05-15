import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import puppeteer from 'puppeteer-core'
import type { AnalisisRFQ, ConfigTaller, PresupuestoRFQ } from '../types'

// Rutas habituales de Chrome/Chromium en Windows, macOS y Linux
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean)

function encontrarChrome(): string {
  const fromEnv = process.env.CHROME_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (found) return found
  throw new Error(
    'No se encontro Chrome/Chromium para generar el PDF. ' +
    'Instala Google Chrome o indica la ruta con CHROME_PATH en .env.local'
  )
}

export function buildPresupuestoHtml(presupuesto: PresupuestoRFQ, analisis: AnalisisRFQ, config: ConfigTaller): string {
  const ivaLabel = `IVA ${Math.round((presupuesto.iva / Math.max(presupuesto.subtotal, 0.01)) * 100)}%`

  const clientRows = presupuesto.lineas
    .map(
      (linea) => `<tr>
        <td><strong>${escapeHtml(linea.denominacion)}</strong></td>
        <td class="num">${linea.cantidad}</td>
        <td class="num">${fmtEur(linea.pvp_unitario)}</td>
        <td class="num"><strong>${fmtEur(linea.subtotal)}</strong></td>
        <td class="num">${linea.plazo_dias} d.</td>
      </tr>`
    )
    .join('')

  const internalRows = presupuesto.lineas
    .map((linea) => {
      const d = linea.desglose
      if (!d) return `<tr><td colspan="9">${escapeHtml(linea.denominacion)}</td></tr>`
      return `<tr>
        <td><strong>${escapeHtml(linea.denominacion)}</strong><br/><span class="mat-tag">${escapeHtml(d.material_normalizado ?? '—')}</span></td>
        <td class="num">${linea.cantidad}</td>
        <td class="num">${d.peso_estimado_kg != null ? d.peso_estimado_kg.toFixed(2) : '—'}</td>
        <td class="num">${d.precio_material_eur_kg != null ? fmtEur(d.precio_material_eur_kg) : '—'}</td>
        <td class="num">${fmtEur(d.coste_material)}</td>
        <td class="num">${fmtEur(d.coste_operaciones)}</td>
        <td class="num">${fmtEur(d.coste_setup)}</td>
        <td class="num">${fmtEur(d.overhead)}</td>
        <td class="num">${Math.round(d.margen * 100)}% + ${Math.round((d.riesgo_pct ?? 0) * 100)}%</td>
      </tr>`
    })
    .join('')

  const obsClientLines = presupuesto.observaciones_tecnicas
    .split('\n')
    .filter((l) => !l.startsWith('BORRADOR') && !l.startsWith('La base de precios') && !l.startsWith('Bloqueo:'))
    .filter((l) => l.trim())
    .join('\n')

  const draftWatermark = presupuesto.requires_human_review
    ? `<div class="draft-stamp">BORRADOR</div>`
    : ''

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Presupuesto ${escapeHtml(presupuesto.ref_interna)}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
      @bottom-right { content: "Pag. " counter(page) " / " counter(pages); font-size: 8px; color: #9ca3af; margin-bottom: 10mm; margin-right: 18mm; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.5; }

    /* ── HEADER ─────────────────────────────────────────── */
    .header { background: #1e293b; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 14px 18mm; }
    .logo-block { display: flex; flex-direction: column; gap: 2px; }
    .logo-mark { width: 36px; height: 36px; background: #f97316; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: #fff; letter-spacing: -1px; margin-bottom: 6px; }
    .logo-name { font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
    .logo-cif { font-size: 9px; color: #94a3b8; margin-top: 1px; }
    .doc-block { text-align: right; }
    .doc-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; }
    .doc-ref { font-size: 18px; font-weight: 900; color: #f8fafc; margin-top: 2px; }
    .doc-meta { font-size: 9px; color: #94a3b8; margin-top: 3px; }

    /* ── PAGE BODY ───────────────────────────────────────── */
    .body { padding: 16px 18mm 20px; }

    /* ── DRAFT STAMP ─────────────────────────────────────── */
    .draft-stamp { display: inline-block; background: #fef3c7; border: 1.5px solid #f59e0b; color: #92400e; font-size: 9px; font-weight: 900; letter-spacing: 0.14em; padding: 3px 10px; margin-bottom: 14px; }

    /* ── INFO ROW ─────────────────────────────────────────── */
    .info-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 10px 12px; }
    .info-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
    .info-value { font-size: 12px; font-weight: 700; color: #0f172a; }
    .info-sub { font-size: 9px; color: #64748b; margin-top: 2px; }

    /* ── SECTION TITLE ───────────────────────────────────── */
    .section-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 18px 0 10px; }

    /* ── TABLE (shared) ──────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    thead th { background: #1e293b; color: #f8fafc; font-size: 9px; font-weight: 600; padding: 7px 8px; text-align: left; letter-spacing: 0.03em; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th.num { text-align: right; }
    tbody tr { page-break-inside: avoid; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    td { padding: 7px 8px; font-size: 10px; vertical-align: top; border-bottom: 1px solid #e2e8f0; }
    .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .mat-tag { display: inline-block; background: #e2e8f0; font-size: 8px; padding: 1px 5px; border-radius: 2px; color: #475569; margin-top: 2px; }

    /* ── TOTALS ──────────────────────────────────────────── */
    .totals-wrap { display: flex; justify-content: flex-end; margin-top: 14px; }
    .totals { width: 240px; border: 1px solid #e2e8f0; border-radius: 3px; overflow: hidden; }
    .tot-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 10px; border-bottom: 1px solid #e2e8f0; }
    .tot-total { background: #1e293b; color: #fff; font-size: 13px; font-weight: 900; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-bottom: none; }
    .tot-label { color: inherit; }
    .tot-value { font-variant-numeric: tabular-nums; }

    /* ── CONDITIONS ──────────────────────────────────────── */
    .cond-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 10px 12px; font-size: 10px; white-space: pre-wrap; color: #334155; }

    /* ── ACCEPTANCE AREA ─────────────────────────────────── */
    .acceptance { margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 3px; padding: 14px 16px; }
    .acceptance-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 10px; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 8px; }
    .sign-block { font-size: 9px; color: #64748b; }
    .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
    .sign-label { font-weight: 600; }

    /* ── PAGE FOOTER ─────────────────────────────────────── */
    .page-footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8px; color: #94a3b8; }

    /* ── INTERNAL PAGE ───────────────────────────────────── */
    .internal-page { page-break-before: always; padding: 16px 18mm 20px; }
    .internal-header { background: #fef3c7; border: 1.5px solid #f59e0b; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-radius: 3px; }
    .internal-header-title { font-size: 11px; font-weight: 900; color: #92400e; letter-spacing: 0.05em; }
    .internal-header-sub { font-size: 9px; color: #a16207; }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- PÁGINA 1 — VERSIÓN CLIENTE                            -->
  <!-- ══════════════════════════════════════════════════════ -->

  <div class="header">
    <div class="logo-block">
      <div class="logo-mark">${escapeHtml(config.nombre.slice(0, 2).toUpperCase())}</div>
      <div class="logo-name">${escapeHtml(config.nombre)}</div>
      <div class="logo-cif">CIF: ${escapeHtml(config.cif)}</div>
    </div>
    <div class="doc-block">
      <div class="doc-title">Presupuesto</div>
      <div class="doc-ref">${escapeHtml(presupuesto.ref_interna)}</div>
      <div class="doc-meta">
        Fecha: ${escapeHtml(presupuesto.fecha)} &nbsp;|&nbsp; Validez: ${presupuesto.validez_dias} dias
      </div>
    </div>
  </div>

  <div class="body">
    ${draftWatermark}

    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Cliente</div>
        <div class="info-value">${escapeHtml(analisis.cliente.empresa)}</div>
        <div class="info-sub">${escapeHtml(analisis.cliente.contacto)}${analisis.cliente.email ? ` &nbsp;|&nbsp; ${escapeHtml(analisis.cliente.email)}` : ''}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Plazo de entrega</div>
        <div class="info-value">${presupuesto.plazo_entrega_dias} dias laborables</div>
        <div class="info-sub">Desde conf. pedido y recepcion material</div>
      </div>
      <div class="info-box">
        <div class="info-label">Partidas</div>
        <div class="info-value">${analisis.piezas.length} pieza(s)</div>
        <div class="info-sub">${escapeHtml(analisis.complejidad_global)} complejidad</div>
      </div>
    </div>

    <div class="section-title">Partidas del presupuesto</div>
    <table>
      <thead>
        <tr>
          <th>Denominacion</th>
          <th class="num">Cant.</th>
          <th class="num">Precio unit. (EUR)</th>
          <th class="num">Subtotal (EUR)</th>
          <th class="num">Plazo</th>
        </tr>
      </thead>
      <tbody>${clientRows}</tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals">
        <div class="tot-row">
          <span class="tot-label">Subtotal sin IVA</span>
          <span class="tot-value">${fmtEur(presupuesto.subtotal)}</span>
        </div>
        <div class="tot-row">
          <span class="tot-label">${escapeHtml(ivaLabel)}</span>
          <span class="tot-value">${fmtEur(presupuesto.iva)}</span>
        </div>
        <div class="tot-row tot-total">
          <span class="tot-label">TOTAL</span>
          <span class="tot-value">${fmtEur(presupuesto.total)} EUR</span>
        </div>
      </div>
    </div>

    <div class="section-title">Condiciones comerciales</div>
    <div class="cond-box">${escapeHtml(presupuesto.condiciones)}</div>

    ${obsClientLines ? `<div class="section-title">Observaciones</div><div class="cond-box">${escapeHtml(obsClientLines)}</div>` : ''}

    <div class="acceptance">
      <div class="acceptance-title">Aceptacion del presupuesto</div>
      <div class="sign-grid">
        <div class="sign-block">
          <div>En _________________, a ______ de _________________ de _________</div>
          <div class="sign-line"></div>
          <div class="sign-label">Firma y sello del cliente</div>
          <div>${escapeHtml(analisis.cliente.empresa)}</div>
        </div>
        <div class="sign-block">
          <div>El proveedor</div>
          <div class="sign-line"></div>
          <div class="sign-label">Firma y sello del proveedor</div>
          <div>${escapeHtml(config.nombre)}</div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>${escapeHtml(config.nombre)} &nbsp;|&nbsp; CIF: ${escapeHtml(config.cif)} &nbsp;|&nbsp; ${escapeHtml(config.email)}</span>
      <span>Los precios son validos durante ${presupuesto.validez_dias} dias desde la fecha del presupuesto.</span>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- PÁGINA 2 — DESGLOSE INTERNO (NO ENVIAR AL CLIENTE)   -->
  <!-- ══════════════════════════════════════════════════════ -->

  <div class="internal-page">
    <div class="internal-header">
      <div>
        <div class="internal-header-title">DESGLOSE INTERNO DE COSTE — NO ENVIAR AL CLIENTE</div>
        <div class="internal-header-sub">${escapeHtml(presupuesto.ref_interna)} &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-ES')}</div>
      </div>
      <div style="font-size:9px;color:#a16207;">Confidence: ${Math.round((presupuesto.confidence_score ?? 0) * 100)}%</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Pieza / Material</th>
          <th class="num">Cant.</th>
          <th class="num">Peso (kg)</th>
          <th class="num">€/kg</th>
          <th class="num">Mat. unit.</th>
          <th class="num">Ops. unit.</th>
          <th class="num">Setup unit.</th>
          <th class="num">Overhead</th>
          <th class="num">Margen+Riesgo</th>
        </tr>
      </thead>
      <tbody>${internalRows}</tbody>
    </table>

    <div class="totals-wrap" style="margin-top:12px;">
      <div class="totals">
        <div class="tot-row"><span>Subtotal</span><span>${fmtEur(presupuesto.subtotal)} EUR</span></div>
        <div class="tot-row"><span>${escapeHtml(ivaLabel)}</span><span>${fmtEur(presupuesto.iva)} EUR</span></div>
        <div class="tot-row tot-total"><span>TOTAL</span><span>${fmtEur(presupuesto.total)} EUR</span></div>
      </div>
    </div>

    ${presupuesto.observaciones_tecnicas ? `
    <div class="section-title" style="margin-top:18px;">Observaciones tecnicas internas</div>
    <div class="cond-box">${escapeHtml(presupuesto.observaciones_tecnicas)}</div>
    ` : ''}

    ${presupuesto.blocking_reasons?.length ? `
    <div class="section-title" style="margin-top:14px;color:#b45309;">Motivos de bloqueo / revision obligatoria</div>
    <div class="cond-box" style="border-color:#f59e0b;background:#fffbeb;">
${escapeHtml(presupuesto.blocking_reasons.join('\n'))}</div>
    ` : ''}
  </div>

</body>
</html>`
}

function fmtEur(value: number): string {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function writeHtmlAndPdf(htmlPath: string, pdfPath: string, html: string): Promise<void> {
  await mkdir(dirname(htmlPath), { recursive: true })
  await writeFile(htmlPath, html, 'utf8')

  const executablePath = encontrarChrome()
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true })
  } finally {
    await browser.close()
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
