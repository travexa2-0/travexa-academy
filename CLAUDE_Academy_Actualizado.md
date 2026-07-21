# Travexa Academy — Instrucciones para Claude Code
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Última actualización: 21 Julio 2026 — Sesión 45b.** El detalle de cada sesión vive únicamente en la tabla de "Estado actual del proyecto" (✅ Completado) y, si construyó una feature, en su sección dedicada — no se repite acá.

> Este archivo es la **fuente de verdad única** para Claude Code en el proyecto Academy.
> Leerlo completo antes de ejecutar cualquier cosa.
> Para negocio/roadmap conjunto ver `Travexa_Negocio.md`; para infraestructura compartida ver `Travexa_Tecnico.md`; para Core ver `master.core.md` (no hace falta leerlo para trabajar en Academy).

---

## CÓMO LEER ESTE ARCHIVO

- **Siempre leer:** Rol, Qué es Travexa Academy, Modelo de negocio, los 4 Principios no negociables generales, Estado actual (tabla de sesiones + infraestructura lista + acción manual pendiente), Backlog priorizado, Principios no negociables (lista final).
- **Leer solo si la tarea toca ese tema:** las secciones dedicadas (Vivenciales, Portal de Instructores, Video de lecciones, Home pública, Cutover de dominio) son detalle histórico/de referencia de la sesión en que se construyó cada feature — consultarlas cuando se toque esa parte del producto, no hace falta releerlas todas cada vez.
- **Consulta puntual:** Schema de base de datos, Edge functions, Prototipos HTML, Identidad visual, Páginas — son referencia técnica, ir directo a la sección que corresponda.
- **El encabezado no lleva detalle de sesión.** Solo la fecha y el número de la última sesión, como puntero. Si buscás qué se hizo en una sesión puntual, andá directo a la tabla de "Estado actual del proyecto" (una fila por sesión) o a la sección dedicada si el índice la referencia.

### Reglas para actualizar este archivo (resumen — ver detalle completo en "Cómo actualizar este archivo" al final)

1. **Una sola fuente por dato.** Cada hecho (qué se hizo, en qué sesión, qué falta) vive en **un solo lugar**: la fila correspondiente de la tabla de sesiones, o la sección dedicada si la feature la tiene. Nunca se copia el mismo párrafo en dos lugares del documento — ni siquiera resumido. Si hace falta mencionarlo en otro lado, se **referencia** ("ver §7d" / "ver tabla de Sesiones"), no se repite.
2. **El encabezado se actualiza en una línea**, con la fecha y el número de la última sesión únicamente — nunca con el detalle de qué se hizo (eso ya vive en la tabla).
3. **Orden cronológico estricto** en la tabla de sesiones: sesión más reciente **abajo de todo** (la tabla crece hacia abajo, no hacia arriba). No insertar una sesión nueva en el medio ni arriba de otras.
4. **Antes de dar por terminada una actualización**, releer el documento de punta a punta una vez — no solo el fragmento editado — para confirmar que no quedó nada duplicado, fuera de orden, o con un estado (EN CURSO/CERRADA) que ya no corresponda.
5. **Antes de agregar una fila de sesión nueva, verificar primero si ya existe una fila con ese número** (`grep -c "^| Sesión N"` debe dar 0 antes de agregarla, y 1 después). Si ya existe, se **edita esa fila**, no se agrega una segunda — dos filas con el mismo número es un error que hay que evitar de entrada.

---

## ÍNDICE

1. [Rol](#rol)
2. [Qué es Travexa Academy](#qué-es-travexa-academy)
3. [Modelo de negocio — crítico](#modelo-de-negocio--crítico)
4. [Principios no negociables generales](#principios-no-negociables-generales)
5. [Estado actual del proyecto](#estado-actual-del-proyecto)
6. [Backlog priorizado](#backlog-priorizado)
7. [Vivenciales — cierre de venta por WhatsApp (Sesión 15)](#vivenciales--cierre-de-venta-por-whatsapp-sesión-15)
7b. [Vivenciales v2 — destino, precio y filtros (Sesión 19)](#vivenciales-v2--destino-precio-y-filtros-sesión-19)
7c. [Vivenciales v3 — reserva automática desde la plataforma (Sesión 20, PROPUESTA)](#vivenciales-v3--reserva-automática-desde-la-plataforma-sesión-20-propuesta)
7d. [Vivenciales v4 — rediseño de la página de detalle (Sesión 30)](#vivenciales-v4--rediseño-de-la-página-de-detalle-sesión-30)
7e. [Vivenciales — Destino independiente de País + toggle de título (Sesión 40)](#vivenciales--destino-independiente-de-país--toggle-de-título-sesión-40)
8. [Portal de instructores (Sesión 16)](#portal-de-instructores-instructor--sesión-16)
8b. [Backoffice — Sección Alumnos (Sesión 32)](#backoffice--sección-alumnos-adminalumnos--sesión-32)
8c. [Gamificación — puntos, XP, créditos y racha (Sesión 32)](#gamificación--puntos-xp-créditos-y-racha-sesión-32)
8d. [Pagos de curso — sin estado "pendiente" (Sesión 32)](#pagos-de-curso--sin-estado-pendiente-sesión-32)
8e. [Beneficios — tienda pública "Travexa Points" (Sesiones 36-38)](#beneficios--tienda-pública-travexa-points-sesiones-36-38)
9. [Home pública (Sesión 14)](#home-pública--sesión-14)
10. [Video de lecciones: grabado + en vivo (Sesión 17)](#video-de-lecciones-grabado--en-vivo-sesión-17)
11. [Cutover de dominio propio (Sesión 18)](#cutover-de-dominio-propio--sesión-18-11-julio-2026)
12. [Prototipos HTML aprobados](#prototipos-html-aprobados)
13. [Identidad visual — combinada](#identidad-visual--combinada)
14. [Schema de base de datos](#schema-de-base-de-datos-ya-existe--no-re-crear)
15. [Edge functions deployadas](#edge-functions-deployadas)
16. [Stack técnico](#stack-técnico)
17. [Infraestructura](#infraestructura)
18. [Control de acceso a contenido](#control-de-acceso-a-contenido)
19. [Páginas](#páginas)
20. [Principios no negociables (lista completa)](#principios-no-negociables-lista-completa)
21. [Cómo actualizar este archivo](#cómo-actualizar-este-archivo)

---

## ROL

Sos el CTO de desarrollo de **Travexa Academy**. Trabajás junto a Nicolás Belinco (CTO) y Yesica Robles (CEO) de Pencom Travexa SAS. Tomás decisiones técnicas, escribís código de producción, y asesorás antes de ejecutar en cualquier cosa que impacte arquitectura o producción.

**Idioma:** español rioplatense en todas las respuestas y en toda la UI.
**Código y comments:** en inglés.
**Modo de trabajo:** en decisiones de arquitectura, preguntar antes de ejecutar. En tareas claras, ejecutar directo.

---

## QUÉ ES TRAVEXA ACADEMY

Plataforma de formación del trade turístico argentino. URL oficial de producción: **`https://academy.travexa.com.ar`** (dominio propio, dado de alta en Vercel y sirviendo desde Sesión 18). `https://travexa-academy.vercel.app` sigue siendo el deploy de Vercel subyacente (el dominio custom apunta ahí) y sigue resolviendo, pero la URL de cara al usuario es la del dominio propio. ✅ Bug de login (redirigía a vercel.app tras el OAuth) **resuelto en Sesión 26**: causa raíz era la config de Supabase Auth (Site URL / Redirect URLs apuntando al dominio viejo); Nico aplicó el cambio en el dashboard y confirmó login OK (Google + email/pass) desde el dominio propio.

**Los 4 pilares:**
1. **Formación** — Cursos grabados por Yesica e instructores/influencers del sector.
2. **Vivencial** — Viajes educativos en grupo (fam trips). El diferenciador absoluto.
3. **Eventos** — Webinars, masterclasses, paneles. *(no construido — tablas placeholder existen)*
4. **Comunidad** — Feed social + directorio de miembros + gamificación. *(no construido — tablas placeholder existen)*

**Producto hermano:** Travexa Core/Marketplace es un repo y proyecto Vercel totalmente aparte, todavía no productivo. No se toca desde este proyecto, no se importa nada de ahí — ver `master.core.md` si hace falta contexto.

---

## MODELO DE NEGOCIO — CRÍTICO

**El registro es GRATUITO. No hay planes ni suscripciones.**

El usuario paga por lo que consume:
- **Curso individual** → pago único por curso, vía Mercado Pago dentro de la plataforma (pendiente de `MP_ACCESS_TOKEN` para cobros reales).
- **Vivencial** → pago único por experiencia (precio en USD, cobrado en ARS) — **⚠️ desde Sesión 15, NO se cobra dentro de la plataforma.** La venta se cierra por WhatsApp con Yesica, quien registra el pago manualmente en el backoffice (ver sección dedicada).
- **Evento pago** → pago único por evento.

**No construir nada de planes, membresías ni suscripciones.**

⚠️ **Deuda técnica confirmada (11/7):** existe en la base una tabla `academy_subscriptions` + edge functions `create-subscription-academy`/`confirm-subscription-academy`, deployadas ACTIVE, de la etapa "Días 1-3" (previa a que se definiera este modelo). **No están en uso, no reflejan ninguna funcionalidad real, no hay ningún botón que las invoque.** Confirmado con Nico que Academy nunca tuvo ni tiene suscripciones. Ver ítem de limpieza en el Backlog.

---

## PRINCIPIOS NO NEGOCIABLES GENERALES

Los cuatro que más determinan cómo se construye cualquier feature nueva. La lista completa (14 puntos) está al final del documento.

### Integridad de datos en producción (Sesión 14)

**Ninguna estadística, testimonio, rating o cara de usuario que se muestre como prueba social puede ser inventada.** Se conecta a datos reales de la base, o la sección/elemento se oculta por completo (feature flag, `display:none` efectivo, lo que corresponda) hasta que exista el dato real.

- No alcanza con marcarlo como "muestra" o "demo" visible al usuario.
- Incluye fotos de stock de personas presentadas junto a texto que sugiere que son usuarios/asesores reales, aunque no lleven nombre ni cifra asociada. Usar avatares genéricos para cualquier elemento decorativo de este tipo.
- Cuando la DB esté vacía, la sección correspondiente muestra un estado vacío diseñado explícitamente — nunca cards fantasma ni ceros crudos.

### Scroll libre (Sesión 14)

No agregar `scroll-snap`, scroll-jacking, ni ningún comportamiento que le saque al usuario el control del scroll, salvo que esté explícitamente pedido y acotado. El alto de sección se resuelve con CSS (`100dvh`), no secuestrando el scroll.

### Vivenciales no se cobran en la plataforma (Sesión 15)

**Travexa no factura vivenciales.** El cierre de venta es 100% por WhatsApp con Yesica; la plataforma nunca procesa un cobro de vivencial. Detalle completo en la sección dedicada.

### Las migraciones las aplica Claude directo (regla corregida en Sesión 32 — antes era "se proponen, no se aplican")

**Corrección explícita de Nico en Sesión 32:** la regla de Sesión 16 tenía mal el dueño del paso. No es "Nico aplica las migraciones" — es **Nico y Yesica hacen el QA visual final** (principio #13), y **Claude corre las migraciones directo** contra `fvrwtqhkskbaixqbxami` (SQL, policies, triggers, `CREATE OR REPLACE`), sin frenar a pedir aprobación por tamaño ni por riesgo bajo. Sigue valiendo el resto del espíritu de la regla original: nunca recrear tablas (solo `ALTER TABLE`), nunca borrar datos salvo pedido explícito y acotado, y dejar la migración commiteada en `supabase/migrations/` del repo (no solo aplicada en el dashboard) para que quede trazada. Detalle del incidente que originó la regla vieja en la sección del Portal de Instructores; detalle de la corrección y de qué se aplicó bajo esta regla nueva en §8b/§8d.

### Toda entrega se prueba visualmente por Yesica o Nico, EN PRODUCCIÓN (regla de ecosistema, ver `Travexa_Negocio.md`)

Ningún ítem se da por cerrado solo con build/deploy limpio y verificación de código/DB — por más prolija que sea esa verificación. Falta el paso humano de ver la feature funcionando de verdad en el navegador. **La prueba visual/funcional de Yesica y Nico se hace EN PRODUCCIÓN, después del deploy — NO antes de mergear.** Es decir: la falta de prueba visual **no bloquea el merge ni el deploy**; sí es requisito para dar el ítem por **completamente cerrado** en el backlog. Se mergea, se deploya, y recién ahí se prueba en vivo. Esto ya generó backlog pendiente real (ver Backlog): el flujo de vivenciales se deploya a prod y queda pendiente la prueba real de Yesica/Nico como usuario.

---

## ESTADO ACTUAL DEL PROYECTO

### ✅ Completado

| Sesión | Qué se hizo |
|---|---|
| Días 1-3 | Setup completo: Vite + React 18 + TS + shadcn/ui + Tailwind v4 + Supabase + auth + páginas base + edge functions MP |
| Sesión 4 | Supabase `fvrwtqhkskbaixqbxami` creada con schema completo + edge functions deployadas |
| Sesión 5 | Schema extendido (tipos, vivencial, gamificación) + datos seed + prototipo HTML aprobado de `/cursos` y `/cursos/:slug` |
| Sesión 6 | `/cursos`, `/cursos/:slug`, `/vivencial`, `/vivencial/:slug` implementados en React. `cupoEstado()` como única fuente de verdad |
| Sesión 7 | Prototipos `/vivencial` y `/perfil` diseñados y aprobados. Sistema dual XP/Créditos, niveles, referidos definidos |
| Sesión 8 | `Profile.tsx` implementado (6 tabs, 7 modales). Header actualizado ("Formación" / "Mi perfil") |
| Sesión 9 | Onboarding obligatorio de 3 pasos, gate real contra DB, referidos vía trigger, `award-points`/`check-badges` deployadas, Google OAuth activado y probado en local, badges client-side corregidos |
| Sesión 10 | Backoffice `/admin/*` (Resumen, Cursos, Vivenciales, Métricas) conectado a Supabase, con RLS admin y wizards de 5 pasos |
| Sesión 12 | Player rebuild + comunidad + ebooks + rediseño con ruta de vuelo horizontal + foto de perfil |
| Sesión 13 | Bugfixes de auth/infra en producción (Site URL, `vercel.json`, Realtime) + auditoría de mocks + `/admin/beneficios` y `/admin/instructores` |
| Sesión 14 | **Home pública (`/`) diseñada, implementada y en producción**, con hero animado de scroll-scrub en curso (Fase 2, rama aparte) |
| Sesión 15 | **Vivenciales: cierre de venta por WhatsApp + carga manual de pagos en backoffice, en producción.** Ver §7 |
| Sesión 16 | **Portal de instructores (`/instructor/*`)**, liquidaciones mensuales, auto-link por email. ⚠️ Incluye una desviación de proceso registrada (origen de la regla "DB se propone"). Ver §8 |
| Sesión 17 | **Video de lecciones grabado/en vivo unificado en el player** + admin carga video/`live_url`/`fecha_vivo`/portada por lección. Rama de trabajo, sin mergear. **Hotfix a producción** del crash de `/cursos` (`NIVEL_STYLES[nivel]` sin fallback). Ver §10 |
| Sesión 18 | **Cutover de dominio propio: `academy.travexa.com.ar` en producción.** ✅ Bug de login → vercel.app diagnosticado y **resuelto en Sesión 26** (causa: Site URL/Redirect URLs de Supabase Auth; código y Google Cloud OK; Nico aplicó el fix en el dashboard, confirmado en incógnito). Ver §11 |
| Sesión 19 | **Vivenciales v2: wizard rediseñado (país/localidades, puntos de salida y hoteles múltiples, desglose de precio) + filtros públicos (traslado) + detalle enriquecido + prototipo actualizado.** Migración PROPUESTA sin aplicar. Ver §12 |
| Sesión 20 | **Vivenciales v3 (PROPUESTA, a confirmar): reserva automática desde la plataforma** — gate de login en todo comprar/reservar, flujo de reserva con elección de punto de salida → pantalla de confirmación con datos bancarios, número de reserva, "Informar transferencia" enriquecido, vista por viajero en backoffice. Reemplaza el cierre por WhatsApp de §7 (NO borrado, pendiente confirmación Yesica/Nico). Migración PROPUESTA sin aplicar. Mail (punto 4) y liquidación PDF (punto 6) pendientes de aprobar approach. Ver §7c |
| Sesión 21 | **Confirmaciones de Nico aplicadas sobre v2/v3** (ambas migraciones aún sin aplicar): (1) `punto_embarque` renombrado a **`detalle_encuentro`** en todo el código, migración y doc; (2) **DNI del cliente** movido a `academy_profiles` vía onboarding (paso 1 obligatorio) + leído en backoffice y PDF de liquidación; (3) cerradas las 2 decisiones de diseño de v2 (embebido + reuso `incluye`/`no_incluye`); (4) confirmada **1 sola cuenta** bancaria; (5) pulido de builders (ids estables + input de archivo por fila). Mail Resend + PDF client-side quedaron implementados en Sesión 20. Ver §7b/§7c |
| Sesión 22 | **Migraciones v2 + v3 APLICADAS en producción** (por Claude IA vía MCP, con aprobación de Nico) — schema real verificado contra el código (`tsc`/`eslint`/`vite build` limpios; RPC self-service, trigger de número y columnas nuevas presentes). **Mail Resend en pausa:** `send-reserva-email` queda escrita, sin deployar, disparo fire-and-forget (no bloquea la reserva) → movido a P1. Único pendiente para reemplazar §7: la **prueba visual del flujo self-service** por Yesica/Nico. Ver §7c |
| Sesión 23 | **Correcciones de copy/contenido + página nueva + 2 bugs visuales, shippeado a `main` (producción).** (1) **Formación (`/cursos`)**: nuevo hero ("Formación práctica que se traduce en más ventas.") + bloque de 3 tarjetas de oferta de valor + tira de 3 métricas reales (usuarios activos/cursos completados/certificados) vía RPC público **propuesto** `academy_public_formacion_stats` (sin aplicar → la tira se oculta; nunca hardcodea). (2) **Vivencial (`/vivencial`)**: nuevo hero ("El turismo no solo se estudia. Se vive.") + 4 tarjetas de oferta de valor. (3) **Página pública nueva `/instructores`** (nav + hero + equipo docente traído de `academy_instructors` real, no hardcodeado, + placeholder de testimonio). (4) **Bug carrusel Home** "Los cursos más elegidos": centrado real + loop seamless solo cuando el set desborda (medición JS) + cards más grandes/jerárquicas. (5) **Bug footer/CTA final**: fondo del footer alineado al degradé del CTA (var(--bg2)) + sin borde, en la Home. Prototipos `academy_catalogo.html` y nuevo `academy_instructores.html` actualizados. Pendientes: cargar los 3 instructores nuevos (INSERT propuesto) + aplicar RPC de métricas + prueba visual. Ver Backlog P1 |
| Sesión 24 | **Merge de v2/v3 (reserva self-service de vivenciales) + copy fixes/instructores de Sesión 23 → `main`, deployado a producción.** Se reconciliaron ambos frentes (el botón de vivencial queda como **"Reservar mi lugar"** del flujo self-service, reemplazando el "Quiero mi lugar" WhatsApp de §7; se preservó el guard de `nivel` null de Sesión 23). Migraciones v2+v3 ya aplicadas. `.gitignore` ignora `SKILL-*.md`. Principio #13 actualizado: la prueba visual se hace EN PRODUCCIÓN, no bloquea el merge. Pendiente único para cerrar el reemplazo de §7: prueba visual del flujo self-service en prod. Ver §7c |
| Sesión 26 | **Módulo de Cursos (público + backoffice): 6 mejoras + 1 bug bloqueante.** (1) **Descripción larga** (`descripcion_larga`, columna ya existente) ahora se renderiza en `/cursos/:slug`: la corta como bajada destacada, la larga como cuerpo. (2) **Fix de recorte del hero** en `CourseDetail` (imagen en capa `absolute` recortada, contenido en flujo normal que crece) — afectaba preview de borrador y prod (mismo componente, el preview del backoffice abre `?preview=1`). (3) **Tipografía** del detalle subida a escala legible (cuerpo ~15-16px). (4) **Fechas del vivo movidas del step Precio a nivel lección**: toggle Grabada/En vivo por lección (cualquier tipo de curso, sin flag nuevo — se deriva de `fecha_vivo`), y `course.live_date` se **deriva al guardar** (próxima fecha futura de las lecciones) → card y detalle sin cambios de query. `courseLiveState` relajado (grabado puede tener clase en vivo). Detalle muestra listado "Fechas en vivo". (5) **Modal expandible** (`ExpandableTextArea` + expand en `RichTextArea`) para textos largos del wizard (desc. completa, descripción de módulo/lección, incluye/no incluye y los campos nuevos). (6) **Gap analysis**: 5 columnas nuevas (`academy_courses.para_quien/no_es_para/objetivos/certificacion` + `academy_lessons.descripcion`) — migración `20260712020000_course_gap_fields.sql` **APLICADA** (aparece en `list_migrations`); modalidad/duración/por qué diferente/docente van a `descripcion_larga` (texto libre). (7) **Bug bloqueante PDF (415)**: el bucket `academy-media` no tenía `application/pdf` en `allowed_mime_types` y su límite era 5 MB. (8) **Seña ARS del wizard vivencial ahora es input independiente** (`VivencialWizard.tsx`): deja de derivarse de `sena_usd × tipo_de_cambio` y pasa a escribir directo en `vivencial_precio_seña_ars` lo que carga Yesica a mano (referencia, sin cobro automático); inputs de base/impuestos/seña con separador de miles es-AR (`formatNum`). **No requirió migración**: la columna `vivencial_precio_seña_ars` ya existía. `tsc`/`eslint`/`vite build` limpios. **Override explícito de la regla #12:** la migración `20260712020000_course_gap_fields` y el cambio de bucket los aplicó **Claude Code vía MCP** por pedido explícito e itemizado de Nico, no por inferencia. **Mergeado a `main` y deployado a producción** (deploy `dpl_B9nJbBTPLLPZyyCQHXHRaa1QBpY8`, sirviendo en `academy.travexa.com.ar`). **Prueba visual EN PROD confirmada por Nico (principio #13): OK**, ítem cerrado. (9) **Bug de login → vercel.app (pendiente desde Sesión 18), retomado y resuelto en esta sesión**: diagnosticada la causa raíz (Site URL/Redirect URLs de Supabase Auth apuntando al dominio viejo, ver §11) y **confirmado el fix** por Nico en el dashboard — login OK en incógnito (Google + email/pass) desde `academy.travexa.com.ar`. |
| Sesión 25 | **SQL de Sesión 23 aplicado (con override consciente y autorizado de la regla #12) + refinamiento de métricas.** (1) `academy_instructors`: cargados los 3 instructores nuevos (Javier Pérez, Hernán Causté, Florencia Endl, `activo`) + `especialidad` de Yesica actualizada a "Fundadora · Psicología y PNL" (su bio/foto reales intactas) → `/instructores` ya muestra los 4. (2) RPC `academy_public_formacion_stats()` (`SECURITY DEFINER`, cuenta global, `grant` a anon/authenticated) **aplicado** — hoy devuelve `{usuarios:3, completados:0, certificados:0}`. (3) La tira de métricas de `/cursos` ahora se oculta bajo un **piso de 50 usuarios activos** (no solo en cero): con 3 usuarios reales queda oculta, surge sola con volumen. Deployado a prod. La aplicación de estos 3 cambios de DB la hizo Claude Code por pedido explícito e itemizado de Nico (override registrado de la separación de tareas de #12), no por inferencia — no es el patrón de Sesión 16. |
| Sesión 27 | **Backoffice — wizard de Vivenciales/Cursos: 5 bugs corregidos, mergeado y en producción.** (1) **Pérdida de datos al navegar entre pasos** (`VivencialWizard.tsx` y `CourseWizard.tsx`): el estado del formulario ya vivía en el componente padre (no era el problema clásico de subcomponentes que se desmontan), pero el `useEffect` de reset se re-disparaba en cualquier render donde `initial` cambiara de referencia, pisando los datos recién cargados. Fix: guard con ref `wasOpen` — el reset solo corre en la transición cerrado→abierto del modal. (2) **Botón "Guardar cambios" dinámico**: tracking de dirty state (`JSON.stringify(form)` contra un baseline en un ref) que habilita el botón solo si hay cambios reales; hace guardado incremental (persiste, rebasea el baseline, deja el wizard abierto) en los pasos 1-4 del modo edición — en el último paso el botón principal ya es el guardado. (3) **Preview de imágenes al subir**: `VivencialWizard` mostraba solo un contador ("N cargadas") sin thumbnail; ahora hay grid de miniaturas reales (`URL.createObjectURL` para archivos locales o URL pública si ya está en `academy-media`), badge "Portada" en la primera foto y botón de borrar por imagen (al borrar la portada, promueve la siguiente). Los uploaders de `CourseWizard` (portada, PDF) y `HotelesBuilder` ya tenían preview, sin cambios ahí. (4) **Botón Cancelar**: reposicionado (queda pegado a la acción principal; "Atrás" pasa al extremo opuesto), estilo destructivo en rojo, y ahora abre un modal de confirmación ("¿Seguro que querés cancelar? Se perderán los cambios no guardados") — solo si hay cambios sin guardar; si el formulario está intacto, cierra directo. Mismo guard aplicado a Escape / click en backdrop / botón X. (5) **Bug crítico: "Ver preview" de un vivencial abría `/cursos/:id?preview=1` (el detalle de CURSO) en vez del detalle real de vivencial.** `ContentDetailDrawer.openPreview` ahora ramifica por tipo de contenido: `/vivencial/:slug?preview=1` para vivenciales, `/cursos/:slug?preview=1` para cursos. `VivencialDetail` lee el query param, lo pasa a `useCourseDetail(slug, preview)` (el hook ya soportaba el modo, salteando el filtro `publicado`) y muestra el banner dorado de borrador con el texto correcto para vivencial. **Sin cambios de schema, RLS ni secrets.** `tsc -b`, `eslint`, `vite build` limpios. Mergeado a `main` (PR #2, squash, commit `9831cfd`) y **deployado a producción** (deploy `dpl_9KhT2mQLhCiUgXFg1L74HJC9HPcD`, `academy.travexa.com.ar`, READY). Decisión tomada sin confirmación explícita previa: el modal de confirmación de Cancelar solo aparece si hay cambios sin guardar (revertible en una línea si se prefiere que confirme siempre). **Pendiente:** prueba visual en prod por Nico (principio #13) — ver Backlog P0. |
| Sesión 28 | **Wizard de Vivenciales — precio en ARS y USD 100% independientes (base + impuestos), fix de regresión en Seña, y propuesta (sin construir) de pago en dólares vía dLocal.** Todo en `VivencialWizard.tsx` (`/admin/vivenciales`), sin migraciones. **(0) Propuesta evaluada y pausada — pago online en USD vía dLocal:** se armó un plan completo (columna `vivencial_precio_online_usd` opt-in, columnas `origen`/`monto_usd`/`dlocal_payment_id` en `academy_vivencial_payments`, edge functions `create-vivencial-dlocal-payment` + `dlocal-webhook-academy`, botón "Pagar en dólares" conviviendo con "Reservar mi lugar") para que el pago en dólares se sume como opción sin tocar el flujo ARS/transferencia existente — **no se implementó nada**: al revisar el negocio con Nico se confirmó que los leads son mayoritariamente argentinos y nadie paga en USD, así que la prioridad pasó a poder cargar precio en ambas monedas en el backoffice (ver punto 3). La propuesta queda documentada para retomar si en el futuro hace falta cobro real en dólares — ver Backlog P1. **(1) Bug de regresión — paso "Seña sugerida" con ARS deshabilitado:** el campo "Equivalente ARS" había vuelto a quedar derivado del USD (disabled) y sin poder cargarse a mano, revirtiendo el fix de Sesión 26; además el número no llevaba separador de miles y "Total final a pagar" no reflejaba el valor cargado. Fix: `sena_ars` vuelve a ser un campo independiente en `FormState` (inicializado desde `vivencial_precio_seña_ars`), se eliminó el `useMemo` que lo derivaba del USD, y el guardado usa `Number(form.sena_ars) || 0` en vez de un valor calculado. **(2) Formato de números:** los inputs de seña pasaron de `type="number"` a `type="text" inputMode="numeric"`, con helpers `displayInt` (formatea con `formatNum` es-AR, ej. "243.234") y `onlyDigits` (el estado guarda solo dígitos); símbolo de moneda en el prefijo, separado del número. Mismo patrón aplicado después a precio base e impuestos (USD). Gastos administrativos (%) se dejó en `type="number"` a propósito — necesita decimales, `onlyDigits` los rompería. **(3) Base e impuestos también independientes en ARS y USD (pedido de negocio: el peso es la moneda real, el dólar es solo referencia):** se agregaron `base_ars`/`impuestos_ars` a `FormState` (inicializados desde `vivencial_precio_base_ars`/`vivencial_impuestos_ars`, columnas que **ya existían en el schema real** — verificado por SELECT a `information_schema`, no hizo falta migración) y se eliminó por completo la derivación automática por tipo de cambio (`tc`) que existía desde Sesión 19: ahora `total_usd` y `total_ars` se calculan cada uno desde su propio desglose independiente (`base + impuestos + gastos_admin_pct%`), ninguno deriva del otro. Nuevo componente `PriceBreakdown` (reusable) muestra el desglose en ambas monedas sin "≈" ni "TC" (ya no son aproximaciones). La validación del paso pasó de exigir USD > 0 a exigir **al menos una de las dos monedas** cargada (con USD obligatorio, Yesica no podía avanzar cargando solo ARS); confirmado con Nico que no hace falta exigir ARS tampoco — si falta, se completa después editando el vivencial. El total final de la preview del paso Revisión pasó a mostrarse en ARS primero (moneda real de pago), con el desglose completo en ambas monedas debajo. Seña, schema, modelo de negocio y flujo dLocal sin tocar; sin migraciones aplicadas. `tsc -b` y `eslint` limpios en los tres fixes. **(4) Datos de prueba cargados directo en Supabase** (autorización explícita de Nico, sin migración ni cambio de schema — solo filas): usuario `nibelinco@gmail.com` inscripto en el único vivencial publicado ("Capacitación Vivencial Brasil", `31f50acc-7cfb-4cb5-bee1-7bdde657266c`) con reserva `VIV-2026-00002`, punto de salida "Buenos Aires", total $942.500 ARS, seña de $239.250 ARS cargada como ya **aprobada** (simula que Yesica ya la confirmó), saldo pendiente $703.250 ARS, cupo del vivencial descontado en 1 — pensado para destrabar la prueba visual pendiente del flujo self-service v3 (subir el saldo desde la plataforma y verlo en cola de aprobación del backoffice). **Pendiente:** prueba visual en prod por Yesica/Nico (principio #13) del paso Precio completo (seña + base + impuestos, en ambas monedas) — ver Backlog P0. |
| Sesión 29 | **Deploy de dos tandas que habían quedado sin commitear + refinamiento del Portal de instructor + rework de registro, todo en `main`/producción.** **Desviación de proceso detectada y corregida (se documenta igual que Sesión 16):** el trabajo de dos sesiones previas —el portal de instructor con la lógica de no exponer el bruto de Travexa, y el rework de auth/registro— había quedado **solo en el working tree local, nunca commiteado ni pusheado**; por eso producción seguía mostrando cosas "ya arregladas" (ej. la card "Facturado del mes" en `/instructor/resumen`). Se confirmó con `git show origin/main` que no era rama sin mergear ni revert: era trabajo sin guardar. **(A) Portal de instructor:** (1) sacadas las métricas del bruto de Travexa — card "Facturado del mes" (`Resumen`), columna "Facturado" (`Metricas`) y card "Facturado" del curso (`CursoDetalle`); la ganancia sale ahora de las RPC `get_instructor_sales`/`get_instructor_payouts` (share aplicado por el servidor, el bruto nunca llega al cliente — verificado que ambas RPC ya existían en la DB con la forma correcta). (2) Tablas prolijas: regla `.align-right` real para celdas de tabla (faltaba en `admin.css`, era no-op) → columnas numéricas alineadas a la derecha con sus headers en `Cursos`/`Metricas`/`Pagos` instructor y `PagosInstructores` admin, + aire arriba en headers. (3) Botón de colapsar el sidebar del portal ahora visible (más grande, chevron teal, sombra fuerte contra el fondo oscuro). (4) Logo del portal: avioncito de papel → `graduation-cap` (lucide) sobre el mismo cuadro dorado. (5) `Mi perfil`: layout a ancho completo — "Sobre vos" (Especialidad+Bio) y "Redes" (grilla 2x2) lado a lado, responsive apila en mobile. Commits `f886e28`, `e583ff5`. **(B) Registro con confirmación por mail + taxonomía única:** (1) `signUp` con `emailRedirectTo /auth/callback`, detección de "ya registrado" (identities vacío, anti-enumeración), retrocompatible (si "Confirm email" está apagado loguea directo); pantalla "Revisá tu mail" + reenvío; Login distingue "mail sin confirmar" de credenciales incorrectas (code de Supabase); `AuthCallback` maneja confirmación OK (toast) y link vencido/inválido → `/login`. (2) `lib/taxonomy.ts`: fuente única de `tipo_vendedor`/`anos_experiencia`/`genero` compartida por onboarding y "Tus datos" del perfil (mismos `value` ya cargados en `academy_profiles` → **sin migración**); saca el selector de tipo de cuenta del registro (ahora lo define el onboarding, paso 2); guard anti-loop de onboarding en mobile (`onboarding_completo` → `/`). (3) Header: Backoffice y Portal instructor como accesos independientes (quien es las dos cosas ve los dos, Portal con ícono graduation-cap); z-index del drawer de notificaciones (abre debajo del header, no lo tapa). (4) Admin: al cargar instructor, detectar cuenta existente por email y precargar nombre/teléfono sin pisar lo tipeado + vincular `user_id` (bug #3). Commits `7a9f8b1`, `8e857d2`, `ac63bad`. **Verificado contra la DB real antes de deployar:** trigger `handle_new_user` tolera la ausencia de `tipo_cuenta` (guard `IF ... IS NOT NULL`, no rompe el alta), las columnas de la taxonomía existen y son nullable, `profiles.telefono` existe, "Confirm email" está ON (hay usuarios reales confirmando horas después de registrarse) y `/auth/callback` ya está en el allowlist de Supabase (el OAuth de Google ya lo usa en prod, misma URL). `npm run build` limpio antes de cada push. **Deploys directos a `main`** (memoria del usuario: migraciones/deploys sin pedir aprobación). **Pendiente:** prueba visual en prod del registro real con confirmación por mail — que llegue el mail, que el link loguee y lleve al onboarding, y que el reenvío funcione (principio #13) — ver Backlog P0. |
| Sesión 30 | **Rediseño completo de la página pública de detalle de vivencial (`/vivencial/:slug`) + una ronda larga de debugging post-deploy, en `main`/producción.** Diseño hecho primero en mockup HTML iterado en vivo con Nico (`vivencial-detalle.V2.html`) hasta su aprobación explícita, y recién ahí implementado — mismo patrón que el resto de prototipos aprobados. **Diseño:** hero cinematográfico full-bleed con parallax + nombre del país gigante flotante (blanco, glow, animación de levitación) + botones de copiar link/compartir; itinerario en timeline vertical con apertura al hover (desktop) o click (mobile) y foto por día; manifiesto/Q&A que Yesica había cargado como texto libre en `incluye` ahora se separa automáticamente en chips (bullets cortos) + cards de prosa agrupadas por subtítulo con fondo liquid glass a ancho completo de sección (no hardcodeado al contenido de Brasil — la regla de agrupamiento es genérica); sección "Qué incluye + Alojamiento" inmersiva sobre foto de fondo; price card liquid glass con contador animado, barra de cupos y "Ver qué no incluye" desplegable; barra flotante inferior persistente estilo iOS que aparece pasado el hero y se autooculta al llegar a "Reservá tu lugar". Toda la lógica de negocio (login-gate antes de reservar/informar transferencia, WhatsApp, saldo del inscripto, cupos en vivo, menú real de Academy) se preservó intacta — se tocó solo la capa visual. **Schema:** columna nueva `academy_courses.vivencial_tipo_destino` (`playa`\|`montana`\|`desierto`\|`selva`\|`ciudad`, check constraint) **APLICADA** — define el tema de color de la página; el vivencial de Brasil quedó en `'playa'`. Sin otras columnas nuevas: fotos, itinerario, incluye/no_incluye ya soportaban todo lo que pide el diseño nuevo (el campo `foto_url` opcional por día de itinerario va dentro del JSONB existente, sin migración). **Debugging post-deploy (6 rondas):** (1) itinerario sin fotos visibles, "qué incluye" mostrando preguntas sueltas sin ícono, espacios vacíos enormes entre secciones, franja oscura vacía al final — causa real: el campo `incluye` es texto libre único donde Yesica escribió bullets + manifiesto + Q&A todo junto, y el parseo inicial partía cada línea como chip individual, inflando la sección y arrastrando efectos visuales en cascada; corregido con regla de parseo genérica (bullets cortos consecutivos al inicio → chips, resto → prosa) + fallbacks de layout. (2) Parpadeo de títulos/descripciones al scrollear, reportado como persistente a través de **tres intentos de fix** (framer-motion → reveal manejado por IntersectionObserver en React state → blindaje con registro global de claves reveladas a nivel de módulo, inmune a remounts) sin cambio visual alguno entre intentos — señal de que el diagnóstico venía mal. Se cortó el ciclo de adivinar leyendo código y se exigió evidencia real (Playwright contra producción, capturando screenshots + valores de opacity en vivo) antes de seguir tocando código; con eso se resolvió. **Fixes menores:** estilo tipográfico de las cards de prosa (ancho, tamaño, interlineado) y luego corregido a ancho completo de sección (no angosto) a pedido explícito; botones de compartir/copiar reposicionados debajo del título con mayor tamaño táctil; botón "← Volver a vivenciales" sacado del hero. **Pendiente, no ejecutado en esta sesión:** Prompt 2 al backoffice (`VivencialWizard`) para que el wizard soporte lo que la página nueva ya sabe mostrar — foto opcional por día de itinerario, tags de posición (Portada/Experiencia/Reserva) sobre las fotos del destino ya existentes, y select de "Tipo de destino" leyendo/escribiendo la columna nueva. Fix aparte de layout en la home de Formación ("Los cursos más elegidos" — grid con hueco enorme por solo 2 cursos cargados, cambiar a flex centrado) — prompt entregado, sin aplicar ni verificar. **Ninguna prueba visual en prod confirmada todavía por Nico/Yesica más allá de las rondas de bugs ya corregidas en vivo durante la sesión** — ver Backlog P0. |
| Sesión 31 | **Backoffice — Prompt 2 del rediseño de detalle de vivencial (§7d) documentado como COMPLETO tras confirmar que sus 3 ítems ya estaban commiteados en `main`.** Los 3 campos que la página pública nueva ya sabía mostrar están implementados en `VivencialWizard`/`ItineraryBuilder` (`/admin/vivenciales`): **(a) foto opcional por día en el paso Itinerario** — debajo del textarea de cada día, campo "Foto del día (opcional)" con el mismo patrón y bucket que la foto de hotel de `HotelesBuilder` (thumbnail + "Cambiar foto"/"Quitar" / placeholder "Sin foto"; sube a `academy-media` con path `itinerario-N`), persistida como clave opcional `foto_url` dentro de cada objeto de `academy_courses.vivencial_itinerario` (**jsonb, sin migración**); los días sin foto no llevan la clave y la página pública los colapsa a una columna (`vv-nophoto`) sin romper layout. **(b) tags de posición** PORTADA/EXPERIENCIA/RESERVA sobre las 3 primeras "Fotos del destino" (`FOTO_POS_TAGS`, derivados del orden del array, sin cambiar su formato). **(c) select "Tipo de destino"** en el paso 1, leyendo/escribiendo la columna `vivencial_tipo_destino` (default público `'playa'` si queda vacío). La lógica de dirty/"Guardar cambios" y el payload no se tocaron; el paso Revisión ya cuenta "Días con foto: X/Y". **Todo ya estaba en `main` (commit `0d684e9`, "Fixes en wizards de Cursos y Vivenciales + tipo de destino") pero nunca se había documentado** — mismo patrón de desviación que la Sesión 29; esta fila y §7d lo dejan asentado. `tsc -b` limpio. **Pendiente:** prueba visual en prod por Nico/Yesica (principio #13) de los 3 campos — cargar/quitar foto por día y verla persistir; ver los tags sobre las fotos del destino; ver el select cambiando el tema — en `/admin/vivenciales`, `?preview=1` y la página pública real (incluido el borrador "Encantos de Brasil"). Ver Backlog P0. |
| Sesión 32 | **Backoffice: sección Alumnos nueva + gamificación unificada (puntos/XP/créditos/racha) + pagos de curso sin estado "pendiente" + corrección de la regla de migraciones, todo en `main`/producción.** **(A) Sección `/admin/alumnos` (nueva, ver §8b):** lista de usuarios (no admins) con cursos/vivenciales tomados (contados por separado), buscador, y drawer de detalle (datos, gamificación, cursos/vivenciales inscriptos, pagos, dar de baja/reactivar vía `profiles.activo` — migración nueva). No requirió RPC ni política nueva: el RLS de admin (`is_academy_admin()`) ya alcanzaba `profiles`/`academy_profiles`/`academy_enrollments`/`academy_payments`. **Bug del botón de colapsar el sidebar del admin corregido** — causa raíz real (no la sospechada al principio): el `.topbar` con `backdrop-filter:blur()` se promueve a su propia capa de composición en GPU y pintaba por encima del botón pese a tener menor z-index (artefacto conocido de `backdrop-filter`, no un problema de z-index puro); fix fue forzar al botón a su propia capa (`translateZ(0)`) + subir su z-index a 50. **(B) Gamificación unificada (ver §8c):** existían dos tablas de puntos paralelas que no coincidían entre sí (`useGamification.ts` del cliente vs `award-points`/edge function) y la mayoría de los triggers no estaban conectados a nada; se unificó todo en `award-points` como única fuente de verdad (13 acciones), se conectaron 6 triggers que no disparaban nada (quedaron 4 sin enganche real en el producto — vivencial completado, asistencia en vivo, referido-primera-compra, compartir logro — documentados, no inventada la UI que les falta), se agregó el modal "Cómo ganar XP" (el de Créditos ya existía, se le actualizaron los valores), y se redefinió la racha: ventana de 30 días (no calendario día a día), ligada a actividad de formación (columna nueva `academy_profiles.streak_window_start`), no a login. **Corrección de cierre, en un commit aparte:** el bono de registro se acumulaba con el de referido (20+50=70 créditos); se corrigió para que el de 50 reemplace al de 20, no se sume — verificado contra la función real deployada, cero llamadas viejas a `bono_bienvenida` remanentes. **(C) Pagos de curso sin "pendiente" (ver §8d):** un pago de curso ahora o está aprobado o no existe — se eliminó el estado intermedio persistido (constraint de `academy_payments.estado` ya no admite `'pendiente'`), se agregó `academy_payment_attempts` (tabla nueva) para loguear intentos como métrica sin que sean pagos reintentables, y se reescribieron las 3 edge functions de pago de curso. Se borraron 3 registros reales de checkouts abandonados (nunca tocados desde su creación, sin `mp_payment_id`) que quedaban en `pendiente` sin ningún camino para destrabarse — no eran pagos "atascados", eran checkouts que el usuario nunca terminó. **(D) Hallazgo de proceso — repo desincronizado del deploy real:** se confirmó que `supabase/functions/*` en el repo **no reflejaba** lo que corría en producción (al menos `create-course-payment` tenía un bug ya corregido en el deploy real que en el repo seguía roto) — alguien había deployado edge functions sin commitear. Se sincronizó el repo con lo real (vía MCP de Supabase) en un commit aparte, y quedó la regla: ninguna edge function se deploya sin pasar por el repo primero. **(E) Regla de migraciones corregida** (ver arriba, Principios): Nico aclaró que el dueño del paso de aplicar migraciones es Claude, no él — la regla de Sesión 16 tenía mal ese punto; queda registrado como corrección explícita, no como excepción puntual. **(F) Wizards de Cursos y Vivenciales, 3 fixes genéricos** (mismo patrón copiado en `CourseWizard.tsx`/`VivencialWizard.tsx`, no un componente compartido — se replicó en los dos): prefijo de moneda (`US$`) que se pisaba con el valor tipeado por padding insuficiente; footer reordenado (Cancelar al extremo izquierdo, Atrás agrupado con Siguiente a la derecha); pasos del stepper ahora clickeables para saltar directo, solo si el resto de los pasos ya están completos (`validateStep`). Quedó pendiente, a confirmar con Nico, sumarle el mismo stepper clickeable a `BenefitWizard.tsx` (comparte el componente visual pero no el footer). `tsc -b` y build limpios en todo. **Pendiente:** prueba visual en prod de todo lo de esta sesión (principio #13) — ver Backlog P0. **Insignias (`academy_badges`) quedan explícitamente para otra sesión** — hay que renombrar/redefinir condiciones (`streak_7` ya no existe, la racha mínima ahora es de 30 días) antes de tocar el front de logros. |
| Sesión 33 | **Rama `feat/vivencial-home-tipografia` (8 commits): card de precio del detalle de vivencial, rediseño de Home, Montserrat global y respaldo de la rama — mergeada a `main` y en producción.** **(A) Card de precio del vivencial (`/vivencial/:slug`, price card de "Reservá tu lugar"):** los 3 checks del CTA pasaron de derivarse del texto libre de `incluye` (que en datos de prueba llegó a mostrar líneas sueltas sin sentido) a ser **3 textos fijos hardcodeados**, iguales para todos los vivenciales: "Viaja, disfruta y capacitate profesionalmente", "Instructores con más de 15 años de experiencia", "Convertite en profesional del destino y crecé con Travexa" — `incluye` sigue en uso en la sección "Qué incluye", solo dejó de alimentar este checklist. Card más ancha y con más padding; la **seña** pasó a ser la cifra más grande y dominante de la card. Subtítulo nuevo: *"Seña para confirmar tu lugar + cuotas cómodas de: $ X ARS"*, con X = (precio_ars − seña_ars) / meses restantes hasta la salida, reusando la misma lógica de `lib/vivencial.ts` que ya calculaba la cuota estimada del listado (mismo fallback a "Pago único" si falta menos de un mes o la fecha ya pasó). Se mantiene "Total del viaje: $ X ARS" y se agregó una línea nueva "O pagá en dólares: US$ X" (con `precio_usd`, ya existente — no hizo falta tipo de cambio ni columna nueva). Se borró la línea redundante "Seña sugerida: $ X". **(B) Home pública (ver §9, tabla actualizada):** sacado "Sin tarjeta · Acceso inmediato" del hero; el bloque "Formación hecha por y para asesores de viajes..." pasó de íconos de silueta genéricos a **fotos reales de `academy_instructors` (activo=true)** en un avatar-stack — los instructores sin `avatar_url` se excluyen del stack (nunca un ícono genérico simulando una persona, principio de integridad de datos), si ninguno tiene foto el bloque queda solo con el texto; la tira de números (curso disponible/cursos gratis/instructor/vivencial activo) pasó a ser **su propia sección** (fondo distinto del hero, números más grandes y centrados, sin scroll-snap); nuevo **orden de secciones**: números → Vivenciales → Formación → "Qué encontrás" (antes Vivenciales quedaba después); "Qué encontrás" rediseñada con más jerarquía visual (íconos, títulos y bajadas más grandes, cards más altas, padding de sección acotado en vez de contenido chico perdido en un espacio enorme). **(C) Tipografía global → Montserrat:** `--font-display`, `--font-body` y **también `--font-mono`** (badges, números, labels, timestamps, botones, inputs) apuntan a Montserrat en `index.css` y `admin.css` — sin excepciones, en toda la plataforma (público, privado, backoffice, portal de instructor); se agregó `input, button, textarea, select { font-family: inherit }` porque los controles de formulario no heredaban la fuente. **(D) Tab de Instructor condicional — implementado y luego superado por el rediseño V2:** en el diseño de tabs vigente al momento de este pedido se agregó la regla de que el tab de Instructor solo se muestra si el vivencial tiene instructor cargado (mismo criterio para Reseñas/Itinerario/Qué incluye). Al revisar contra el código real (V2 de Sesión 30, que ya está en producción y convirtió el detalle en una página de scroll sin tabs), se confirmó que **el V2 no tiene ninguna sección de Instructor que ocultar/mostrar** — se eliminó por completo en ese rediseño, no es que quedó vacía. Se evaluó construirla de cero pero **se decidió NO hacerlo en esta sesión**: excede el alcance pedido (que era solo lógica condicional sobre algo existente) y hoy ningún vivencial tiene `instructor_id` cargado en la base, así que no habría nada que mostrar igual. Las demás secciones del V2 que pueden quedar vacías (Itinerario, Experiencia/Qué incluye, Puntos de salida) ya estaban correctamente condicionadas desde Sesión 30 — no hubo nada suelto ahí. Queda como ítem de Backlog P1: agregar la sección de Instructor al V2 cuando haya vivenciales con instructor asignado. **(E) Proceso:** la rama vivió varias sesiones solo en local; en esta sesión se **pusheó a `origin` como respaldo** (antes no tenía upstream en GitHub). `tsc -b`, `eslint` y `vite build` limpios. **Pendiente:** prueba visual en prod de los 4 puntos (card de precio con un vivencial real que tenga seña/fecha/precio_usd cargados, hero con fotos de instructores, orden de secciones y tira de números, Montserrat en todas las áreas) — ver Backlog P0. |
| Sesión 34 | **Backoffice — selección de instructores en el wizard de Vivenciales (`VivencialWizard.tsx`, `/admin/vivenciales`).** Yesica ya puede asignar **uno o varios instructores** a un vivencial; la página pública (Prompt B, otra tanda) los mostrará. **Columna nueva `academy_courses.vivencial_instructor_ids` (`uuid[]`)** — array de IDs de `academy_instructors`, en orden; null o vacío = sin instructores. **Aplicada por Claude IA vía MCP con autorización de Nico** (mismo procedimiento que `vivencial_tipo_destino` de Sesión 30); se usa columna array nueva y **no** el `instructor_id` single existente, que es el de los **cursos** y quedó intacto. Verificada con SELECT a `information_schema` antes de codear (`data_type=ARRAY`, `udt_name=_uuid`). **Wizard:** bloque nuevo "Instructores" en el paso 1 (Destino y logística), después de "Hoteles / alojamiento" — componente `InstructorPicker`: chips en orden (avatar real o iniciales sobre gradiente determinístico vía `lib/avatar`, nombre, especialidad) que se agregan desde un `<select>` de instructores **activos** (`useAdminInstructors`, ya existente); cada chip con **flechas ↑↓ para reordenar** y ✕ para quitar. Un instructor asignado que después queda `activo=false` **se muestra igual con badge "inactivo"** al reabrir (no se borra solo del array). Estado vacío con CTA a `/admin/instructores` si no hay ningún instructor activo ni asignado. Paso 5 (Revisión): línea "Instructores: N" con los nombres, o "Instructores: — (la sección no se mostrará)" si no hay ninguno. Integrado al `FormState` (`instructor_ids`) y al payload sin tocar la lógica de dirty state / "Guardar cambios" (Sesión 27). **Decisiones:** (1) **reordenamiento SÍ** (flechas ↑↓, no drag — barato con array); (2) **null cuando vacío** (no array vacío) al persistir — la página pública tratará ambos igual (sección oculta); (3) `Course.vivencial_instructor_ids: string[] | null` agregado al type (alimenta `Database` + `CourseWrite` de una). `tsc -b`, `eslint` y `vite build` limpios. Estado DB al cierre: ambos vivenciales de Brasil con `vivencial_instructor_ids=null`, 3 instructores activos disponibles (Hernán Causté, nicolas, Yesica). **NO tocado:** lógica de cursos (`instructor_id`), resto de pasos del wizard, guardado incremental, página pública. **Pendiente:** que Yesica cargue los instructores del vivencial de Brasil y la prueba visual en prod (principio #13) — asignar 2 / reordenar / quitar / reabrir. Ver §7d (mapeo) y Backlog P0. |
| Sesión 35 | **Resend configurado en producción (dominio + API key) + `send-reserva-email` finalmente deployada (escrita desde Sesión 22) + gap real encontrado y cerrado: mail de compra de curso, inexistente hasta hoy.** Arrancó como pedido de "configurar Resend para confirmar el mail" (registro); el análisis derivó en priorizar el mail de vivenciales que ya estaba escrito y pausado, y de ahí surgió un segundo frente al probarlo. **(A) Resend — infraestructura compartida:** dominio `travexa.com.ar` verificado en Resend vía los 4 registros DNS en Cloudflare (DKIM `resend._domainkey`, MX `send`, SPF `send`, DMARC `_dmarc`, todos "DNS only"); API key generada y cargada como secret `RESEND_API_KEY` en Supabase Edge Functions — **nota de seguridad:** esa key quedó pegada en el chat, pendiente que Nico la rote en Resend (crear nueva, borrar vieja) y actualice el secret. **(B) `send-reserva-email` deployada (Sesión 22 → Sesión 35):** la function escrita hace 13 sesiones y nunca deployada quedó **ACTIVE en producción**, vía Claude IA por MCP de Supabase — CORS reescrito inline (self-contained, mismo patrón que `confirm-course-payment`) porque el import relativo a `../_shared/cors.ts` no viaja en un deploy por MCP; secret `RESERVA_FROM` cargado (`Travexa Academy <reservas@travexa.com.ar>`). **(C) Gap encontrado en QA:** primera prueba real (usuario `Katrix840216@gmail.com`) no generó ningún mail; revisando los logs de Edge Functions se confirmó que `send-reserva-email` **nunca se invocó** — la reserva de prueba fue de un **curso** (vía Mercado Pago: `create-course-payment`/`confirm-course-payment`/`mp-webhook-academy`), no de un vivencial, y esa function solo está cableada al flujo de vivenciales. Conclusión real: **nunca existió ningún mail de confirmación para compra de curso**, no era un bug de esta configuración. **(D) `send-course-email` — nueva function, mail de "compra de curso confirmada":** mismo patrón (Resend por API HTTP, fire-and-forget, CORS inline), secret `COURSE_FROM` (`Travexa Academy <cursos@travexa.com.ar>`, con fallback a `RESERVA_FROM` y luego a `onboarding@resend.dev`). El problema real a resolver era **evitar mail duplicado**: `confirm-course-payment` (redirect de éxito) y `mp-webhook-academy` (notificación de MP) corren casi en simultáneo y ambos pueden aprobar el mismo pago — confirmado en los logs de la compra de prueba. Se descartó unificar ambas functions (acoplaría el camino de pago) a favor de reusar una señal atómica que ya existía: `ensureEnrollment()` hace `upsert(..., { onConflict: 'user_id,course_id', ignoreDuplicates: true })` sobre el `UNIQUE(user_id, course_id)` de `academy_enrollments` — Postgres resuelve el conflicto de forma atómica, así que entre las dos llamadas exactamente una ve `created = true` (la misma señal que ya usaban para no inflar `total_alumnos`). Ambas functions modificadas para que `ensureEnrollment()` devuelva ese booleano y solo dispare `send-course-email` cuando `created === true`. Segunda red de seguridad dentro de `send-course-email`: no manda nada si no existe un pago `estado='aprobado'` para ese `(user, course)`. Las 3 functions (`send-course-email` nueva, `confirm-course-payment` v9, `mp-webhook-academy` v11) deployadas por Claude IA vía MCP. **Sin migraciones ni cambios de schema en toda la sesión** — todo a nivel edge functions y secrets. **Pendiente:** (1) confirmar que `COURSE_FROM` quedó guardado (Bulk save) en el dashboard; (2) prueba real de compra de curso para confirmar que `send-course-email` sale **una sola vez** pese a la carrera webhook/redirect (queda documentado el método con `curl` en paralelo para forzarla si hace falta); (3) prueba real de una reserva de **vivencial** (no curso) para confirmar que `send-reserva-email` efectivamente dispara y el mail llega — el único test hecho hasta ahora fue de curso, que no la invoca; (4) rotar la API key de Resend expuesta en el chat. Ver Backlog P0/P1. |
| Sesión 36 | **Sistema de Beneficios "Travexa Points" completo: tienda pública `/beneficios`, perfil, checkout con descuento automático, `CourseWizard`, backoffice y notificaciones — diseñado y planificado por Claude IA (chat), ejecutado en 2 tandas por Claude Code, deployado a producción.** Ver §8e para el detalle completo (reglas de negocio, schema, edge functions, QA pendiente). Resumen: **(A)** Especificación funcional completa (`ESPEC_Beneficios_Academy.md`) con 14 reglas de negocio cerradas junto a Nico (canje total/parcial por curso, sorteos por chances, vencimiento de créditos al año, canje intocable una vez hecho). **(B) Backend aplicado directo por Claude IA vía MCP** (mismo criterio que el resto del proyecto desde la corrección de Sesión 32): 4 migraciones sobre `academy_benefits`/`academy_credit_redemptions`/`academy_payment_attempts`/`academy_enrollments` + 3 funciones SQL nuevas (`redeem_benefit`, `draw_benefit_winner`, `expire_credits_run`) + 3 edge functions nuevas (`redeem-benefit`, `draw-benefit-winner`, `expire-credits`). **(C) Prototipo visual** iterado en vivo con Nico (`prototipo_beneficios.html`, en la raíz — mismo patrón que el resto de prototipos aprobados): hero a dos columnas siguiendo la línea visual de `/vivencial` (Montserrat, sin logo, colores reales de prod), carrusel 3D de destacados estilo liquid glass, panel de créditos, filtros, grilla y modal de canje con pantalla de éxito. **(D) Claude Code — tanda 1:** tienda pública completa (ítem "Beneficios" sumado al menú existente, entre Vivencial e Instructores, sin tocar su lógica), perfil ("Tus canjes" dentro de Logros → "Tus movimientos"), checkout de curso con descuento automático antes de Mercado Pago, `CourseWizard` con canje total/parcial sincronizado a `academy_benefits`, notificaciones in-app. **(E) Claude Code — tanda 2, backoffice:** `BenefitWizard` extendido (destacado, bases y condiciones, "valor de 1 chance", stepper clickeable — cierra el ítem pendiente desde Sesión 32), lista con badges/drawer de canjes, botón real "Realizar sorteo" (invoca `draw-benefit-winner`), "Marcar como entregado" para beneficios tipo `otro` (edge function nueva `mark-redemption-delivered`), bloque de Métricas de beneficios. `tsc -b`/build limpios en ambas tandas, pusheado a `main` y deployado a `academy.travexa.com.ar` (verificado con Playwright contra prod). **Sin datos de ejemplo inventados**: como no había ningún beneficio cargado al momento del deploy, la tienda mostró su estado vacío real. **Pendiente:** prueba visual en prod por Nico/Yesica (principio #13) — ver Backlog P0. |
| Sesión 37 | **Bugfix: saldo de créditos invisible en el hero de `/beneficios`, en producción.** Reportado por Nico tras la Sesión 36: el panel "Tus créditos" mostraba el nivel y la etiqueta "disponibles" pero el número del saldo quedaba vacío. **Causa raíz real** (no era timing de animación, como se sospechó al principio): el componente de conteo animado usado (`NumberFlow`) renderiza en un *web component con shadow DOM*, y el efecto de relleno con gradiente del número (`background-clip:text` + `-webkit-text-fill-color:transparent`) no cruza el límite del shadow DOM — los dígitos quedaban 100% transparentes, invisibles, mientras el resto del panel (elementos normales) se veía bien. **Fix:** número movido a un `<span>` normal (mismo patrón que ya funcionaba en `/perfil`) + count-up propio que se re-dispara cuando cambia el saldo (incluso después de un canje) + estado "nunca vacío" (skeleton/`—` mientras carga, valor directo si la animación no llega a correr). Verificado con Playwright contra prod en la vista deslogueada (sin regresiones); **la vista logueada quedó pendiente de la confirmación visual de Nico** (Claude Code no tiene forma de loguearse con una cuenta real). Deployado a `main`/producción. |
| Sesión 38 | **Aceptación de bases y condiciones en el canje de beneficios con `terminos` cargados (sorteos).** A pedido de Nico: (1) Claude IA (chat) redactó la plantilla genérica de bases y condiciones de sorteos (`bases_y_condiciones_sorteos.md`) — pendiente que Nico confirme la razón social a usar mientras Pencom Travexa SAS termina su constitución. (2) **Backend, aplicado y deployado directo por Claude IA vía MCP:** columna nueva `academy_credit_redemptions.terminos_aceptados_at`; `redeem_benefit()` reemplazada con un 4° parámetro `p_acepta_terminos boolean` — si el beneficio tiene `terminos` no vacío y no llega en `true`, rechaza con `RAISE EXCEPTION 'TERMINOS_NO_ACEPTADOS'` sin descontar nada; si lo acepta, graba la fecha. Edge function `redeem-benefit` redeployada (v3) para reenviar `aceptaTerminos` desde el body. (3) **Claude Code, solo frontend:** en el modal de canje, si el beneficio tiene `terminos`, aparece un checkbox obligatorio sin marcar por defecto ("Leí y acepto las bases y condiciones...") con link a un acordeón (texto general + "Condiciones específicas de este beneficio" con el `terminos` del beneficio); "Confirmar canje" queda deshabilitado hasta tildarlo; si no tiene `terminos`, cero cambios. Texto general centralizado en `src/content/basesYCondicionesSorteos.ts` (una sola fuente). En el drawer de canjes del backoffice (`/admin/beneficios`), cada canje con aceptación muestra "Bases aceptadas el {fecha}" para trazabilidad de Yesica. Deployado a `main`/producción (commit `e5f01b9`, sin mezclar con trabajo sin commitear de otra sesión que había en el árbol). **Pendiente:** confirmar la razón social del texto legal; prueba visual en prod con un sorteo real que tenga bases cargadas — ver Backlog P0. |
| Sesión 39 | **Bug crítico de RLS resuelto + instructores múltiples en cursos + reconciliación de trabajo sin commitear, todo en `main`/producción.** **(Tarea 1) Bug crítico — `/admin/cursos`, `/admin/vivenciales` e `/admin/instructores` mostraban 0 resultados pese a tener datos.** Causa raíz (diagnosticada simulando el JWT real del admin contra la DB, no adivinando): **ciclo de RLS** entre dos policies — `"Instructor ve sus propios cursos"` (en `academy_courses`) consultaba `academy_instructors`, y `"Instructores asignados a vivencial visibles"` (en `academy_instructors`, agregada al publicar la sección pública de instructores del vivencial) consultaba `academy_courses` → `ERROR 42P17: infinite recursion detected in policy`. Todo SELECT autenticado a esas dos tablas fallaba y el frontend lo tragaba como lista vacía (Alumnos seguía OK porque lee `profiles`, fuera del ciclo). `is_academy_admin()` nunca fue el problema (los 36 alumnos lo probaban). **Fix (migración `20260719005000`):** el `EXISTS` sobre `academy_courses` se movió a la función `SECURITY DEFINER` `instructor_en_vivencial_publicado()` (bypassa RLS, no re-evalúa policies) → corta el ciclo, mismo resultado funcional. Además, las listas del backoffice ahora distinguen **error de vacío** (`ListErrorState`): un fallo de query/RLS ya no se disfraza de "0 resultados". Regla nueva registrada: dos policies de estas tablas nunca se consultan en cruz; si hace falta, `SECURITY DEFINER`. **(Tarea 2) Instructores múltiples en cursos (paridad con vivenciales).** Los cursos (`en_vivo`/`grabado`/`ebook`) soportaban un solo instructor (`instructor_id`); ahora soportan varios. **Migración `20260719006000`:** columna `academy_courses.instructor_ids uuid[]` (fuente de verdad, ordenada) + backfill de los 6 cursos existentes (`instructor_ids = [instructor_id]`); `instructor_id` **no se dropea**, queda como espejo de `instructor_ids[0]` (compat con embed, conteos y datos viejos), sincronizado en cada guardado del wizard. La policy `"Instructor ve sus propios cursos"` se extendió a reconocer single y array vía la función `SECURITY DEFINER` `mi_instructor_id()` (resuelve `auth.uid()` sin consultar otra tabla → no reintroduce la recursión de la Tarea 1). **Frontend:** `InstructorPicker` extraído a componente compartido (`VivencialWizard` + `CourseWizard`); `CourseWizard` con selector múltiple de chips reordenables (instructor sigue opcional); detalle público del curso muestra todos los instructores (nombre/foto/especialidad/bio) vía `usePublicInstructors` (hook generalizado desde el de vivenciales). **(Housekeeping) Reconciliación de trabajo sin commitear que había quedado en el árbol de sesiones previas** (mismo patrón de desviación que Sesiones 29/31): se revisó cada archivo (diff mostrado a Nico) y se commitearon por separado — (a) `.gitignore` ignora `.vercel`; (b) **mail de compra de curso** (`send-course-email` + los 2 webhooks, Sesión 35: ya deployado y vivo, solo faltaba versionar el fuente); (c) **sección pública de instructores del vivencial** (`VivencialDetail` + estilos + migración `002000` de `vivencial_instructor_ids`, que coincide exacto con la DB). Con OK de Nico se commitearon además, como cierre: (d) la migración `003000` (RLS pública de instructores asignados) como **registro histórico** — su policy fue superseded por la `005000` de esta sesión (la secuencia `003000`→`005000` reproduce el estado real de la DB), se versiona tal cual se aplicó; (e) el mockup aprobado `vivencial-detalle.V2.html` junto al resto de prototipos de la raíz. `tsc`, `vite build` y `eslint` limpios; todo pusheado a `main` y **deployado a producción** (deploy `dpl_BvEj1UGC3sKA7yroeVp1HXxTbzFB`, READY); working tree limpio, repo sincronizado con prod. **Pendiente:** prueba visual en prod por Nico/Yesica (principio #13) — listas del backoffice con datos, y asignar/reordenar varios instructores a un curso y verlos en el detalle público. Ver Backlog P0. |
| Sesión 40 | **Vivenciales — campo "Destino" (continente/zona) independiente de País + toggle de cuál va como título del hero público.** Contexto: hasta ahora el único dato geográfico era `vivencial_pais`, que además se usa como título grande del hero del detalle; los viajes que son de una zona y no de un país puntual (ej. "Europa") no tenían dónde cargarse. **(1) Schema — migración APLICADA y trackeada en prod** (`20260720132306_vivencial_destino.sql`, en `supabase/migrations/`): dos columnas aditivas sobre `academy_courses` — `vivencial_destino text` (nullable, sin CHECK, igual de flexible que país; valores válidos definidos en el front) y `vivencial_destino_como_titulo boolean not null default false`. 100% aditiva, no rompe vivenciales existentes (los que solo tienen País siguen igual: destino NULL, flag false → hero muestra País). **Estado real (verificado 20/07/2026):** las columnas ya existen en la DB de Travexa 2.0 y la migración está en `schema_migrations` como version `20260720132306`; el archivo local se renombró a ese timestamp para que local y remoto coincidan. **(2) Backoffice (`VivencialWizard.tsx`, paso "Destino"):** dropdown "Destino" con lista fija `DESTINOS` (Europa, Sudamérica, Norteamérica, Centroamérica, El Caribe, África, Asia, Medio Oriente, Oceanía — mismo patrón que `PAISES` en `types/index.ts`), opcional, no bloquea el guardado si queda vacío; + checkbox "Mostrar Destino como título principal" al lado. Si el checkbox está tildado pero Destino vacío, el hero cae a País (no rompe ni deja título vacío). **(3) Público — listado (`/vivencial`):** el select que antes filtraba por país (mal rotulado "destinos") se separó en **dos filtros independientes** — "Todos los países" (filtra `vivencial_pais`) y "Todos los destinos" (filtra `vivencial_destino`). Se combinan con AND con el resto (región/traslado/fecha): filtrar por uno, por el otro, por ambos o por ninguno. Cada select se muestra solo si hay valores reales en la DB. **(4) Público — detalle (`/vivencial/:slug`):** el título grande del hero (`vv-hero-word`) muestra Destino cuando `vivencial_destino_como_titulo` es true y hay destino; si no, País (histórico). Cuando el Destino toma el título, el País no se pierde: baja a un tag secundario (con pin) junto al eyebrow. Resto del hero (fotos, cards, tags) intacto. **(5) Prototipo estático** (`academy_vivencial.html`): no tocado — la referencia de diseño viva del detalle es `vivencial-detalle.V2.html` (Sesión 30) y el punto era opcional ("priorizá 1-4"); queda anotado como diferido. Sin cambios de modelo de cobro/precio/hoteles/puntos de salida. `tsc -b`, `eslint` (limpio en los archivos tocados; los errores que quedan son preexistentes en `supabase/functions/*`) y `vite build` limpios. **Pendiente:** prueba visual en prod (principio #13) — cargar un Destino en un vivencial, tildar el toggle y ver el hero con Destino como título + País como tag, y los dos filtros del listado (las columnas ya están en prod, se puede probar de una). Ver §7e. |
| Sesión 41 | **Vivenciales — "anotados" mostrados al público son HARDCODEADOS (decisión de negocio, prueba social), NO reflejan el cupo real de la DB. Cambio 100% visual/frontend, sin tocar schema ni lógica de reservas. Sin deploy todavía — listo para revisión de Nico.** Pedido de Nico: en las páginas públicas de vivenciales, el número de anotados que se muestra (que se calculaba en vivo como `vivencial_cupo_maximo − vivencial_cupo_disponible`) pasa a ser un valor ficticio hardcodeado, para que el vivencial se vea con más gente anotada de la que realmente tiene. **Nuevo helper central `src/lib/cupo.ts`:** mapa `ANOTADOS_HARDCODEADOS: Record<slug, number>` (hoy `'capacitacion-vivencial-brasil': 15`) + fallback `ANOTADOS_HARDCODE_DEFAULT = 20` (así el próximo vivencial que cargue Yesica ya muestra un valor sin tocar código) + funciones `anotadosDisplay(slug, cupoMaximo)` y `cupoDisponibleDisplay(slug, cupoMaximo) = cupoMaximo − anotados` (ambas clampeadas a `[0, cupoMaximo]`). **El denominador ("de Y") y la barra de progreso siguen usando el `cupo_maximo` REAL de la DB**; solo el numerador de anotados (y el "disponible" derivado que se muestra) sale del hardcode. **4 superficies públicas tocadas:** (1) `VivencialDetail.tsx` (`/vivencial/:slug`) — hero mini-card "Cupos", price card de "Reservá tu lugar" (barra animada + "Quedan X lugares de Y") y barra flotante inferior; se agregó `dispDisplay`/`ctaPct` de display, **manteniendo intacto el `disp` real para la lógica de negocio `agotado = disp === 0 && !enrollment`** (la reserva se sigue bloqueando con el cupo real). (2) `VivencialCard.tsx` (card del listado `/vivencial`). (3) `VivencialHighlight.tsx` (vivencial destacado de la Home). (4) branch vivencial de `CourseDetail.tsx` (`/cursos/:slug`, por si se accede un vivencial por esa ruta). **NO tocado:** columnas `vivencial_cupo_maximo`/`vivencial_cupo_disponible` en DB, lógica de reservas/pagos/agotado, y todo el backoffice/admin (`VivencialWizard`, `Resumen`, drawers) que sigue mostrando el dato REAL. Cada punto lleva comentario `// HARDCODE TEMPORAL: cupos de display, pedido de Nico (sesión jul-2026)` para que no se "corrija" pensando que es un bug. Verificado: `tsc -b`, `eslint` y `vite build` limpios; Playwright contra el preview local confirmó el vivencial de Brasil mostrando **"Quedan 21 de 36"** (36 real − 15 hardcodeados) en las 3 superficies del detalle. **Sin deploy a producción** — cambio dejado listo para el OK explícito de Nico antes de pushear a `main`. |
| Sesión 42 | **Cards de curso: se saca el conteo de alumnos (ícono de personas + `total_alumnos`) de todas las superficies públicas. Cambio 100% visual/frontend, sin tocar la DB. Sin deploy todavía — listo para revisión de Nico.** Pedido de Nico: el número de alumnos que se mostraba en las cards (ej. "👤 1" en la MASTERCLAS) quedaba pobre y se saca de cara al público. **3 superficies tocadas:** (1) `CourseCard.tsx` (card usada en `/cursos`, `CourseGrid`, y también dashboard/perfil privados) — se eliminó el `<span>` con el ícono `Users` + `total_alumnos` de la fila de stats, y la fila entera pasó a ser condicional (solo se renderiza si hay rating y/o duración/páginas) para no dejar un hueco vacío con el `mt-2` colgando. (2) `FeaturedCoursesMarquee.tsx` (carrusel "Los cursos más elegidos" de la Home) — se quitó el texto "X alumnos" de la meta-line (reordenando los separadores "·" para que no quede un punto colgando) y la meta-line se volvió condicional igual que en la card. (3) `CourseDetail.tsx` (`/cursos/:slug`, página pública de detalle) — se sacó el mismo bloque ícono `Users` + "X alumnos" de la fila de meta bajo el título y **en su lugar se agregó el badge dorado "★ N PERSONAS CAPACITADAS"**, reutilizando el mismo dato y estilo que ya mostraba la card (estrella dorada rellena + número + label en mayúsculas). Para reutilizar (no duplicar) se extrajo la función `vecesTomado(id)` — el número ilustrativo estable por curso, derivado del id, decisión de producto para prueba social — de `CourseCard.tsx` a un helper nuevo compartido **`src/lib/course.ts`**, que ahora importan tanto la card como el detalle → mismo número para un mismo curso en ambos lados. Import de `Users` de lucide eliminado en los dos archivos donde quedaba sin uso (`CourseCard`, `CourseDetail`); `Star` de lucide agregado al import del detalle. **NO se tocó:** (a) el badge dorado **"★ N personas capacitadas"** de la card (`vecesTomado(course.id)`, número propio no ligado a `total_alumnos`) — es el "★ 314" que Nico pidió mantener; (b) el rating real (`rating_avg`, "★ 4.5"); (c) la columna `total_alumnos` en DB ni su lógica de incremento, que sigue viva en el backoffice/portal de instructor (`InstructorDetailDrawer`, `useAdminInstructorsFull`, etc.) y en el sort "Más vendidos"/"popular" de `/cursos`. Los íconos `Users` que quedan en el front público son de otra cosa (nav "Instructores" del Header, métrica global "Usuarios activos" de `FormacionStatsRow`, "Lugares" de `VivencialCard`) — no son el conteo por curso. Verificado: `tsc -b`, `eslint` y `vite build` limpios; Playwright contra el preview local confirmó que la card de MASTERCLAS y el carrusel de la Home ya no muestran el conteo de alumnos, el detalle muestra el badge "★ 314 PERSONAS CAPACITADAS" con el estilo dorado de la card, y el layout queda prolijo (sin hueco). Con OK explícito de Nico (incluye el ajuste del banner), **pusheado a `main` y deployado a producción**. |
| Sesión 43 | **Indicadores unificados: el Home adopta el estilo de card de la tira de Formación y suma los indicadores de comunidad (datos REALES vía RPC, con piso de volumen); "Cursos gratis" se recalcula desde beneficios; Formación pierde "Tasa de finalización" y la opción "Gratis" del filtro. Incluye una regresión de integridad de datos encontrada y corregida (ver punto 3). Cambio 100% visual/frontend, sin tocar DB. Sin deploy todavía — listo para revisión de Nico.** **(1) "Cursos gratis" del Home recalculado:** antes se contaba con `tipo_acceso==='gratuito' || precio_ars===0` de los cursos; ahora cuenta **cursos DISTINTOS con un beneficio vigente `tipo='curso_gratis'` en `academy_benefits`** (reusando `usePublicBenefits()`, que ya filtra vigentes por RLS; se re-chequea `publicado`/`!archivado`/ventana de fechas por robustez). Un curso cuenta como gratis por tener ese beneficio, aunque además tenga precio normal. **Estado real al cierre: da 0 porque no hay ningún beneficio cargado todavía** (la tienda sigue vacía desde Sesión 36) — no es bug, se poblará solo cuando Yesica cargue un `curso_gratis`. **(2) Tira del Home (`ProofStrip`) unificada:** pasó del formato plano (número + label, sin ícono, sin link) al **mismo estilo de card de Formación** (card + ícono de color + número + label). Muestra **hasta 8 indicadores**: los 4 propios (conteos REALES, con link a su sección) — Cursos disponibles→`/cursos`, Cursos gratis→`/beneficios`, Instructores→`/instructores`, Vivencial activo→`/vivencial`, **siempre visibles** — y los 4 de comunidad **sin link** (Usuarios activos, Cursos iniciados, Cursos completados, Certificados), que se agregan **solo cuando hay volumen real** (ver punto 3). Con la data actual el Home muestra 4 cards; con volumen pasa a 8. **(3) Fuente compartida — DATOS REALES (regresión encontrada y corregida):** al escribir la primera versión de esta tanda extraje los 4 números de comunidad como **valores hardcodeados** (195/769/567/422) a `communityStats.tsx`, arrastrando un comentario del código que los atribuía a una "decisión de producto de Nico (Sesión 27)". **Nico frenó el push y aclaró que nunca decidió eso.** Al auditar con git se confirmó: la tira de `/cursos` **originalmente traía datos REALES** vía el RPC `academy_public_formacion_stats` (hook `useFormacionStats`), ocultándose bajo un piso de volumen (`MIN_USUARIOS = 50`, Sesión 25); el commit `d8f46d2` ("stats /cursos hardcodeadas") **reemplazó ese RPC real por los números fake** — una regresión que violaba el principio de integridad de datos (doc §Integridad: "ninguna estadística puede ser inventada; se conecta a datos reales o se oculta"). **Fix (Opción 1 elegida por Nico):** `communityStats.tsx` pasó a ser el **hook `useCommunityStats()`** que lee los 4 números del RPC real (`useFormacionStats`) y **devuelve `[]` cuando `usuarios_activos < 50`** (mismo piso de Sesión 25, recuperado del código, no inventado) → la tira de comunidad entera se oculta hasta que haya volumen y "surge sola". Se **borraron por completo** los valores hardcodeados (ni fallback ni comentados) y se **eliminó el comentario falso** que atribuía la decisión a Nico. El componente de card reutilizable **`src/components/shared/StatCardItem.tsx`** (estilo Formación, con `<Link>` opcional y hover si tiene `to`) lo consumen Formación y el Home (mismo criterio que `vecesTomado()`/`cupo.ts`). **(4) Formación (`/cursos`) pierde "Tasa de finalización":** `FormacionStatsRow` quedó en **4 indicadores reales** (Usuarios/Iniciados/Completados/Certificados) y se oculta entero bajo el piso — el 5º (tasa) se sacó del set, no aparece en ninguna de las dos páginas. **Estado real al cierre: usuarios_activos = 32 (< 50), así que la tira de comunidad NO se muestra hoy** — el Home queda con sus 4 cards propias (reales) y `/cursos` sin esa tira, hasta que la plataforma supere los 50 usuarios activos. **(5) Anchos recalculados:** Home en grid `grid-cols-2 md:grid-cols-4` (se adapta a 4 u 8 cards sin huecos: 4→1 fila desktop / 2×2 mobile, 8→2 filas desktop / 4×2 mobile); Formación 4 cards en `grid-cols-2 lg:grid-cols-4` — verificado responsive. **(6) Filtro y botón de `/cursos`:** se sacó la opción **"Gratis"** del filtro de Modalidad (quedan Todos / A tu ritmo / En vivo / Ebook-PDF) — se limpió el valor `'gratis'` del tipo `TipoFilter`, de las opciones y de la lógica de filtrado; el botón **"Cursos gratis"** del hero (al lado de "Ver cursos") **dejó de filtrar el listado y ahora navega a `/beneficios`** (`useNavigate`). **NO se tocó:** el conteo de cursos disponibles/instructores/vivencial activo (que ya andaba), el resto de filtros (Nivel/Categoría/otras modalidades), ni el sort "Más vendidos". Verificado: `tsc -b`, `eslint` y `vite build` limpios; Playwright contra el preview local confirmó — con la data real (32 usuarios < 50) el Home muestra **4 cards propias** y `/cursos` sin tira de comunidad; interceptando el RPC con usuarios=210 (>50), el Home pasa a **8 cards** con los números que devuelve el RPC (210/640/480/355, no hardcodeados) y `/cursos` muestra su tira — probando que "surge sola" al cruzar el piso sin tocar código. Además: "Cursos gratis" en 0 real (sin beneficios), filtro sin "Gratis", botón "Cursos gratis" → `/beneficios`, responsive OK. Pusheado a `main` y deployado a producción (`4d67b21`). **⚠️ El piso en Formación fue revertido enseguida — ver Sesión 43b.** |
| Sesión 43b | **Ajuste sobre la Sesión 43 tras revisión de Nico en prod: (1) Formación (`/cursos`) SIN piso — muestra siempre sus 4 indicadores reales, incluso con 0; (2) el piso de 50 queda SOLO en el Home; (3) fix de alineación de las stat-cards. Sin deploy todavía — listo para revisión de Nico.** **(1) Formación sin piso:** Nico revisó en prod y decidió que `/cursos` debe mostrar **siempre** sus 4 indicadores reales sin importar el volumen (hoy: 32 usuarios, 2 iniciados, 0 completados, 0 certificados) — los ceros son datos reales, no un error, se muestran tal cual. `FormacionStatsRow` dejó de usar `useCommunityStats()` (el hook con gate de piso) y ahora consume **`useFormacionStats()` directo + `buildCommunityStats()`** (mapeo de los 4 números reales del RPC a cards, extraído en `communityStats.tsx`); solo se oculta si el RPC no devuelve nada. **(2) Home mantiene el piso, sin cambios:** el Home sigue con `useCommunityStats()` (gate `usuarios_activos < 50 → []`) → con la data real (32) el Home muestra sus 4 cards propias y la tira de comunidad sigue oculta hasta pasar el umbral. El piso `MIN_USUARIOS = 50` vive solo en ese hook ahora. **(3) Fix de alineación (`StatCardItem.tsx`):** las cards tenían el ícono centrado contra el bloque número+label (no contra el número) → ícono y número quedaban en ejes distintos (medido: iconCenterY=45 vs numCenterY=33), y en mobile los labels que wrapeaban a 2 líneas ("Cursos completados") descentraban el número respecto de los de 1 línea ("Certificados"). Nuevo layout: **ícono + número en una misma fila (comparten eje) y el label debajo**, contenido top-aligned y card `h-full` (estira a la altura del grid). Verificado midiendo con Playwright: ahora **iconCenterY == numCenterY == 39** en todas las cards, mismas alturas, tanto en desktop como en mobile, y consistente en los grids de 4 (Formación) y de 4-u-8 (Home, incluyendo cards con y sin link). `tsc -b`, `eslint`, `vite build` limpios. Pusheado a `main` y deployado a producción (`be66635`). **⚠️ El punto (1) — Formación con datos reales — fue revertido a números de ejemplo por decisión de Nico enseguida; ver Sesión 43c.** |
| Sesión 43c | **Formación (`/cursos`): la tira de indicadores vuelve a números de EJEMPLO fijos (195/769/567/422) por decisión de producto EXPLÍCITA y CONSCIENTE de Nico — NO es una regresión ni un comentario falso como el que originó el fix de la Sesión 43.** Contexto: en 43b se cableó la tira de Formación a datos reales vía RPC (`useFormacionStats`), que hoy dan 32/2/0/0. Nico vio ese resultado **en producción** y decidió, a sabiendas, volver a los números de ejemplo del mockup —mismo criterio de negocio que los cupos de vivenciales hardcodeados de la Sesión 41 (`cupo.ts`)—. **Motivo dado por Nico:** los números reales todavía son demasiado bajos para mostrarse de cara al público. **Cambio:** `FormacionStatsRow` deja de consumir el RPC/`buildCommunityStats` y define un array local `STATS` con valores FIJOS: Usuarios activos=195, Cursos iniciados=769, Cursos completados=567, Certificados=422 — **siempre visibles, sin depender de ningún RPC ni piso**. Lleva un comentario explícito `// HARDCODE INTENCIONAL: ... decisión explícita de Nico ... No "corregir" pensando que es un bug` (mismo estilo que `cupo.ts`), justamente para que ningún future-yo lo "arregle". **Diferencia clave con la Sesión 43 original:** allá los números fake habían reemplazado el RPC real sin autorización y con un comentario que atribuía falsamente la decisión a Nico (por eso se corrigió); acá la decisión es real, explícita y documentada como tal. **NO se tocó:** (a) el **Home** — sigue con datos reales vía RPC + piso de 50 (`useCommunityStats`), intacto; (b) el fix de alineación de 43b (`StatCardItem`), que se mantiene — verificado iconCenterY==numCenterY==39 con los valores nuevos; (c) el hook `useFormacionStats`/RPC real, que queda disponible (lo usa el Home) por si se quiere reconectar Formación en el futuro. `tsc -b`, `eslint`, `vite build` limpios; Playwright confirmó `/cursos` mostrando **195/769/567/422** idéntico al mockup, con la alineación intacta. **Sin deploy a producción** — listo para el OK explícito de Nico antes de pushear a `main`. |
| Sesión 44 | **Rediseño de la card de instructor en la página pública `/instructores`. Cambio 100% visual/frontend, sin tocar DB ni los datos reales de cada instructor. Sin deploy todavía — listo para revisión de Nico.** Pedido de Nico: la card horizontal simple (foto chica 76px cuadrada a la izquierda + texto a la derecha) pasa a un formato tipo "retrato". **Único archivo tocado: `src/pages/public/Instructores.tsx`** (componente `InstructorCard`). **Nueva estructura de la card:** (1) **foto como rectángulo vertical** (`aspect-ratio 4/5`) a **todo el ancho de la card**, arriba (medido 568×710 px en desktop, mucho más que el 200% pedido sobre los 76px viejos); (2) **placa BLANCA** con bordes redondeados, superpuesta sobre la base de la foto (`marginTop:-44`), con el **nombre** en tipografía grande/marcada (dark `#0A1E29` sobre blanco) y la **especialidad** debajo en estilo secundario (mono, mayúsculas, color de acento `--primary` teal — se eligió el teal profundo en vez de `--neon` porque contrasta mejor sobre blanco); (3) **bio a 4 líneas** con `line-clamp` (corte limpio con ellipsis, no a mitad de palabra); (4) **botón de avión** (lucide `Plane`) para expandir/colapsar el resto de la bio: cerrado el avión apunta **horizontal** (`rotate(45deg)`, texto "Leer bio completa"), abierto rota a apuntar **hacia abajo** (`rotate(135deg)`, texto "Ver menos"), con transición suave `.35s` (mismo patrón que un chevron que rota). **Grilla:** 2 instructores por fila en desktop (`grid-cols-1 md:grid-cols-2`, ya existía), 1 columna apilada en mobile. **Placeholder sin foto** (instructor "nicolas", sin `avatar_url`): se mantuvo el avatar de iniciales existente (`avatarGradient`+`initialsFrom`, la "N") **adaptado al formato vertical** (gradiente a todo el retrato + inicial grande centrada) — NUNCA una foto de stock (integridad de datos). **Detalle técnico corregido en el camino:** la foto es `position:absolute` y por orden de pintado tapaba la placa blanca (el nombre salía cortado arriba); se le dio `position:relative`+`z-index:1` al contenedor de contenido para que la placa quede por encima (verificado con `elementFromPoint`/medición: `plateZ=1`, nombre limpio sobre blanco). **NO se tocó:** (a) la **sección de testimonios** (el bloque "Espacio para testimonio de alumno… pendiente de completar") — queda EXACTAMENTE igual, sin contenido, en el backlog (P1, "cargar testimonio real de alumno") a pedido de Nico; **no se inventó ni se agregó ningún testimonio**; (b) los datos reales de cada instructor (nombre/especialidad/bio/`avatar_url`), que salen de `academy_instructors` real vía `useInstructors` como antes; (c) el hero ni ninguna otra sección de la página. Verificado: `tsc -b`, `eslint`, `vite build` limpios; Playwright contra el preview local confirmó — desktop 2 cards por fila con foto vertical y placa blanca legible, bio a 4 líneas, botón de avión rotando de horizontal (cerrado) a hacia-abajo (abierto) con animación, mobile a 1 columna, y el placeholder "N" de nicolas prolijo en formato vertical. **Sin deploy a producción** — listo para el OK explícito de Nico antes de pushear a `main`. |
| Sesión 45 | **PILOTO de paleta CLARA en la Home (`/`) — migración al branding real de Travexa (fondo claro dominante + navy en bloques puntuales + turquesa de acento + banners blancos con borde turquesa). SOLO la Home; el resto de la plataforma sigue en el esquema dark actual hasta que Nico apruebe y pida el rollout completo. Cambio 100% visual/frontend, sin tocar DB. Sin deploy todavía — listo para revisión de Nico.** Pedido de Nico: alinear Academy a los flyers de marca (carpeta `_ref/`) — fondo blanco/paper dominante, navy reservado para hero/CTA/bloques, turquesa como acento (botones, íconos, palabras destacadas), y algunos banners blancos con borde turquesa para dar variedad. Tokens de marca tomados de `travexa_2_0_estrategia` (ese HTML **no** está en el repo; los tokens venían en el pedido): `--ink #122733`, `--ink-soft #4A6373`, `--ink-faint #7C8E97`, `--paper #F4F5F2`, `--surface #FFFFFF`, `--brand-line #DDE2DC`, `--teal #0E6B5C` (= `--primary`), `--teal-soft #D9ECE7`, `--mint #4ECDB8` (= `--primary-l`), `--navy-deep #0A1E29` (= `--bg`). **Cómo se hizo (arquitectura):** todo el CSS de la Home ya vive scopeado bajo `.home-root` en `src/components/home/home.css` con tokens propios → se cambió el fondo raíz de `--bg` (navy) a `--paper` (claro) y el color default a `--ink`; así las secciones SIN fondo explícito (pilares/como/gami) se volvieron claras solas, y solo hubo que reconvertir sus elementos internos (cards→`--surface`+`--brand-line`, texto→`--ink`/`--ink-soft`, íconos→chips `--teal-soft`+`--teal`). **Bloques que se MANTIENEN navy** (los "puntuales" que pidió Nico), con su texto claro intacto: hero superior, card del vivencial destacado, el "boarding pass"/ticket de *Cómo funciona*, el CTA final "Empezá a formarte hoy" y el footer. **Banners blancos con BORDE TURQUESA** (variedad pedida): (a) las cards de indicadores de la proof-strip (blancas, borde teal) y (b) el bloque de sync Academy↔Marketplace de gamificación (blanco, borde teal 1.5px + glow suave). **Componente compartido preservado:** `StatCardItem` lo usan también `/cursos` (que sigue dark) → NO se tocó el componente; se le redefinieron scopeados bajo `.home-root .proof-strip` los 3 tokens que usa por inline-style (`--card`/`--line`/`--text-3`) a valores claros, así rinde claro en el Home y dark en `/cursos`. Los 4 colores de los números de la proof-strip (eran cyan/violeta claros para fondo oscuro) se ajustaron en `ProofStrip.tsx` (Home-only, no compartido) a tonos con contraste ≥3:1 sobre blanco (teal/gold-deep/violeta/naranja). El link-arrow y los section-label/title/sub pasaron a teal/ink (default claro), con override dark scopeado para la sección de Testimonios (que sigue navy y está OCULTA, `SHOW_TESTIMONIALS=false`). **Fix encontrado en el camino:** el Header (compartido) es transparente arriba y renderiza un spacer `.h-14` (56px) como hijo directo de `.home-root`; con el fondo raíz ahora claro ese spacer quedaba claro y el texto claro del header perdía contraste → se le dio `var(--navy-deep)` al spacer scopeado (`.home-root > .h-14`), sin tocar el Header. **Componente compartido que queda PENDIENTE para el rollout completo:** el propio **Header/nav** no se rediseñó — funciona en el Home porque el hero sigue navy (header transparente sobre oscuro) y al scrollear se vuelve una píldora frosted oscura (legible también sobre claro); cuando se migren las demás páginas a claro habrá que decidir su versión clara. **Archivos tocados:** `src/components/home/home.css` (paleta + secciones), `src/components/home/ProofStrip.tsx` (colores de números), `CLAUDE_Academy_Actualizado.md`. **NO se tocó:** estructura/contenido/copy/links de las secciones, motion/easings/reveals (se conservaron; solo se sumaron hovers a cards que no tenían: lift+borde teal en pilares, lift en value-cards), ni ninguna otra página (Formación/Vivencial/Beneficios/Instructores/Backoffice siguen dark). Verificado: `tsc -b`, `eslint`, `vite build` limpios; Playwright contra el preview local confirmó, sección por sección, fondo claro dominante con navy en hero/vivencial-card/ticket/CTA/footer, cards blancas, banners con borde turquesa (proof + gami-sync), acentos teal, y responsive en mobile (proof 2×2, header con tope navy legible). **Sin deploy a producción** — listo para el OK explícito de Nico antes de pushear a `main`; si aprueba, se pedirá aparte el rollout al resto de la plataforma. |
| Sesión 45b | **REHECHA del piloto de paleta clara de la Home tras feedback VISUAL de Nico (no es un bugfix).** La Sesión 45 se pusheó y deployó (commit `a7bcaf1`), pero al revisarla en prod Nico la vio "plana, aburrida, de baja calidad": sin jerarquía ni pulido, y **sin turquesa marcando lo importante** (botones/acentos/bordes) como en los flyers de marca (`_ref/`). Además pidió un **cambio de alcance**: hero y CTA final **ya NO quedan navy** — pasan también a la paleta clara con turquesa protagonista y detalles oscuros puntuales. **Antes de tocar código** se releyeron los skills de diseño del proyecto (`SKILL-emil-design-eng.md`, `SKILL-ui-ux-pro-max.md`, `SKILL-cult-ui.md`) —el path `/mnt/skills/public/frontend-design/SKILL.md` que citaba el pedido **no existe en este entorno**, se avisó— y se aplicaron sus principios de verdad (jerarquía por tamaño/peso/espaciado no solo color; escala de elevación consistente; motion con `:active scale(.97)`, hover animado, ease-out; un CTA primario teal por pantalla; contraste ≥4.5:1) y se recalibró contra los flyers. **Qué cambió respecto de la 45:** (1) **Escala de elevación** nueva (`--shadow-card/-hover/-teal/-teal-sm`, `--radius-card`) → las cards dejan de verse "pegadas" al fondo. (2) **Turquesa protagonista:** badges de ícono **teal SÓLIDO con ícono blanco** (estilo flyer) en pilares y gamificación; botones primarios (`.btn-lg`) pasan de mint a **teal sólido** con sombra teal; `--teal-outline` subido a .45 y usado como borde presente + **hover que lleva el borde de las cards a teal pleno** (proof-strip, pilares, value-cards); tags/pills teal; `section-label` con línea teal y palabras acento en teal con resalte "brush" (`h1 em`, `h2 em`, `h3 span`). (3) **Hero a CLARO:** fondo paper con washes teal/gold + grid teal sutil; eyebrow = **pill navy** (detalle oscuro puntual) con texto mint; título ink + acento teal; botón teal sólido; **video enmarcado** (marco blanco + borde teal + sombra) para integrarlo en vez de flotar; el fade del scrub ahora funde a paper. (4) **CTA final a CLARO:** fondo paper + **blob teal-soft** + grid sutil (ya no glow navy); título ink con "hoy." en teal; botón teal sólido. (5) **Vivencial destacado y ticket "pase de acceso":** dejan de ser bloques 100% navy → **cards blancas** con sombra y borde teal; el navy queda solo como **acento puntual** (pill "Próxima salida" / "Pase de acceso") + la foto real del destino aporta la riqueza. (6) **Jerarquía tipográfica** más marcada en toda la Home (títulos +grandes/+peso, labels 600, spacing). **Componente compartido `StatCardItem` (lo usa también `/cursos` dark):** se extendió con un campo **opcional** `iconColor?` (retrocompatible; `/cursos` no lo pasa → sin cambios) para poder pintar el ícono blanco sobre badge sólido en el Home. **NO se tocó:** estructura/contenido/copy/links, ni ninguna otra página (sigue siendo piloto SOLO de Home), ni el **Header** (sigue pendiente para el rollout, funciona porque su tope quedó navy vía el spacer). **Única banda oscura grande que resta:** el **footer** (componente compartido, pendiente de rediseño como el Header) — queda como ancla oscura del pie, legible, y los flyers también cierran con banda oscura. **Archivos tocados:** `src/components/home/home.css` (paleta/elevación/6 secciones), `src/components/home/ProofStrip.tsx` (badges sólidos + iconColor), `src/components/home/FinalCTA.tsx` (`<em>` de acento), `src/components/shared/StatCardItem.tsx` (+`iconColor` opcional), `src/lib/communityStats.tsx` (+campo en el tipo `StatCard`), `CLAUDE_Academy_Actualizado.md`. Verificado: `tsc -b`, `eslint`, `vite build` limpios; Playwright contra el preview local, sección por sección (hero/proof/vivencial/como/gami/cta) en desktop y mobile — turquesa protagonista, badges sólidos, cards elevadas con hover teal, acentos oscuros puntuales, responsive OK. **Sin deploy a producción** — listo para el OK explícito de Nico antes de pushear a `main`. |
| Sesión 46 | **Unificación de tokens de color de TODA la plataforma (fuente única de verdad) + rollout de paleta cian con 6 cambios puntuales pedidos por Nico. Cambio 100% visual/frontend, sin tocar DB. Sin deploy — PENDIENTE una decisión de contraste de texto y el OK de Nico.** Contexto/pedido: hasta hoy el mismo rol visual (fondo oscuro, card, CTA primario, borde) estaba **duplicado como hex literal en 4 escopos distintos** (`index.css` global, `.home-root`, `.admin-root`, `.player-root`) → cambiar un color obligaba a tocarlo en 5 lugares. **(A) Unificación:** se creó un bloque de **tokens de ROL canónicos** en el `:root` de `src/index.css` (`--surface-page-dark`, `--surface-card-dark`, `--surface-page-light`, `--cta-primary`, `--border-dark`) como única fuente de verdad; cada escopo dejó de redefinir el hex y ahora **referencia esos tokens con `var()`** (los `.css` están scopeados bajo clase, así que no había colisión de nombres, solo duplicación de valores). Ver §Unificación de tokens de color para el detalle. **(B) 6 cambios puntuales aplicados sobre los tokens de rol:** (1) fondo navy `#0A1E29` → `#8AF3E4` (tema oscuro global: Cursos/Detalle/Player/Perfil/Instructores + shell de Admin `--navy`); (2) paper `#F4F5F2`/`#F6F6F2` → blanco puro `#FFFFFF` (fondo general Home + área de trabajo Admin); (3) card `#0F2C3B` → `#8AF3E4` (`--bg-2`); (4) CTA primario: `#4ECDB8` (mint/`--pl-primary-l`), `#0B6B57` (`--teal-deep` admin) y `#0E6B5C` (`--teal` home) unificados a `#00E5C8` (neon) vía `--cta-primary`; (5) mint del eyebrow del Home `#4ECDB8` → neon (mismo `--cta-primary`); (6) bordes/separadores del tema oscuro (`--line` de index) → `#00E5C8`. **NO se tocó** (por pedido explícito): `vivencial-detail.css` (Vivencial detalle V2 intacto), rojo EN VIVO `#EF4444`, verde WhatsApp `#25D366`, dorados de números/rating `#C99A3A`; tampoco los **colores de texto** (`--text-1/2/3`, `--ink*`), ni `--primary` global (botones shadcn del resto del tema oscuro), ni los bloques navy de acento del Home (`--navy-deep`, distinto rol), ni los bordes propios del Player (`--pl-line`, token aparte). **(C) Contraste — resuelto con decisión de Nico ("respetá el fondo cian, poné el texto legible; blanco/neon no dan sobre el cian → negro"):** se relevó que sobre `#8AF3E4` (cian claro) los textos del tema oscuro (`--text-1 #F5F3EC` casi blanco, etc.) quedaban ilegibles (~1.1:1) y que blanco/neon tampoco dan → se **reapuntaron los tokens de texto a oscuro** (`--text-1 → #0A1E29`, `--text-2 → #244049`, `--text-3 → #3C5661` + legacy `--text-primary/secondary/muted`) en `index.css`, y sus equivalentes del Player (`--pl-text-1/2/3`). Para no romper las **superficies que siguen oscuras** se preservó texto claro donde correspondía: el inset de los inputs de perfil (`.td-input`, sigue sobre `--bg-3` oscuro) y el dropdown de orden de `/cursos` (fondo `#0C1E2C`). En el **Player** los paneles del sidebar/rows (`--bg2/3/4`, que eran el mismo rol de card oscura) se pasaron también al cian + separadores oscuros (`--pl-line`) para que el player quede coherente y legible, no medio-cian/medio-navy. En **Admin** (que ya es tema claro con área de trabajo blanca + texto `--ink` intacto) el único cambio de la 46 fue el shell: el **sidebar** pasó a cian sólido (antes gradiente navy) con el **nav y datos de usuario en texto oscuro**, y las **pills activas** (chips/toggles/segmented, que quedaron con fondo cian) + el **texto sobre botones gold** pasaron a oscuro. **Rough-edges menores anotados (piloto, para revisión visual de Nico):** los acentos neon/`--pl-primary-l` (íconos, %, links, bordes) tienen poco contraste sobre el cian —consecuencia directa del cambio 4/6 pedido—; y quedan superficies puntuales aún oscuras con su texto claro propio (paneles `--bg-deep` del lector de ebook / recorte de avatar / arte de registro, algún panel `--bg-3` de perfil, y el stepper del wizard de admin), que se dejaron tal cual y se pueden pasar a claro en una pasada aparte si Nico quiere coherencia total. **Archivos tocados:** `src/index.css` (bloque canónico + reapuntado de fondos/borde/**texto** + legacy + `.td-input`), `src/components/home/home.css` (`--paper`/`--teal`/`--mint`), `src/pages/admin/admin.css` (`--navy`/`--paper`/`--teal-deep` + sidebar/pills/gold en texto oscuro), `src/pages/private/player.css` (`--bg`/`--pl-primary-l` + `--pl-text-*` + paneles `--bg2/3/4` + `--pl-line`), `src/pages/public/Catalog.tsx` (dropdown de orden), `CLAUDE_Academy_Actualizado.md`. `vite build` limpio (6.1s, sin errores; warning de chunk-size pre-existente). **Housekeeping:** había 4 archivos modificados sin commitear que NO eran de esta sesión (`FinalCTA.tsx`, `ProofStrip.tsx`, `StatCardItem.tsx`, `communityStats.tsx` — implementación de la Sesión 45b); por decisión de Nico se **descartaron** (`git checkout`, revertidos a HEAD). **Sin deploy** — listo para el OK explícito de Nico antes de pushear a `main`. |

### 🎨 Unificación de tokens de color — fuente única de verdad (Sesión 46)

**Problema que resolvió:** el mismo rol visual (fondo del tema oscuro, superficie de card, botón CTA primario, borde/separador, fondo del tema claro) estaba escrito como **hex literal duplicado** en 4 hojas de estilo con tokens propios: `src/index.css` (`:root`, global), `.home-root` (`home.css`), `.admin-root` (`admin.css`) y `.player-root` (`player.css`). Como cada `.css` scopea sus tokens bajo su clase, no había *colisión* de nombres, pero sí **duplicación de valores** → cambiar un color implicaba editarlo en hasta 5 lugares.

**Solución:** un bloque de **tokens de ROL canónicos** en el `:root` de `src/index.css` (única fuente de verdad); los custom properties heredan por el árbol del DOM, así que cada escopo (`.home-root`, `.admin-root`, `.player-root`) los consume con `var()` en vez de redefinir el hex.

**Tokens de rol nuevos (`src/index.css :root`):**

| Token de rol | Valor | Rol / antes |
|---|---|---|
| `--surface-page-dark` | `#8AF3E4` | fondo general tema oscuro — antes `#0A1E29` |
| `--surface-card-dark` | `#8AF3E4` | card/superficie sobre fondo oscuro — antes `#0F2C3B` |
| `--surface-page-light` | `#FFFFFF` | fondo general tema claro — antes `#F4F5F2` / `#F6F6F2` |
| `--cta-primary` | `var(--neon)` = `#00E5C8` | botón CTA primario unificado — antes mint/teal/teal-deep |
| `--border-dark` | `var(--neon)` = `#00E5C8` | bordes/separadores tema oscuro — antes `rgba(245,243,236,.12)` |

**Reapuntado (qué token de cada archivo pasó a referenciar el canónico):**

| Archivo (escopo) | Token local | Ahora apunta a |
|---|---|---|
| `index.css` (`:root`) | `--bg`, `--brand-navy` | `--surface-page-dark` |
| `index.css` (`:root`) | `--bg-2`, `--brand-navy-2` | `--surface-card-dark` |
| `index.css` (`:root`) | `--line`, `--surface-border` | `--border-dark` |
| `home.css` (`.home-root`) | `--paper` | `--surface-page-light` |
| `home.css` (`.home-root`) | `--teal`, `--mint` | `--cta-primary` |
| `admin.css` (`.admin-root`) | `--navy` | `--surface-page-dark` |
| `admin.css` (`.admin-root`) | `--paper` | `--surface-page-light` |
| `admin.css` (`.admin-root`) | `--teal-deep` | `--cta-primary` |
| `player.css` (`.player-root`) | `--bg` | `--surface-page-dark` |
| `player.css` (`.player-root`) | `--pl-primary-l` | `--cta-primary` |

De acá en adelante, **cambiar cualquiera de estos 5 roles se hace en una sola línea** del `:root` de `index.css` y se propaga a las 5 hojas.

**Fuera de alcance a propósito (NO unificados):** `--navy-deep`/`--bg`/`--bg2` de `.home-root` (son *acentos oscuros puntuales* del Home, rol distinto del fondo de página → siguen navy `#0A1E29`); `--primary` global (`#0E6B5C`, botones shadcn del resto del tema oscuro); `--pl-line` del Player (borde propio, token aparte, no es el `--line` global); `--primary-l` global (`#4ECDB8`, rol de texto/acento en CourseDetail, no CTA); y todo `vivencial-detail.css` (V2, intacto por pedido).

**Contraste (resuelto):** al llevar el fondo del tema oscuro a `#8AF3E4` (cian claro), los textos claros quedaban ilegibles. Decisión de Nico: mantener el cian y poner el texto legible en oscuro (blanco/neon no dan sobre el cian). Se reapuntaron los tokens de texto a oscuro (`--text-1 #0A1E29`, `--text-2 #244049`, `--text-3 #3C5661` en `index.css`; `--pl-text-1/2/3` en el Player), preservando texto claro solo en las superficies que siguen oscuras (inputs `.td-input`, dropdown de orden de `/cursos`), y pasando al cian los paneles del sidebar del Player (`--bg2/3/4`) y el sidebar de Admin para que queden coherentes. **Rough-edges menores (piloto):** los acentos neon sobre cian tienen poco contraste (consecuencia de unificar CTA/bordes a neon), y quedan superficies `--bg-deep`/algún `--bg-3` aún oscuras con su texto claro; se pueden pasar a claro en una pasada aparte si se busca coherencia total. **`--surface-card-dark` == `--surface-page-dark`** hoy (ambos `#8AF3E4`): las cards no se separan del fondo por color, solo por el borde neon — es intencional según el pedido, pero si Nico quiere separación se le puede dar un cian levemente distinto a `--surface-card-dark` en una sola línea.

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones.
- 13 edge functions deployadas y ACTIVE (las 3 de pagos + `award-points` + `check-badges`, más las 2 originales de MP), más `create-vivencial-cuotas-payment` (Sesión 15, deployada sin uso — ver Backlog), más `send-reserva-email` (escrita en Sesión 22, deployada recién en Sesión 35) y `send-course-email` (nueva, Sesión 35), más `redeem-benefit`/`draw-benefit-winner`/`expire-credits`/`mark-redemption-delivered` (nuevas, Sesión 36, sistema de Beneficios — ver §8e). *(No cuenta acá `create-subscription-academy`/`confirm-subscription-academy` — son deuda técnica sin relación con el modelo actual, ver Backlog.)*
- Bucket `academy-media` (público, imágenes) + bucket `academy-comprobantes` (privado) en Storage.
- Onboarding obligatorio en producción.
- Home pública (`/`) en producción, ver §9.
- Flujo de vivenciales por WhatsApp + backoffice en producción, ver §7.
- Portal de instructores en producción, ver §8.
- Backoffice: sección Alumnos (`/admin/alumnos`) en producción, ver §8b.
- Dominio propio `academy.travexa.com.ar` sirviendo, ver §11.

---

## BACKLOG PRIORIZADO

Backlog único (reemplaza las listas separadas de versiones anteriores de este doc — "acción manual pendiente" / "próximos pasos" / "backlog" quedaban dispersas en 3 lugares distintos). Orden por bloqueo/impacto real, de arriba hacia abajo.

### 🔴 P0 — Bloqueante para operar con usuarios reales / cobrar de verdad

- [ ] **Prueba visual en prod del sistema de Beneficios completo (Sesiones 36-38, ver §8e)** — deployado y verificado a nivel código/build, falta el cierre humano (principio #13): cargar un beneficio de cada tipo desde `/admin/beneficios` (curso gratis, % descuento, monto fijo, sorteo, otro), recorrer `/beneficios` logueado y deslogueado con los filtros, hacer un canje real de cada tipo, confirmar que el descuento se aplica solo en un pago real de MP, correr un sorteo con participantes de prueba (botón "Realizar sorteo"), probar "Marcar como entregado", y confirmar el checkbox de bases y condiciones con un sorteo que tenga `terminos` cargado (Sesión 38).
- [ ] **Confirmar la razón social a usar en las bases y condiciones de sorteos (Sesión 38)** — Pencom Travexa SAS sigue "en proceso de constitución" (`Travexa_Negocio.md` §13); ajustar `bases_y_condiciones_sorteos.md` y `src/content/basesYCondicionesSorteos.ts` con el nombre confirmado.
- [ ] **Programar `expire-credits` como cron (Sesión 36, ver §8e)** — la edge function está deployada y funciona, pero no se automatizó por SQL para no hardcodear la `SERVICE_ROLE_KEY` en una migración versionada; falta el alta manual en Supabase Dashboard → Edge Functions → Cron (2 minutos, documentado en la sesión).

- [ ] **Rotar la API key de Resend expuesta en el chat (Sesión 35).** La key (`re_GVfYYApt...`) quedó pegada en texto plano en esta conversación. Recomendado: crear una nueva en Resend, actualizar el secret `RESEND_API_KEY` en Supabase, borrar la vieja.
- [ ] **Confirmar que `send-course-email` sale una sola vez ante la carrera webhook/redirect (Sesión 35).** Función y guard anti-duplicado (`ensureEnrollment` → `created`) ya deployados; falta una compra de curso real (o el test con `curl` en paralelo documentado en la sesión) que confirme un solo mail y una sola invocación `sent:true` en los logs.
- [ ] **Confirmar que `send-course-email` quedó bien conectada — verificar que el secret `COURSE_FROM` haya quedado guardado (Bulk save) en Supabase (Sesión 35).**
- [ ] **Prueba visual en prod del bloque "Instructores" del wizard de Vivenciales (Sesión 34, ver §7d)** — implementación en `main`, falta el cierre humano (principio #13): en `/admin/vivenciales`, asignar 2 instructores a un vivencial (arrancar por el de Brasil), reordenarlos con las flechas, guardar, cerrar y reabrir → aparecen en el orden guardado; quitar 1 y guardar → queda 1; quitar todos → la columna queda null. Confirmar con un SELECT a `academy_courses.vivencial_instructor_ids` que el array quedó bien escrito. (La vista pública de la sección es el Prompt B, tanda aparte.)
- [ ] **Prueba visual en prod de todo lo de Sesión 33 (rama `feat/vivencial-home-tipografia`, ver tabla de sesiones)** — mergeada y en producción, falta el cierre humano (principio #13): (a) card de precio en un vivencial real con seña/fecha/precio_usd cargados — que la cuota calculada dé bien, la seña se lea como la cifra dominante, y aparezca "O pagá en dólares"; (b) hero de la Home con fotos reales de instructores en el avatar-stack; (c) tira de números como sección propia + nuevo orden de secciones (Vivenciales antes que Formación) + "Qué encontrás" rediseñada; (d) Montserrat aplicado en todas las áreas (público, privado, backoffice, portal de instructor), incluidos inputs, botones, números y badges.
- [ ] **Prueba visual en prod de todo lo de Sesión 32 (ver tabla de sesiones + §8b/§8c/§8d)** — deployado y verificado a nivel código/DB, falta el cierre humano (principio #13): sección `/admin/alumnos` (lista, drawer, dar de baja/reactivar), botón de colapsar sidebar del admin visible en Chrome y Safari, modal "Cómo ganar XP" en `/perfil`, un pago de curso real de punta a punta (que habilite solo, sin nada manual, y que un checkout abandonado no deje ninguna fila en `academy_payments`), y los 3 fixes genéricos de los wizards (prefijo de moneda, footer, stepper clickeable) en `/admin/cursos` y `/admin/vivenciales`.
- [ ] **Prueba visual en prod de los 3 campos nuevos del wizard de Vivenciales (Prompt 2 COMPLETO, Sesión 31, ver §7d)** — implementación ya en `main` (commit `0d684e9`), falta el cierre humano (principio #13): (a) cargar/quitar foto por día en el paso Itinerario y confirmar que persiste al reabrir; (b) que los tags PORTADA/EXPERIENCIA/RESERVA aparezcan sobre las 3 primeras "Fotos del destino"; (c) que el select "Tipo de destino" guarde y cambie el tema de color de la página. Verificar en `/admin/vivenciales`, en `?preview=1` y en la página pública real, incluido el borrador "Encantos de Brasil".
- [ ] **Prueba visual final EN PRODUCCIÓN del rediseño completo de `/vivencial/:slug` (Sesión 30, ver §7d)** — se corrigieron varias rondas de bugs reales ya en vivo durante la sesión (parpadeo de texto, espacios vacíos, parseo de "Qué incluye", fotos de fondo) hasta quedar aprobado por Nico en el recorrido de esa sesión, pero falta el cierre formal: recorrido completo de la página (hero → itinerario → qué incluye → alojamiento → puntos de salida → reserva → footer) en desktop y mobile, con los 3 estados de usuario (deslogueado, logueado sin inscripción, inscripto con saldo), y confirmar que el preview del backoffice (`?preview=1`) renderiza este mismo diseño nuevo.
- [ ] **Fix de layout de "Los cursos más elegidos" en la home de Formación — prompt entregado, sin aplicar.** Grid de columnas fijas deja un hueco enorme con solo 2 cursos cargados; cambiar a un layout tipo flex centrado con cards más grandes, que se sostenga igual de bien con pocos o muchos cursos.
- [ ] **Prueba visual real EN PRODUCCIÓN de los 5 fixes del wizard de Vivenciales/Cursos (Sesión 27)** —
  mergeado y deployado (`academy.travexa.com.ar`), pendiente que Nico lo confirme en vivo, backoffice
  → `/admin/vivenciales` y `/admin/cursos`: (a) editar un vivencial, subir foto en "Destino", ir a
  "Precio" y volver → la foto y los datos siguen ahí, con thumbnail visible; (b) el botón "Guardar
  cambios" se habilita solo al modificar algo; (c) "Cancelar" en rojo, abre modal de confirmación si
  hay cambios sin guardar; (d) "Ver preview" de un vivencial abre `/vivencial/:slug?preview=1` (página
  real de vivencial con banner de borrador), no la página de curso.
- [ ] **Prueba visual real EN PRODUCCIÓN del flujo de reserva self-service de vivenciales (v3)** —
  Sesión 24: mergeado a `main` y **deployado a producción** (`academy.travexa.com.ar`); las 2
  migraciones (v2 + v3) están aplicadas y el schema real verificado. Según el principio #13, esta
  prueba **NO bloqueó el merge/deploy** — se hace en vivo. **Es el único paso que falta para dar por
  reemplazado el modelo WhatsApp de §7:** que Yesica/Nico recorran el flujo como usuario real —
  reservar (elegir punto de salida) → ver número de reserva + datos bancarios en la pantalla de
  confirmación → "Informar transferencia" → aprobar el comprobante en el backoffice. El mail de
  Resend NO es parte de este gate (queda pausado, ver P1). **Sesión 28:** para destrabar esta prueba
  sin depender de una reserva orgánica nueva, se cargó un caso de prueba directo en Supabase —
  `nibelinco@gmail.com` inscripto en "Capacitación Vivencial Brasil" (`VIV-2026-00002`, seña de
  $239.250 ARS ya aprobada, saldo pendiente $703.250 ARS) — para probar puntualmente la parte que
  faltaba: subir el saldo desde `/viaje/:slug` y verlo en cola de aprobación en el backoffice.
- [ ] **Prueba visual real EN PRODUCCIÓN del paso "Precio" del wizard de Vivenciales (Sesión 28)** —
  seña + base + impuestos, ahora con ARS y USD 100% independientes (sin derivación por tipo de
  cambio) y formato de miles homogéneo en los tres pares de campos. `tsc -b`/`eslint` limpios,
  sin migraciones (columnas ARS/USD ya existían). Falta que Yesica cargue un vivencial de prueba
  con ambas monedas y confirme que el desglose y el total final se ven bien.
- [ ] **Prueba visual real EN PRODUCCIÓN del registro con confirmación por mail (Sesión 29)** —
  deployado a `main`/`academy.travexa.com.ar`, verificado a nivel código+DB (Confirm email ON,
  `/auth/callback` allowlisted, trigger tolera la ausencia de `tipo_cuenta`). Falta ejercitarlo como
  usuario real: registrarse con un mail nuevo → aparece la pantalla "Revisá tu mail" → llega el mail →
  el link loguea y lleva al onboarding (paso 2 pide tipo de vendedor con la taxonomía única) → probar
  también "Reenviar mail de confirmación" y el caso de link vencido (redirige a `/login` con aviso).
- [ ] `MP_ACCESS_TOKEN` cargado en Supabase Secrets — bloquea el cobro real de **cursos** (vivenciales no lo necesitan).
- [x] ~~Reactivar "Confirm email" en Supabase Auth~~ — **verificado ON en Sesión 29** (los registros por email/password recientes quedan `sin_confirmar` o se confirman tardíamente, nunca instantáneos → la confirmación por mail está activa). El rework de registro de Sesión 29 se apoya en esto (protección contra account-takeover en el auto-linking Google↔password).
- [ ] SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real.
- [ ] Sacar el Google OAuth Client de modo "Testing" (agregar test users mientras tanto).
- [ ] JavaScript origins del Google OAuth Client — completar con `https://academy.travexa.com.ar` (hoy vacío).

### 🟡 P1 — Producto: pilares incompletos o features a medio construir

- [ ] **Prototipo `academy_vivencial.html`: alinear del todo con el flujo v3 (Sesión 24).** El proto todavía arrastra el layout self-service legacy / CTA viejo; el producto ya usa "Reservar mi lugar" → pantalla de confirmación. Actualizar el proto para que refleje el flujo real de reserva self-service.
- [ ] **Confirmar que el mail de reserva sale bien (Sesión 22 → Sesión 35):** `send-reserva-email` ya está deployada y Resend configurado (dominio verificado, secrets cargados), pero el único test real hecho hasta ahora fue con una compra de **curso** (que no la invoca — ver Sesión 35). Falta probar con una reserva de **vivencial** real: que llegue el mail con número, resumen, monto y datos bancarios.
- [ ] **DNI del cliente en perfil (Sesión 21):** columna `academy_profiles.dni` (en la migración v3) + campo obligatorio en el onboarding + lectura en backoffice/PDF. Reemplaza el "—" que salía antes en la liquidación. Ya implementado en código; una vez aplicada la migración v3, los usuarios nuevos lo cargan en el onboarding. Los usuarios **ya existentes** no tienen DNI hasta que completen/reediten el perfil → evaluar pedirlo retroactivamente (banner o gate suave) si Yesica lo necesita para liquidaciones viejas.
- [ ] Testimonios reales para `TestimonialsSection` de la Home (hoy `SHOW_TESTIMONIALS = false`, activar cuando existan reseñas).
- [ ] Ajustes finales de la Home (checklist de Sesión 14, ver §9).
- [ ] Mergear Fase 2 del hero animado (`feat/plane-takeoff-hero`) a `main`.
- [ ] Tienda pública de canjes `/beneficios` — solo existe el lado de administración del catálogo.
- [ ] **Rediseño de insignias (`academy_badges`) — explícitamente pospuesto a otra sesión en Sesión 32** (ver tabla de sesiones): con la racha redefinida a ventana de 30 días (ver §8c), la condición `streak_7` ya no existe y hay que decidir cómo queda (renombrar a `streak_30`, sacarla, u otra). Alcance a definir con Nico: renombrar/redefinir las 7 condiciones de `academy_badges.condicion` (`first_lesson`, `first_review`, `first_vivencial`, `first_referral`, `streak_7`, `streak_100`, `top10_monthly`), y recién ahí conectar `check-badges` con la tabla de acciones unificada de §8c (hoy sin lógica implementada para ninguna condición).
- [ ] Badge `top10_monthly` (ranking-based, contra `get_academy_ranking()`) — parte del ítem de arriba.
- [ ] Certificados: título para certificados externos + generación de PDF en backend.
- [ ] Backoffice: drag-and-drop para reordenar módulos/lecciones e itinerario de vivenciales.
- [ ] **Comunidad** (pilar): feed social + directorio de miembros — no construido (tablas placeholder ya existen).
- [ ] **Eventos** (pilar): webinars con cards tipo boarding pass — no construido (tablas placeholder ya existen).
- [ ] **Pago en dólares para vivenciales vía dLocal (propuesta evaluada en Sesión 28, sin implementar):**
  se descartó como prioridad — leads mayoritariamente argentinos, nadie paga en USD hoy. Si en el
  futuro hace falta cobro real en dólares, queda el plan armado para retomar: columna opt-in
  `vivencial_precio_online_usd` en `academy_courses` (NULL = no se ofrece pago online), columnas
  `origen`/`monto_usd`/`dlocal_payment_id` en `academy_vivencial_payments` para distinguir un pago
  dLocal de uno cargado por Yesica o subido por el viajero, edge functions
  `create-vivencial-dlocal-payment` (crea la reserva + inicia el pago, flujo REDIRECT) y
  `dlocal-webhook-academy` (confirma vía webhook con HMAC, idempotente), y un botón "Pagar en
  dólares" que convive con "Reservar mi lugar" sin reemplazarlo. Full-payment, no seña/cuotas.
  Nico ya tiene cuenta y credenciales de dLocal si se retoma.
- [ ] **Decidir si precio base/impuestos con ARS y USD independientes (Sesión 28) necesita exigir ARS
  como obligatorio** — hoy el wizard permite guardar el paso Precio con una sola moneda cargada
  (a pedido explícito de Nico: "no es obligatorio ARS, ella podría editar el vivencial y agregarla").
  Revisar si en la práctica genera vivenciales publicados sin precio en la moneda real de cobro.
- [ ] `referral_code` con formato legible (`TRVX-NOMBRE-2026`) — evaluado, sin decisión final.
- [ ] Rediseño visual completo del backoffice admin (`/admin/pagos-instructores` quedó intencionalmente básica).
- [ ] Probar el Portal de Instructores con un instructor real (carga de datos, no código — Yesica/Nico cargan un `academy_instructors` con email de una cuenta existente + un pago de curso aprobado).
- [ ] Exportar CSV de liquidaciones de instructores.
- [ ] Mergear la rama del video unificado (Sesión 17) a `main` — hoy solo el hotfix de `/cursos` está en producción, el resto sigue en rama.
- [ ] **Agregar sección de Instructor al rediseño V2 del detalle de vivencial (decisión de Sesión 33, ver §7d).** El V2 no tiene ningún bloque de instructor — se eliminó por completo en el rediseño de Sesión 30. Retomar cuando haya al menos un vivencial con `instructor_id` cargado en `academy_instructors`: construir la sección (foto, bio, nombre reales) visible solo cuando el vivencial tenga instructor asignado, sin mostrar nada si no lo tiene.

### 🧹 P2 — Limpieza de deuda técnica

- [ ] **Dar de baja `academy_subscriptions`** (tabla) + edge functions `create-subscription-academy` y `confirm-subscription-academy` — sin uso, leftover del modelo pre-pivote. Escribir la migración de baja como propuesta (ver principio "DB se propone"), no aplicar directo.
- [ ] Sacar el valor `'suscripcion'` del enum de `academy_payments.tipo` una vez confirmado que no se usa.

### 🔵 P3 — Más adelante / infraestructura de fondo

- [ ] Repos privados + Vercel Pro (cuando el negocio lo justifique).

---

## VIVENCIALES — CIERRE DE VENTA POR WHATSAPP (Sesión 15)

> ⚠️ **Posible reemplazo en curso:** la Sesión 20 propone automatizar la reserva desde la
> plataforma (ver **§7c**), lo que reemplazaría esta sección. Se mantiene como modelo vigente
> hasta que Yesica/Nico prueben y confirmen v3. Mientras tanto, esto es lo que describe producción.

### Contexto y decisión de negocio

Travexa no factura vivenciales — son montos altos (viajes reales) y, a diferencia de los cursos, no se procesan dentro de la plataforma. La venta se gestiona íntegramente por WhatsApp con Yesica, quien administra la transferencia bancaria (fuera de Mercado Pago) por chat y después registra manualmente en el backoffice lo que cobró.

### Iteración de diseño

1. **Primera iteración (self-service):** seña por transferencia + saldo por transferencia (con cola de aprobación de Yesica) + saldo/total pagable en cuotas vía Mercado Pago, con reserva automática de cupo al primer pago y recálculo de saldo vía trigger. Se construyó completa: wizard, settings, 3 botones de pago, 2 edge functions, backoffice con cola de aprobación.
2. **Pivote:** definido que Travexa no cobra vivenciales, se simplificó el frontend a un solo botón de contacto. La base de datos de la primera iteración (ledger de pagos + trigger de recálculo) se mantuvo intacta y sirve igual para el modelo manual — solo cambiaron las policies de quién puede insertar qué y se agregó un camino de inserción directa (ya aprobada) para el admin.

### Flujo final (en producción)

**Página del vivencial (sin inscripción):**
- 2-3 tags informativos (no clickeables): "Transferencia en un pago", "Cuotas cómoda — pagás cuando querés, siempre antes de viajar", y opcionalmente "Seña sugerida: $X" si está cargada en el wizard.
- 1 botón: **"Quiero anotarme"** → abre WhatsApp al número de `travexa_whatsapp_business`, con mensaje pre-armado: *"Hola! Estoy interesado/a en ser parte del vivencial {nombre}"* — el género (interesado/interesada) sale de `academy_profiles.genero` del usuario logueado (Masculino/Femenino confirmados como valores reales en producción); sin sesión o sin género cargado, usa "interesado/a" genérico.

**Gestión de la venta (Yesica, fuera de la plataforma):** cierra la venta por WhatsApp, indica los datos bancarios por chat (ya no se muestran en la plataforma).

**Backoffice — alta + carga de pagos:**
- "Cargar inscripción manual": busca al usuario, crea el enrollment y descuenta cupo. Pide solo el monto total — la seña se carga como un pago más.
- "+ Cargar pago" por inscripto: monto, fecha, comprobante, tipo (Seña/Transferencia). Al guardar, se inserta **ya en `estado='aprobado'`** — sin pasar por ninguna cola — y el trigger recalcula el saldo al instante.

**Página del vivencial (con inscripción activa):**
- Resumen Total/Pagado/Pendiente.
- Botón "Subir comprobante" → sin mostrar CBU/alias (Yesica ya se lo pasó por chat) — solo monto + fecha + archivo. Queda `pendiente` hasta que Yesica lo apruebe desde el backoffice.
- Si `vivencial_whatsapp_url` tiene valor (Yesica lo carga más cerca de la fecha de salida): botón/link al **grupo de WhatsApp del viaje**.

**Historial (backoffice + perfil del viajero):** conviven en la misma tabla los pagos que carga Yesica (ya aprobados, registro histórico) y los que sube el viajero (con acciones de aprobar/rechazar mientras estén pendientes). Se distingue visualmente quién subió cada uno.

### Cambios de schema (Sesión 15)

- Tabla nueva `academy_vivencial_payments` (ledger de comprobantes).
- `academy_courses`: columnas `vivencial_precio_cuotas_ars/usd` (sin uso en UI actual), `vivencial_whatsapp_url` resemantizado (grupo del viaje, no consultas).
- `academy_enrollments`: columnas `pago_completado` (bool) y `fecha_limite_pago` (date). `monto_señado_ars`/`monto_pendiente_ars` ahora los recalcula el trigger, nunca se editan a mano.
- `academy_payments`: columnas `enrollment_id` y `comprobante_url`; constraint de `tipo` acepta también `'vivencial_cuotas'`.
- RPCs: `academy_reserve_vivencial_spot` (ahora solo fallback), `academy_liberar_cupo_vivencial` (admin), `academy_recalc_vivencial_balance` (interna, trigger-only).
- Bucket privado `academy-comprobantes` (10MB, jpg/png/webp/pdf) con RLS.
- Settings: `travexa_whatsapp_business` (en uso), `travexa_datos_transferencia` y `mp_monto_minimo_cuotas_ars` (sin uso en UI actual).

### Bug preexistente encontrado y corregido en esta sesión (no introducido en ella)

En `mp-webhook-academy`, la rama de pagos de curso escribía el status crudo de Mercado Pago en inglés directo en la columna `estado` (CHECK constraint solo en español) — el `update` fallaba en silencio. Corregido con un mapeo compartido (`estadoMap`/`toEstado()`) + logging de errores. No afectó datos reales.

---

## VIVENCIALES v2 — DESTINO, PRECIO Y FILTROS (Sesión 19)

Iteración sobre el feedback de Yesica al wizard de creación de vivenciales y a la página pública. **No cambia el modelo de cobro** (los vivenciales siguen sin cobrarse en la plataforma — §7). Toca ubicación, salida/alojamiento múltiples, desglose de precio y filtros públicos.

### Qué se hizo

**Backoffice — `VivencialWizard` (`/admin/vivenciales`):**
- **País:** dropdown de lista fija (`PAISES` en `types/index.ts`), no input libre.
- **Localidades:** multi-select tipo tags (Enter/coma para agregar) — alimentan el filtro público por localidad.
- **Puntos de salida:** repetible (`PuntosSalidaBuilder`), cada fila `{ ciudad, detalle_encuentro }` (renombrado desde `punto_embarque` en Sesión 21). `detalle_encuentro` es texto libre y **cubre embarque + punto de encuentro** (no hay campo separado).
- **Hoteles:** repetible (`HotelesBuilder`), cada fila `{ nombre, noches, link, foto_url }`. La foto sube al bucket existente `academy-media` (no se creó bucket nuevo).
- **Incluye / No incluye:** ya eran texto enriquecido (`RichTextArea` + `lib/richText`) desde antes — se mantiene. Secciones vacías no se renderizan en público.
- **Precio:** 3 inputs (base USD, impuestos USD monto fijo, gastos admin %) con **desglose en vivo** (PRECIO grande → + Impuestos → + Gastos administrativos → Total final a pagar). El total se calcula al guardar y se persiste en `precio_usd`/`precio_ars` (que pasan a ser el TOTAL FINAL): `total = base + impuestos + (base + impuestos) * gastos_admin_pct / 100`. Sin trigger de DB.
- **Tipo de traslado / Régimen de alimentos:** checkboxes multi-select. Alimentan los filtros públicos.
- **Fix de moneda:** `format.ts` unificado — `formatArs` ahora lleva espacio (`$ 1.234`) y se agregó `formatUsd` (`US$ 1.234`). Se eliminó el hack de `US$` + número crudo que generaba el símbolo pegado en el desglose.

**Público — listado (`/vivencial`):**
- Filtro por **tipo de traslado** (reemplaza al de **duración**, eliminado del todo).
- **Hover sobre la card** → preview con la descripción del viaje (solo si hay descripción real).
- **Cuota mensual estimada** en la card: `total_final / meses restantes hasta la salida` (`lib/vivencial.ts`). Si falta <1 mes o la fecha pasó → "Pago único". **Es informativa**, no un plan de pago (los vivenciales no se cobran en la plataforma).

**Público — detalle (`/vivencial/:slug`):**
- Bloque de **datos clave agrandado** (fechas, duración, cupos, sale desde) con soporte de **múltiples ciudades de salida**.
- **Sección de alojamiento**: lista todos los hoteles con noches, link y foto.
- **Traslado / régimen** como tags visuales con íconos.
- **Cuota estimada informativa** en la tarjeta CTA.
- Incluye/No incluye: texto libre con negrita, oculto si no hay contenido (ya estaba).

**Prototipo:** `academy_vivencial.html` actualizado — CTA de pago viejo (self-service) reemplazado por "Quiero anotarme" → WhatsApp, + desglose de precio, cuota estimada, hoteles, tags de traslado/régimen, salidas múltiples y filtro de traslado. (Cierra el ítem de backlog P2 que lo marcaba desactualizado.)

### Cambios de schema (PROPUESTOS — NO aplicados)

Migración `supabase/migrations/20260712000000_vivencial_v2_fields.sql`, 100% aditiva. **No corrida** (regla "DB se propone"). Hasta que Nico la aplique, el wizard v2 falla al guardar (escribe columnas que aún no existen) — esperado.

Columnas nuevas en `academy_courses`: `vivencial_localidades text[]` (+GIN), `vivencial_puntos_salida jsonb`, `vivencial_hoteles jsonb`, `vivencial_precio_base_usd/ars`, `vivencial_impuestos_usd/ars`, `vivencial_gastos_admin_pct`, `vivencial_tipo_traslado text[]` (+GIN), `vivencial_regimen_alimentos text[]`. `vivencial_pais` ya existía (se reutiliza).

Columnas **deprecadas, no borradas** (se siguen poblando con la 1ª entrada para compatibilidad): `vivencial_ciudad_salida`, `vivencial_punto_encuentro`, `vivencial_hotel`.

### Decisiones de diseño — CONFIRMADAS por Nico (Sesión 21)

1. **"Punto de encuentro" no es campo separado — CONFIRMADO.** Se resuelve con el texto libre de cada punto dentro de `vivencial_puntos_salida`. El campo se **renombró de `punto_embarque` a `detalle_encuentro`** (Sesión 21) para reflejar que cubre a la vez el punto de embarque y las instrucciones de encuentro (ej: "Terminal 2, mostrador Aerolíneas Argentinas, 3hs antes"). La columna legacy `vivencial_punto_encuentro` queda intacta.
2. **Se reutilizan `incluye` / `no_incluye` — CONFIRMADO.** No se crean `vivencial_incluye_texto` / `vivencial_no_incluye_texto`: esas columnas ya son `text` y ya se usan como texto enriquecido, columnas nuevas serían un duplicado.

### Pendiente de verificación (regla de ecosistema)

La migración v2 ya está **aplicada** (Sesión 22) y todo pasa `tsc -b`, `eslint` y `vite build`
limpios, pero **falta la prueba visual real de Yesica o Nico** del wizard v2 + detalle público. No dar por cerrado.

### Actualización — precio en ARS y USD independientes (Sesión 28)

El modelo de precio de esta sección (3 inputs: base USD, impuestos USD, gastos admin %, con el ARS
calculado automáticamente por tipo de cambio) **quedó reemplazado**. Motivo: los leads son
mayoritariamente argentinos y nadie paga en dólares — el ARS es la moneda real de cobro, el USD es
solo referencia, y Yesica necesita poder cargar ambos a mano de forma independiente (mismo criterio
que ya tenía la seña). Cambios: se agregaron `base_ars`/`impuestos_ars` como inputs propios (las
columnas `vivencial_precio_base_ars`/`vivencial_impuestos_ars` ya existían en el schema real, no
hizo falta migración), se eliminó la derivación por tipo de cambio, y `total_usd`/`total_ars` se
calculan cada uno desde su propio desglose. El paso permite guardar con una sola moneda cargada
(ninguna es obligatoria — Yesica puede completar la que falte después editando el vivencial). Detalle
completo en la fila de Sesión 28 de la tabla de sesiones. Falta la prueba visual de este paso rediseñado.

---

## VIVENCIALES v3 — RESERVA AUTOMÁTICA DESDE LA PLATAFORMA (Sesión 20-22)

> ⚠️ **DECISIÓN DE NEGOCIO A CONFIRMAR por Yesica/Nico.** Este flujo **reemplaza** el
> "cierre de venta por WhatsApp" documentado en **§7**. §7 **NO se borró** a propósito:
> queda como el modelo vigente hasta que Yesica/Nico prueben v3 y confirmen el cambio.
> **Estado (Sesión 22):** las migraciones v2 + v3 están **APLICADAS en producción** y el
> código pasa `tsc`/`eslint`/`vite build` contra el schema real. Lo único que falta para
> reemplazar §7 es la **prueba visual real del flujo self-service** (regla de ecosistema).

### Qué cambia (y qué NO)

- **Cambia:** el usuario **reserva solo desde la plataforma**. El botón del vivencial deja
  de ser "Quiero anotarme" → WhatsApp y pasa a ser **"Reservar mi lugar"** → elige punto de
  salida → confirma → pantalla de confirmación in-app con **número de reserva**, resumen del
  viaje, monto total y **datos bancarios** para transferir. La comunicación de esos datos se
  automatiza (antes Yesica los pasaba por chat).
- **NO cambia:** **Travexa sigue sin cobrar vivenciales con Mercado Pago.** El pago sigue
  siendo transferencia/depósito bancario coordinado manualmente por Yesica, sobre el **mismo
  ledger `academy_vivencial_payments`** y el mismo trigger de recálculo de saldo. Yesica
  sigue aprobando/rechazando comprobantes desde el backoffice, sin cambios en esa parte.

### Alcance implementado (frontend, contra migración PROPUESTA)

1. **Gate de login en todo comprar/reservar** (no solo vivenciales): cualquier acción que
   exige sesión manda a `/login?redirect=<url actual>` y vuelve al mismo lugar tras loguearse.
   Helpers `loginRedirect()` / `safeRedirectPath()` en `lib/utils.ts`. El destino se preserva
   a través del round-trip de Google OAuth vía `sessionStorage` (`POST_LOGIN_REDIRECT_KEY`),
   recuperado en `AuthCallback` (`App.tsx`). Corregido en `CourseDetail` (cursos) y en el CTA
   de vivenciales. Las cards del catálogo solo navegan al detalle (no compran) — sin gate.
2. **Flujo de reserva** (`VivencialPagoCTA` + `PuntoSalidaModal`): login gate → elegir punto
   de salida (de `vivencial_puntos_salida`, con fallback a `vivencial_ciudad_salida`) → RPC
   `academy_reserve_vivencial_self` (crea enrollment, descuenta cupo, guarda punto elegido,
   trigger asigna número) → redirige a `/reserva/:slug`.
3. **Pantalla de confirmación** (`ReservaConfirmada`, ruta `/reserva/:slug`): celebración,
   número de reserva, resumen, monto total y datos bancarios de `travexa_datos_transferencia`
   (setting que estaba sin uso — ahora se usa; `normalizeCuentas()` soporta 1 o varias cuentas).
4. **Perfil + `/viaje/:slug`**: barra **Total / Pagado / Saldo** (`PagoProgressBar`), número
   de reserva, y botón **"Informar transferencia"** (antes "Subir comprobante") con formulario
   enriquecido: método (Depósito/Transferencia), depositante, DNI, fecha, N° de cupón, selector
   de cuenta destino (si hay más de una) e importe + comprobante. Entra a
   `academy_vivencial_payments` con `estado='pendiente'`, igual que antes.
5. **Backoffice — vista por viajero** (`VivencialInscriptoRow`): header con nombre, número de
   reserva, estado e ícono de **Liquidación PDF**; barra Pagado/Total + Saldo; 3 columnas
   (Detalles del Paquete, Precios [comisiones **N/A** en vivenciales de Academy], Datos del
   Cliente). El modal "Cargar pago" existente se mantiene, con resumen Total/Cobrado/Saldo.

### Cambios de schema (APLICADOS en producción — Sesión 22)

Migración `supabase/migrations/20260712010000_vivencial_reserva_self_service.sql`, 100% aditiva,
**aplicada** (junto con la v2 `20260712000000`). Verificado contra el schema real: el RPC, el
trigger y las columnas existen; el código compila y buildea contra prod.

- `academy_enrollments.numero_reserva text` (UNIQUE parcial) — formato `VIV-{año}-{consecutivo}`,
  asignado por trigger `academy_assign_numero_reserva` a toda inscripción de vivencial (cubre
  self-service, alta manual de Yesica y fallback). Secuencia global `academy_reserva_seq`.
- `academy_enrollments.punto_salida_elegido text` — punto de salida que eligió el viajero.
- RPC `academy_reserve_vivencial_self(p_course_id, p_punto_salida)` — clon de
  `academy_reserve_vivencial_spot` que además persiste el punto elegido.
- `academy_vivencial_payments`: `metodo`, `depositante_nombre`, `depositante_dni`,
  `cupon_numero`, `cuenta_destino` (todas nullable).
- `academy_profiles.dni text` — DNI del cliente capturado en el onboarding (Sesión 21).

### Mail y PDF — approach implementado; mail EN PAUSA (Sesión 22)

- **Punto 4 — mail de "reserva confirmada" (Resend, EN PAUSA):** edge function
  `supabase/functions/send-reserva-email/index.ts` (Resend API HTTP, sin SMTP) queda **escrita
  pero sin deployar** por decisión de Nico (Sesión 22). Se dispara
  fire-and-forget desde el cliente (`sendReservaEmail()`) al reservar — nunca rompe la reserva.
  **Falta para que envíe de verdad:** setear secrets `RESEND_API_KEY` y `RESERVA_FROM` en
  Supabase + dominio verificado en Resend + **deployar la function** (lo hace Nico). Sin
  `RESEND_API_KEY`, la function responde `{sent:false}` sin error. Esto resuelve, para el caso
  transaccional, el ítem P0 de "SMTP propio".
- **Punto 6 — liquidación PDF (client-side, confirmado):** `lib/liquidacionPdf.ts`
  (`jsPDF` + `html2canvas`, deps agregadas) genera el PDF con los bloques del formato de
  referencia (Operador/Proveedor, Pasajero Responsable, Fechas y Condiciones, Detalle de
  Pasajeros, Servicios Contratados, Cuenta de la Reserva, Detalle de Pagos Recibidos, Total
  Pagado/Resta Pagar, términos de cancelación). Descargable desde el backoffice (ícono en
  `VivencialInscriptoRow`) y desde el viaje del viajero (`LiquidacionButton`). No importa código
  de `travexa-catalogo` (que usa el mismo enfoque), es una implementación propia de Academy.
  El **DNI del cliente** ya se lee desde `academy_profiles.dni` (capturado en el onboarding,
  Sesión 21) — reemplaza el "—" que salía antes.

### Decisiones — estado (Sesión 21)

1. **La decisión de negocio en sí** (reserva automática vs. WhatsApp) — **pendiente** de la prueba
   visual real de Yesica/Nico. Es lo único que falta para reemplazar §7.
2. `numero_reserva`: secuencia global con año informativo (no reinicia por año) — CONFIRMADO.
3. `travexa_datos_transferencia`: **CONFIRMADO que alcanza con 1 sola cuenta** — no se agrega
   soporte de array (el código igual lo tolera sin costo).
4. **DNI del cliente — RESUELTO:** se captura en el onboarding (obligatorio, paso 1) hacia
   `academy_profiles.dni` y se lee desde ahí en backoffice y PDF. "Observaciones" del cliente
   sigue sin existir en el schema (fuera de alcance por ahora).

---

## VIVENCIALES v4 — REDISEÑO DE LA PÁGINA DE DETALLE (Sesión 30)

> Esta sección documenta un cambio **puramente visual** de `/vivencial/:slug`. **No toca**
> el modelo de negocio (§7), ni la reserva self-service (§7c), ni el modelo de precio
> (§7b) — la lógica de todos esos flujos se preservó intacta a propósito.

### Qué es y por qué

Yesica pidió que la página de detalle de un vivencial "venda la experiencia desde el
primer segundo", en línea con el diferenciador de Travexa Academy (viajar y vivir el
destino, no solo estudiarlo). El diseño anterior era una ficha de producto genérica
(hero chico, tabs, sidebar de precio) que no comunicaba eso.

### Proceso de diseño

Como con el resto de prototipos del proyecto: el diseño se iteró punto por punto en un
**mockup HTML standalone** (`vivencial-detalle.V2.html`, en la raíz del proyecto junto a
los demás `academy_*.html`) hasta la aprobación explícita de Nico, y **recién ahí** se
portó a React. El mockup es la fuente de verdad visual de esta feature — si hace falta
retocar el diseño más adelante, arrancar por ahí, no directo en el componente React.

### Diseño aprobado

- **Hero 100svh**: foto de portada full-bleed con parallax sutil, nombre del país en
  mayúsculas gigante flotando de fondo (blanco, borde con glow, sombra, animación de
  levitación continua — no el gris apenas visible de la primera iteración), tag "✦
  Capacitación vivencial", título, subtítulo (oculto si no hay), botones de copiar
  link/compartir (44×44px, glass con buen contraste, ubicados debajo del título — no
  perdidos a mitad de la foto), y 4 mini-cards de datos (fechas/duración/cupos/sale
  desde). Sin el botón "Volver a vivenciales" (se sacó del hero a pedido explícito).
- **Itinerario** en timeline vertical con línea dorada: cada día se expande solo (con
  apertura lenta) al pasar el mouse en desktop, y con click/tap en mobile (no hay hover
  en touch). Cada día puede llevar una foto — campo nuevo y **opcional**
  `vivencial_itinerario[i].foto_url` dentro del mismo JSONB existente, sin migración.
- **"Qué incluye"**: el campo `incluye` es texto libre único (Yesica escribe ahí bullets
  cortos seguidos de párrafos largos y hasta bloques de preguntas y respuestas, todo en
  el mismo campo — no hay estructura). Se parsea de forma **genérica** (no atada al texto
  de ningún vivencial en particular): las líneas cortas consecutivas desde el inicio se
  muestran como chips con ícono de check; el resto se agrupa por los "subtítulos" que
  aparecen en el texto (líneas cortas seguidas de contenido, tipo "¿A quién está
  dirigido?") en **cards de vidrio liquid glass separadas**, a **ancho completo** de la
  sección (no angostas) — así el texto siempre tiene contraste garantizado sin importar
  qué parte de la foto de fondo quede detrás.
- **"Alojamiento"**: comparte la sección inmersiva con "Qué incluye", misma foto de fondo
  (`fotos[1]`). Cards de hotel con foto, estrellas, noches, hover con zoom.
- **Puntos de salida**: cards claras con pin dorado.
- **"Reservá tu lugar"**: foto de fondo (`fotos[2]`) + price card liquid glass premium
  (blur fuerte, borde luminoso, contador animado del monto, barra de cupos animada,
  desglose completo, botón dorado "Informar transferencia", botón "Consultá por
  WhatsApp", y un botón nuevo **"Ver qué no incluye"** desplegable debajo de WhatsApp que
  lee `no_incluye`).
- **Barra flotante inferior persistente** (liquid glass, estilo iOS): aparece pasado el
  hero, muestra seña + cupos + botón **"Ver detalle"** que scrollea a "Reservá tu lugar",
  y **se autooculta** cuando esa sección ya está en pantalla (para no duplicar
  información en la vista).
- **Tema de color por destino**: `vivencial_tipo_destino` (playa/montaña/desierto/
  selva/ciudad) tiñe los tonos de fondo de la página. Implementado en el mockup con 5
  variantes de token de color; el selector para cargarlo en el backoffice se agregó en
  Sesión 31 (commit `0d684e9`) — antes de eso todo vivencial usaba el default.

### Regla de oro que se mantuvo: diseño nuevo, lógica intacta

Todo lo que ya funcionaba se preservó sin tocar: el gate de login antes de reservar/
informar transferencia, el link de WhatsApp con mensaje pre-armado, el saldo del
inscripto, los cupos en vivo, el menú real de Academy (no el placeholder del mockup). El
modal de "Informar transferencia" (mismo formulario de siempre: método, depositante, DNI,
importe, fecha, cupón, comprobante) se re-estiló en liquid glass oscuro con blur del
fondo de la página al abrirse, sin tocar su lógica de guardado en
`academy_vivencial_payments`. Todos los textos dicen **"el equipo Travexa"**, nunca un
nombre propio (antes decía "Yesica" en un par de lugares).

> ⚠️ **Los "anotados"/cupos que ve el PÚBLICO son HARDCODEADOS (Sesión 41) — NO son un bug.**
> Desde Sesión 41, el número de anotados que se muestra en las páginas públicas de
> vivenciales (hero "Cupos", price card "Quedan X de Y", barra flotante, card del listado
> y home) es **ficticio**, por decisión de negocio (prueba social): NO refleja
> `vivencial_cupo_disponible` real. El valor sale del mapa `ANOTADOS_HARDCODEADOS` en
> **`src/lib/cupo.ts`** (hoy `capacitacion-vivencial-brasil: 15`, default 20 para el
> resto). El denominador ("de Y") y la barra siguen usando el `cupo_maximo` REAL de la DB;
> solo el numerador es hardcodeado. **La lógica de reservas/agotado sigue usando el cupo
> real** — el gate `agotado` de `VivencialDetail` NO se tocó. Si querés que un vivencial
> muestre otro número de anotados, editá el mapa en `src/lib/cupo.ts`, no la DB ni la
> lógica. El backoffice/admin sigue mostrando el cupo REAL. No lo "arregles" pensando que
> el número mostrado no coincide con la DB — es a propósito.

### Cambios de schema (APLICADOS)

- `academy_courses.vivencial_tipo_destino text` con `CHECK IN ('playa','montana','desierto','selva','ciudad')` — **aplicada** vía MCP en esta sesión (columna nueva, aditiva, sin dato existente que migrar salvo el backfill de Brasil). El vivencial "Capacitación Vivencial Brasil" quedó seteado en `'playa'`.
- **Nada más requirió migración**: `fotos` (array de URLs, ya existente) se reutiliza con una convención de **posición** (1ª = portada/hero, 2ª = fondo de "Qué incluye+Alojamiento", 3ª = fondo de "Reservá tu lugar") en vez de un campo nuevo; `vivencial_itinerario` es JSONB y admite la clave opcional `foto_url` sin alterar su forma; `incluye`/`no_incluye` son los mismos campos de texto libre de siempre.

### Debugging post-deploy — qué pasó y causa raíz real de cada bug

Se shippeó a producción antes de que estuviera terminado de pulir (según el principio #13, no bloquea el deploy) y salieron varios bugs reales en producción, con varias rondas de idas y vueltas:

1. **"Qué incluye" con preguntas sueltas sin ícono, itinerario con días sin contenido visible, espacios vacíos enormes entre secciones, franja oscura vacía al final de la página.** Causa raíz real: el campo `incluye` de este vivencial en particular tiene bullets + el manifiesto completo + un bloque de preguntas y respuestas, todo en el mismo texto libre — el primer parseo partía **cada línea** como un chip individual (incluyendo preguntas y párrafos largos), lo que infló la sección y disparó efectos en cascada (foto de fondo recortada rara por la sección desproporcionadamente alta, layout roto). Se resolvió con la regla de parseo genérica descrita arriba, más una franja residual del footer viejo que quedó de una sección eliminada del mockup.
2. **Parpadeo de títulos/descripciones al hacer scroll — el bug más largo de resolver, tres intentos fallidos antes del correcto:**
   - *Intento 1:* se sospechó de la animación de reveal implementada con `framer-motion` (`whileInView`) reaplicándose en cada re-render del padre. Se reemplazó por un `IntersectionObserver` manejado en `useState` de React puro. **No cambió el bug.**
   - *Intento 2:* se blindó ese mecanismo con un registro global (`Set` a nivel de módulo, fuera de React) de elementos ya revelados por `key` estable, para que ningún remount pudiera volver a ocultar algo ya mostrado — estructuralmente imposible que fallara por esa causa. **El bug siguió exactamente igual, pixel por pixel.**
   - Que dos fixes distintos y verificablemente correctos no cambiaran nada en absoluto fue la señal de que el diagnóstico estaba mal desde el principio — Claude Code venía razonando por lectura estática de código, sin ver la página correr en un navegador real. Se cortó ese ciclo exigiendo evidencia real: correr Playwright contra la URL de producción, scrollear de a poco, y capturar screenshots + valores reales de `opacity` del DOM en cada paso, en vez de seguir razonando solo sobre el código; la hipótesis alternativa a probar era que el texto nunca desaparecía — sino que algo se le superponía encima (gradiente de fondo, overlay, doble render). Con esa exigencia de evidencia, el bug se resolvió en el intento siguiente.
3. **Fixes menores, sin misterio:** tipografía de las cards de prosa demasiado angosta (se corrigió a ancho completo de sección a pedido explícito, con límite de línea más generoso en pantallas muy anchas); botones de compartir/copiar reposicionados y agrandados; botón "Volver a vivenciales" sacado del hero.

**Lección de proceso para sesiones futuras con este mismo patrón de bug (algo que "debería" estar arreglado por el código pero el usuario ve que sigue igual):** si un segundo fix estructuralmente sólido no cambia el resultado visual ni un poco, dejar de iterar hipótesis por lectura de código y pasar a diagnóstico con evidencia real (navegador real, screenshots, valores computados) antes de proponer un tercer fix.

### Cómo se conecta con el backoffice (mapeo de datos)

La página pública **no tiene nada hardcodeado** — todo lo que muestra sale de la fila de `academy_courses` que edita Yesica en `/admin/vivenciales`. Si en el futuro hay que agregar o cambiar un campo del wizard, **primero hay que saber qué parte visual alimenta** para no romper la página nueva sin querer:

| Campo del wizard (`VivencialWizard`) | Columna en DB | Dónde se ve en `/vivencial/:slug` |
|---|---|---|
| Título del vivencial | `titulo` | Hero: título grande |
| País | `vivencial_pais` | Hero: palabra gigante flotante de fondo |
| Descripción | `descripcion` | Hero: subtítulo (oculto si vacío) |
| Fechas de salida/regreso | `vivencial_fecha_salida/regreso` | Hero: mini-card "Fechas" + duración calculada |
| Cupo máximo/disponible | `vivencial_cupo_maximo/disponible` | Hero + barra flotante + price card (cupos y barra animada) |
| Puntos de salida | `vivencial_puntos_salida` (jsonb) | Hero: mini-card "Sale desde" + sección "Puntos de salida" |
| Tipo de traslado / régimen de alimentos | `vivencial_tipo_traslado/regimen_alimentos` | Chips bajo el hero (heredado de v2, sin cambios en Sesión 30) |
| **Fotos del destino** | `fotos` (array de URLs) | **Por posición**: 1ª = fondo del hero, 2ª = fondo de "Qué incluye + Alojamiento", 3ª = fondo de "Reservá tu lugar". El wizard muestra los tags de posición **PORTADA / EXPERIENCIA / RESERVA** sobre las 3 primeras (`FOTO_POS_TAGS`, desde Sesión 31, commit `0d684e9`) — derivados del orden del array, sin cambiar su formato |
| Itinerario día por día | `vivencial_itinerario` (jsonb `{dia,titulo,descripcion,foto_url?}`) | Sección "Itinerario", timeline. La clave opcional `foto_url` por día (**cargable desde el wizard desde Sesión 31**, commit `0d684e9`) se muestra dentro de la card del día al expandirse; los días sin `foto_url` colapsan a una sola columna (`vv-nophoto`), sin placeholder roto |
| Hoteles | `vivencial_hoteles` (jsonb) | Sección "Alojamiento" |
| Incluye | `incluye` (texto libre) | Se parsea de forma automática: líneas cortas consecutivas del inicio → chips con ícono; el resto, agrupado por subtítulos, → cards de prosa liquid glass. **Ver la regla de parseo en el debugging de esta sesión, arriba** — no es una lista estructurada, es texto libre |
| No incluye | `no_incluye` (texto libre) | Botón "Ver qué no incluye" desplegable, dentro de la price card |
| Precio (seña/base/impuestos, ARS y USD) | `vivencial_precio_*` | Price card de "Reservá tu lugar" — sin cambios de mapeo en esta sesión, hereda de §7b |
| **Tipo de destino** (nuevo, Sesión 30) | `vivencial_tipo_destino` | Tema de color de toda la página (`data-theme`). Selector en el paso 1 del wizard (desde Sesión 31, commit `0d684e9`); si queda vacío, el público usa `'playa'` |
| **Instructores** (nuevo, Sesión 34) | `vivencial_instructor_ids` (uuid[]) | Sección "Instructores" de la página pública (Prompt B) — oculta si vacío. Selector múltiple con reorden en el paso 1 del wizard (`InstructorPicker`, desde Sesión 34) |

**Regla para cambios futuros al wizard:** si se agrega un campo nuevo al formulario, hay que decidir explícitamente si tiene o no una vista correspondiente en la página pública nueva — no asumir que "se va a mostrar solo". Si hace falta agregar la vista, tocar `VivencialDetail` (componente de la página pública) y este mapeo a la vez, no por separado.

### Pendiente

- **Backoffice (`VivencialWizard`) — Prompt 2 COMPLETO ✅** (los 3 ítems commiteados en `0d684e9`, ya en `main` — ver Sesión 31 en la tabla): (a) campo de foto opcional por día en el paso Itinerario **✅ RESUELTO** (`ItineraryBuilder`, mismo patrón de subida y bucket `academy-media` que la foto de hotel); (b) tags visuales de posición (Portada/Experiencia/Reserva) sobre el picker de "Fotos del destino" **✅ RESUELTO** (`FOTO_POS_TAGS`, derivados del orden del array — sin cambiar su formato); (c) select "Tipo de destino" en el paso 1, leyendo/escribiendo `vivencial_tipo_destino` **✅ RESUELTO**. Falta solo la prueba visual en prod (principio #13) — ver Backlog P0.
- El **preview del backoffice** (`?preview=1`) comparte componente con la ruta pública por diseño (desde Sesión 27), así que debería renderizar igual — la confirmación está incluida en la prueba visual del Backlog P0.
- **Prueba visual final en prod, de punta a punta, del rediseño** (principio #13) — ver Backlog P0.
- Fix aparte, de otra página (home de Formación, "Los cursos más elegidos") — ver Backlog P0.
- **El V2 no tiene sección de Instructor (confirmado en Sesión 33).** A diferencia del diseño anterior (con tabs, donde existía un tab de Instructor que a veces quedaba vacío), el rediseño de Sesión 30 convirtió la página en scroll continuo y **eliminó por completo** cualquier bloque de instructor — la única mención a "instructor" hoy es un texto fijo genérico dentro de los checks de la price card (ver Sesión 33 en la tabla), no datos reales de `academy_instructors`. Se decidió no reconstruirla por ahora: ningún vivencial tiene `instructor_id` cargado hoy. Queda en Backlog P1 para cuando haya instructores asignados a vivenciales.

---

## VIVENCIALES — DESTINO INDEPENDIENTE DE PAÍS + TOGGLE DE TÍTULO (Sesión 40)

**Problema que resuelve.** El único dato geográfico del vivencial era `vivencial_pais` (dropdown fijo `PAISES`), que además es lo que se usa como **título grande del hero** del detalle público (`vv-hero-word`). Los viajes que no son de un país puntual sino de una zona/continente (ej. "Europa") no tenían dónde cargarse. Se agrega un segundo campo **Destino** (continente/zona) que convive con País — ninguno obligatorio respecto del otro — y Yesica elige cuál de los dos va como título de la portada.

**Schema (migración APLICADA y trackeada en prod).** `supabase/migrations/20260720132306_vivencial_destino.sql`, aditiva sobre `academy_courses`:
- `vivencial_destino text` — nullable, **sin CHECK** (igual de flexible que `vivencial_pais`); los valores válidos viven en el front (`DESTINOS` en `src/types/index.ts`, mismo patrón que `PAISES`), no en la DB.
- `vivencial_destino_como_titulo boolean not null default false` — controla si el hero muestra Destino en vez de País.
- **Estado real (verificado en la DB el 20/07/2026):** las dos columnas ya existen en prod (Travexa 2.0) con exactamente ese shape, y la migración quedó registrada en `supabase_migrations.schema_migrations` como version **`20260720132306`** (name `vivencial_destino`). El archivo local se renombró de `20260720000000` a ese mismo timestamp para que local y remoto queden alineados. Los vivenciales existentes que solo tienen País no cambian: `vivencial_destino` NULL + flag en `false` (default) → el hero sigue mostrando País tal cual.

**Tipos (`src/types/index.ts`).** Nueva const `DESTINOS = ['Europa','Sudamérica','Norteamérica','Centroamérica','El Caribe','África','Asia','Medio Oriente','Oceanía'] as const`. En `Course`: `vivencial_destino: string | null` y `vivencial_destino_como_titulo: boolean`. `CourseWrite` es `Partial<Omit<Course,…>>`, así que hereda ambos sin tocar el hook.

**Backoffice (`VivencialWizard.tsx`, paso "Destino").** Junto a País/Región se agregó una fila con: (1) dropdown **Destino** (`DESTINOS`, opción "Sin destino", opcional — no entra en `validateStep`, no bloquea el guardado); (2) checkbox **"Mostrar Destino como título principal"** (reusa la clase `check-item` con estado `.checked`). El estado del form suma `destino: string` y `destino_como_titulo: boolean`; el payload manda `vivencial_destino: form.destino || null` y `vivencial_destino_como_titulo: form.destino_como_titulo`. **Regla de convivencia:** si el checkbox está tildado pero Destino vacío, no hay efecto — el front cae a País (no rompe ni deja título vacío).

**Público — listado (`/vivencial`, `VivencialCatalog.tsx`).** El único select geográfico existente estaba **mal rotulado**: se llamaba "destinos" pero filtraba `vivencial_pais`. Se separó en dos filtros independientes:
- **País** (`activePais`, "Todos los países") → filtra `vivencial_pais`. Opciones = DISTINCT de países realmente presentes.
- **Destino** (`activeDestino`, "Todos los destinos") → filtra `vivencial_destino`. Opciones = DISTINCT de destinos realmente presentes.
- Se combinan con **AND** entre sí y con región/traslado/fecha: se puede filtrar por uno, por el otro, por ambos o por ninguno. Cada select se renderiza solo si hay valores reales en la DB (misma regla de integridad que el resto de los filtros).

**Público — detalle (`/vivencial/:slug`, `VivencialDetail.tsx`).** El título grande del hero (`vv-hero-word`):
- `destinoComoTitulo = !!course.vivencial_destino_como_titulo && !!destino` → si true, `heroWord = destino.toUpperCase()`; si no, `heroWord = pais.toUpperCase()` (comportamiento histórico).
- Cuando el Destino toma el título, el País **no se pierde**: baja de jerarquía a un tag secundario (`vv-tag vv-tag-loc`, con ícono `MapPin`) dentro de una fila `vv-hero-tags` junto al eyebrow "✦ Capacitación vivencial". CSS nuevo en `vivencial-detail.css` (`.vv-hero-tags`, `.vv-tag-loc`; el `.vv-tag` pasó a `inline-flex` para alinear ícono+texto y el `margin-bottom` se movió al contenedor).
- Resto del hero (fotos, parallax, mini-cards, share) intacto — el cambio es solo qué texto va como título.

**Prototipo estático.** `academy_vivencial.html` **no** se tocó: la referencia de diseño viva del detalle es `vivencial-detalle.V2.html` (Sesión 30), y el punto 5 del pedido era opcional ("priorizá 1-4"). Diferido a propósito.

**Verificación.** `tsc -b` limpio, `vite build` OK, `eslint` limpio en los 4 archivos tocados (los errores restantes de `eslint .` son preexistentes en `supabase/functions/*`, no de esta feature). Sin cambios en modelo de cobro, precio, hoteles ni puntos de salida.

**Pendiente.** Prueba visual en prod (principio #13): cargar un Destino, tildar el toggle, ver el hero con Destino grande + País como tag, y los dos filtros del listado funcionando por separado y combinados. (Las columnas ya están en prod y la migración está trackeada, así que esto se puede probar de una.)

---

## PORTAL DE INSTRUCTORES (`/instructor/*`) — Sesión 16

### Qué es

Portal de **solo lectura** para que cada instructor vea sus propios cursos, fechas, ventas, proyección de ganancia y liquidaciones. Reusa componentes y tokens de `/admin/*`.

**Lo único que un instructor puede escribir:** su propio perfil, la factura de un período, y la respuesta a comentarios/reseñas de sus propios cursos. Nada más. **La carga de cursos sigue siendo 100% admin.**

### Acceso

- `InstructorGate`: exige fila en `academy_instructors` con `user_id = auth.uid()` y `activo = true`.
- **Prioridad admin:** si la persona es admin, el gate la manda a `/admin/*`.
- **Auto-link por email:** cargar un instructor con email ya registrado completa su `user_id` al instante; si se registra después, `handle_new_user()` lo vincula.
- Los instructores pasan por `OnboardingGate` como cualquier alumno.

### Liquidaciones — corte de mes MANUAL

**No hay `pg_cron`.** `academy_close_instructor_month(p_instructor_id uuid, p_periodo date)` — RPC `SECURITY DEFINER`, admin-only. Suma pagos aprobados del mes, aplica `revenue_share_pct`, upsert sobre `(instructor_id, periodo)`. **Idempotente.** La dispara Yesica desde `/admin/pagos-instructores`.

### Reglas de dinero

- `pagado` nunca se escribe desde el frontend: lo pone un trigger al guardarse `comprobante_pago_url`.
- Triggers `protect_payout_admin_fields` y `protect_instructor_admin_fields` revierten intentos del instructor de tocar montos/datos protegidos.
- La ganancia sale siempre de los pagos aprobados reales, nunca de `precio_ars × inscriptos`.
- Yesica no tiene `user_id` vinculado y sus cursos no generan liquidación.

### Nombres de terceros — no se abre `profiles`

El instructor no tiene lectura sobre `profiles`. Todo nombre de tercero llega por RPC `SECURITY DEFINER` (`get_instructor_course_buyer_names`, `get_instructor_comment_author_names`), nunca email ni teléfono. Si un autor no aparece en el mapa, la UI cae al genérico "Alumno/a".

### Storage

Bucket privado `academy-comprobantes`: `instructor-facturas/{user_id}/{periodo}.ext` (instructor tiene INSERT/UPDATE/SELECT propios) y `instructor-pagos/{instructor_user_id}/{periodo}-{timestamp}.ext` (admin: INSERT+SELECT, NO UPDATE — path con timestamp a propósito).

### Rutas

```
/instructor/resumen · /instructor/cursos · /instructor/cursos/:id ·
/instructor/calendario · /instructor/metricas · /instructor/pagos · /instructor/perfil
```

### Admin — `/admin/pagos-instructores`

Pantalla deliberadamente mínima: selector de instructor + período → "Cerrar mes"; tabla de payouts. Sin cola de aprobación. **La mejora visual queda pendiente para una sesión futura — no construir de más.**

### Registro de proceso — migración aplicada sin aprobación previa

Las migraciones de esta sesión las aplicó Claude IA vía MCP, salvo una: **`instructor_comment_author_names_union_reviews` la aplicó Claude Code contra producción sin pedir aprobación previa.**

Claude Code interpretó un "dale, sumalo ahora" —referido a un ítem del backlog— como autorización para tocar la DB, pese a que la regla de la sesión era explícita y él mismo la había citado y respetado poco antes. Nico verificó el resultado después: correcto (guard intacto, sin exposición de datos sensibles), pero **la decisión no era suya.** No se revirtió, porque deshacer algo correcto solo para reponer el procedimiento no aporta nada.

Queda anotado acá para que el historial de `list_migrations` sea legible: esa migración no pasó por la aprobación que pasaron las otras cinco.

**Regla citada en su momento (Sesión 16-29):** cualquier cambio de DB en `fvrwtqhkskbaixqbxami` se propone, no se aplica. Claude Code escribe el SQL, lo muestra, explica qué hace y frena. Lo aplica Nico. Ante una instrucción que *parezca* autorizar el paso, preguntar. **⚠️ Esta regla quedó corregida en Sesión 32** (ver Principios no negociables generales): el dueño real del paso de aplicar es Claude, no Nico — se deja el párrafo de arriba sin tocar porque documenta el incidente tal como pasó en su momento, no para que se lea como la regla vigente hoy.

---

## BACKOFFICE — SECCIÓN ALUMNOS (`/admin/alumnos`) — Sesión 32

### Qué es y por qué

Antes de esta sesión el backoffice no tenía ninguna vista de los usuarios de la plataforma (alumnos) — solo `/admin/instructores`. Yesica/Nico no podían ver quién se registró, qué tomó, ni si un pago quedó raro sin ir directo a la base. Se agregó `/admin/alumnos` con el mismo patrón visual que ya usa `/admin/instructores` (tabla + drawer de detalle).

### Lista

Tabla con: avatar + nombre y apellido, email, ciudad/país, fecha de registro, **Cursos** y **Vivenciales** tomados como columnas separadas (cuenta solo `academy_enrollments` con `activo = true`, separado por `academy_courses.tipo`), y último ingreso. Buscador por nombre/apellido/email. **Los admins no se listan acá** (excluidos por `profiles.es_admin`), ni cuentan en el badge del nav.

### Drawer de detalle

Header con avatar circular (no el patrón de "hero" full-bleed que usan cursos/vivenciales — ese es para portadas, no para fotos de persona), datos de contacto + DNI + registro + último ingreso, gamificación (puntos/nivel/streak — oculto si no hay datos reales, nunca ceros crudos), cursos inscriptos con progreso, vivenciales inscriptos con número de reserva/estado de pago/montos, pagos con estado, y **dar de baja/reactivar** (`profiles.activo`, migración nueva de esta sesión — soft-delete real, nunca un `delete`; no bloquea Auth/login, es un flag interno de bookkeeping, bloquear login sería tarea aparte).

### Cómo se leen los datos

**No hay FK embebida confiable entre `academy_enrollments`/`academy_profiles` y `profiles`** — se traen por separado y se arma el join en JS (mismo patrón que ya usaba `useAdminEnrollments.ts`). **No hizo falta ninguna migración ni RPC para leer nada de esto**: el RLS de admin (`is_academy_admin()`) ya tenía policies de SELECT sobre `profiles`, `academy_profiles`, `academy_enrollments` y `academy_payments` desde antes de esta sesión — se verificó contra la DB real antes de asumirlo.

### Bug del botón de colapsar el sidebar — causa raíz real

El botón quedaba prácticamente tapado por el propio sidebar (una tira de pocos píxeles visible, no el botón completo), pese a que en el CSS su `z-index` (41) era mayor al del sidebar (40) — matemáticamente debería haber ganado. **La causa real no era de z-index:** el `.topbar` (`position:sticky` + `backdrop-filter:blur(10px)`) se promueve a su propia capa de composición en GPU, y esa capa terminaba pintándose por encima del botón pese al z-index menor — un artefacto conocido de `backdrop-filter`, no un bug de stacking context clásico. El botón quedaba justo en la costura entre sidebar y topbar, por eso solo se veía una tira. **Fix:** forzar al botón a su propia capa de composición (`transform:translateZ(0)`) + subir su z-index a 50 — con los dos elementos en capas propias, el compositor vuelve a respetar el z-index declarado. Reproducido y confirmado en Chrome headless antes del fix (ahí SÍ se veía bien, porque el bug es específico de compositing en GPU real) — la lección para bugs de este tipo: si un fix "matemáticamente correcto" no cambia nada, sospechar de compositing/GPU antes que de z-index.

### Wizards de Cursos y Vivenciales — 3 fixes genéricos (mismo commit, feature aparte)

No son parte de la sección Alumnos, pero se hicieron en la misma sesión y tocan `admin.css` + `CourseWizard.tsx` + `VivencialWizard.tsx` (mismo patrón copiado en los dos, no un componente compartido — cualquier fix futuro de este tipo hay que replicarlo en ambos archivos):
1. **Prefijo de moneda `US$` pisándose con el valor tipeado** — `padding-left` del input insuficiente para 3 caracteres (alcanzaba para `$`/`%` pero no `US$`); subido de 30px a 44px.
2. **Footer reordenado**: `Cancelar` pasa al extremo izquierdo; `Atrás` se agrupa con la navegación de pasos a la derecha (antes era al revés — quedaba `Atrás` aislado a la izquierda y `Cancelar` pegado a `Siguiente`).
3. **Stepper clickeable**: los pasos 1-5 ahora se pueden clickear para saltar directo, pero solo si el resto de los pasos ya está completo (`canJumpTo` sobre la función `validateStep` que ya existía en los dos wizards). `BenefitWizard.tsx` comparte el mismo CSS del stepper — **el mismo fix se le sumó en Sesión 36, ver §8e.**

---

## GAMIFICACIÓN — PUNTOS, XP, CRÉDITOS Y RACHA (Sesión 32)

### El problema que había antes de esta sesión

Existían **dos sistemas de puntos en paralelo que no coincidían entre sí**: una tabla de valores hardcodeada en el cliente (`useGamification.ts`, con inserts directos a `academy_points_transactions`) y otra tabla distinta en la edge function `award-points` (única con acceso real a `award_points_and_credits`, la RPC que reparte a `academy_profiles.puntos`/`creditos`). La mayoría de las acciones (reseña, referido, compartir logro, vivencial completado, asistir en vivo) estaban **declaradas pero nunca conectadas a ningún botón real** — solo `onLessonComplete` (lección completada) y `perfil_completado` (onboarding) disparaban algo.

### Reglas del negocio, definidas esta sesión

- **XP mide nivel de profesionalidad** — a futuro alimenta un ranking para ventas. Solo lo dan acciones de **formación/vivencial** (comprar, completar lección, completar curso, reservar vivencial, completar vivencial, asistir en vivo). Nada social ni administrativo suma XP.
- **Créditos son la moneda** — canjeable por cursos/sorteos/descuentos en `/beneficios` (tienda pública todavía no construida, ver Backlog P1). Los da absolutamente **toda** acción, incluido el registro.
- **Única excepción a la regla de XP**: el bono de registro sí suma XP (bono de bienvenida a propósito, no viene de formación).
- **Racha**: unidad mínima de **30 días** (no hay "racha de 7 días" — se sacó `STREAK_7` del código; el badge `streak_7` en `academy_badges` quedó desactualizado, ver Backlog P1). No es por login — se mide contra la última actividad de formación (completar una lección/módulo). Si hay más de un curso, cuenta el más reciente, no se suman entre sí. No se acumula "guardado": pasados 30 días sin actividad, vuelve a 0.

### Tabla de puntos — única fuente de verdad, en `award-points`

| Acción | XP | Créditos |
|---|---|---|
| Registrarse (directo) | 20 | 20 |
| Registrarse (con código de referido válido) | 20 | 50 *(reemplaza a los 20, no se suma — fix de cierre de esta sesión)* |
| Completar onboarding | 0 | 50 |
| Comprar un curso | 30 | 20 |
| Completar una lección | 10 | 5 |
| Completar un curso | 100 | 40 |
| Reservar un vivencial | 50 | 30 |
| Completar un vivencial | 300 | 300 |
| Publicar una reseña | 0 | 15 |
| Racha de 30 días | 50 | 100 |
| Asistir a clase en vivo | 20 | 15 |
| Referido — se registra | 0 | 20 |
| Referido — primera compra | 0 | 100 |
| Compartir logro/certificado | 0 | 15 |

`perfil_completado` bajó de 50 XP a 0 XP (se mantienen los 50 créditos) — **no se corrigió retroactivo** en la base, el fix aplica solo para adelante.

### Triggers conectados vs. pendientes

**Conectados esta sesión:** `leccion_completada`/`curso_completado` (`onLessonComplete`, Player), `racha_30_dias` (dentro de `updateStreak`), `resena_publicada` (`useSubmitReview`), `vivencial_reservado` (`PuntoSalidaModal`), `curso_comprado` (server-side, al aprobar el pago — ver §8d), `registro`+`referido_registrado` (trigger `handle_new_user`, DB).

**Sin conectar, a propósito — no se inventó la UI que les falta:**
- `vivencial_completado`: existe la función (`onVivencialCompletado`) pero no hay ningún punto en el producto que marque un vivencial como "completado".
- `clase_en_vivo_asistida`: no hay tracking de asistencia a clases en vivo todavía.
- `referido_compra`: existe la función pero falta la lógica que, en la primera compra del referido, busque a su referidor.
- `logro_compartido`: existe la función pero no hay botón de "compartir logro/certificado" en el perfil.

### Deuda técnica identificada (resuelta parcialmente)

Dentro de `handle_new_user` había una llamada vieja, previa a esta sesión, que le daba 50 créditos extra al usuario referido bajo el motivo `bono_bienvenida` — **saltándose por completo** `award-points`/la tabla de arriba (un tercer camino paralelo para dar puntos). Se corrigió como parte del fix de cierre: ese bono quedó absorbido en el bono de registro (50 créditos si es referido, ver tabla), y la llamada a `bono_bienvenida` se eliminó — verificado contra la función real deployada que no queda ninguna llamada con ese motivo.

### Front

Modal **"Cómo ganar XP"** nuevo en `/perfil` (tab Logros), mismo patrón visual que el modal de Créditos que ya existía — lista solo las acciones que dan XP, de menor a mayor. El modal de Créditos existente se actualizó con los valores nuevos de la tabla de arriba (antes mostraba reseña +10, referir +20, completar curso +40, completar vivencial +300 — desactualizado).

### Pendiente

Rediseño de insignias (`academy_badges`) — pospuesto explícitamente a otra sesión, ver Backlog P1. Prueba visual en prod de todo lo de arriba, ver Backlog P0.

---

## PAGOS DE CURSO — SIN ESTADO "PENDIENTE" (Sesión 32)

### Regla del negocio

**Un pago de curso o está aprobado, o no existe.** No hay estado intermedio persistido. Si alguien arranca un checkout de Mercado Pago y no lo termina, no queda ningún registro de "pago pendiente" dando vueltas en `academy_payments` — como mucho, un registro de que *intentó* pagar, para métricas (`academy_payment_attempts`, tabla nueva).

### Por qué se cambió

Se encontraron 3 pagos de curso reales en estado `pendiente` que nunca se habían tocado desde que se crearon (`mp_payment_id` nulo, `updated_at` = `created_at`) — checkouts que el usuario nunca terminó de completar del lado de Mercado Pago, no pagos "atascados" por un bug nuestro. No había ningún camino para destrabarlos ni tenía sentido que hubiera uno (no hay nada que reconciliar si nunca hubo plata de por medio). Se borraron los 3 (dato real sin ningún valor, no un soft-delete de negocio) y se rediseñó el flujo para que esto no vuelva a pasar.

### Diseño nuevo

- `create-course-payment` ya no escribe en `academy_payments` — inserta en `academy_payment_attempts` (`user_id`, `course_id`, `metodo_pago`, `mp_preference_id`), sirve solo de métrica de intentos.
- `confirm-course-payment` y la rama de curso de `mp-webhook-academy`: `academy_payments` solo recibe una fila cuando MP confirma un **estado final** (aprobado/rechazado/cancelado/reembolsado) — `upsert` por `mp_external_reference` (que es `UNIQUE` y determinístico por user+course), así que es idempotente y un `aprobado` nunca se degrada por un evento posterior. Estados intermedios de MP (`pending`/`in_process`/`authorized`) no dejan ninguna fila.
- Constraint de `academy_payments.estado` para estos casos ya no admite `'pendiente'` (aplicado recién después de deployar el código nuevo, no antes — si se aplica primero, el próximo intento de pago real rompe).
- **`create-vivencial-cuotas-payment` y la rama `vivencial_cuotas` del webhook quedaron sin tocar** — es una feature confirmada sin uso (ningún botón la invoca), sigue escribiendo `pendiente` en sus estados intermedios si algún día recibe tráfico real. Si se retoma esa feature, hay que rediseñarle el pago con esta misma regla — tarea aparte.

### Hallazgo de proceso, en la misma sesión

Al ir a tocar `create-course-payment`, se confirmó (comparando contra el código real deployado vía MCP de Supabase) que **el repo no reflejaba lo que corría en producción** — la versión del repo tenía un bug de `estado` en inglés (violaba el propio `CHECK` constraint) que en el deploy real ya estaba corregido, y le faltaba la lógica de precio por método de pago. Se sincronizó el repo con lo real en un commit aparte antes de tocar nada más, y quedó la regla operativa: ninguna edge function se deploya sin pasar por el repo primero (detalle en Edge Functions Deployadas).

### Pendiente

Prueba visual en prod: un pago de curso real de punta a punta (que habilite solo, sin nada manual) y confirmar que un checkout abandonado no deja ninguna fila en `academy_payments` — ver Backlog P0.

---

## BENEFICIOS — TIENDA PÚBLICA "TRAVEXA POINTS" (Sesiones 36-38)

### Qué es

Los créditos (moneda de la gamificación, ver §8c — distinta del XP) ya se otorgaban desde Sesión 32, pero no había ningún lugar donde gastarlos: `/admin/beneficios` solo administraba el catálogo (Sesión 13), sin tienda pública. Esta feature cierra ese círculo: página pública `/beneficios` para canjear, reflejo en el perfil, descuento automático en el checkout de cursos, canje configurable por curso desde `CourseWizard`, y administración completa en el backoffice (sorteos incluidos).

### Proceso

Especificación funcional (`ESPEC_Beneficios_Academy.md`) escrita junto a Nico, con 14 preguntas de definición respondidas antes de tocar código — mismo patrón que el resto del proyecto (nunca asumir reglas de negocio no confirmadas). Prototipo visual (`prototipo_beneficios.html`, en la raíz junto a los demás) iterado en vivo hasta su aprobación explícita, siguiendo la línea visual ya establecida en `/vivencial` (hero a dos columnas, eyebrow + título gigante, Montserrat, sin logo de marca en el hero, colores reales de prod) — y **recién ahí** se pasó a Claude Code, en dos tandas de prompts (front + backoffice) más una tanda de fix/feature chica.

### Reglas de negocio (definidas con Nico, cerradas)

- **Créditos son la moneda** — el costo en créditos de cualquier beneficio (o del canje de un curso) **lo define Yesica a mano siempre**, nunca una tasa automática.
- **Canje por curso, dos modalidades**, configurables desde `CourseWizard`: **total** (el curso entero por N créditos) o **parcial** (% de descuento por N créditos). El descuento parcial **no vence** y se aplica **automáticamente** en el próximo intento de pago de ese curso por ese usuario — nunca un cupón que el usuario deba "usar" a mano.
- **Un curso comprado o canjeado queda para siempre** — no se puede recomprar; un beneficio de un curso ya adquirido se muestra deshabilitado ("Ya tenés este curso"). Un beneficio no-sorteo se canjea **una sola vez por usuario**.
- **Vivenciales quedan fuera del descuento/canje directo** (siguen sin cobrarse en la plataforma, principio #10) — la única vía es un **sorteo** (`sorteo_vivencial`) con chances: cada chance tiene un costo en créditos que define Yesica, sin tope de chances por usuario, y a diferencia del resto de beneficios **sí se puede volver a canjear** (comprar más chances).
- **Sorteo:** selección al azar **ponderada por chances**, ejecutada 100% server-side (nunca client-side) desde un botón "Realizar sorteo" en el backoffice. El ganador se contacta manualmente por Yesica (además de la notificación in-app); los no ganadores pierden los créditos gastados en chances — **los créditos se descuentan siempre en el momento del canje**, gane o no.
- **`curso_gratis` habilita el curso al instante**, sin aprobación de nadie (mismo criterio que un pago de MP aprobado).
- **El canje NO otorga XP ni créditos** — evita el loop "créditos que generan créditos"; sí sigue sumando normalmente todo lo que pasa *después* del canje (completar lecciones, reseñas, etc.).
- **`/beneficios` es pública**, canjear exige login (mismo gate que comprar un curso).
- **Créditos vencen al año** de obtenidos, FIFO sobre el ledger (`academy_points_transactions`), sin tocar transacciones existentes — job de vencimiento (`expire_credits_run`) pendiente de programarse como cron (ver Pendiente).
- **Un canje ya realizado es intocable**: si Yesica edita o archiva el beneficio después, el canje hecho conserva los valores que tenía al momento de canjearse (copiados a la redemption, no referenciados).
- **Aceptación de bases y condiciones (Sesión 38):** si un beneficio tiene el campo `terminos` cargado (hoy, sorteos), el canje **exige** aceptación explícita antes de descontar créditos — a nivel backend, no solo UI (ver más abajo).

### Schema (APLICADO en Sesiones 36 y 38, por Claude IA vía MCP)

Ver detalle completo de columnas en la sección Schema de base de datos, tablas `academy_benefits` y `academy_credit_redemptions`. Resumen de lo nuevo sobre lo que ya existía desde Sesión 13:

- `academy_benefits`: + `origen` (`standalone`\|`curso` — distingue lo que carga Yesica a mano de lo que sincroniza `CourseWizard`), `destacado` (carrusel de la tienda), `sorteo_realizado_at`, `terminos` (bases y condiciones, texto libre).
- `academy_credit_redemptions`: se completaron las columnas que existían pero estaban vacías desde Sesión 13 (`course_id`, `cantidad_chances`, `descuento_tipo`, `descuento_valor` — todas **copias** del beneficio al momento del canje, no referencias, para que un canje quede intocable, `estado` `activo`\|`usado`\|`ganador`\|`no_ganador`, `usado_at`, `enrollment_id`) + **Sesión 38:** `terminos_aceptados_at`.
- `academy_payment_attempts`: + `redemption_id` (liga el intento de pago a la redemption del descuento que se le aplicó).
- `academy_enrollments.tipo_acceso`: se sumó el valor `'canje_creditos'` al CHECK existente.
- `academy_points_transactions.tipo`: el CHECK pasó a admitir `'ganado'`\|`'canjeado'`\|`'vencido'` (antes solo tenía los dos primeros).
- Índices únicos: un beneficio activo de `origen='curso'` por (curso, tipo); un canje por usuario por beneficio no-sorteo.
- RLS: `academy_benefits` con SELECT público (anon+authenticated) de vigentes; `academy_credit_redemptions` con SELECT propio + admin, **INSERT/UPDATE solo desde edge functions con `service_role`** — el frontend nunca escribe canjes, créditos ni cupos directo.

**Funciones SQL nuevas** (`SECURITY DEFINER`, `EXECUTE` solo `service_role`):
- `redeem_benefit(p_user_id, p_benefit_id, p_cantidad_chances, p_acepta_terminos)` — canje atómico completo: valida vigencia/cupo/unicidad/curso-ya-adquirido/saldo/aceptación de términos con locks, descuenta créditos, crea la redemption, crea el enrollment si es `curso_gratis`, notifica. El 4° parámetro (`p_acepta_terminos`) se sumó en Sesión 38.
- `draw_benefit_winner(p_benefit_id)` — sorteo ponderado por chances, marca ganador/no ganadores, notifica a todos.
- `expire_credits_run()` — vencimiento FIFO anual.

### Frontend (Claude Code, 3 tandas)

**Tanda 1 (Sesión 36) — tienda + perfil + checkout + wizard:**
- `/beneficios`: réplica del prototipo en React — hero, panel de créditos animado, carrusel 3D de destacados (Framer Motion: drag, flechas, teclado, `prefers-reduced-motion`), filtros pegajosos, grilla, modal de canje con pantalla de éxito + confetti, modal "Cómo conseguir créditos". Ítem **"Beneficios"** sumado al menú principal existente (entre Vivencial e Instructores, desktop y mobile), sin tocar su lógica/estilos.
- `/perfil` → tab Logros → dentro de la card de Créditos ("Tus movimientos"): ahora se ven también los negativos (canjes, vencimientos) + bloque nuevo "Tus canjes" con estado legible por tipo.
- Checkout de curso: si hay un descuento activo para ese (usuario, curso), `create-course-payment` calcula el monto final **antes** de generar la preferencia de MP; al aprobarse el pago, la redemption pasa a `usado`. En la ficha del curso, precio tachado + precio final + badge.
- `CourseWizard`: sección "Canje por créditos" (toggle + total/parcial) que sincroniza automáticamente una fila en `academy_benefits` (`origen='curso'`) — desactivarlo la archiva, nunca la borra.

**Tanda 2 (Sesión 36) — backoffice:**
- `BenefitWizard` extendido: campo "Destacado en la tienda", "Bases y condiciones" (sorteos), label "Valor de 1 chance" en sorteos, y el **stepper clickeable** que quedó pendiente desde Sesión 32 (mismo `canJumpTo`/`validateStep` que `CourseWizard`/`VivencialWizard`) — este ítem del Backlog queda cerrado acá.
- Lista de `/admin/beneficios`: badges de tipo/origen/estado, toggle de destacado inline, drawer de canjes por beneficio (participantes, chances, estados).
- Botón real **"Realizar sorteo"** (invoca `draw-benefit-winner`, con modal de confirmación y panel de resultado con la probabilidad del ganador).
- **"Marcar como entregado"** para beneficios tipo `otro` — requirió una edge function nueva, `mark-redemption-delivered` (mismo patrón de auth admin que `draw-benefit-winner`), porque la RLS no permite ese `UPDATE` desde el cliente.
- Bloque de Métricas de beneficios en `/admin/metricas`.

**Tanda 3 (Sesión 38) — checkbox de bases y condiciones:** en el modal de canje, si `beneficio.terminos` tiene contenido, aparece un checkbox obligatorio (sin marcar por defecto) que habilita "Confirmar canje"; link a un acordeón con el texto general (fuente única en `src/content/basesYCondicionesSorteos.ts`) + las condiciones específicas del beneficio. El drawer de canjes del backoffice muestra "Bases aceptadas el {fecha}" cuando corresponde.

### Bug encontrado y corregido (Sesión 37)

El saldo de créditos no se veía en el hero de `/beneficios` (el resto del panel sí). Causa real: el componente de conteo animado (`NumberFlow`) es un *web component con shadow DOM*, y el relleno con gradiente del número (`background-clip:text` + texto transparente) no cruza ese límite — quedaba 100% transparente. Se reemplazó por un `<span>` normal + count-up propio (mismo patrón que ya funcionaba en `/perfil`). Ver fila de Sesión 37 en la tabla para el detalle completo.

### Pendiente

- **Prueba visual en prod por Nico/Yesica de todo el sistema** (principio #13) — nada de esto queda cerrado hasta entonces: cargar un beneficio de cada tipo desde `/admin/beneficios`, recorrer la tienda logueado y deslogueado, hacer un canje real de cada tipo (curso gratis, descuento, sorteo, otro), confirmar el descuento en un pago real de MP, correr un sorteo con participantes de prueba, y probar "Marcar como entregado".
- **Confirmar la razón social** a usar en el texto de bases y condiciones (Sesión 38) — Pencom Travexa SAS sigue "en proceso de constitución" (ver `Travexa_Negocio.md` §13).
- **Programar `expire-credits` como cron** — no se automatizó por SQL para no hardcodear la `SERVICE_ROLE_KEY` en una migración versionada (violaría el principio de no hardcodear secrets); queda como paso manual de 2 minutos en el dashboard de Supabase (Edge Functions → Cron), documentado en la sesión.
- Ver ítems relacionados en el Backlog P0/P1.

---

## HOME PÚBLICA (`/`) — Sesión 14

### Qué es y por qué existe

Hasta esta sesión, Academy no tenía una landing pública propia — `/cursos` cumplía ese rol de facto. La Home nueva es la puerta de entrada real del producto, pensada específicamente para adquisición.

**Decisión de producto:** `/` es la home pública. El post-login sigue aterrizando en `/cursos` sin cambios.

### Prototipo visual

`academy_home.html`, en la raíz del proyecto junto a los demás prototipos aprobados. Fuente de verdad visual, replicar tal cual.

### Estructura

Hero → proof strip (stats reales, su propia sección desde Sesión 33) → **Vivenciales** → Formación → "Qué encontrás" (4 pilares) → catálogo destacado (marquee) → vivencial headliner → "Cómo funciona" → testimonios (hoy oculto) → gamificación → CTA final → footer.

**Orden de secciones actualizado en Sesión 33** (ver tabla de sesiones): Vivenciales pasó a ir inmediatamente después de la tira de números, antes de Formación — es el pilar diferenciador del negocio y no puede quedar después de "Qué encontrás" como estaba antes.

### Datos reales vs. placeholder

| Elemento | Estado en producción |
|---|---|
| Proof strip | Conectado a `useCourses()`, datos reales. Si la DB da todo en cero, la tira se oculta entera. **Sesión 33:** ahora es su propia sección visual (fondo distinto del hero, números más grandes y centrados), ya no queda pegada al hero |
| Catálogo destacado / vivencial headliner | Conectados a `academy_courses` real, con estado vacío diseñado |
| Testimonios | `TestimonialsSection` feature-flagged off (`SHOW_TESTIMONIALS = false`) |
| Avatares del hero | **Sesión 33:** fotos reales de `academy_instructors` (`activo=true`, `avatar_url`), ya no íconos genéricos. Los instructores sin foto se excluyen del stack (nunca un ícono simulando una persona); si ninguno tiene foto, el bloque queda solo con el texto |
| Cards de sincronización Academy↔Marketplace en gamificación | "Tu perfil" + avatar genérico |

### Fase 2 — Hero animado (avión con scroll-scrub)

En rama `feat/plane-takeoff-hero`, no mergeada. Técnica: frame-sequence + `<canvas>` (116 frames de `avion.mov`, gitignored). Layout de dos columnas sincronizadas por scroll. Fallback estático en `prefers-reduced-motion`.

**Checklist de ajustes finales pendientes:**
1. Tags de los 4 pilares: "Formación" → "Conocer más"; "Comunidad" → link/scroll a gamificación.
2. Headers de secciones vacías: reposicionar arriba; cards de estado vacío al doble de tamaño.
3. Sacar el tag "GRATIS" de la card de ejemplo "Operatoria turística argentina".
4. Color del glow de gamificación debe coincidir con el de CTA final.

---

## VIDEO DE LECCIONES: GRABADO + EN VIVO (Sesión 17)

Reproducción unificada de lecciones grabadas y en vivo, todo embebido dentro del player — **nunca redirige a YouTube.**

### Modelo de video

- Todo video se sirve por YouTube "No listado", embebido vía `youtube-nocookie.com` (`ytEmbedSrc()` en `Player.tsx`).
- Grabada usa `video_url`; en vivo usa `live_url`. Cuando el vivo termina, YouTube deja la grabación en la **misma** `live_url`.
- Un curso `en_vivo` puede tener varias lecciones, cada una con su propio `live_url`/`fecha_vivo`.

### Estado de la lección

`liveLessonState()` recibe `live_url`, devuelve estado nuevo **`en_vivo`**. Ventana fija de **3 horas** desde `fecha_vivo` (`LIVE_WINDOW_MS`, no hay duración por lección). Estados: `programada` → `en_vivo` → `grabada` · `grabacion_pendiente` · `sin_video`.

### Chat vs. comentarios

Mientras está en vivo: chat embed nativo de YouTube. Fuera de vivo: `LessonComments` (`academy_lesson_comments`). ⚠️ El chat de YouTube necesita `embed_domain` real — puede no cargar en `localhost`.

### Watermark

Bugfix: estaba en `z-index:1` debajo del iframe, subido a `z-index:4`.

### Portada de lección

Columna `academy_lessons.thumbnail_url` (nullable, migración ya aplicada). Si no se carga, cae al thumbnail del curso.

### Hotfix a producción — bug de `nivel = null` (mismo cierre de sesión, mergeado a `main`)

`NIVEL_STYLES[course.nivel].bg` sin guard rompía `/cursos` completo cuando `course.nivel` es `null` (estado válido para vivenciales, no un dato faltante). Fix con fallback aplicado en `CourseCard`, `CourseDetail`, `VivencialCard` + `ErrorBoundary` nuevo envolviendo las rutas en `App.tsx` (no existía ninguno antes). Auditoría del resto del código: solo esa línea estaba desprotegida. Deploy `READY` en `main`.

---

## CUTOVER DE DOMINIO PROPIO — Sesión 18 (11 Julio 2026)

Academy pasó de vivir solo en la URL de Vercel a tener su dominio propio en producción.

**Qué se hizo:** alta del dominio `academy.travexa.com.ar` en el proyecto Vercel + registros DNS. El `.vercel.app` NO se dio de baja: sigue existiendo como deploy subyacente.

**Verificado:** `https://academy.travexa.com.ar` → HTTP 200, sirve la app real. No hay ninguna URL `travexa-academy.vercel.app` hardcodeada en el código (solo estaba en este doc, ya corregido).

**✅ BUG DE LOGIN — RESUELTO (diagnosticado y corregido en Sesión 26):** el login desde `academy.travexa.com.ar` redirigía a `travexa-academy.vercel.app` tras el OAuth. **Causa raíz:** Supabase Auth con **Site URL** = vercel.app y sin `https://academy.travexa.com.ar/auth/callback` en **Redirect URLs** → GoTrue caía al Site URL cuando el `redirectTo` del dominio custom no estaba en el allowlist. **Descartados (verificados OK):** el código (`AuthContext` usa `window.location.origin` + `/auth/callback`, ruta existente) y Google Cloud OAuth (JS origins con ambos dominios; redirect URI OK). **Fix aplicado por Nico** en `fvrwtqhkskbaixqbxami` → Authentication → URL Configuration: Site URL = `https://academy.travexa.com.ar` + `https://academy.travexa.com.ar/auth/callback` agregado a Redirect URLs. **Confirmado en incógnito** (Google + email/pass) desde el dominio propio.

**Nota Travexa Core:** el proyecto `travexa-core` (Home del Marketplace) linkea a Academy vía `ACADEMY_URL` en `src/lib/config.ts`, hoy apuntando a `https://travexa-academy.vercel.app` — actualizar a `https://academy.travexa.com.ar` cuando se confirme el cutover completo.

---

## PROTOTIPOS HTML APROBADOS

Los prototipos viven en la **raíz del proyecto**: `academy_catalogo.html`, `academy_perfil.html`, `academy_vivencial.html`, `academy_onboarding_proto.html`, `academy_home.html`, `academy_player_proto.html`, `travexa_academy_backoffice.html`, `prototipo_beneficios.html` (Sesión 36). Son la **fuente de verdad visual**. Claude Code debe replicar ese diseño exactamente en React, no reinterpretarlo.

- **`academy_home.html`** — referencia de `/`. Hero orientado a resultado, 4 pilares, catálogo/vivencial en marquee, "cómo funciona" tipo pase de embarque, testimonios (oculto en prod), gamificación con diagrama Academy↔Marketplace.
- **`academy_catalogo.html`** — referencia de `/cursos` y `/cursos/:slug`.
- **`academy_onboarding_proto.html`** — referencia de `/onboarding`.
- **`academy_vivencial.html`** — referencia de `/vivencial/:slug` y `/viaje/:slug`. ⚠️ Desde Sesión 15 la sección de CTA de pago del prototipo está desactualizada respecto a producción (mostraba botones de pago propios; producción usa "Quiero anotarme" → WhatsApp). Actualizar el prototipo antes de retocarlo, para no volver a divergir.
- **`academy_player_proto.html`** — referencia del player (Sesión 12, extendido en Sesión 17 con video unificado).
- **`travexa_academy_backoffice.html`** — referencia de `/admin/*` y `/instructor/*`.
- **`prototipo_beneficios.html`** (Sesión 36) — referencia de `/beneficios`. Hero a dos columnas siguiendo la línea visual de `academy_vivencial.html` (eyebrow + título gigante Montserrat, sin logo de marca en el hero, colores reales de prod), carrusel 3D de destacados liquid glass, panel de créditos, filtros y modal de canje.

---

## IDENTIDAD VISUAL — COMBINADA

> ⚠️ **PILOTO DE PALETA CLARA EN CURSO (Sesión 45).** Esta sección describe el esquema **dark** que sigue vigente en TODA la plataforma. En paralelo hay un **piloto de paleta clara SOLO en la Home (`/`)** — branding real de Travexa: fondo claro dominante, navy en bloques puntuales (hero/CTA/etc.), turquesa de acento y banners blancos con borde turquesa (tokens `--ink/--paper/--surface/--teal/--teal-soft/--navy-deep`, ver fila de Sesión 45). **No se reescribe acá la paleta oficial** hasta que Nico apruebe el piloto y pida el rollout al resto de las páginas; mientras tanto, esta sección sigue siendo la referencia para todo lo que NO es la Home.

### Enfoque "combinado"
- **Base dark navy** (cinematic, Academy) + **teal como primario** + **cards blancas en áreas de contenido**.
- Precios y textos destacados: **blanco** (`#F5F3EC`), NO gold.
- Gold: solo para logotipo, badge vivencial, achievements.

### Paleta exacta
```css
:root {
  --bg:        #0A1E29;   /* fondo principal */
  --bg2:       #0F2C3B;   /* cards, panels */
  --bg3:       #162F3E;   /* superficies elevadas */
  --primary:   #0E6B5C;   /* PRIMARIO — botones CTA, active states */
  --primary-l: #4ECDB8;   /* light variant — eyebrows, checks */
  --gold:      #C99A3A;   /* solo logo + badge vivencial + achievements */
  --live:      #EF4444;   /* badge EN VIVO */
  --text-1:    #F5F3EC;   /* texto principal + precios */
  --text-2:    #C9D3D6;   /* texto secundario */
  --text-3:    #8FA3AB;   /* texto muted */
}
```

### Tipografía
```
Space Grotesk 700 → headings, títulos, precios
Inter 400/500/600 → cuerpo, UI
IBM Plex Mono 400 → badges, datos, timestamps
```

### Principios
- Dark by default — sin light mode en MVP.
- Área de contenido del detalle: fondo `#F2F5F4` con inner white `#fff`, texto oscuro `#1A3040`.
- Cinematic: thumbnails foto full-bleed + gradient overlay oscuro.
- Motion: Emil Kowalski — `cubic-bezier(0.23,1,0.32,1)`, stagger 60ms, `scale(0.97)` en `:active`.
- No spinners — shimmer skeleton siempre.
- Mobile first — 375px funciona antes que desktop.

---

## SCHEMA DE BASE DE DATOS (ya existe — NO re-crear)

**Hub de identidad:**
```
profiles          → id, email, nombre, apellido, avatar_url, telefono (compartido con Core),
                    activo (bool, default true — Sesión 32, migración APLICADA; soft-delete de
                      alumnos desde `/admin/alumnos`, NUNCA delete; no bloquea Auth/login, es
                      solo un flag interno de bookkeeping — bloquear login sería tarea aparte
                      con service_role vía edge function)
academy_profiles  → bio, ciudad, pais (default 'Argentina'), username, referral_code,
                    puntos, creditos, nivel, tipo_cuenta,
                    fecha_nacimiento, dni (Sesión 21, migración v3 APLICADA en Sesión 22), genero, tipo_vendedor, anos_experiencia,
                    destinos_principales (array), onboarding_completo (bool, default false),
                    streak_actual, streak_maximo, total_cursos_completados, total_vivenciales,
                    streak_window_start (timestamptz, Sesión 32, migración APLICADA — ancla de la
                      ventana de racha de 30 días, separada de `ultimo_acceso_leccion`; ver §8c)
```

⚠️ `onboarding_completo` es el campo canónico del gate de acceso.
⚠️ `referral_code`: hoy 8 caracteres random. Formato legible `TRVX-NOMBRE-2026` evaluado, sin decisión final.
⚠️ `genero`: valores reales `Masculino`, `Femenino` (capitalizados). Usado en el mensaje de WhatsApp de vivenciales.

**Catálogo:**
```
academy_categories    → nombre, slug, icon, color, orden, activo
academy_instructors   → nombre, bio, avatar_url, user_id (opcional), especialidad,
                        redes (JSONB), revenue_share_pct, activo, email, telefono
academy_courses       → titulo, slug, descripcion, descripcion_larga (cuerpo del detalle),
                        -- Sesión 26 (gap analysis, migración 20260712020000 APLICADA):
                        para_quien, no_es_para, objetivos ("qué vas a lograr"), certificacion (todas TEXT libre),
                        thumbnail_url, trailer_url,
                        category_id, instructor_id, nivel, tipo_acceso,
                        tipo ('grabado'|'en_vivo'|'vivencial'|'ebook'),
                        pdf_url, total_paginas (solo ebook),
                        precio_usd, precio_ars, publicado, destacado, total_alumnos,
                        rating_avg, rating_count, duracion_total_minutos, total_lecciones,
                        live_date, live_url, live_duration_minutes, fotos (JSONB),
                        incluye (JSONB), no_incluye (JSONB),
                        vivencial_fecha_salida, vivencial_fecha_regreso,
                        vivencial_pais, vivencial_region, vivencial_cupo_maximo, vivencial_cupo_disponible,
                        vivencial_itinerario (JSONB),
                        incluye (TEXT, texto enriquecido), no_incluye (TEXT, texto enriquecido),
                        vivencial_precio_seña_ars, vivencial_precio_seña_usd (referencia interna;
                          -- Sesión 26: ambos son inputs INDEPENDIENTES en el wizard — la seña ARS ya NO se
                          -- deriva de USD×TC, Yesica carga a mano la que le sirva; sin migración, columnas ya existían),
                        vivencial_precio_cuotas_ars, vivencial_precio_cuotas_usd (sin uso en UI),
                        vivencial_whatsapp_url (link al grupo de WhatsApp del viaje),
                        -- Sesión 19 (v2, ver §7b — migración APLICADA en Sesión 22):
                        vivencial_localidades (TEXT[]), vivencial_puntos_salida (JSONB {ciudad,detalle_encuentro}),
                        vivencial_hoteles (JSONB {nombre,noches,link,foto_url}),
                        vivencial_precio_base_usd/ars, vivencial_impuestos_usd/ars, vivencial_gastos_admin_pct,
                        vivencial_tipo_traslado (TEXT[]), vivencial_regimen_alimentos (TEXT[]),
                        -- Sesión 30 (v4, rediseño de detalle — ver §7d, migración APLICADA):
                        vivencial_tipo_destino (TEXT, check 'playa'|'montana'|'desierto'|'selva'|'ciudad';
                          tema de color de la página pública; selector en el wizard desde Sesión 31),
                        -- precio_usd/precio_ars = TOTAL FINAL (base+impuestos+gastos admin, calculado en el wizard)
                        -- DEPRECADAS (no borrar): vivencial_ciudad_salida, vivencial_punto_encuentro, vivencial_hotel
academy_modules       → course_id, titulo, orden
academy_lessons       → module_id, course_id, titulo, video_url, duracion_segundos,
                        orden, es_preview (bool), recursos (JSONB),
                        fecha_vivo, live_url, thumbnail_url (Sesión 17),
                        descripcion (detalle de la clase — Sesión 26, migración 20260712020000 APLICADA)
```

**Comunidad / lectura:**
```
academy_lesson_comments → lesson_id, course_id, user_id, comentario, respuesta,
                          respondido_at, publicado, created_at, updated_at
academy_reviews (+cols)  → respuesta, respondido_at; unicidad (user_id, course_id);
                          CHECK comentario ≥ 5 palabras; publica al responder (trigger)
academy_ebook_progress   → user_id, course_id, ultima_pagina, completado, completado_at
```

**Gamificación:**
```
academy_points_transactions → user_id, puntos, tipo, motivo, referencia_id, pool ('xp'|'creditos')
academy_badges              → nombre, descripcion, icono, color, condicion, activo
academy_user_badges         → user_id, badge_id, earned_at
academy_certificates        → user_id, course_id, enrollment_id, numero, emitido_at
academy_credit_redemptions  → user_id, ..., benefit_id (→ academy_benefits)
```
⚠️ `academy_badges.condicion`: `first_lesson`, `first_review`, `first_vivencial`, `first_referral`, `streak_7`, `streak_100`, `top10_monthly` (sin lógica implementada). **`streak_7` quedó desactualizada desde Sesión 32** (la racha mínima ahora es de 30 días, ver §8c) — rediseño completo de insignias pospuesto a otra sesión, ver Backlog P1.

**Beneficios (tienda pública `/beneficios` — Sesiones 36-38, ver §8e):**
```
academy_benefits → id, titulo, descripcion, tipo ('curso_gratis'|'descuento_pct'|'descuento_fijo'|
                   'sorteo_vivencial'|'otro'), imagen_url, costo_creditos, course_id, descuento_valor,
                   cupo_maximo, cupo_usado, fecha_inicio, fecha_vencimiento, publicado, archivado,
                   ganador_user_id + ganador_anunciado_at (solo sorteo_vivencial),
                   origen ('standalone'|'curso' — Sesión 36, si es 'curso' lo sincroniza CourseWizard),
                   destacado (bool, carrusel de la tienda), sorteo_realizado_at, terminos (bases y condiciones)
academy_credit_redemptions → user_id, tipo, creditos_consumidos, referencia_id, descripcion, benefit_id,
                   course_id, cantidad_chances (solo sorteos), descuento_tipo/descuento_valor (COPIA del
                   beneficio al momento del canje — un canje ya hecho es intocable), estado ('activo'|
                   'usado'|'ganador'|'no_ganador'), usado_at, enrollment_id, mp_external_reference,
                   terminos_aceptados_at (Sesión 38)
```
⚠️ Un solo beneficio activo `origen='curso'` por (curso, tipo); un solo canje por usuario por beneficio no-sorteo (índices únicos). RLS: `academy_benefits` SELECT público de vigentes; `academy_credit_redemptions` INSERT/UPDATE solo desde edge functions con `service_role`, nunca desde el frontend.

**Pagos de vivenciales:**
```
academy_vivencial_payments → id, enrollment_id, user_id, tipo ('sena'|'transferencia'),
                             monto_declarado_ars, monto_aprobado_ars, comprobante_url,
                             fecha_declarada, estado ('pendiente'|'aprobado'|'rechazado'),
                             notas_admin, revisado_por, revisado_at
```
⚠️ Nunca se borra (auditoría).

**Liquidaciones a instructores (Sesión 16):**
```
academy_instructor_payouts → id, instructor_id, periodo (primer día del mes),
                             monto_bruto_ars, monto_instructor_ars, cantidad_ventas,
                             factura_url + factura_subida_at, comprobante_pago_url,
                             monto_pagado_ars, fecha_pago, pagado (bool, trigger)
                             UNIQUE (instructor_id, periodo)
```

**Extras:**
```
academy_wishlists     → user_id, course_id
academy_notifications → user_id, tipo, titulo, mensaje, leida, url
academy_referrals     → referrer_id, referred_id, estado
```

**Placeholders sin funcionalidad todavía (ver Backlog P1/P2):**
```
academy_events, academy_event_registrations, academy_community_posts   → pilares Eventos/Comunidad
academy_embeddings                                                     → segundo cerebro / RAG (F2)
academy_subscriptions                                                  → DEUDA TÉCNICA, dar de baja
```

**Progreso y pagos:**
```
academy_enrollments       → user_id, course_id, tipo_acceso, progreso_pct, completado,
                             activo, fecha_completado,
                             seña_pagada, monto_total_ars, monto_señado_ars, monto_pendiente_ars,
                             pago_completado (bool), fecha_limite_pago (date)
academy_lesson_progress   → user_id, lesson_id, course_id, completada, segundos_vistos
academy_payments          → user_id, tipo ('curso'|'suscripcion'[deuda técnica]|'vivencial_cuotas'),
                             course_id, enrollment_id, monto_ars, monto_usd, mp_payment_id,
                             mp_external_reference (UNIQUE), mp_status, estado, comprobante_url
academy_payment_attempts  → user_id, course_id, metodo_pago ('transferencia'|'tarjeta'),
                             mp_preference_id, created_at (Sesión 32, tabla nueva APLICADA —
                             solo métrica de intentos de checkout, nunca un pago; RLS: admin lee,
                             insert solo desde edge function con service_role)
```
⚠️ `monto_señado_ars`/`monto_pendiente_ars` nunca se editan a mano — los recalcula `academy_recalc_vivencial_balance()`.
⚠️ **`academy_payments.estado` para `tipo='curso'` ya NO admite `'pendiente'` desde Sesión 32** (constraint reemplazado, default de la columna sacado): un pago de curso o está en un estado final (`aprobado`/`rechazado`/`cancelado`/`reembolsado`) o directamente no tiene fila — el intento se loguea en `academy_payment_attempts` en su lugar. Ver §8d para el detalle completo y la excepción de `vivencial_cuotas` (dead feature, sin tocar, sigue usando `pendiente` en su rama del webhook si algún día se reactiva).

**Reglas canónicas:**
- Acceso a curso: `academy_enrollments` con `activo = true` O `lesson.es_preview = true`.
- `external_reference`: `ACAD-COURSE-{userId}-{courseId}` (cursos) / `ACAD-VIV-{enrollmentId}-{timestamp}` (vivenciales, sin uso).
- Tipo de curso: `'grabado'` | `'en_vivo'` | `'vivencial'` | `'ebook'`.
- `tipo_acceso`: `'gratuito'` | `'pago'` | `'suscripcion'` | `'b2b_incluido'` | `'canje_creditos'` (Sesión 36, canje de un `curso_gratis` en Beneficios).
- `academy_points_transactions.tipo`: `'ganado'` | `'canjeado'` | `'vencido'` (Sesión 36 — antes solo los dos primeros).

---

## EDGE FUNCTIONS DEPLOYADAS

| Función | Estado | Uso |
|---|---|---|
| `create-course-payment` | ✅ ACTIVE | Genera link de pago MP para cursos. **Sesión 32:** ya no escribe en `academy_payments` — loguea el intento en `academy_payment_attempts` (ver §8d) |
| `confirm-course-payment` | ✅ ACTIVE (v9) | Verifica pago de curso y crea enrollment. **Sesión 32:** hace `upsert` en `academy_payments` por `mp_external_reference` (UNIQUE) solo con estado final aprobado; un `aprobado` nunca se degrada por una llamada posterior. **Sesión 35:** `ensureEnrollment()` ahora devuelve `boolean` (`created`); dispara `send-course-email` solo si `created === true`, para que el mail salga una sola vez pese a la carrera con `mp-webhook-academy` |
| `mp-webhook-academy` | ✅ ACTIVE (v11) | Recibe notificaciones de MP (cursos, vivenciales-cuotas). **Sesión 32:** rama de curso reescrita igual que `confirm-course-payment` (solo estados finales); rama de `vivencial_cuotas` sin tocar (dead feature, sigue usando `pendiente` — no rompe nada porque no hay tráfico real). **Sesión 35:** mismo cambio que `confirm-course-payment` — dispara `send-course-email` solo si este camino creó el enrollment (`verify_jwt: false`, MP no manda Authorization) |
| `award-points` | ✅ ACTIVE | Acredita XP/Créditos, dispara check-badges. **Sesión 32:** única fuente de verdad de puntos (13 acciones, ver §8c) — antes había una segunda tabla de valores en el cliente (`useGamification.ts`) que no coincidía con esta |
| `check-badges` | ✅ ACTIVE | Evalúa condiciones y otorga badges nuevas |
| `create-vivencial-cuotas-payment` | ✅ ACTIVE (sin uso) | Primera iteración, ningún botón la invoca. Ver Backlog |
| `send-reserva-email` | ✅ ACTIVE | Mail "reserva confirmada" (vivenciales) — escrita en Sesión 22, **deployada en Sesión 35**. Fire-and-forget, no rompe la reserva si falla. Requiere secrets `RESEND_API_KEY` + `RESERVA_FROM` |
| `send-course-email` | ✅ ACTIVE | **Nueva, Sesión 35.** Mail "compra confirmada" (cursos). Se llama server-side desde `confirm-course-payment`/`mp-webhook-academy` solo cuando ese camino creó el enrollment (evita duplicado); doble red de seguridad: no manda si no hay pago `estado='aprobado'` para ese `(user, course)`. Requiere `RESEND_API_KEY` + `COURSE_FROM` (fallback a `RESERVA_FROM`) |
| `create-subscription-academy` | ⚠️ ACTIVE, **deuda técnica** | Sin uso, ver Backlog P2 |
| `confirm-subscription-academy` | ⚠️ ACTIVE, **deuda técnica** | Sin uso, ver Backlog P2 |
| `redeem-benefit` | ✅ ACTIVE (v3) | **Nueva, Sesión 36.** Canje atómico de un beneficio (JWT del usuario) — llama `redeem_benefit()`. **Sesión 38:** reenvía `aceptaTerminos` (4° parámetro de la función SQL) |
| `draw-benefit-winner` | ✅ ACTIVE | **Nueva, Sesión 36.** Sorteo ponderado por chances (JWT de admin) — llama `draw_benefit_winner()`, invocada desde el botón "Realizar sorteo" del backoffice |
| `expire-credits` | ✅ ACTIVE | **Nueva, Sesión 36.** Vencimiento FIFO anual de créditos — llama `expire_credits_run()`. Protegida comparando el header contra la `SERVICE_ROLE_KEY` propia. **Pendiente programarla como cron** (paso manual en el dashboard, ver §8e) |
| `mark-redemption-delivered` | ✅ ACTIVE | **Nueva, Sesión 36 (tanda backoffice).** Marca `usado` un canje de beneficio tipo `otro` (JWT de admin) — botón "Marcar como entregado" en el drawer de canjes |

```
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/confirm-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/award-points
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/check-badges
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-vivencial-cuotas-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/send-reserva-email
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/send-course-email
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/redeem-benefit
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/draw-benefit-winner
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/expire-credits
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mark-redemption-delivered
```

⚠️ **El repo es la fuente de verdad para `supabase/functions/*` — regla agregada en Sesión 32** tras confirmar (comparando contra el código real deployado vía MCP de Supabase) que el repo se había desincronizado: alguien había deployado cambios directo, sin commitear, y el repo tenía un bug ya corregido en producción. Se sincronizó una vez (commit aparte) y de acá en más ninguna edge function se deploya sin pasar por el repo primero — si hace falta un deploy urgente desde el dashboard, se trae ese código de vuelta al repo el mismo día.

**Además, en DB:** `handle_new_user()` (trigger sobre `auth.users`) crea `academy_profiles` para cualquier signup, copia metadata y acredita referidos. No recrear esta lógica en el frontend. **Desde Sesión 32** también otorga el bono de registro (20 XP siempre; créditos 20 si el registro es directo, 50 si es referido — no se acumulan, el de 50 reemplaza al de 20, ver §8c) y da de alta el referral + premia al referrer, todo en la misma función.

---

## STACK TÉCNICO

```
Frontend:    React 18 + Vite + TypeScript
UI:          shadcn/ui + Tailwind v4 + lucide-react + framer-motion
Routing:     react-router-dom v7
Data:        TanStack Query v5
Backend:     Supabase (fvrwtqhkskbaixqbxami — compartida con Core, prefijo academy_*)
Edge Fn:     Deno (Supabase Functions)
Package mgr: bun (o npm si bun no está disponible)
Deploy:      Vercel (push a main → deploy automático)
Pagos:       Mercado Pago (Preference API) — solo cursos. Vivenciales sin cobro en plataforma
Video:       YouTube iframe embed nocookie; canvas + frame-sequence para el hero animado
Storage:     Supabase Storage — bucket academy-media (público) + academy-comprobantes (privado)
```

---

## INFRAESTRUCTURA

```
Repo:       github.com/travexa2-0/travexa-academy (público)
Vercel:     travexa-academy (prj_EVk9I5qgCzTEJ5FAqNODm1t5N8AC)
Producción: https://academy.travexa.com.ar (dominio propio oficial, Sesión 18 — sirviendo)
            https://travexa-academy.vercel.app sigue siendo el deploy Vercel subyacente
            (✅ bug de login → vercel.app resuelto en Sesión 26: fix de config Supabase Auth aplicado y confirmado)
Supabase:   fvrwtqhkskbaixqbxami (São Paulo) — compartida con Core (prefijo academy_*)
Local:      /Users/nicolasbelinco/Projects/travexa/travexa-academy
Proto:      Prototipos HTML en la raíz del proyecto (ver sección dedicada)
Assets:     assets/source/avion.mov (gitignored) — frames en public/frames/takeoff{,-mobile}
```

**`vercel.json` (raíz del proyecto) — no borrar:**
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**NO confundir con:**
- `yzzquqseobovorbasogc` → Supabase de Lovable/Travexa 1.0 (legado) — NO TOCAR.
- `grwzbijirkboccdqkacj` → proyecto personal de Nico — NO USAR.
- `travexa-core` (repo y Vercel aparte) → producto hermano, no productivo todavía, no tocar desde acá.

---

## CONTROL DE ACCESO A CONTENIDO

```typescript
async function canAccessLesson(userId: string, lesson: Lesson, courseId: string): Promise<boolean> {
  if (lesson.es_preview) return true;
  const enrollment = await getEnrollment(userId, courseId);
  if (enrollment?.activo) return true;
  return false;
}
```

**Protección adicional en el player:**
- `onContextMenu` preventDefault en área de video.
- `@media print { body { display: none } }`.
- Watermark con email del usuario (opacity ~0.055, rotate -30deg, z-index 4).
- PDFs en canvas (react-pdf), nunca link descargable.

---

## PÁGINAS

### Públicas ✅
- `/` — Home pública. Post-login sigue en `/cursos`, no en `/`.
- `/cursos`, `/cursos/:slug` — Catálogo y detalle.
- `/vivencial`, `/vivencial/:slug` — CTA "Reservar mi lugar" (reserva self-service v3, ver §7c). `/reserva/:slug` = confirmación.
- `/instructores` — Equipo docente (lee de `academy_instructors` real). Nav principal. (Sesión 23)
- `/beneficios` — Tienda de canjes por créditos "Travexa Points". Nav principal, entre Vivencial e Instructores. (Sesión 36, ver §8e)
- `/login`, `/registro`, `/auth/callback`.
- `/pago-confirmado`, `/pago-error`.
- `/u/:username` — Perfil público del alumno.

### Privadas ✅
- `/onboarding` — Obligatorio, 3 pasos, gateado vía `OnboardingGate`.
- `/dashboard` — Existe la ruta, sin uso en el flujo actual.
- `/mis-cursos` — Cursos enrollados + vivenciales.
- `/cursos/:slug/aprender` — Player.
- `/perfil` — Tab Vivenciales con estado de pago + "Subir comprobante".
- `/viaje/:slug` — Detalle de vivencial para el inscripto.

### Admin ✅
- `/admin/resumen`, `/admin/cursos`, `/admin/vivenciales`, `/admin/instructores`, `/admin/alumnos` (Sesión 32, ver §8b), `/admin/beneficios`, `/admin/comentarios`, `/admin/metricas`, `/admin/pagos-instructores`.
- Gate: `AdminGate` (RLS + `profiles.es_admin`).

### Instructor ✅ (Sesión 16)
- `/instructor/resumen`, `/instructor/cursos`, `/instructor/cursos/:id`, `/instructor/calendario`, `/instructor/metricas`, `/instructor/pagos`, `/instructor/perfil`.
- Gate: `InstructorGate` (RLS + fila propia en `academy_instructors` con `activo = true`). Admin tiene prioridad.

### Pendientes
- Drag-and-drop para reordenar módulos/lecciones e itinerario.

---

## PRINCIPIOS NO NEGOCIABLES (LISTA COMPLETA)

1. **TypeScript estricto.** Sin `any`.
2. **RLS siempre activo.** Nunca `service_role` desde el frontend.
3. **Nunca hardcodear secrets.**
4. **No borrar datos.** Soft-delete siempre.
5. **No re-crear tablas.** Solo `ALTER TABLE`.
6. **Modelo:** registro gratis, pago por curso/evento vía Mercado Pago; vivenciales pagados por fuera de la plataforma. Sin suscripciones (ver deuda técnica de `academy_subscriptions`).
7. **Diseño:** prototipos HTML en la raíz del proyecto son la fuente de verdad visual.
8. **Nunca shippear estadísticas, testimonios o prueba social inventada.**
9. **Nunca agregar scroll-snap o scroll-jacking no pedido.**
10. **Los vivenciales no se cobran dentro de la plataforma.** El saldo nunca se edita a mano.
11. **Comentarios y reseñas:** responde el admin (cualquier curso) o el instructor dueño del curso. El `pagado` de un payout y los campos de dinero nunca se escriben desde el frontend — los protegen triggers.
12. **Las migraciones las aplica Claude directo** (corregido en Sesión 32 — antes decía que las aplicaba Nico). Escribe el SQL, lo corre contra `fvrwtqhkskbaixqbxami` (migraciones, policies, triggers, `CREATE OR REPLACE`) y lo deja commiteado en `supabase/migrations/` del repo. Nico y Yesica hacen el QA visual final (principio #13), no el gatekeeping de si se aplica. Sigue sin poder recrear tablas (solo `ALTER TABLE`) ni borrar datos salvo pedido explícito y acotado.
13. **Toda entrega se prueba visualmente por Yesica o Nico EN PRODUCCIÓN, después del deploy.** La prueba visual no bloquea el merge/deploy; se mergea, se deploya y recién ahí se prueba en vivo. Verificación técnica (build, deploy, código, DB) no reemplaza ese paso humano, pero tampoco hay que probar antes de deployar. El ítem queda "completamente cerrado" solo tras la prueba en prod.
14. **Actualizar este archivo con cada sesión** (ver instrucciones abajo).

---

## CÓMO ACTUALIZAR ESTE ARCHIVO

- **Este archivo se actualiza y commitea SIEMPRE por Claude Code, en el mismo commit (o PR) que el código/migración de la tarea que documenta — nunca por copy-paste manual desde otro chat.** Si Nico pega una versión editada de este archivo en el proyecto de Claude IA, Claude Code la toma como referencia de contenido pero es quien hace el commit real al repo.
- **Cada sesión que toque Academy** agrega una fila a la tabla de "Sesiones" en Estado actual, con el número de sesión y un resumen de una línea.
- Si la sesión construye una feature nueva relevante (como Vivenciales, Portal de Instructores, Video, Home, Cutover), se le agrega **su propia sección dedicada** siguiendo el mismo formato que las existentes (qué es, decisiones de diseño, cambios de schema, bugs encontrados, verificación) — y se suma al índice.
- **El Backlog es único** (sección "Backlog priorizado"). No volver a partirlo en varias listas sueltas. Al cerrar un ítem: se borra de la lista (no se tacha y se deja — el historial de que se hizo ya queda en la tabla de sesiones). Al surgir uno nuevo: se agrega en el bucket de prioridad que corresponda (P0 bloqueante, P1 producto, P2 limpieza de deuda técnica, P3 más adelante).
- Si aparece deuda técnica nueva (tabla/función sin uso, feature a medio construir y abandonada), va a **P2** con una línea clara de qué es y por qué no se usa — no dejarla flotando sin explicación en el Schema.
- Si se identifica una desviación de proceso (como la de Sesión 16), se documenta igual que ese caso: qué pasó, por qué, si se revirtió o no y por qué — no se omite para que el historial de decisiones quede completo.
- **No duplicar acá** contenido de negocio (eso es `Travexa_Negocio.md`) ni de infraestructura compartida/Core (eso es `Travexa_Tecnico.md` / `master.core.md`).
- Actualizar la fecha y el número de sesión en el encabezado con cada actualización.
- Si se agregan o renombran secciones, sincronizar el índice.

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial · Última actualización: Sesión 39*
