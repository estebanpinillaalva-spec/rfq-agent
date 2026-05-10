import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type SkillPromptName = 'validar-plano' | 'procesar-rfq' | 'generar-presupuesto'

export function cargarPromptSkill(nombre: SkillPromptName): string {
  const candidates = [
    join(process.cwd(), 'skills', nombre, 'SKILL.md'),
    join(process.cwd(), '..', 'skills', nombre, 'SKILL.md'),
  ]

  const path = candidates.find((candidate) => existsSync(candidate))
  if (!path) {
    throw new Error(
      `No encuentro el prompt exacto de la skill "${nombre}". Ejecuta el piloto desde la raiz del repo o desde rfq-agent-piloto/.`
    )
  }

  return readFileSync(path, 'utf8')
}

// Carga un archivo de referencia de una skill. Devuelve null si no existe (no es obligatorio).
export function cargarReferencia(skillNombre: SkillPromptName, nombreArchivo: string): string | null {
  const candidates = [
    join(process.cwd(), 'skills', skillNombre, 'references', nombreArchivo),
    join(process.cwd(), '..', 'skills', skillNombre, 'references', nombreArchivo),
  ]
  const path = candidates.find((candidate) => existsSync(candidate))
  return path ? readFileSync(path, 'utf8') : null
}
