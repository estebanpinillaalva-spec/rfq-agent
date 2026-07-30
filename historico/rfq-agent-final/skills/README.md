# Skills RFQ Agent — Suite completa

5 skills profesionales para el agente IA de procesamiento de RFQ en talleres mecánicos españoles.

Generadas siguiendo el formato oficial de Anthropic skill-creator: frontmatter YAML con `name` y `description` optimizada para triggering, instrucciones imperativas, separación SKILL.md (<500 líneas) + recursos, ejemplos de uso, reglas críticas explícitas.

---

## 📋 Las 5 skills y su orden de uso

```
Email entrante con planos
    ↓
1️⃣  validar-plano        ← Filtro rápido (2-3 min)
    ↓ (si PROCESABLE)
2️⃣  procesar-rfq         ← Análisis técnico completo (5-10 min)
    ↓ (si análisis validado por estimador)
3️⃣  generar-presupuesto  ← Documento comercial profesional (3-5 min)
    ↓
Email respuesta al cliente con análisis + PDF presupuesto
```

```
Sesión semanal de captación comercial
    ↓
4️⃣  prospectar-linkedin  ← Lote de 20-30 prospectos cualificados (3-4h)
    ↓ (cuando hay demo agendada)
5️⃣  investigar-prospecto ← Dossier comercial pre-llamada (45-60 min)
    ↓
Demo con prospecto (preparada y personalizada)
```

---

## 🎯 Triggering automático

Cada skill tiene una **description optimizada con frases pushy** para activarse cuando hace falta, incluso si el usuario no lo pide explícitamente:

| Skill | Frases que la activan |
|-------|----------------------|
| validar-plano | "valida este plano", "está completo", "se puede procesar", "calidad suficiente"; o automáticamente al recibir cualquier dibujo técnico para presupuestar |
| procesar-rfq | "RFQ", "presupuesto", "request for quotation", "petición de oferta", "fabricación a medida", "cotizar pieza"; o cuando hay email + planos |
| generar-presupuesto | "genera presupuesto", "calcula coste", "haz oferta", "cotiza", "documento comercial"; o cuando hay análisis listo |
| prospectar-linkedin | "vamos a prospectar", "buscar talleres", "leads", "captación B2B", "Sales Navigator"; o sesión comercial semanal |
| investigar-prospecto | "investiga esta empresa", "prepara llamada con", "dossier", "tengo demo el [día]"; o automáticamente antes de demos |

---

## 📦 Estructura de cada skill

Todas siguen el mismo patrón profesional:

```
nombre-skill/
├── SKILL.md                    # Frontmatter + instrucciones (<500 líneas)
└── references/                 # Recursos cargados bajo demanda
    ├── plantilla-output.md     # Estructura del output esperado
    ├── tabla-X.md              # Tablas técnicas (materiales, etc.)
    ├── plantillas-Y.md         # Plantillas de email/documentos
    └── ...
```

Esto sigue el principio de **progressive disclosure**: solo se carga en contexto el SKILL.md base; los archivos de referencia se cargan a demanda cuando la skill los necesita.

---

## 🔧 Cómo usar las skills

### En Claude Code

Una vez tienes Claude Code instalado y la suite descargada:

```bash
# Las skills viven en una de estas ubicaciones:
~/.claude/skills/                    # Skills personales
[proyecto]/.claude/skills/           # Skills del proyecto
/mnt/skills/user/                    # Skills custom del usuario
```

Claude Code las detecta automáticamente. Cuando una de tus frases coincide con la description de una skill, Claude la activa internamente y sigue sus instrucciones.

### En Gemini Pro / ChatGPT (para el flujo Wizard of Oz)

Para procesar RFQs manualmente al inicio (antes de tener el agente automatizado):

```
1. Abrir Gemini Pro (https://aistudio.google.com)
2. Adjuntar el SKILL.md de la skill que toca (ej. procesar-rfq/SKILL.md)
3. Adjuntar el plano + email del cliente
4. Decir: "Procesa este RFQ siguiendo la skill"
5. Gemini sigue las instrucciones del SKILL.md como si fuera un prompt
```

### Como prompt directo (modo simple)

Si necesitas una versión sin sistema de skills, copia el contenido del SKILL.md como prompt y los archivos de referencia los pegas según los necesite.

---

## ⚙️ Archivos auxiliares por crear (futuro)

Estas skills hacen referencia a algunos archivos auxiliares que **aún no existen** y que iremos creando según los necesites:

### En `procesar-rfq/references/`
- ✅ plantilla-output.md (creado)
- ✅ tabla-operaciones.md (creado)
- ✅ tabla-materiales.md (creado)
- ✅ tabla-gdt.md (creado)
- ✅ emails-respuesta.md (creado)

### En `generar-presupuesto/references/`
- ✅ plantilla-presupuesto.md (creado)
- ✅ tarifas-referencia.md (creado)
- ⏳ tabla-densidades.md (pendiente, sub-tabla de materiales)
- ⏳ tabla-tiempos-operaciones.md (pendiente)
- ⏳ condiciones-comerciales.md (pendiente)

### En `validar-plano/references/`
- ✅ emails-cliente.md (creado)
- ✅ checklist-validacion.md (creado)

### En `prospectar-linkedin/references/`
- ✅ mensajes-linkedin.md (creado, unifica varios mensajes)
- ⏳ filtros-sales-navigator.md (pendiente)
- ⏳ queries-enriquecimiento.md (pendiente)
- ⏳ estructura-pipeline.md (pendiente)

### En `investigar-prospecto/references/`
- ✅ plantilla-dossier.md (creado)
- ⏳ queries-perplexity.md (pendiente)
- ⏳ ejemplos-hooks.md (pendiente)
- ⏳ red-flags.md (pendiente)

### En cada taller (fuera de las skills)
- ⏳ config-taller.md (uno por cada taller cliente, fuera del paquete general)

**Las skills funcionan al 80% sin estos archivos auxiliares.** Los crearemos sobre la marcha según los necesites en uso real.

---

## 🧪 Test cases para validar las skills

Antes de empaquetar cada skill como `.skill` file, conviene validar con casos reales. Test cases sugeridos:

### Para validar-plano
1. Plano técnico bueno y completo → esperado: PROCESABLE
2. Plano escaneado emborronado → esperado: NO PROCESABLE + email
3. Plano sin material especificado → esperado: DUDOSO + email

### Para procesar-rfq
1. RFQ simple en español, una pieza mecanizada → análisis estructurado completo
2. RFQ multilingüe (alemán) con 3 piezas → análisis en español, todas procesadas
3. RFQ con ambigüedades técnicas → análisis con ⚠️ flageados + email aclaratorio

### Para generar-presupuesto
1. Análisis simple con config-taller → presupuesto profesional completo
2. Análisis sin config-taller → solicitar config antes de proceder
3. Análisis con ambigüedades sin resolver → STOP, no generar

### Para prospectar-linkedin
1. Sesión sector mecanizado España → 25 prospectos en CSV con mensajes únicos
2. Sesión sector calderería con foco aero → prospectos cualificados con hooks aero
3. Re-prospección sector ya trabajado → excluir contactos previos, solo nuevos

### Para investigar-prospecto
1. Empresa con presencia digital fuerte → dossier completo en 45 min
2. Empresa pequeña sin info pública → dossier con secciones marcadas "no disponible"
3. Empresa que claramente no encaja → veredicto NO ENCAJA documentado

---

## 📥 Empaquetado como .skill files

Cuando las hayamos validado en uso real, podemos empaquetarlas como `.skill` files instalables:

```bash
python -m scripts.package_skill /path/to/validar-plano
python -m scripts.package_skill /path/to/procesar-rfq
# etc.
```

Los `.skill` files se pueden compartir, instalar en otras instancias de Claude Code, o publicar.

---

## 🎯 Filosofía de diseño

Estas skills siguen 5 principios:

1. **Progressive disclosure** — SKILL.md ligero (<500 líneas), referencias bajo demanda
2. **Trazabilidad** — todo dato técnico se asocia al plano del que viene
3. **Cero invención** — si falta dato, se marca como tal, no se asume
4. **Output estructurado** — formato consistente para que el siguiente paso (humano o skill) lo procese fácilmente
5. **Bilingüe input, output en español** — soporta RFQs multilingües, responde siempre en español

---

## 🔄 Evolución de las skills

Estas skills NO son finales. Se iteran con datos reales:

- Tras procesar 10-20 RFQs reales: ajustar `procesar-rfq` con patrones detectados
- Tras 5 presupuestos generados: ajustar `generar-presupuesto` con feedback de estimadores
- Tras 100+ prospectos contactados: iterar mensajes de `prospectar-linkedin`
- Tras 5 demos: ajustar pitch en `investigar-prospecto`

Cada cambio se documenta en `docs/DECISIONS.md` del proyecto.

---

**Versión actual:** 2.0 (post-skill-creator)
**Última actualización:** Sprint 0
**Próxima revisión:** Final Sprint 2 (tras primeros RFQs reales procesados)
