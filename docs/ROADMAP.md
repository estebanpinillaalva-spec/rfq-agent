# ROADMAP — 4 semanas hasta primer cliente piloto

> Nota 2026-05-08: este roadmap es historico. La fuente operativa actual es `AGENTS.md` y el piloto vigente es local/inbound con mock o Gemini, sin Supabase ni Claude API.

Plan ejecutable sprint a sprint. Adjuntar este archivo en cada sesión de Superpowers para que el sistema sepa dónde estás.

---

## 🎯 OBJETIVOS DEL MES

- 4 sprints semanales completados
- MVP email-native funcional end-to-end
- 100+ prospectos en pipeline
- 1 cliente piloto firmado
- Caso de éxito documentado

---

## 🏃 SPRINT 1 — Setup base (semana 1)

**Tema:** Infraestructura mínima + arranque comercial
**Tiempo estimado:** 15-20h

### Objetivos
- [ ] GitHub Student Pack solicitado
- [ ] Stack técnico instalado (Cursor, Node.js, cuentas servicios)
- [ ] Landing page LIVE en internet
- [ ] 30 prospectos en pipeline.csv
- [ ] Primer post LinkedIn publicado
- [ ] Primera prueba real de skill procesar-rfq con Gemini

### Cierre del sprint (viernes)
Reflexión obligatoria en docs/LEARNINGS.md:
- ¿Qué funcionó del stack de IA?
- ¿Cuánto tiempo real costó vs estimado?
- ¿Las skills generan output usable?
- ¿Qué cambiaría para el sprint 2?

---

## 🚀 SPRINT 2 — Backend agente email (semana 2)

**Tema:** El email mágico funciona end-to-end (modo demo)
**Tiempo estimado:** 20-25h

### Objetivos
- [ ] Resend Inbound configurado y testeado
- [ ] Webhook Next.js recibe emails y guarda en Supabase
- [ ] Integración Gemini Pro funcional para procesar planos
- [ ] Primer email procesado end-to-end (mando email a mí mismo, recibo análisis)
- [ ] 30 prospectos nuevos en pipeline (acumulado: 60)
- [ ] 5+ conversaciones activas en LinkedIn

### Demo interna obligatoria (viernes)
Te mandas un email con un plano real → debes recibir en <15 min:
- Email de respuesta con análisis técnico
- Confirmación de procesamiento

Si no funciona: stop. No avanzas a sprint 3 hasta resolverlo.

---

## 🎯 SPRINT 3 — Pipeline completo (semana 3)

**Tema:** PDF profesional + primera demo real con un taller
**Tiempo estimado:** 20-25h

### Objetivos
- [ ] Generación de PDF de presupuesto integrada (Puppeteer)
- [ ] Email respuesta con PDF adjunto profesional
- [ ] Logging completo de cada RFQ en Supabase
- [ ] Mini dashboard simple (ver historial de RFQs procesados)
- [ ] 1-2 demos agendadas con talleres reales
- [ ] 40 prospectos nuevos en pipeline (acumulado: 100)

### Métricas a trackear
- Tiempo medio procesamiento email recibido → respuesta enviada
- Tasa de éxito (RFQs que se procesan sin errores)
- Coste por RFQ (Gemini API + Claude API)

---

## 💰 SPRINT 4 — Cliente piloto firmado (semana 4)

**Tema:** Convertir conversaciones en piloto real
**Tiempo estimado:** 20-25h

### Objetivos
- [ ] 1 cliente piloto firmado (gratis o muy descontado, ej. 100€/mes)
- [ ] Onboarding del piloto: email mágico configurado, config-taller.md hecho
- [ ] Primer RFQ real del piloto procesado correctamente
- [ ] 3+ talleres en lista de espera para próximos pilotos
- [ ] Caso de éxito en draft con datos del piloto

### Conversaciones críticas
- Demo con el prospecto más caliente
- Negociación piloto: 2 semanas gratis o 100€/mes con descuento del 80%
- Compromiso de feedback honesto a cambio de testimonio

---

## 📊 MÉTRICAS DE SEGUIMIENTO SEMANAL

Actualizar cada viernes en docs/METRICAS.md:

### Comercial
- Prospectos contactados (total + nuevos esta semana)
- Tasa aceptación LinkedIn
- Conversaciones activas
- Demos agendadas
- Pilotos firmados
- MRR

### Técnico
- Sprints completados
- Tiempo total invertido
- Líneas de código (referencia, no objetivo)
- Bugs encontrados / resueltos
- Tests pasando

### Aprendizaje
- 3 cosas que funcionaron
- 3 cosas que NO funcionaron
- 1 cambio para próxima semana

---

## 🛑 SEÑALES DE STOP / PIVOT

Si al final del mes 1:
- 0 conversaciones reales con talleres → REVISAR mensajes/canal
- 0 demos agendadas → REVISAR pitch/posicionamiento
- MVP no funciona end-to-end → STOP comercial, FOCO técnico
- 0 interés a precio piloto (100€/mes) → POSIBLE PIVOT

Estas señales NO son fracaso. Son información sobre qué falta en el sistema.

---

## 🎬 RUTINA DIARIA SUGERIDA

**Mañanas (9:00-12:00) — Foco profundo**
- Trabajo técnico (Claude Code + Superpowers + Cursor)
- Actividad: lo que requiere concentración

**Tardes (15:00-18:00) — Comercial**
- Prospección, mensajes, llamadas
- Investigación con Perplexity
- Actividad: requiere energía social

**Viernes 17:00 — Cierre semanal**
- Actualizar pipeline.csv
- Actualizar docs/METRICAS.md
- docs/LEARNINGS.md de la semana
- Plan próxima semana con GSD

---

## 🤝 USO DE LAS HERRAMIENTAS POR FASE

### Cada inicio de sesión técnica
1. Claude Code abre con claude-mem inyectando contexto
2. Si hay tarea nueva: `/brainstorm`
3. Si hay plan: `/write-plan` 
4. Si hay que ejecutar: `/execute-plan`

### Cada commit / PR
1. `/review` automático
2. Si crítico: `/ultra-review`
3. Solo entonces: merge

### Cada sesión comercial
1. Adjunta skill apropiada (prospectar-linkedin o investigar-prospecto)
2. claude-mem recuerda contexto de la semana
3. GSD trackea acciones
4. Output a pipeline.csv siempre

### Cierre de día
1. claude-mem captura sesión automáticamente
2. GSD: marca tareas hechas, prioriza día siguiente
3. (Opcional) breve nota en LEARNINGS.md si hubo insight importante

---

**Última actualización:** sprint 0 (planificación)
**Sprint actual:** Sprint 1 — Setup base
