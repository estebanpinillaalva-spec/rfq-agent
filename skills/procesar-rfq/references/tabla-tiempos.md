# Tabla de Tiempos de Referencia para Estimación

Usa estos rangos como base obligatoria para `tiempo_estimado_min` de cada pieza.
Si tu estimación se desvía más del 100% respecto al rango de la tabla, justifícalo explícitamente en `flags`.

## Rangos por operación y complejidad

| Operación principal | BAJA | MEDIA | ALTA | MUY_ALTA |
|---------------------|------|-------|------|----------|
| Torno CNC — cilíndrica simple (≤Ø80×200 mm) | 15–45 min | 45–120 min | 120–240 min | >240 min |
| Torno CNC — barra larga / pieza compleja | 30–90 min | 90–180 min | 180–360 min | >360 min |
| Centro mecanizado 3 ejes — plana simple | 20–60 min | 60–150 min | 150–300 min | >300 min |
| Centro mecanizado 3 ejes — geometría compleja | 45–120 min | 120–240 min | 240–480 min | >480 min |
| Centro mecanizado 4/5 ejes | 60–180 min | 180–360 min | 360–720 min | >720 min |
| Taladrado / roscado simple (≤5 agujeros) | 5–15 min | 15–40 min | 40–90 min | >90 min |
| Fresado convencional (contorno o plano) | 20–60 min | 60–120 min | 120–240 min | >240 min |
| Rectificado cilíndrico | 20–60 min | 60–120 min | 120–240 min | >240 min |
| Rectificado plano | 15–45 min | 45–90 min | 90–180 min | >180 min |
| Soldadura TIG — unión simple (<200 mm) | 15–30 min | 30–90 min | 90–180 min | >180 min |
| Soldadura MIG/MAG — estructura | 20–60 min | 60–150 min | 150–300 min | >300 min |
| EDM hilo / penetración | 60–180 min | 180–480 min | 480–960 min | >960 min |
| Ajuste / montaje manual | 10–30 min | 30–60 min | 60–120 min | >120 min |
| Doblado / plegado chapa (≤3 pliegues) | 5–20 min | 20–60 min | 60–120 min | >120 min |

## Criterios de complejidad

**BAJA:** Pieza de revolución simple o prismática. ≤3 operaciones. Tolerancias ISO 2768-m. Sin GD&T crítico. Material estándar.

**MEDIA:** 4–6 operaciones. Tolerancias intermedias (IT8–IT10 en zonas críticas). Algo de GD&T. Posible subcontrata puntual.

**ALTA:** >6 operaciones o cambios de amarre múltiples. Tolerancias estrechas (IT6–IT7). GD&T con referencias múltiples. Material difícil (inox, titanio). Subcontrata probable.

**MUY_ALTA:** Geometría compleja 5 ejes. Tolerancias <IT6. Inspección dimensional extensa. Material exótico. Subcontrata múltiple obligatoria.

## Ajustes sobre el tiempo base

- **Primera pieza / prototipo**: ×1.5 sobre el tiempo base
- **Serie ≥10 piezas idénticas**: ×0.7 (economías de escala)
- **Material difícil (inox, titanio, PEEK)**: ×1.3–1.6 sobre tiempo base
- **Plano ambiguo / sin tolerancias**: añadir +30% como margen de riesgo

## Errores frecuentes a evitar

- NO estimes <15 min para ninguna pieza mecanizada real (hay setup mínimo)
- NO estimes >8 h por pieza sin indicarlo como MUY_ALTA con justificación
- Si el tiempo calculado por operaciones supera 4 h, revisa la complejidad asignada
