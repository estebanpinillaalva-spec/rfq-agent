# Plantilla de output — Análisis RFQ

Estructura exacta del análisis técnico que debe generar la skill `procesar-rfq`. Copiar y rellenar.

```markdown
# 📋 ANÁLISIS DE RFQ

**Ref. interna:** RFQ-[YYYY]-[NNN]
**Fecha procesamiento:** [DD/MM/YYYY HH:MM]
**Tiempo de procesamiento:** [X minutos]
**Estado:** ⚠️ BORRADOR — pendiente de validación del estimador

---

## 📧 DATOS DEL CLIENTE Y RFQ

| Campo | Valor |
|-------|-------|
| **Empresa** | [Razón social] |
| **Contacto** | [Nombre, cargo si aparece] |
| **Email** | [email] |
| **Teléfono** | [si aparece, si no: "no especificado"] |
| **Idioma original email** | [ES / EN / FR / DE / IT / PT] |
| **Fecha del email** | [DD/MM/YYYY] |

### Datos comerciales

- **Plazo solicitado:** [específico o "no especificado"]
- **Cantidad total:** [número total de piezas o referencias]
- **Forma de pago:** [si aparece, si no: "según condiciones taller"]
- **Lugar de entrega:** [si aparece]
- **Repetición:** [SÍ / NO / no consta]
- **Urgencia indicada:** [SÍ / NO]

### Condiciones especiales

- **Certificaciones requeridas:** [ISO 9001, IATF 16949, EN 9100, AS9100, etc., o "ninguna mencionada"]
- **ITP requerido:** [SÍ / NO]
- **Certificado de material:** [3.1 / 3.2 / no especificado]
- **Otros:** [marcado, embalaje específico, etc.]

### Notas técnicas del email

[Volcado en bullets de notas relevantes mencionadas en el cuerpo del email]

---

## 📐 ANÁLISIS TÉCNICO POR PIEZA

### Pieza 1: [Denominación]

**A. Identificación**
- **Plano nº:** [referencia + revisión]
- **Empresa emisora:** [si aparece en cajetín]
- **Escala:** [1:1, 1:2, etc.]
- **Cantidad solicitada:** [unidades]

**B. Material**
- **Designación normalizada:** [ej. F-114 (1.0503)]
- **Equivalencias:** [si aparece otra designación, indicar]
- **Estado de suministro:** [normalizado, calibrado, laminado, etc.]
- **Notas material:** [tratamientos previos al mecanizado si aplican]

**C. Dimensiones**
- **Generales:** [largo × ancho × alto] o [Ø ext × longitud]
- **Volumen aproximado:** [cm³]
- **Peso estimado:** [kg, calculado con densidad estándar]

**D. Tolerancias**
- **Generales:** [ISO 2768 mK / fK / DIN 7168, etc.]
- **Especiales (cota a cota):**
  - [Cota X: tolerancia Y]
  - [Cota Z: IT6, +0/-0.005]
- **GD&T detectado:**
  - [Planitud 0.05 sobre superficie A]
  - [Perpendicularidad 0.02 entre A y B]
  - [Otros]

**E. Acabado superficial**
- **Rugosidad general:** [Ra X.X µm]
- **Rugosidad zonas específicas:** [si aplica]
- **Recubrimientos/tratamientos:** [anodizado, niquelado, pintura RAL, etc.]
- **Tratamientos térmicos:** [temple, revenido, normalizado, cementación, nitruración]

**F. Operaciones requeridas (en orden)**
1. [Operación 1: ej. Corte de barra Ø60 a longitud 250mm]
2. [Operación 2: ej. Torneado exterior]
3. [Operación 3: ej. Fresado de chavetero]
4. [Operación N...]

**G. Características críticas**
- **Roscas:** [M10×1.5 6H profundidad 25mm]
- **Chaveteros:** [DIN 6885 12×8×40]
- **Agujeros:** [Ø8 H7 pasante con escariado / Ø6 ciego prof. 15]
- **Otros:** [estriados, engranajes con módulo y nº dientes]

---

[REPETIR sección "Pieza N" para cada plano del RFQ]

---

## ⚠️ ANÁLISIS DFM (Design For Manufacturing)

### Riesgos detectados
- [Riesgo 1: ej. "Tolerancia IT6 en Ø interior + Ra 0.4 requiere rectificado, no solo torneado fino"]
- [Riesgo 2: ej. "Espesor de pared 1.5mm en zona X susceptible a deformación térmica"]
- [Riesgo N...]

### Sugerencias de optimización
- [Sugerencia 1: ej. "Cambiar tolerancia general de fK a mK reduce coste un 15% sin afectar función"]
- [Sugerencia 2: ej. "Material AISI 304 alternativa más económica que 316L si ambiente no es marino"]

### Ambigüedades a resolver
- ⚠️ [Ambigüedad 1: ej. "Cota X especifica Ø10±0.05 pero no indica función crítica. Confirmar si es ajuste real o nominal"]
- ⚠️ [Ambigüedad 2: ej. "Tratamiento térmico no especificado pero material sugiere temple HRC 40-44"]

---

## 💶 ESTIMACIÓN DE COMPLEJIDAD

⚠️ **Esto NO es presupuesto. Es input para skill `generar-presupuesto`.**

### Resumen
- **Complejidad global:** [BAJA / MEDIA / ALTA / MUY ALTA]
- **Justificación:** [breve explicación, máx 2 líneas]

### Por pieza

**Pieza 1**
- Complejidad: [nivel]
- Operaciones críticas: [lista de las que más impacto tienen en coste/plazo]
- Tiempo estimado por pieza: [rango en minutos]
- Subcontratas necesarias: [lista o "ninguna"]

[REPETIR para cada pieza]

### Tiempo de aprovisionamiento estimado
- Material: [días desde proveedores habituales]
- Subcontrataciones: [días añadidos al lead time total]

---

## ✅ BORRADOR DE RESPUESTA AL CLIENTE

Email en español listo para enviar tras validación del estimador. La plantilla concreta depende de si hay ambigüedades. Ver `emails-respuesta.md`.

[Email completo aquí]

---

## 🔧 NOTAS PARA EL ESTIMADOR (no enviar al cliente)

- [Asunciones críticas realizadas]
- [Cosas a validar antes de pasar a generar-presupuesto]
- [Riesgos comerciales o técnicos]
- [Recomendación margen aplicable según complejidad]

---

**Procesado por:** Sistema RFQ Agent v1.0
**Validado por:** [Pendiente - estimador]
**Validado fecha:** [Pendiente]
```

## Reglas de uso

- Mantener TODOS los campos. Si falta info, escribir "no especificado", no eliminar el campo.
- Marca de BORRADOR siempre visible en cabecera.
- Sección "Notas para el estimador" SIEMPRE separada y marcada para no enviar al cliente.
- Si hay 5+ piezas en el RFQ, considerar si dividir en sub-RFQs o si el cliente quiere un solo presupuesto integral.
