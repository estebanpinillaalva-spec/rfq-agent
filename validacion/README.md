# Validación de precisión — RFQ Agent

> **Objetivo:** cerrar el riesgo nº 1 del negocio — *¿lee bien la IA los planos reales?* — con **evidencia repetible**, no con demos sueltas. Mide la precisión de la extracción (`analisis.json`) contra una **verdad-terreno verificada por un humano**.

Esta carpeta es tooling neutro (no toca `rfq-agent-piloto/src/` ni `src/`). Complementa al skill `rfq-fixture-benchmark` (que mide *estado técnico + Quality Gate*) añadiendo lo que falta: **acierto real campo a campo**.

---

## Qué medimos y con qué peso

Solo los campos que de verdad determinan un presupuesto correcto. Pesos (suman 100):

| Campo | Peso | Por qué |
|---|---:|---|
| `material` | 20 | Si falla el material, el coste se va a pique |
| `dimensiones` | 15 | Base del tiempo de mecanizado y del material |
| `tolerancias_criticas` | 12 | Marcan operaciones, rechazos y tiempo |
| `cantidad` | 10 | Multiplica todo |
| `gdt` | 8 | GD&T = complejidad y verificación |
| `acabado` | 8 | Rugosidad/acabado = operaciones extra |
| `roscas` | 6 | Operaciones y herramienta |
| `agujeros` | 6 | Operaciones y setup |
| `tolerancias_generales` | 4 | Norma base (ISO 2768…) |
| `tratamientos` | 3 | Subcontrata/plazo |
| `numero_plano` | 3 | Trazabilidad |
| `recubrimientos` | 2 | Subcontrata/plazo |
| `denominacion` | 2 | Trazabilidad |
| `revision_plano` | 1 | Trazabilidad |

> El script **renormaliza** los pesos sobre los campos que tú hayas rellenado en la verdad-terreno. Puedes rellenar solo lo que sepas; no penaliza por dejar huecos.

**Cómo puntúa cada campo:** texto se normaliza (minúsculas, sin acentos, sin ruido) y se compara por igualdad / contención / solape de *tokens*. Las listas (`gdt`, `roscas`, `tolerancias_criticas`…) puntúan por **recall con crédito parcial** (¿capturó cada elemento crítico?). `cantidad` es acierto/fallo.

---

## Barra de aceptación (del plan de negocio)

Antes de un piloto real en un taller, sobre **10–20 RFQs reales anonimizados**:

- **Precisión media ponderada ≥ 85 %**, y
- **borrador útil como oferta interna en ≥ 80 %** de los planos, y
- **0 envíos automáticos** al cliente final (siempre BORRADOR + revisión humana).

### Árbol de decisión según la precisión media

- **≥ 85 %** → la tecnología sostiene el negocio. Adelante con pilotos.
- **70–85 %** → iterar **prompts** (`skills/procesar-rfq`, área de Codex) y afinar `config-taller.json`/`materiales.json`. Repetir.
- **< 70 %** → añadir **extractor especializado** (p. ej. Werk24 / LlamaParse) *detrás de la misma interfaz* para los planos difíciles. No se cambia el producto, se refuerza una capa.

---

## Cómo construir la "verdad-terreno" (paso humano, innegociable)

La verdad-terreno la rellena/verifica **una persona** que sepa leer el plano (el ingeniero mecánico, o el estimador del taller). **Nunca otra IA** — si una IA la genera y otra IA la extrae, estaríamos comparando IA contra IA, no contra la realidad.

1. Copia `verdad-terreno.template.json`.
2. Rellena, por cada pieza del plano, los campos que conozcas (deja vacío lo que no apliquen).
3. Guárdalo **dentro del fixture**, junto al plano:
   ```
   rfq-agent-piloto/fixtures/reales-anonimizados/rfq-001/
     email.txt
     config-taller.json
     plano-1.pdf | .png
     verdad-terreno.json     ← lo que rellenas tú
   ```
4. **Anonimiza** antes: sin nombres reales de cliente, sin precios propietarios, sin datos personales.

---

## Cómo ejecutar (con Gemini real)

> La clave **nunca** se pega en el chat. Va en un fichero local.

1. Pon la clave en `rfq-agent-piloto/.env.local` (créalo si no existe):
   ```
   RFQ_AI_PROVIDER=gemini
   GOOGLE_GEMINI_API_KEY=AIza...tu_clave...
   ```
2. Procesa el caso con el piloto (desde `rfq-agent-piloto/`):
   ```bash
   npm run dev -- ./fixtures/reales-anonimizados/rfq-001
   ```
   Genera una carpeta en `salidas/<timestamp>-rfq-001/` con `analisis.json`.
3. Puntúa la precisión (desde la raíz del repo o desde donde quieras, con rutas explícitas):
   ```bash
   node validacion/score-precision.mjs \
     "rfq-agent-piloto/salidas/<timestamp>-rfq-001/analisis.json" \
     "rfq-agent-piloto/fixtures/reales-anonimizados/rfq-001/verdad-terreno.json"
   ```
   Imprime el resumen y escribe un informe `validacion/reportes/precision-<fixture>-<timestamp>.md`.

Para el corpus entero, repite por cada fixture y agrega los resultados (la media de las precisiones es lo que se compara con la barra del 85 %).

---

## Coste y prudencia

- Cada caso con Gemini consume cuota → mantener `mock` por defecto y usar `gemini` solo en validaciones puntuales.
- Empezad por **3–5 planos** para un primer pulso; subid a 10–20 para la barra formal.
- Los planos de `rfq-agent-piloto/ejemplos/` sirven para **probar el harness**, pero la barra real exige **planos reales anonimizados** (más sucios y variados).
