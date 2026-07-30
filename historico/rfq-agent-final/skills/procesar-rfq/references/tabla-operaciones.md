# Tabla de operaciones de fabricación

Nomenclatura estándar para identificar operaciones en el análisis técnico. Usar denominación de la columna izquierda en los outputs.

---

## Operaciones de corte y preparación de material

| Denominación estándar | Cuándo se usa | Equivalencia inglés |
|----------------------|---------------|---------------------|
| Corte por sierra | Barras, perfiles a longitud | Sawing |
| Corte por plasma | Chapa media (3-30mm) | Plasma cutting |
| Corte por láser | Chapa fina-media (0.5-25mm) | Laser cutting |
| Corte por chorro de agua | Materiales sensibles, multicapa | Water jet cutting |
| Oxicorte | Chapas gruesas de acero (>20mm) | Oxy-fuel cutting |
| Cizallado | Chapa fina (<6mm) en serie | Shearing |
| Punzonado | Agujeros en chapa fina serie | Punching |

## Operaciones de conformado

| Denominación | Aplicación |
|--------------|------------|
| Plegado | Chapa: dobladuras lineales |
| Curvado | Tubos, barras, perfiles |
| Embutición | Chapa: profundidad >50% del diámetro |
| Estampación | Conformado en frío con matriz |
| Forja | Conformado en caliente con martillo/prensa |
| Calandrado | Curvar chapa en cilindros |
| Trefilado | Reducción de sección de barras/alambres |

## Operaciones de mecanizado

| Denominación | Máquina | Aplicación típica |
|--------------|---------|-------------------|
| Torneado | Torno paralelo / CNC | Piezas de revolución |
| Torneado vertical | Torno vertical | Piezas grandes de revolución |
| Refrentado | Torno | Caras planas perpendiculares al eje |
| Cilindrado | Torno | Diámetros exteriores |
| Mandrinado | Torno / mandrinadora | Diámetros interiores grandes |
| Fresado | Fresadora / centro de mecanizado 3 ejes | Caras planas, ranuras, contornos |
| Fresado 5 ejes | Centro 5 ejes | Geometrías complejas, aero |
| Taladrado | Taladradora / centro mecanizado | Agujeros |
| Escariado | Centro mecanizado / mano | Agujeros con tolerancia precisa |
| Roscado | Centro / macho a mano | Roscas internas |
| Rectificado plano | Rectificadora plana | Superficies planas Ra ≤0.4 |
| Rectificado cilíndrico | Rectificadora cilíndrica | Diámetros exteriores Ra ≤0.4 |
| Rectificado interior | Rectificadora interior | Diámetros interiores Ra ≤0.4 |
| Brochado | Brochadora | Estriados, chaveteros interiores serie |
| Tallado de engranajes | Talladora / fresadora especial | Engranajes |
| Honeado | Honeadora | Acabado superficial Ra <0.2 |
| Lapeado | Lapeadora | Acabado especular |

## Operaciones de unión

| Denominación | Tipo de unión |
|--------------|---------------|
| Soldadura TIG | Aceros inox, aluminio, calidad alta |
| Soldadura MIG/MAG | Acero al carbono, productividad |
| Soldadura por electrodo | Estructuras gruesas, exterior |
| Soldadura por puntos | Chapa serie |
| Soldadura por robot | Series altas |
| Soldadura láser | Alta precisión, automoción |
| Brasado / soldadura blanda | Uniones no críticas, piezas pequeñas |
| Remachado | Uniones desmontables, aero |
| Atornillado | Estándar |

## Tratamientos térmicos (típicamente subcontratados)

| Denominación | Efecto |
|--------------|--------|
| Temple | Aumento dureza |
| Revenido | Reducir tensiones tras temple |
| Normalizado | Refinar grano |
| Recocido | Reducir dureza, mejorar mecanizado |
| Cementación | Aumentar dureza superficial (carbono) |
| Nitruración | Aumentar dureza superficial (nitrógeno) |
| Carbonitruración | Combinación cementación+nitruración |
| Inducción | Temple superficial localizado |

## Tratamientos superficiales (típicamente subcontratados)

| Denominación | Función |
|--------------|---------|
| Anodizado | Capa óxido protectora aluminio (color) |
| Niquelado químico | Resistencia corrosión, aspecto |
| Cromado | Decorativo / técnico |
| Cincado | Anti-corrosión acero |
| Galvanizado | Anti-corrosión inmersión |
| Bonderizado | Pre-pintura |
| Pintura epoxi | Industrial, exterior |
| Pintura poliuretano | Aero, alta durabilidad |
| Pintura RAL | Color específico |
| Pulido | Acabado decorativo |
| Granallado | Limpieza superficial |
| Decapado | Eliminación óxido y cascarilla |

## Operaciones de acabado y limpieza

| Denominación | Uso |
|--------------|-----|
| Eliminación de rebabas | Casi siempre necesario |
| Achaflanado | Aristas vivas |
| Cepillado | Acabado decorativo lineal |
| Vibrado | Acabado en serie pequeñas piezas |
| Limpieza desengrasada | Antes de pintura/recubrimiento |
| Marcado láser | Identificación |
| Marcado por percusión | Identificación robusta |
| Grabado químico | Marcado decorativo/identificativo |

## Operaciones de inspección y certificación

| Denominación | Cuándo aplica |
|--------------|---------------|
| Inspección dimensional | Estándar |
| Calibración con CMM | Tolerancias críticas |
| Inspección con calibres pasa/no pasa | Series |
| END (Ensayo No Destructivo) | Aero, pressure vessels |
| Líquidos penetrantes | Detección defectos superficiales |
| Partículas magnéticas | Defectos en aceros ferromagnéticos |
| Ultrasonidos | Defectos internos |
| Radiografía | Soldaduras críticas |
| ITP (Inspection Test Plan) | Aero, nuclear, ferroviario |

## Notas de uso

- En el análisis, **listar las operaciones en orden cronológico de fabricación**, no por máquina o tipo.
- Si una operación es atípica para el sector, añadir nota explicativa.
- Las **subcontratas** se marcan claramente como tales en la sección DFM.
- Si el plano implica operaciones que el taller no realiza in-house (verificar contra `config-taller.md`), añadir alerta al estimador.
