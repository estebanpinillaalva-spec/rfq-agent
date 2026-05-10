# Tabla de operaciones de fabricación — Nomenclatura, tiempos y tarifas

Nomenclatura estándar para identificar operaciones en el análisis técnico.
**Tarifas orientativas para taller PYME español 2024-2025. Actualizar contra `config-taller.json` del cliente.**

---

## Tarifas horarias de máquina — Referencia PYME española

| Máquina / Proceso | Tarifa €/h (orientativa) | Notas |
|-------------------|--------------------------|-------|
| Torno CNC (2 ejes) | 45–65 | Incluye operario |
| Torno CNC con contracabezal | 55–75 | Reduce operaciones de volteo |
| Centro de mecanizado 3 ejes | 55–75 | Incluye operario |
| Centro de mecanizado 5 ejes | 90–130 | Menos disponible en PYMEs |
| Rectificadora plana | 50–70 | Operario semiespecializado |
| Rectificadora cilíndrica | 55–75 | — |
| EDM hilo | 70–100 | Muy autónoma, puede ser overnight |
| EDM penetración | 75–110 | Fabricación electrodo aparte |
| Taladradora (no CNC) | 25–40 | Operaciones simples |
| Mandrinadora | 60–80 | Agujeros grandes precisos |
| Fresadora convencional | 35–50 | Para operaciones simples |
| CMM (inspección 3D) | 40–60 | Medición primera pieza |
| Mesa de control manual | 20–35 | Calibres, micrómetros |

---

## Tiempos de setup (preparación de máquina)

El setup es el tiempo que no varía con la cantidad de piezas. Clave para series cortas.

| Operación | Setup orientativo | Notas |
|-----------|------------------|-------|
| Torno CNC, pieza nueva | 45–90 min | Programación + utillaje + primera pieza |
| Torno CNC, pieza repetida | 20–40 min | Solo montaje y verificación |
| Centro 3 ejes, pieza nueva | 60–120 min | Programación + amarre + pieza patrón |
| Centro 3 ejes, pieza repetida | 30–60 min | Montaje utillaje + verificación |
| Centro 5 ejes, pieza nueva | 90–180 min | Mayor complejidad de utillaje |
| Rectificado, pieza nueva | 30–60 min | Rectificado de muelas + ajuste |
| EDM hilo, pieza nueva | 60–120 min | Programación + enhebrado |
| Inspección CMM, pieza nueva | 45–90 min | Programación rutina CMM |

---

## Factores de complejidad para estimación de tiempo de ciclo

Estos factores se aplican al tiempo base estimado por geometría. Multiplicar el tiempo teórico de ciclo por el factor correspondiente.

| Nivel | Descripción de la pieza | Factor multiplicador |
|-------|------------------------|---------------------|
| **SIMPLE** | Geometría básica de revolución o prismática, 1–2 operaciones, tolerancias IT9+, Ra ≥3.2 | ×1.0 |
| **MEDIO** | 3–5 operaciones, cambios de utillaje, tolerancias IT7-IT9, Ra 1.6–3.2, algunas cotas críticas | ×1.4–1.7 |
| **ALTO** | >5 operaciones, GD&T presente, tolerancias IT6-IT7, Ra ≤1.6, requiere utillaje especial | ×2.0–2.5 |
| **MUY ALTO** | 5 ejes, geometría libre, IT4-IT6, Ra ≤0.8, GD&T múltiple, materiales difíciles, subcontratas múltiples | ×2.8–4.0 |

### Factores adicionales por característica

| Característica | Factor adicional | Cuándo aplicar |
|----------------|-----------------|----------------|
| Material inox austenítico (304/316) | ×1.8–2.2 sobre tiempo base acero | Menor velocidad de corte, desgaste herramienta |
| Material aluminio (6082, 7075) | ×0.6–0.7 sobre tiempo base acero | Mayor velocidad de corte |
| Material plástico técnico (POM, PEEK) | ×0.7–0.8 sobre tiempo base acero | Velocidades altas, menos refrigeración |
| Material latón CW614N | ×0.5–0.6 sobre tiempo base acero | Muy alta maquinabilidad |
| Roscas interiores M<10 o Tr | +5–15 min/rosca | Roscado con macho, riesgo de rotura |
| Roscas exteriores | +3–8 min/rosca | Terraja o ciclo CNC |
| Agujero profundo >3×D | +10–20 min | Necesita taladro especial, evacuación viruta |
| Tolerancias IT6-IT7 (H7/h6, etc.) | ×1.3–1.5 sobre operación | Pases de acabado extra |
| Tolerancias IT4-IT5 | ×1.8–2.5 + rectificado | Casi siempre implica rectificado |
| Rugosidad Ra ≤0.8 | +20–40% en acabado | Semiacabado + acabado + rectificado/bruñido |
| Rugosidad Ra ≤0.4 | +40–80% en acabado | Rectificado obligatorio |
| GD&T: perpendicularidad ≤0.02 | ×1.3 en mecanizado + CMM | Verificación obligatoria |
| GD&T: posición ⌀0.05 | ×1.4 en mecanizado + CMM | Utillaje especial |
| One-off (1 pieza) | ×1.3–1.5 sobre serie 5 | Sin serie para amortizar setup |
| Serie 1–5 piezas | ×1.0 | Referencia |
| Serie 6–20 piezas | ×0.80 | Setup se amortiza |
| Serie 21–100 piezas | ×0.65 | Programas optimizados |
| Serie >100 piezas | ×0.50 | Utillajes dedicados |

---

## Operaciones de corte y preparación de material

| Denominación estándar | Cuándo se usa | Coste orientativo | Equivalencia inglés |
|----------------------|---------------|-------------------|---------------------|
| Corte por sierra | Barras, perfiles a longitud | 5–15 €/pieza | Sawing |
| Corte por plasma | Chapa media (3–30 mm) | 0.50–2.00 €/m | Plasma cutting |
| Corte por láser | Chapa fina-media (0.5–25 mm) | 0.80–3.00 €/m | Laser cutting |
| Corte por chorro de agua | Materiales sensibles, multicapa | 1.50–5.00 €/m | Water jet cutting |
| Oxicorte | Chapas gruesas acero (>20 mm) | 0.30–1.00 €/m | Oxy-fuel cutting |
| Cizallado | Chapa fina (<6 mm) en serie | 0.20–0.50 €/pieza | Shearing |

---

## Operaciones de mecanizado

| Denominación | Máquina | Tiempo ciclo orientativo | Aplicación típica |
|--------------|---------|--------------------------|-------------------|
| Torneado exterior | Torno CNC | 5–60 min/pieza | Piezas de revolución |
| Torneado interior / mandrinado | Torno CNC | 10–90 min/pieza | Diámetros interiores |
| Refrentado | Torno | 2–15 min/pieza | Caras planas perp. eje |
| Fresado de planeado | Centro 3 ejes | 5–30 min/pieza | Caras planas |
| Fresado de cajeras | Centro 3 ejes | 15–90 min/pieza | Cajeras, contornos |
| Fresado 5 ejes | Centro 5 ejes | 30–240 min/pieza | Geometrías complejas |
| Taladrado (serie agujeros) | Centro / taladradora | 2–20 min total | Agujeros pasantes/ciegos |
| Escariado | Centro mecanizado | +5–15 min/agujero | Agujeros H7 y mejores |
| Roscado interior (macho CNC) | Centro mecanizado | +3–8 min/rosca | Roscas M3–M30 |
| Roscado exterior | Torno | +2–6 min/rosca | Roscas métricas |
| Rectificado plano | Rectificadora | 30–120 min/pieza | Superficies planas Ra ≤0.4 |
| Rectificado cilíndrico ext. | Rectificadora cilíndrica | 30–90 min/pieza | Diámetros Ra ≤0.4 |
| Rectificado cilíndrico int. | Rectificadora interior | 30–90 min/pieza | Agujeros precisos Ra ≤0.4 |
| EDM hilo | Cortadora hilo | 30–480 min/pieza | Perfiles complejos, IT5 |
| EDM penetración | EDM penetración | 60–480 min/pieza | Cavidades complejas |
| Tallado de engranajes | Talladora | 60–360 min/pieza | Engranajes |
| Honeado | Honeadora | 10–45 min/pieza | Acabado Ra <0.2 |
| Brochado | Brochadora | 5–20 min/pieza | Estriados, chaveteros interiores serie |

---

## Operaciones de conformado

| Denominación | Aplicación |
|--------------|------------|
| Plegado | Chapa: dobladuras lineales |
| Curvado | Tubos, barras, perfiles |
| Embutición | Chapa: profundidad >50% del diámetro |
| Estampación | Conformado en frío con matriz |
| Forja | Conformado en caliente con martillo/prensa |

---

## Operaciones de unión

| Denominación | Tipo de unión | Coste orientativo |
|--------------|---------------|------------------|
| Soldadura TIG | Aceros inox, aluminio, calidad alta | 50–80 €/h |
| Soldadura MIG/MAG | Acero al carbono, productividad | 35–55 €/h |
| Soldadura por electrodo | Estructuras gruesas, exterior | 30–50 €/h |
| Soldadura por puntos | Chapa serie | 25–40 €/h |

---

## Tratamientos térmicos (típicamente subcontratados)

| Denominación | Efecto | Surcharge orientativo |
|--------------|--------|----------------------|
| Temple + revenido | Aumento dureza HRC | +10–20% del coste pieza |
| Normalizado | Refinar grano | +5–10% |
| Recocido | Reducir dureza, mejorar mecanizado | +5–10% |
| Cementación | Aumentar dureza superficial (C) | +15–25% |
| Nitruración | Aumentar dureza superficial (N) | +15–25% |
| Carbonitruración | Combinación | +15–25% |
| Inducción | Temple superficial localizado | +10–18% |

---

## Tratamientos superficiales (típicamente subcontratados)

| Denominación | Función | Surcharge orientativo |
|--------------|---------|----------------------|
| Anodizado natural | Capa óxido protectora aluminio | +8–15% |
| Anodizado duro | Alta dureza superficial aluminio | +15–25% |
| Niquelado químico | Resistencia corrosión, aspecto | +12–20% |
| Cromado duro técnico | Dureza extrema, tolerancias ajustadas | +20–35% |
| Cincado / Zincado | Anti-corrosión acero | +5–10% |
| Galvanizado en caliente | Anti-corrosión larga duración | +8–14% |
| Bonderizado | Pre-pintura | +3–6% |
| Pintura epoxi industrial | Industrial, exterior | +10–18% |
| Pulido espejo | Acabado decorativo | +15–30% |
| Granallado / Chorreado | Limpieza superficial, pre-pintura | +3–8% |
| Decapado pasivado | Inoxidables, mejora resistencia | +5–12% |

---

## Operaciones de acabado y limpieza

| Denominación | Coste orientativo | Uso |
|--------------|------------------|-----|
| Desbarbado manual | 5–20 €/pieza | Casi siempre necesario |
| Achaflanado aristas | 3–10 €/pieza | Aristas vivas |
| Marcado láser | 5–15 €/pieza | Identificación, trazabilidad |
| Limpieza / desengrasado | 2–5 €/pieza | Antes de pintura/recubrimiento |

---

## Operaciones de inspección y certificación

| Denominación | Cuándo aplica | Coste orientativo |
|--------------|---------------|------------------|
| Inspección dimensional básica | Estándar | +3–5% del coste pieza |
| Calibración con CMM | Tolerancias IT6 o mejores | +8–15% del coste pieza |
| Inspección pasa/no pasa | Series medias/altas | +2–4% por pieza en serie |
| END — Líquidos penetrantes | Superficies críticas | +5–12% |
| END — Ultrasonidos | Defectos internos | +10–20% |
| Certificado de material (3.1 EN 10204) | Aero, nuclear, PED | +3–8% sobre material |
| Certificado de conformidad 2.1 | Estándar | Incluido generalmente |

---

## Desperdicio de material por tipo de operación

Factor de desperdicio a aplicar sobre el peso bruto de material necesario.

| Tipo de operación principal | Desperdicio orientativo | Notas |
|-----------------------------|------------------------|-------|
| Torneado desde barra | 25–40% | Se genera mucha viruta |
| Fresado desde bloque | 30–45% | Depende de la geometría |
| Torneado + fresado (mixto) | 35–50% | Suma de ambos |
| Rectificado (solo acabado) | 2–5% | Poco material removido |
| Corte láser / plasma desde chapa | 10–20% | Niching / nesting |
| Plegado de chapa | 3–8% | Solo esquinas |
| Fundición / forja (near-net-shape) | 5–15% | Ya viene preformado |

---

## Notas de uso

- En el análisis, **listar las operaciones en orden cronológico de fabricación**, no por máquina o tipo.
- Si una operación es atípica para el sector, añadir nota explicativa.
- Las **subcontratas** se marcan claramente como tales en la sección DFM.
- Si el plano implica operaciones que el taller no realiza in-house (verificar contra `config-taller.json`), añadir alerta al estimador.
- Los tiempos de ciclo son **estimaciones para pieza nueva**. Para piezas repetidas descontar 20–30% (programa y utillaje ya conocidos).
- El coste total de una pieza: `(setup / cantidad) + (tiempo_ciclo × tarifa_hora) + coste_material + subcontratas + merma`
