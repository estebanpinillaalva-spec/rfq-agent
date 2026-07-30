# Tabla GD&T (Geometric Dimensioning & Tolerancing)

Símbolos GD&T más habituales en planos industriales y su interpretación. Detectarlos y reportarlos correctamente es crítico porque indican cotas funcionales.

---

## Tolerancias de forma (un solo elemento)

| Símbolo | Nombre | Significado | Ejemplo típico |
|---------|--------|-------------|----------------|
| ⏤ | Rectitud (straightness) | La línea/eje no se desvía más que X de la recta ideal | Eje de motor, guía lineal |
| ⏥ | Planitud (flatness) | La superficie no se desvía más que X del plano ideal | Superficie de apoyo, junta |
| ○ | Redondez (circularity) | La sección circular no se desvía más que X | Casquillo, eje rotativo |
| ⌭ | Cilindricidad (cylindricity) | El cilindro entero (no solo una sección) | Pistones, cojinetes |
| ⌒ | Perfil de línea (line profile) | Línea curva/compleja con tolerancia | Levas, álabes |
| ⌓ | Perfil de superficie (surface profile) | Superficie curva/compleja | Carcasas aero, álabes |

---

## Tolerancias de orientación (relativas a referencia)

| Símbolo | Nombre | Significado | Ejemplo típico |
|---------|--------|-------------|----------------|
| ∥ | Paralelismo (parallelism) | Eje/superficie paralela a referencia ±X | Cara opuesta de un bloque |
| ⊥ | Perpendicularidad (perpendicularity) | Eje/superficie a 90° de referencia ±X | Agujero perpendicular a cara |
| ∠ | Angularidad (angularity) | Ángulo específico distinto de 0/90 ±X | Superficie inclinada |

---

## Tolerancias de localización (posición precisa)

| Símbolo | Nombre | Significado | Ejemplo típico |
|---------|--------|-------------|----------------|
| ⌖ | Posición (position) | El punto/eje está dentro de zona X de su posición teórica | Patrón de agujeros |
| ⌯ | Concentricidad (concentricity) | Ejes coinciden ±X | Diámetros sucesivos en torneado |
| = | Simetría (symmetry) | Elementos simétricos respecto a plano de referencia | Chaveteros opuestos |

---

## Tolerancias de batimiento (giro respecto a eje)

| Símbolo | Nombre | Significado | Ejemplo típico |
|---------|--------|-------------|----------------|
| ↗ | Batimiento circular (circular runout) | Una sección durante giro | Eje rotativo |
| ⟂ | Batimiento total (total runout) | Toda la superficie durante giro | Roldana, polea |

---

## Modificadores

Los símbolos GD&T pueden llevar modificadores que cambian su interpretación:

| Modificador | Símbolo | Significado |
|-------------|---------|-------------|
| MMC (Maximum Material Condition) | Ⓜ | Máximo material — beneficios de bonus tolerance |
| LMC (Least Material Condition) | Ⓛ | Mínimo material |
| RFS (Regardless of Feature Size) | (sin símbolo) | Por defecto, aplica siempre |
| Proyección | Ⓟ | La tolerancia se proyecta más allá del elemento |
| Independencia | Ⓘ | Tolerancia independiente de otras |

---

## Sistema de referencias (Datums)

Los datums se identifican con letras mayúsculas en marco rectangular (Ⓐ, Ⓑ, Ⓒ).

**Sistema típico de 3 datums:**
- Datum primario (A): superficie principal de apoyo (3 puntos contacto)
- Datum secundario (B): superficie auxiliar (2 puntos contacto)  
- Datum terciario (C): superficie complementaria (1 punto contacto)

En el análisis, **siempre identificar los datums y reportarlos**, porque el estimador necesita saber qué referencias debe respetar para el utillaje de fabricación.

---

## Cómo reportar GD&T en el análisis

Formato recomendado en la sección "D. Tolerancias" de cada pieza:

```
**GD&T detectado:**

- Planitud 0.05 sobre datum A (superficie inferior)
- Perpendicularidad 0.02 entre Ø10H7 y datum A
- Posición Ø0.1 Ⓜ sobre patrón de 4 agujeros respecto a datums A|B|C
- Concentricidad 0.01 entre Ø20 y Ø30 (ejes consecutivos en torneado)
- Batimiento total 0.05 sobre Ø50 respecto a datum A-B (ejes acoplados)
```

---

## Implicaciones de fabricación

Cada tipo de tolerancia GD&T tiene implicaciones en el coste:

### Tolerancias bajas (>0.1mm)
- No requieren operaciones especiales
- Se consiguen con mecanizado normal (torneado, fresado)
- Coste estándar

### Tolerancias medias (0.05-0.1mm)
- Pueden requerir torneado/fresado fino
- Acabado superficial Ra ≤1.6 µm habitualmente
- Coste +20-30% sobre estándar

### Tolerancias bajas (0.01-0.05mm)
- Requieren rectificado o operación de acabado especial
- Acabado Ra ≤0.8 µm
- Posible necesidad de calibración con CMM
- Coste +50-100% sobre estándar

### Tolerancias muy bajas (<0.01mm)
- Operaciones de precisión: rectificado, lapeado, honeado
- Acabado Ra ≤0.4 µm
- Calibración CMM obligatoria
- Coste +200-500% sobre estándar
- Aplicable solo a piezas verdaderamente críticas

---

## Reglas para flagear como ⚠️

Marca `⚠️ REQUIERE REVISIÓN HUMANA` si:

- Aparece GD&T con tolerancia <0.01mm sin justificación funcional clara
- Hay incompatibilidad entre tolerancia general y GD&T específica
- Datums están definidos pero no claros (referencias múltiples sin jerarquía)
- Aparecen modificadores Ⓜ/Ⓛ en piezas no funcionales
- La tolerancia parece copiada de otro plano y no aplica

Estas situaciones cuestan dinero y plazo. El estimador debe validarlas con el cliente antes de cotizar.
