# Travexa Academy — Instrucciones para Claude Code
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Actualizado: 11 Julio 2026 — Sesión 18 + reorganización documental**

> Este archivo es la **fuente de verdad única** para Claude Code en el proyecto Academy.
> Leerlo completo antes de ejecutar cualquier cosa.
> Para negocio/roadmap conjunto ver `Travexa_Negocio.md`; para infraestructura compartida ver `Travexa_Tecnico.md`; para Core ver `master.core.md` (no hace falta leerlo para trabajar en Academy).

---

## CÓMO LEER ESTE ARCHIVO

- **Siempre leer:** Rol, Qué es Travexa Academy, Modelo de negocio, los 4 Principios no negociables generales, Estado actual (tabla de sesiones + infraestructura lista + acción manual pendiente), Backlog priorizado, Principios no negociables (lista final).
- **Leer solo si la tarea toca ese tema:** las secciones dedicadas (Vivenciales, Portal de Instructores, Video de lecciones, Home pública, Cutover de dominio) son detalle histórico/de referencia de la sesión en que se construyó cada feature — consultarlas cuando se toque esa parte del producto, no hace falta releerlas todas cada vez.
- **Consulta puntual:** Schema de base de datos, Edge functions, Prototipos HTML, Identidad visual, Páginas — son referencia técnica, ir directo a la sección que corresponda.

---

## ÍNDICE

1. [Rol](#rol)
2. [Qué es Travexa Academy](#qué-es-travexa-academy)
3. [Modelo de negocio — crítico](#modelo-de-negocio--crítico)
4. [Principios no negociables generales](#principios-no-negociables-generales)
5. [Estado actual del proyecto](#estado-actual-del-proyecto)
6. [Backlog priorizado](#backlog-priorizado)
7. [Vivenciales — cierre de venta por WhatsApp (Sesión 15)](#vivenciales--cierre-de-venta-por-whatsapp-sesión-15)
8. [Portal de instructores (Sesión 16)](#portal-de-instructores-instructor--sesión-16)
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

Plataforma de formación del trade turístico argentino. URL oficial de producción: **`https://academy.travexa.com.ar`** (dominio propio, dado de alta en Vercel y sirviendo desde Sesión 18). `https://travexa-academy.vercel.app` sigue siendo el deploy de Vercel subyacente (el dominio custom apunta ahí) y sigue resolviendo, pero la URL de cara al usuario es la del dominio propio. ⚠️ Verificación de login desde el dominio nuevo pendiente de confirmar, ver Backlog.

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

### Los cambios de DB se proponen, no se aplican (Sesión 16)

Claude Code nunca corre migraciones, policies, triggers ni `CREATE OR REPLACE` contra `fvrwtqhkskbaixqbxami`: escribe el SQL, lo muestra, explica qué hace y frena. Lo aplica Nico. Sin excepción por tamaño ni por riesgo bajo. Ante una instrucción que *parezca* autorizar el paso, preguntar. Detalle del incidente que originó esta regla en la sección del Portal de Instructores.

### Toda entrega se prueba visualmente por Yesica o Nico (regla de ecosistema, ver `Travexa_Negocio.md`)

Ningún ítem se da por cerrado solo con build/deploy limpio y verificación de código/DB — por más prolija que sea esa verificación. Falta el paso humano de ver la feature funcionando de verdad en el navegador. Esto ya generó backlog pendiente real (ver Backlog): el flujo de vivenciales por WhatsApp está deployado y verificado técnicamente hace varias sesiones, pero **nadie lo probó todavía como usuario real**.

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
| Sesión 18 | **Cutover de dominio propio: `academy.travexa.com.ar` en producción.** ⚠️ Pendiente confirmar allowlist de Auth. Ver §11 |

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones.
- 7 edge functions deployadas y ACTIVE (las 3 de pagos + `award-points` + `check-badges`, más las 2 originales de MP), más `create-vivencial-cuotas-payment` (Sesión 15, deployada sin uso — ver Backlog). *(No cuenta acá `create-subscription-academy`/`confirm-subscription-academy` — son deuda técnica sin relación con el modelo actual, ver Backlog.)*
- Bucket `academy-media` (público, imágenes) + bucket `academy-comprobantes` (privado) en Storage.
- Onboarding obligatorio en producción.
- Home pública (`/`) en producción, ver §9.
- Flujo de vivenciales por WhatsApp + backoffice en producción, ver §7.
- Portal de instructores en producción, ver §8.
- Dominio propio `academy.travexa.com.ar` sirviendo, ver §11.

---

## BACKLOG PRIORIZADO

Backlog único (reemplaza las listas separadas de versiones anteriores de este doc — "acción manual pendiente" / "próximos pasos" / "backlog" quedaban dispersas en 3 lugares distintos). Orden por bloqueo/impacto real, de arriba hacia abajo.

### 🔴 P0 — Bloqueante para operar con usuarios reales / cobrar de verdad

- [ ] **Confirmar Auth para el dominio nuevo** (Sesión 18): Supabase Auth → Site URL = `https://academy.travexa.com.ar`; Redirect URLs incluye `https://academy.travexa.com.ar/**` (mínimo `/auth/callback` y `/actualizar-contrasena`); Google Cloud → OAuth Client → Authorized JavaScript origins incluye `https://academy.travexa.com.ar`. El código ya arma el `redirectTo` con `window.location.origin`, así que del lado del código está listo — falta el allowlist de los dashboards. **Verificar login end-to-end (email + Google) desde el dominio nuevo antes de dar el cutover por cerrado.**
- [ ] **Revisión visual end-to-end del flujo de vivenciales por WhatsApp** — deployado y verificado a nivel de código/DB hace varias sesiones, pero nadie lo probó todavía como usuario real (botón "Quiero anotarme" → WhatsApp, alta + carga de pago en backoffice, subida de comprobante del viajero).
- [ ] `MP_ACCESS_TOKEN` cargado en Supabase Secrets — bloquea el cobro real de **cursos** (vivenciales no lo necesitan).
- [ ] Reactivar "Confirm email" en Supabase Auth (protección contra account-takeover en el auto-linking Google↔password).
- [ ] SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real.
- [ ] Sacar el Google OAuth Client de modo "Testing" (agregar test users mientras tanto).
- [ ] JavaScript origins del Google OAuth Client — completar con `https://academy.travexa.com.ar` (hoy vacío).

### 🟡 P1 — Producto: pilares incompletos o features a medio construir

- [ ] Testimonios reales para `TestimonialsSection` de la Home (hoy `SHOW_TESTIMONIALS = false`, activar cuando existan reseñas).
- [ ] Ajustes finales de la Home (checklist de Sesión 14, ver §9).
- [ ] Mergear Fase 2 del hero animado (`feat/plane-takeoff-hero`) a `main`.
- [ ] Tienda pública de canjes `/beneficios` — solo existe el lado de administración del catálogo.
- [ ] Badge `top10_monthly` (ranking-based, contra `get_academy_ranking()`).
- [ ] Auditar `academy_badges.condicion` completo contra lo que cubren `useGamification.ts`/`check-badges`.
- [ ] Certificados: título para certificados externos + generación de PDF en backend.
- [ ] Backoffice: drag-and-drop para reordenar módulos/lecciones e itinerario de vivenciales.
- [ ] **Comunidad** (pilar): feed social + directorio de miembros — no construido (tablas placeholder ya existen).
- [ ] **Eventos** (pilar): webinars con cards tipo boarding pass — no construido (tablas placeholder ya existen).
- [ ] Decidir destino de la feature de cuotas MP para vivenciales que quedó deployada sin uso (edge function `create-vivencial-cuotas-payment`, columnas `vivencial_precio_cuotas_*`, settings `travexa_datos_transferencia`/`mp_monto_minimo_cuotas_ars`) — retomar o dar de baja.
- [ ] `referral_code` con formato legible (`TRVX-NOMBRE-2026`) — evaluado, sin decisión final.
- [ ] Rediseño visual completo del backoffice admin (`/admin/pagos-instructores` quedó intencionalmente básica).
- [ ] Probar el Portal de Instructores con un instructor real (carga de datos, no código — Yesica/Nico cargan un `academy_instructors` con email de una cuenta existente + un pago de curso aprobado).
- [ ] Exportar CSV de liquidaciones de instructores.
- [ ] Mergear la rama del video unificado (Sesión 17) a `main` — hoy solo el hotfix de `/cursos` está en producción, el resto sigue en rama.

### 🧹 P2 — Limpieza de deuda técnica

- [ ] **Dar de baja `academy_subscriptions`** (tabla) + edge functions `create-subscription-academy` y `confirm-subscription-academy` — sin uso, leftover del modelo pre-pivote. Escribir la migración de baja como propuesta (ver principio "DB se propone"), no aplicar directo.
- [ ] Sacar el valor `'suscripcion'` del enum de `academy_payments.tipo` una vez confirmado que no se usa.
- [ ] Actualizar prototipo `academy_vivencial.html` para reflejar el CTA de WhatsApp (hoy desactualizado respecto a producción).

### 🔵 P3 — Más adelante / infraestructura de fondo

- [ ] Repos privados + Vercel Pro (cuando el negocio lo justifique).

---

## VIVENCIALES — CIERRE DE VENTA POR WHATSAPP (Sesión 15)

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

**Regla vigente, sin excepciones (ver también Principios no negociables generales):** cualquier cambio de DB en `fvrwtqhkskbaixqbxami` se propone, no se aplica. Claude Code escribe el SQL, lo muestra, explica qué hace y frena. Lo aplica Nico. Ante una instrucción que *parezca* autorizar el paso, preguntar.

---

## HOME PÚBLICA (`/`) — Sesión 14

### Qué es y por qué existe

Hasta esta sesión, Academy no tenía una landing pública propia — `/cursos` cumplía ese rol de facto. La Home nueva es la puerta de entrada real del producto, pensada específicamente para adquisición.

**Decisión de producto:** `/` es la home pública. El post-login sigue aterrizando en `/cursos` sin cambios.

### Prototipo visual

`academy_home.html`, en la raíz del proyecto junto a los demás prototipos aprobados. Fuente de verdad visual, replicar tal cual.

### Estructura

Hero → proof strip (stats reales) → 4 pilares → catálogo destacado (marquee) → vivencial headliner → "Cómo funciona" → testimonios (hoy oculto) → gamificación → CTA final → footer.

### Datos reales vs. placeholder

| Elemento | Estado en producción |
|---|---|
| Proof strip | Conectado a `useCourses()`, datos reales. Si la DB da todo en cero, la tira se oculta entera |
| Catálogo destacado / vivencial headliner | Conectados a `academy_courses` real, con estado vacío diseñado |
| Testimonios | `TestimonialsSection` feature-flagged off (`SHOW_TESTIMONIALS = false`) |
| Avatares del hero | Genéricos (ícono), no fotos de stock |
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

**⚠️ PENDIENTE de confirmar (no verificable por código):** Supabase Auth → Site URL + Redirect URLs; Google Cloud OAuth → Authorized JavaScript origins. Sin esto, **el login puede estar roto desde el dominio nuevo aunque el sitio cargue bien.** Ver Backlog P0.

**Nota Travexa Core:** el proyecto `travexa-core` (Home del Marketplace) linkea a Academy vía `ACADEMY_URL` en `src/lib/config.ts`, hoy apuntando a `https://travexa-academy.vercel.app` — actualizar a `https://academy.travexa.com.ar` cuando se confirme el cutover completo.

---

## PROTOTIPOS HTML APROBADOS

Los prototipos viven en la **raíz del proyecto**: `academy_catalogo.html`, `academy_perfil.html`, `academy_vivencial.html`, `academy_onboarding_proto.html`, `academy_home.html`, `academy_player_proto.html`, `travexa_academy_backoffice.html`. Son la **fuente de verdad visual**. Claude Code debe replicar ese diseño exactamente en React, no reinterpretarlo.

- **`academy_home.html`** — referencia de `/`. Hero orientado a resultado, 4 pilares, catálogo/vivencial en marquee, "cómo funciona" tipo pase de embarque, testimonios (oculto en prod), gamificación con diagrama Academy↔Marketplace.
- **`academy_catalogo.html`** — referencia de `/cursos` y `/cursos/:slug`.
- **`academy_onboarding_proto.html`** — referencia de `/onboarding`.
- **`academy_vivencial.html`** — referencia de `/vivencial/:slug` y `/viaje/:slug`. ⚠️ Desde Sesión 15 la sección de CTA de pago del prototipo está desactualizada respecto a producción (mostraba botones de pago propios; producción usa "Quiero anotarme" → WhatsApp). Actualizar el prototipo antes de retocarlo, para no volver a divergir.
- **`academy_player_proto.html`** — referencia del player (Sesión 12, extendido en Sesión 17 con video unificado).
- **`travexa_academy_backoffice.html`** — referencia de `/admin/*` y `/instructor/*`.

---

## IDENTIDAD VISUAL — COMBINADA

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
profiles          → id, email, nombre, apellido, avatar_url, telefono (compartido con Core)
academy_profiles  → bio, ciudad, pais (default 'Argentina'), username, referral_code,
                    puntos, creditos, nivel, tipo_cuenta,
                    fecha_nacimiento, genero, tipo_vendedor, anos_experiencia,
                    destinos_principales (array), onboarding_completo (bool, default false),
                    streak_actual, streak_maximo, total_cursos_completados, total_vivenciales
```

⚠️ `onboarding_completo` es el campo canónico del gate de acceso.
⚠️ `referral_code`: hoy 8 caracteres random. Formato legible `TRVX-NOMBRE-2026` evaluado, sin decisión final.
⚠️ `genero`: valores reales `Masculino`, `Femenino` (capitalizados). Usado en el mensaje de WhatsApp de vivenciales.

**Catálogo:**
```
academy_categories    → nombre, slug, icon, color, orden, activo
academy_instructors   → nombre, bio, avatar_url, user_id (opcional), especialidad,
                        redes (JSONB), revenue_share_pct, activo, email, telefono
academy_courses       → titulo, slug, descripcion, thumbnail_url, trailer_url,
                        category_id, instructor_id, nivel, tipo_acceso,
                        tipo ('grabado'|'en_vivo'|'vivencial'|'ebook'),
                        pdf_url, total_paginas (solo ebook),
                        precio_usd, precio_ars, publicado, destacado, total_alumnos,
                        rating_avg, rating_count, duracion_total_minutos, total_lecciones,
                        live_date, live_url, live_duration_minutes, fotos (JSONB),
                        incluye (JSONB), no_incluye (JSONB),
                        vivencial_fecha_salida, vivencial_fecha_regreso,
                        vivencial_ciudad_salida, vivencial_punto_encuentro,
                        vivencial_cupo_maximo, vivencial_cupo_disponible,
                        vivencial_itinerario (JSONB), vivencial_hotel,
                        vivencial_precio_seña_ars, vivencial_precio_seña_usd (referencia interna),
                        vivencial_precio_cuotas_ars, vivencial_precio_cuotas_usd (sin uso en UI),
                        vivencial_whatsapp_url (link al grupo de WhatsApp del viaje)
academy_modules       → course_id, titulo, orden
academy_lessons       → module_id, course_id, titulo, video_url, duracion_segundos,
                        orden, es_preview (bool), recursos (JSONB),
                        fecha_vivo, live_url, thumbnail_url (Sesión 17)
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
⚠️ `academy_badges.condicion`: `first_lesson`, `first_review`, `first_vivencial`, `first_referral`, `streak_7`, `streak_100`, `top10_monthly` (sin lógica implementada).

**Beneficios:**
```
academy_benefits → id, titulo, descripcion, tipo ('curso_gratis'|'descuento_pct'|'descuento_fijo'|
                   'sorteo_vivencial'|'otro'), imagen_url, costo_creditos, course_id, descuento_valor,
                   cupo_maximo, cupo_usado, fecha_inicio, fecha_vencimiento, publicado, archivado,
                   ganador_user_id + ganador_anunciado_at (solo sorteo_vivencial)
```
⚠️ `/admin/beneficios` solo administra el catálogo — la tienda pública (`/beneficios`) no existe.

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
                             mp_external_reference, mp_status, estado, comprobante_url
```
⚠️ `monto_señado_ars`/`monto_pendiente_ars` nunca se editan a mano — los recalcula `academy_recalc_vivencial_balance()`.

**Reglas canónicas:**
- Acceso a curso: `academy_enrollments` con `activo = true` O `lesson.es_preview = true`.
- `external_reference`: `ACAD-COURSE-{userId}-{courseId}` (cursos) / `ACAD-VIV-{enrollmentId}-{timestamp}` (vivenciales, sin uso).
- Tipo de curso: `'grabado'` | `'en_vivo'` | `'vivencial'` | `'ebook'`.
- `tipo_acceso`: `'gratuito'` | `'pago'` | `'suscripcion'` | `'b2b_incluido'`.

---

## EDGE FUNCTIONS DEPLOYADAS

| Función | Estado | Uso |
|---|---|---|
| `create-course-payment` | ✅ ACTIVE | Genera link de pago MP para cursos |
| `confirm-course-payment` | ✅ ACTIVE | Verifica pago de curso y crea enrollment |
| `mp-webhook-academy` | ✅ ACTIVE (v4) | Recibe notificaciones de MP (cursos, vivenciales-cuotas) |
| `award-points` | ✅ ACTIVE | Acredita XP/Créditos, dispara check-badges |
| `check-badges` | ✅ ACTIVE | Evalúa condiciones y otorga badges nuevas |
| `create-vivencial-cuotas-payment` | ✅ ACTIVE (sin uso) | Primera iteración, ningún botón la invoca. Ver Backlog |
| `create-subscription-academy` | ⚠️ ACTIVE, **deuda técnica** | Sin uso, ver Backlog P2 |
| `confirm-subscription-academy` | ⚠️ ACTIVE, **deuda técnica** | Sin uso, ver Backlog P2 |

```
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/confirm-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/award-points
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/check-badges
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-vivencial-cuotas-payment
```

**Además, en DB:** `handle_new_user()` (trigger sobre `auth.users`) crea `academy_profiles` para cualquier signup, copia metadata y acredita referidos. No recrear esta lógica en el frontend.

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
            (⚠️ auth desde el dominio nuevo pendiente de confirmar, ver Backlog)
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
- `/vivencial`, `/vivencial/:slug` — CTA "Quiero anotarme" (WhatsApp).
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
- `/admin/resumen`, `/admin/cursos`, `/admin/vivenciales`, `/admin/instructores`, `/admin/beneficios`, `/admin/comentarios`, `/admin/metricas`, `/admin/pagos-instructores`.
- Gate: `AdminGate` (RLS + `profiles.es_admin`).

### Instructor ✅ (Sesión 16)
- `/instructor/resumen`, `/instructor/cursos`, `/instructor/cursos/:id`, `/instructor/calendario`, `/instructor/metricas`, `/instructor/pagos`, `/instructor/perfil`.
- Gate: `InstructorGate` (RLS + fila propia en `academy_instructors` con `activo = true`). Admin tiene prioridad.

### Pendientes
- Tienda pública de canjes (`/beneficios`).
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
12. **Los cambios de DB se proponen, no se aplican.** Claude Code nunca corre migraciones, policies, triggers ni `CREATE OR REPLACE` contra `fvrwtqhkskbaixqbxami`: escribe el SQL, lo muestra y frena. Lo aplica Nico. Sin excepción por tamaño ni por riesgo bajo.
13. **Toda entrega se prueba visualmente por Yesica o Nico antes de darse por cerrada.** Verificación técnica (build, deploy, código, DB) no reemplaza este paso.
14. **Actualizar este archivo con cada sesión** (ver instrucciones abajo).

---

## CÓMO ACTUALIZAR ESTE ARCHIVO

- **Cada sesión que toque Academy** agrega una fila a la tabla de "Sesiones" en Estado actual, con el número de sesión y un resumen de una línea.
- Si la sesión construye una feature nueva relevante (como Vivenciales, Portal de Instructores, Video, Home, Cutover), se le agrega **su propia sección dedicada** siguiendo el mismo formato que las existentes (qué es, decisiones de diseño, cambios de schema, bugs encontrados, verificación) — y se suma al índice.
- **El Backlog es único** (sección "Backlog priorizado"). No volver a partirlo en varias listas sueltas. Al cerrar un ítem: se borra de la lista (no se tacha y se deja — el historial de que se hizo ya queda en la tabla de sesiones). Al surgir uno nuevo: se agrega en el bucket de prioridad que corresponda (P0 bloqueante, P1 producto, P2 limpieza de deuda técnica, P3 más adelante).
- Si aparece deuda técnica nueva (tabla/función sin uso, feature a medio construir y abandonada), va a **P2** con una línea clara de qué es y por qué no se usa — no dejarla flotando sin explicación en el Schema.
- Si se identifica una desviación de proceso (como la de Sesión 16), se documenta igual que ese caso: qué pasó, por qué, si se revirtió o no y por qué — no se omite para que el historial de decisiones quede completo.
- **No duplicar acá** contenido de negocio (eso es `Travexa_Negocio.md`) ni de infraestructura compartida/Core (eso es `Travexa_Tecnico.md` / `master.core.md`).
- Actualizar la fecha y el número de sesión en el encabezado con cada actualización.
- Si se agregan o renombran secciones, sincronizar el índice.

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
