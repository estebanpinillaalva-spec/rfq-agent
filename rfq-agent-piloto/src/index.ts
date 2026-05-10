import { config as loadEnv } from 'dotenv'
import { createAiClient } from './llm/aiClient'
import { generarPresupuesto } from './skills/generarPresupuesto'
import { procesarRFQ } from './skills/procesarRFQ'
import { validarPlano } from './skills/validarPlano'
import type { LlmUsage } from './types'
import { color } from './utils/colors'
import { formatDuration, formatEuro } from './utils/format'
import { guardarError, guardarSalida } from './utils/guardarSalida'
import { leerEntradaRFQ } from './utils/leerArchivos'
import { enviarEmailSalida } from './utils/enviarEmail'

loadEnv({ path: '.env.local' })
loadEnv()

async function main(): Promise<void> {
  const start = Date.now()
  const carpetaArg = process.argv[2]

  printHeader()

  if (!carpetaArg) {
    throw new Error('Uso: npx ts-node --esm src/index.ts ./ejemplos/rfq-simple')
  }

  const entrada = await leerEntradaRFQ(carpetaArg)
  const ai = createAiClient()

  console.log(color.gray(`Proveedor IA: ${ai.provider === 'mock' ? 'mock local (0 EUR)' : 'Gemini'}`))
  console.log()
  console.log(color.cyan(`Cargando: ${carpetaArg}`))
  console.log(color.green(`   OK email.txt`))
  for (const plano of entrada.planos) {
    const paginas = plano.metadata.page_count && plano.metadata.page_count !== 'desconocido' ? ` (${plano.metadata.page_count} pag.)` : ''
    console.log(color.green(`   OK ${plano.nombre}${paginas}`))
  }
  console.log(color.green(`   OK config-taller.json`))
  console.log()

  const usages: LlmUsage[] = []

  console.log(color.cyan('PASO 1: Validando planos...'))
  const raw: Record<string, string> = {}
  raw.email = entrada.email
  const validacion = await validarPlano(ai, entrada.email, entrada.planos)
  raw.validacion = validacion.raw
  usages.push(validacion.usage)
  console.log(
    color.green(
      `   OK ${entrada.planos.map((plano) => plano.nombre).join(', ')} -> ${validacion.data.resultado} (${formatDuration(validacion.usage.durationMs)}, ${formatEuro(validacion.usage.estimatedCostEur)})`
    )
  )
  if (validacion.data.problemas.length > 0) {
    for (const problema of validacion.data.problemas) console.log(color.yellow(`      - ${problema}`))
  }
  console.log()

  if (validacion.data.resultado === 'NO_PROCESABLE') {
    const reason = [...validacion.data.problemas, ...validacion.data.blocking_reasons].join('; ')
    const dir = await guardarError({ nombreCarpeta: entrada.nombreCarpeta, error: reason || 'RFQ bloqueado por validacion', raw })
    console.log(color.yellow(`RFQ bloqueado con motivo: ${reason}`))
    console.log(color.cyan(`Salida guardada en: ${dir}`))
    return
  }

  console.log(color.cyan('PASO 2: Procesando RFQ...'))
  const analisis = await procesarRFQ(ai, entrada.email, entrada.planos, validacion.data)
  raw.analisis = analisis.raw
  usages.push(analisis.usage)
  for (const pieza of analisis.data.piezas) {
    console.log(color.green(`   OK ${pieza.denominacion} - ${pieza.complejidad} complejidad`))
  }
  console.log(
    color.green(
      `   Analisis completado (${formatDuration(analisis.usage.durationMs)}, ${formatEuro(analisis.usage.estimatedCostEur)})`
    )
  )
  console.log()

  console.log(color.cyan('PASO 3: Generando presupuesto...'))
  const presupuesto = await generarPresupuesto(ai, analisis.data, entrada.config)
  raw.presupuesto = presupuesto.raw
  usages.push(presupuesto.usage)
  console.log(color.green(`   OK Total: ${formatEuro(presupuesto.data.total)} IVA incluido`))
  console.log(color.green(`   OK Plazo: ${presupuesto.data.plazo_entrega_dias} dias laborables`))
  console.log(
    color.green(
      `   Presupuesto generado (${formatDuration(presupuesto.usage.durationMs)}, ${formatEuro(presupuesto.usage.estimatedCostEur)})`
    )
  )
  console.log()

  const salida = await guardarSalida({
    nombreCarpeta: entrada.nombreCarpeta,
    validacion: validacion.data,
    analisis: analisis.data,
    presupuesto: presupuesto.data,
    config: entrada.config,
    planos: entrada.planos,
    raw,
  })

  const totalCost = usages.reduce((sum, usage) => sum + usage.estimatedCostEur, 0)
  const totalTokens = usages.reduce((sum, usage) => sum + usage.inputTokens + usage.outputTokens, 0)

  console.log(color.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(color.green(`Completado en ${formatDuration(Date.now() - start)} | Coste estimado: ${formatEuro(totalCost)}`))
  console.log(color.gray(`Tokens reportados: ${totalTokens}`))
  console.log()
  console.log(color.cyan('Resultados guardados en:'))
  console.log(`   ${salida.directorio}`)
  console.log('   analisis.json')
  console.log('   presupuesto.md')
  console.log('   presupuesto.html')
  console.log('   presupuesto.pdf')
  console.log('   email-respuesta.md')
  console.log('   revision-checklist.md')
  console.log('   quality-report.json')
  console.log('   quality-report.md')
  console.log()
  console.log(color.bold('Resumen tecnico'))
  console.log(`   Cliente: ${analisis.data.cliente.empresa}`)
  console.log(`   Complejidad global: ${analisis.data.complejidad_global}`)
  console.log(`   Tiempo estimado: ${analisis.data.tiempo_total_min} min`)
  console.log(`   Total presupuesto: ${formatEuro(presupuesto.data.total)}`)
  console.log()

  console.log(color.cyan('Enviando email de respuesta...'))
  const envio = await enviarEmailSalida(salida.directorio)
  if (envio.enviado) {
    console.log(color.green(`   OK Email enviado a ${envio.destinatario} (Resend ID: ${envio.resendId ?? 'n/d'})`))
  } else {
    console.log(color.yellow(`   Email no enviado: ${envio.motivo}`))
    console.log(color.gray(`   Para enviar manualmente: npm run send:test -- ${salida.directorio}`))
  }
}

function printHeader(): void {
  console.log(color.bold('RFQ Agent - Piloto Local'))
  console.log(color.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error()
  console.error(color.red('Error:'), message)
  console.error(color.gray('Solucion: revisa la carpeta de entrada, .env.local o ejecuta npm run dev desde rfq-agent-piloto/.'))
  process.exitCode = 1
})
