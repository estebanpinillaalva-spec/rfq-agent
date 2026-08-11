# Estado de trabajo activo

## Quién está trabajando ahora
**AI:** — (libre)
**Desde:** —
**Archivos bloqueados:** —
**Tarea:** —

## Estado del benchmark (2026-08-11)

Bloqueado en terceros: cuota diaria de Gemini agotada (429). Pendiente de medir la
version compacta de la seccion E del prompt, que esta aplicada pero SIN VERIFICAR.

Lo ultimo medido y estable a 3 repeticiones: la version LARGA de la seccion E era
net-negativa (acabado 0/6 -> 6/6, pero material, cantidad y tolerancia de 15 aciertos
a 0). La compacta es una hipotesis razonada, no un hecho.

Con la cache ya montada, en cuanto vuelva la cuota una sola corrida contesta la
pregunta, y a partir de ahi cualquier cambio en comparador, verdad o motor de coste
se puntua gratis.

Pendiente del usuario: corregir `verdad.json` de ejemplo-002 (la pagina 7 es el plano
11.08 con dos marcas, no 11.07 con una) y conseguir el dato de `C-6440`. Ver
`rfq-agent-piloto/benchmark/casos/ejemplo-002/origen.md`.

Bloqueado en terceros: Gemini devuelve 503 por sobrecarga, asi que la medicion real con repeticiones esta pendiente de que se recupere su API. Pendiente del usuario: el dato de `C-6440`, que no existe en fuentes publicas.

Tarea 9 hecha (6cd3ff0): comparador corregido contra planos reales. Bloqueado en el usuario: transcribir las 7 piezas de `benchmark/casos/ejemplo-002/S01 - Piezas adicionales.pdf` a `verdad.json` v2.0. Ningun agente debe escribir ese fichero.

Plan `docs/superpowers/plans/2026-08-05-reshape-buzon-medible.md` **tareas 1-8 completadas**: las 8 tareas (f7c490f, 233e214, d156f9a, 6c2925b, cb6ff5f, 609f6c9, daa3fcf). QA visual hecho a 1440x1100 y 390x950.

Pendiente y bloqueado en el usuario: la "Tarea humana previa" del plan — generar un plano PDF desde CAD publico y pedir precio de referencia a un motor de presupuesto instantaneo, para rellenar `rfq-agent-piloto/benchmark/casos/ejemplo-001/`. Hasta entonces `npm run benchmark` reporta "Sin datos", que es lo correcto.

## Protocolo
1. Antes de editar, escribe aquí tu nombre (Claude Code / Codex) + archivos que vas a tocar
2. Si el archivo está en "Archivos bloqueados", espera o trabaja en otra área
3. Al terminar tu tarea, borra tu nombre y deja el campo vacío
4. Nunca edites un archivo que otro AI tiene bloqueado

## División de responsabilidades

| Área | Responsable preferente |
|------|----------------------|
| UI / CSS / Frontend Next.js (`src/`) | Claude Code |
| Prompts Gemini y tablas de referencia | Codex |
| Pipeline del agente CLI (`rfq-agent-piloto/`) | Codex |
| API routes y `local-store.ts` | Cualquiera — avisar aquí primero |
| Arquitectura y planificación | Claude Code |
| Implementación de planes detallados | Codex |
| Git commits | Cualquiera — mensajes descriptivos en español |

## Historial reciente
<!-- Añadir entradas al terminar cada tarea significativa -->
- 2026-05-10 — Claude Code: baseline MVP, dark UI polish, iconos sidebar, pipeline mejorado
