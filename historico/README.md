# Histórico del proyecto

Estas dos carpetas son versiones **anteriores** de este mismo proyecto. Vivían suel­tas en
`Desktop\claude code curso\` como si fueran proyectos distintos, y se movieron aquí el 2026-07-30 al
consolidar el RFQ Agent en un único directorio con control de versiones.

No se borró nada: si algo de aquí hace falta, está.

## Cronología

| Carpeta | Fecha | Qué es |
|---|---|---|
| `proyecto-rfq` | 2026-05-03 | El kit inicial. 5 skills y `docs/CONTEXT.md` |
| `rfq-agent-final` | 2026-05-05 | Andamio con planificación. Mismas 5 skills, más `ARCHITECTURE.md`, `ROADMAP.md`, `SPRINT1_TAREAS.md` y `supabase-schema.sql` |
| *(la raíz de este repo)* | 2026-05-19 | El desarrollo real. 11 skills, superconjunto de las anteriores |

## Qué conservan que la raíz no tenga

De `rfq-agent-final`, cuatro documentos que no están en `docs/` de la raíz:

- `ARCHITECTURE.md`
- `ROADMAP.md`
- `SPRINT1_TAREAS.md`
- `supabase-schema.sql` — **obsoleto**: el `CLAUDE.md` de la raíz dice explícitamente *"no
  reintroducir Supabase"*, así que este esquema es material histórico, no una referencia a seguir.

Si el `ROADMAP.md` o el `SPRINT1_TAREAS.md` siguen siendo válidos, súbelos a `docs/` de la raíz y
bórralos de aquí. Mientras estén aquí abajo, se leen como historia, no como plan.

## Por qué el proyecto se llamaba "agente CAD"

Por un error de nombre. La carpeta se llamaba así pero su `CLAUDE.md` decía *"RFQ Agent — puente para
Claude Code"*, y no tiene nada que ver con CAD. Cualquier sesión de agente que se abriera buscando el
RFQ arrancaba en el sitio equivocado, y ese fue el motivo real de que el proyecto llevara parado desde
el 19 de mayo.
