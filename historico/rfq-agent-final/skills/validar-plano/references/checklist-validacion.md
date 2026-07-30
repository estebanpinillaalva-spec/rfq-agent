# Checklist completo de validación de plano

Referencia ampliada para casos donde el SKILL.md base no cubre el detalle suficiente.

---

## Nivel 1 — Calidad de imagen (eliminatorio)

### Resolución
- ¿Se pueden leer las cotas más pequeñas (típicamente 2-3mm en plano A4)?
- ¿El texto del cajetín es legible sin esfuerzo?
- ¿Las líneas finas (ejes, líneas auxiliares) se distinguen de las gruesas?

**Criterio de fallo:** si para responder cualquier pregunta tienes que asumir lo que pone, la imagen no sirve.

### Nitidez
- ¿La imagen está enfocada y sin emborronado?
- ¿Hay zonas con artefactos JPEG visibles que comprometan información?
- ¿Se ve afectada por movimiento durante el escaneado?

### Completitud visual
- ¿Aparece el cajetín completo (las 4 esquinas del plano)?
- ¿Hay zonas cortadas, tapadas o con sellos opacos?
- ¿La página completa está incluida (no solo media)?

### Orientación
- ¿El plano está derecho o rotado?
- Si es PDF de varias páginas, ¿están todas legibles y orientadas?

### Contraste
- Líneas oscuras sobre fondo claro: contraste mínimo 70%
- ¿Los planos en blanco sobre azul (heliografías antiguas) son legibles tras procesamiento?

---

## Nivel 2 — Información mínima presente (eliminatorio)

### Cajetín del plano

Debe contener al menos:
- [ ] Empresa emisora del plano
- [ ] Número de plano (referencia única)
- [ ] Revisión/versión actual
- [ ] Fecha del plano
- [ ] Escala del plano
- [ ] Sistema de proyección (1ª o 3ª diedro)
- [ ] Unidades (mm habitualmente)

### Vista principal

- [ ] Existe al menos una vista principal con cotas visibles
- [ ] La pieza es identificable como objeto 3D (vistas múltiples si necesario)
- [ ] Las cotas críticas están legibles
- [ ] Se observan los detalles relevantes (chaveteros, roscas, agujeros)

### Material

Debe estar especificado en uno de estos lugares:
- En el cajetín (campo "material")
- En nota técnica del plano
- En el email del cliente
- En documentos auxiliares (especificación, norma)

Designaciones aceptables:
- Aceros: F-114, AISI 304/316, S235JR, S275JR, C45, 42CrMo4, etc.
- Aluminios: AlMg3, EN AW-6082, EN AW-7075
- Inoxidables: AISI 304L, AISI 316L, 1.4301, 1.4404
- Otros: latón, bronce, cobre, plásticos técnicos (POM, PA6, PEEK)

Si solo dice "acero" sin especificar grado → DUDOSO (preguntar).
Si no aparece material en ningún sitio → NO PROCESABLE.

### Tolerancias generales

Debe aparecer en cajetín o nota:
- ISO 2768 mK (medio, fina) — el más habitual
- ISO 2768 fK (fina, fina)
- DIN 7168 (antigua pero aún usada)
- Normativa propia de la empresa cliente

Si no aparece, asumir ISO 2768 mK pero **dejar nota explícita** y preguntar al cliente si confirma.

### Escala

- Indicada explícitamente: 1:1, 1:2, 2:1, 5:1, etc.
- Deducible si hay cotas y se respetan (medir en pantalla y comparar)

---

## Nivel 3 — Información para cotización (no bloqueante)

### Cantidades

- [ ] Cantidad indicada en plano (campo "cantidad" del cajetín)
- [ ] Cantidad en email del cliente
- [ ] Si discrepan, prevalece el email pero aclarar con cliente

### Acabado superficial

Buscar símbolos Ra:
- Ra 0.4 µm: rectificado fino
- Ra 0.8 µm: rectificado / torneado fino
- Ra 1.6 µm: torneado/fresado de calidad
- Ra 3.2 µm: mecanizado estándar
- Ra 6.3 µm: mecanizado basto / fresado de desbaste
- Ra 12.5 µm: corte de sierra, oxicorte

Si no aparece símbolo Ra: asumir Ra 3.2 µm (estándar) pero documentarlo.

### Tratamientos térmicos / superficiales

Buscar referencias a:
- Templados (HRC indicada)
- Cementación / nitruración (espesor de capa)
- Anodizado (color, espesor)
- Cincado, niquelado, cromado
- Pintura (RAL)

### GD&T (Geometric Dimensioning & Tolerancing)

Símbolos a detectar:
- ⏤ Rectitud
- ⏥ Planitud  
- ⊥ Perpendicularidad
- ∥ Paralelismo
- ⌭ Cilindricidad
- ○ Redondez
- ⌖ Posición
- ⌯ Concentricidad
- ⌒ Perfil de línea
- ⌓ Perfil de superficie
- ⟂ Batimiento
- = Simetría

Si aparecen pero no son legibles → DUDOSO, preguntar al cliente.

### Notas técnicas en el plano

Frecuentes y críticas:
- "Eliminar rebabas y aristas vivas"
- "Marcado: número de pieza + lote"
- "ITP requerido" → certificación de plan de inspección
- "Material según certificado 3.1 / 3.2"
- "Limpieza desengrasada"
- "Embalaje individual / agrupado"

---

## Casos especiales

### Plano antiguo (heliografía azul/verde)

Si el cliente envía escaneado de plano antiguo:
- Calidad suele ser dudosa
- Material puede aparecer en designación no normalizada (St 37 → S235JR)
- Pedir si tiene plano CAD digitalizado actualizado

### Plano sin cajetín visible (recortado)

Marcar NO PROCESABLE inmediatamente. El cajetín es la huella técnica del plano y su ausencia compromete trazabilidad.

### Plano en formato vectorial (DWG, DXF, STEP)

Estos no necesitan validación visual. Saltar a procesamiento directo, pero verificar:
- Ficheros no corruptos
- Versión compatible
- Si STEP: análisis 3D, no 2D

### Plano con texto en idioma no esperado

Si llega un plano en alemán/chino/etc. no esperado:
- Verificar que el cliente puede dar info en español
- O confirmar que el taller acepta planos en ese idioma
- Las cotas son universales pero las notas técnicas no
