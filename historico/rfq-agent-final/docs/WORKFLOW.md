# WORKFLOW — Cómo usar tu stack de herramientas día a día

Esta es tu guía operativa para sacar el máximo de Superpowers, GSD, claude-mem y /review en cada sesión del proyecto RFQ.

---

## 🛠️ TUS HERRAMIENTAS Y SU ROL

| Herramienta | Su rol en el proyecto | Cuándo se activa |
|-------------|----------------------|------------------|
| **Claude Code** | CTO/arquitecto principal | Sesiones técnicas largas |
| **Superpowers** | Metodología (brainstorm/plan/execute) | Antes de codificar cualquier feature |
| **GSD** | Gestión de tareas | Continuo en background |
| **claude-mem** | Memoria entre sesiones | Automático al iniciar |
| **/review + /ultra-review** | Code review | Tras cada componente generado |
| **Cursor** | Editor con autocompletado IA | Codificación tactical |
| **Gemini Pro** | Visión técnica de planos | Procesamiento RFQs (Wizard of Oz) |
| **Perplexity Max** | Research comercial | Antes de cada demo / personalizar mensajes |
| **Tus 5 skills propias** | Procesos del negocio | Adjuntar según tarea |

---

## 🌅 RUTINA DE INICIO DE SESIÓN

### Cada vez que abres Claude Code en tu proyecto:

**1. claude-mem inyecta automáticamente** lo relevante de sesiones anteriores. Verifica que aparece algo tipo:
> *"Última sesión cerraste el endpoint /api/inbound-email. Pendiente: integrar el webhook con la BD Supabase."*

Si NO aparece: claude-mem no está activo. Reinicia.

**2. Verifica el sprint actual**
```
Comando: cat docs/ROADMAP.md | head -50
O simplemente: "¿En qué sprint estoy según ROADMAP?"
```

**3. Pregunta a GSD qué tareas tienes pendientes**
```
Comando GSD apropiado o: "Muéstrame mis tareas activas del proyecto RFQ"
```

**4. Decide la fase de la sesión:**
- **Brainstorm** (planificar algo nuevo)
- **Build** (ejecutar plan existente)  
- **Review** (revisar código generado)
- **Sales** (sesión comercial)

---

## 🧠 FASE BRAINSTORM — Cuando empiezas algo nuevo

### Cuándo usar
- Sprint nuevo y no tienes plan
- Feature que no tenías pensada
- Bloqueo donde no sabes por dónde tirar
- Cliente piloto pide algo que no habías previsto

### Cómo

```
1. Adjunta CONTEXT.md y ROADMAP.md
2. /brainstorm
   "[Describe la situación o feature en lenguaje natural]"
3. Superpowers te hace preguntas refinando
4. Llegáis a un design document
5. claude-mem captura todo
6. GSD añade tareas que se desprenden
```

### Ejemplo real para tu proyecto

```
TÚ: /brainstorm
    "Quiero implementar el webhook que recibe emails de Resend Inbound 
     y dispara el procesamiento del RFQ. Necesito que sea robusto: 
     emails con muchos adjuntos, errores de Gemini, retry, etc."

SUPERPOWERS: 
- ¿Cuántos adjuntos máx por email esperas?
- ¿Procesamiento síncrono o async (con cola)?
- ¿Qué hacer si falla la API de Gemini?
- ¿Necesitas idempotencia (mismo email reenviado dos veces)?
- ¿Qué métricas trackear?

[Tras tu respuesta, genera design doc con decisiones]

claude-mem captura: "Decidimos cola async con BullMQ + Redis (Upstash 
free tier), retry x3, idempotencia por message-id"

GSD añade: 
[ ] Setup Upstash Redis
[ ] Implementar /api/inbound-email con cola
[ ] Worker que procesa la cola
[ ] Tests de retry
```

---

## 🚀 FASE BUILD — Cuando ejecutas un plan

### Cuándo usar
- Tienes design doc claro
- Las tareas están en GSD
- Es momento de codificar

### Cómo

```
1. claude-mem te recuerda dónde estabas
2. /write-plan
   "Implementa lo que decidimos sobre el webhook. Ver design doc."
3. Superpowers genera plan de tareas concretas
4. /execute-plan
5. Subagentes ejecutan, two-stage review
6. Tú interrumpes solo si decisión arquitectónica
```

### Regla crítica

**NUNCA dejes que Superpowers tome decisiones arquitectónicas grandes mientras está en /execute-plan.** Si surge una decisión: PARAR, /brainstorm, decidir, retomar.

---

## ✅ FASE REVIEW — Tras código generado

### Cuándo usar
- Cualquier código nuevo de >20 líneas
- Antes de cualquier merge
- Cuando algo "no se siente bien" pero no sabes qué

### Cómo

```
TÚ: /review

CLAUDE: 
[Revisa el código generado]
- Bugs detectados
- Anti-patterns
- Issues de seguridad
- Rendimiento
- Test coverage

Si /review marca issues serios:
TÚ: /ultra-review
[Análisis más profundo con subagentes]

Aplicar correcciones.
Repetir /review si hubo cambios grandes.
```

### Cuándo usar /ultra-review específicamente

- Endpoints públicos (webhooks)
- Manejo de pagos / datos sensibles
- Lógica de procesamiento RFQ (core del negocio)
- Antes de desplegar a producción con clientes reales

---

## 📞 FASE SALES — Sesiones comerciales

### Cuándo usar
- Sesión semanal de prospección (lunes/jueves)
- Antes de cualquier demo
- Personalización de mensajes

### Cómo

#### Para prospección semanal:

```
1. Adjunta skill: prospectar-linkedin/SKILL.md
2. Adjunta CONTEXT.md  
3. claude-mem recuerda: "La semana pasada contactaste 30 mecanizado, 
   tasa aceptación 28%. Esta semana toca calderería."
4. "Vamos con la sesión: sector calderería, toda España, 30 prospectos"
5. Sistema te guía por todo el flujo
6. GSD captura cada acción
7. Output a pipeline.csv
```

#### Para preparación de demo:

```
1. Adjunta skill: investigar-prospecto/SKILL.md
2. "Tengo demo el jueves con [Empresa]. Genera dossier."
3. Perplexity Max lo recoge en research profundo
4. Output a prospectos/investigaciones-perplexity/
5. Lees 1h antes de la demo
```

---

## 🌙 RUTINA DE CIERRE DE SESIÓN

### Cada vez que terminas una sesión técnica:

**1. Commit + push**
```
git add .
git commit -m "[Sprint N] [tema breve]"
git push
```

**2. claude-mem captura automáticamente.** Verifica que se guarda algo relevante.

**3. GSD: marca tareas completadas, añade nuevas que surgieron**

**4. Si hubo aprendizaje grande, breve nota en docs/LEARNINGS.md**

### Cada viernes (cierre semanal):

```
1. Revisión del sprint con docs/ROADMAP.md
2. Actualizar docs/METRICAS.md
3. Reflexión 3+3+1 en docs/LEARNINGS.md:
   - 3 cosas que funcionaron
   - 3 cosas que NO funcionaron
   - 1 cambio para próxima semana
4. Plan próxima semana:
   /brainstorm "Plan próximo sprint según ROADMAP, dado lo aprendido"
5. Descansa de verdad. La consistencia gana al esfuerzo puntual.
```

---

## 🔥 PATRONES PROBADOS PARA TU CASO ESPECÍFICO

### Patrón 1: "Vibe + Skill + Review"

Para cualquier feature técnica:

```
1. Adjuntas la skill relevante (validar-plano, procesar-rfq, etc.)
2. /brainstorm para refinar la implementación de esa skill
3. /write-plan
4. /execute-plan (genera código)
5. /review (valida)
6. Test manual
```

Esto te garantiza que el código generado:
- Implementa exactamente la skill
- Es revisado antes de ejecutar
- Está documentado por claude-mem

### Patrón 2: "Manual antes que automático"

Antes de codificar la skill `procesar-rfq` en el sistema:

```
1. Procesas 3-5 RFQs MANUALMENTE con Gemini Pro + skill como prompt
2. Documentas en LEARNINGS qué patrones ves
3. /brainstorm sobre cómo automatizar exactamente esos casos
4. /execute-plan con conocimiento real, no teoría
```

Esto evita el "constructo del SaaS perfecto que nadie usa".

### Patrón 3: "Comercial primero, técnico después"

Cada semana del sprint:
- **Lunes-Martes**: PROSPECCIÓN (incluso sin producto terminado)
- **Miércoles-Viernes**: TÉCNICO

Por qué: si el lunes haces solo técnico, el viernes te quedas sin energía social y no prospectas → no tienes feedback real → optimizas algo equivocado.

---

## 🚨 ANTI-PATRONES A EVITAR

### ❌ Anti-patrón 1: Codear sin /brainstorm
**Síntoma:** Le pides directamente a Cursor que genere algo sin pensar arquitectura.
**Consecuencia:** Código que parece funcionar pero arrastra problemas que verás en 2 semanas.
**Solución:** SIEMPRE /brainstorm + /write-plan antes de /execute-plan.

### ❌ Anti-patrón 2: Saltarse /review
**Síntoma:** "Funciona, lo merge directamente."
**Consecuencia:** Bug en producción que costará cliente piloto.
**Solución:** /review NO es opcional para ti. Sin saber código, es tu único filtro.

### ❌ Anti-patrón 3: Mezclar herramientas en una sesión
**Síntoma:** Empiezas en Claude Code, saltas a Cursor, vuelves a ChatGPT, cierras Claude.
**Consecuencia:** claude-mem pierde el hilo, contexto fragmentado.
**Solución:** Bloque de 2-3h con UNA herramienta principal. Las otras solo si necesarias puntualmente.

### ❌ Anti-patrón 4: Construir antes de vender
**Síntoma:** "Cuando esté el MVP perfecto, empiezo a vender."
**Consecuencia:** 4 meses construyendo, 0 ingresos, te frustras.
**Solución:** Sprint 1 ya incluye 30 prospectos. Sin negociación.

### ❌ Anti-patrón 5: Ignorar GSD
**Síntoma:** Las tareas viven solo en tu cabeza.
**Consecuencia:** Olvidas follow-ups, pierdes prospectos calientes.
**Solución:** GSD es el sistema, tu cabeza no.

---

## 🎯 CHECKLIST DIARIO

Antes de cerrar el día:

- [ ] ¿Hice una sesión de Build con design doc claro?
- [ ] ¿Pasé /review por código nuevo?
- [ ] ¿Actualicé pipeline.csv si hubo acciones comerciales?
- [ ] ¿Captura claude-mem está al día?
- [ ] ¿GSD refleja tareas reales para mañana?
- [ ] ¿Mañana tengo bloque de tiempo en calendario?

Si 4+ son SÍ → buen día. Si 3 o menos → revisar qué falló.

---

## 🏁 OBJETIVO FINAL

Tu objetivo no es construir un producto perfecto. Es construir un **sistema de trabajo** que te permita iterar rápido, sin caos, con feedback real.

Cuando lo tengas dominado en 4-6 semanas:
- 1 cliente piloto
- Sistema técnico funcionando end-to-end
- Pipeline lleno
- Métricas claras

A partir de ahí, escalar es matemática: más prospectos × mismo sistema × mejor producto = más clientes.

---

**Última actualización:** Sprint 0
**Próxima revisión:** Final de cada sprint
