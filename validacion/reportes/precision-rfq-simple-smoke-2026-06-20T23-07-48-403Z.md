# Informe de precisión — rfq-simple-smoke

Fecha: 2026-06-20T23:07:48.403Z
Analisis: `rfq-agent-piloto/salidas/20260621-010529-rfq-simple/analisis.json`
Verdad-terreno: `validacion/_smoke/verdad-terreno.json`

## Precisión media ponderada: 74.9 %

**Veredicto:** REVISAR — iterar prompts (skills/procesar-rfq) y config. Repetir.

### Pieza 1: Eje mecanizado — 74.9 %

| Campo | Peso | Acierto | Verdad-terreno | Extraído |
|---|---:|---:|---|---|
| material | 20 | 100% | Acero F-114 | Acero F-114 |
| dimensiones | 15 | 67% | Ø35 x 120 mm | Diametro 35 x 120 mm |
| tolerancias_criticas | 12 | 25% | Ø exterior ±0,02 mm · Longitud 120 ±0,1 | Diametro exterior +/-0,02 mm |
| gdt | 8 | 0% | concentricidad 0,03 respecto a A | — |
| acabado | 8 | 90% | Ra 1,6 | Ra 1,6 en superficies mecanizadas principales |
| roscas | 6 | 100% | M10 | M10 |
| agujeros | 6 | 90% | Taladro axial Ø8 | Taladro axial |
| tolerancias_generales | 4 | 90% | ISO 2768-mK | ISO 2768-mK asumida para demo; confirmar en plano real. |
| numero_plano | 3 | 100% | PL-001 | PL-001 |
| denominacion | 2 | 100% | Eje mecanizado | Eje mecanizado |
| revision_plano | 1 | 100% | Rev A | Rev A |
| cantidad | 10 | 100% | 50 | 50 |
