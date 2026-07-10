# Travexa Academy — Instrucciones para Claude Code
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Actualizado: 10 Julio 2026 — Sesión 16**

> Este archivo es la fuente de verdad para Claude Code en este proyecto.
> Leerlo completo antes de ejecutar cualquier cosa.

---

## ROL

Sos el CTO de desarrollo de **Travexa Academy**. Trabajás junto a Nicolás Belinco (CTO) y Yesica Robles (CEO) de Pencom Travexa SAS. Tomás decisiones técnicas, escribís código de producción, y asesorás antes de ejecutar en cualquier cosa que impacte arquitectura o producción.

**Idioma:** español rioplatense en todas las respuestas y en toda la UI.
**Código y comments:** en inglés.
**Modo de trabajo:** en decisiones de arquitectura, preguntar antes de ejecutar. En tareas claras, ejecutar directo.

---

## QUÉ ES TRAVEXA ACADEMY

Plataforma de formación del trade turístico argentino. URL destino: `academy.travexa.com.ar`. Producción actual: `https://travexa-academy.vercel.app` (dominio propio pendiente de cutover, ver backlog).

**Los 4 pilares:**
1. **Formación** — Cursos grabados por Yesica e instructores/influencers del sector
2. **Vivencial** — Viajes educativos en grupo (fam trips). El diferenciador absoluto.
3. **Eventos** — Webinars, masterclasses, paneles.
4. **Comunidad** — Feed social + directorio de miembros + gamificación

---

## MODELO DE NEGOCIO — CRÍTICO

**El registro es GRATUITO. No hay planes ni suscripciones.**

El usuario paga por lo que consume:
- **Curso individual** → pago único por curso, vía Mercado Pago dentro de la plataforma (pendiente de `MP_ACCESS_TOKEN` para cobros reales)
- **Vivencial** → pago único por experiencia (precio en USD, cobrado en ARS) — **⚠️ desde Sesión 15, NO se cobra dentro de la plataforma.** La venta se cierra por WhatsApp con Yesica, quien registra el pago manualmente en el backoffice (ver sección dedicada más abajo)
- **Evento pago** → pago único por evento

**No construir nada de planes, membresías ni suscripciones.**

---

## PRINCIPIO NO NEGOCIABLE — INTEGRIDAD DE DATOS EN PRODUCCIÓN (Sesión 14)

Establecido al llevar la Home pública a producción, aplica a toda la plataforma de acá en adelante:

**Ninguna estadística, testimonio, rating o cara de usuario que se muestre como prueba social puede ser inventada.** Se conecta a datos reales de la base, o la sección/elemento se oculta por completo (feature flag, `display:none` efectivo, lo que corresponda) hasta que exista el dato real.

- **No alcanza con marcarlo como "muestra" o "demo" visible al usuario.** Un visitante real viendo un rating con la etiqueta "contenido de muestra" es peor que no ver rating — comunica que la prueba social del sitio es falsa.
- Esto incluye fotos de stock de personas presentadas junto a texto que sugiere que son usuarios/asesores reales, **aunque no lleven nombre ni cifra asociada** — un cluster de avatares de gente real bajo "Formación hecha por y para asesores de viajes" también viola el principio. Usar avatares genéricos (ícono/iniciales) para cualquier elemento decorativo de este tipo.
- Cuando la DB esté vacía (ej. cero cursos publicados), la sección correspondiente muestra un estado vacío diseñado explícitamente para ese caso — nunca cards fantasma ni ceros crudos sin contexto.

---

## PRINCIPIO NO NEGOCIABLE — SCROLL LIBRE (Sesión 14)

No agregar `scroll-snap`, scroll-jacking, ni ningún comportamiento que le saque al usuario el control del scroll, salvo que esté explícitamente pedido y acotado (ej. el scrub del hero animado, que sí es scroll-driven pero por diseño). Si se agrega algo así "de más" para resolver otro problema (p.ej. hacer que las secciones midan una pantalla), se revierte — el alto de sección se resuelve con CSS (`100dvh`), no secuestrando el scroll.

---

## PRINCIPIO NO NEGOCIABLE — VIVENCIALES NO SE COBRAN EN LA PLATAFORMA (Sesión 15)

**Travexa no factura vivenciales.** El cierre de venta es 100% por WhatsApp con Yesica; la plataforma nunca procesa un cobro de vivencial (ni Mercado Pago ni ningún checkout propio). Reglas derivadas:

- El único CTA de pre-compra es "Quiero anotarme", que redirige a WhatsApp. No reintroducir botones de pago propios para vivenciales sin que Yesica/Nico lo pidan explícitamente.
- Yesica es quien crea la inscripción (alta manual en backoffice) y quien registra los pagos que recibe — ya aprobados, con comprobante y fecha.
- El viajero puede subir su propio comprobante desde su perfil, pero ese camino queda **pendiente de aprobación** de Yesica (no se auto-aprueba nunca).
- El saldo pendiente de un vivencial (`monto_pendiente_ars`) **nunca se edita a mano**: lo recalcula automáticamente `academy_recalc_vivencial_balance()` vía trigger de Postgres cuando un pago pasa a `estado='aprobado'` (dispara tanto en INSERT como en UPDATE). El frontend y el backoffice solo *leen* ese campo.
- `vivencial_whatsapp_url` es el link al **grupo de WhatsApp del viaje** (lo carga Yesica cerca de la fecha de salida, visible solo con inscripción activa) — no confundir con el WhatsApp Business global (`travexa_whatsapp_business`) al que apunta el botón "Quiero anotarme".
- La edge function `create-vivencial-cuotas-payment` y las columnas/settings relacionados a cuotas por Mercado Pago quedaron construidos de una iteración anterior de esta feature, **deployados pero sin ningún botón que los invoque**. No se usan. Ver backlog para la decisión de retomarlos o darlos de baja.

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
| Sesión 14 | **Home pública (`/`) diseñada, implementada y en producción**, con hero animado de scroll-scrub en curso (Fase 2, rama aparte). |
| **Sesión 15** | **Vivenciales: cierre de venta por WhatsApp + carga manual de pagos en backoffice, en producción.** Diseñado, iterado (primero self-service con Mercado Pago, pivotado a modelo manual) y deployado. Bugfix de un bug preexistente en `mp-webhook-academy` (mapeo de estado de pagos de curso). Ver detalle completo más abajo |
| **Sesión 16** | **Portal de instructores (`/instructor/*`)**, de solo lectura salvo perfil, factura y respuesta a comentarios. Liquidaciones mensuales (`academy_instructor_payouts`), cierre de mes manual por instructor, auto-link de cuenta por email. Ver sección dedicada más abajo |

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones
- 7 edge functions deployadas y ACTIVE (las 3 de pagos + `award-points` + `check-badges`, más las 2 originales de MP), más `create-vivencial-cuotas-payment` (Sesión 15, deployada sin uso — ver backlog)
- Bucket `academy-media` (público, imágenes) + bucket `academy-comprobantes` (privado, Sesión 15) en Storage
- Onboarding obligatorio en producción
- Home pública (`/`) en producción, ver Sesión 14
- Flujo de vivenciales por WhatsApp + backoffice en producción, ver Sesión 15 (commit `67f680c`, deploy `dpl_C8NiJo6f3fKmxW7Vt6A2UDPnur7n`, `READY`)

### 🔴 Acción manual pendiente

- `MP_ACCESS_TOKEN` → cargar en `supabase.com/dashboard/project/fvrwtqhkskbaixqbxami/settings/functions`. Bloquea el cobro real de **cursos**. Ya no bloquea nada de vivenciales (esas no usan Mercado Pago, ver Sesión 15)
- Test users de Google OAuth → mientras el OAuth Client esté en modo "Testing", solo loguean cuentas agregadas a mano en Google Cloud Console
- Volver a activar "Confirm email" en Supabase (se apagó para testear sin rate limit)
- SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real
- **[NUEVO] Dominio propio `academy.travexa.com.ar`** — cutover sin arrancar (alta en Vercel + DNS + Site URL/Redirect de Supabase Auth + Google OAuth origins). Tema de la próxima sesión
- **[NUEVO] Revisión visual end-to-end del flujo de vivenciales** — deployado y verificado a nivel de código/DB, pero nadie lo probó todavía como usuario real (botón "Quiero anotarme" → WhatsApp, alta + carga de pago en backoffice, subida de comprobante del viajero)

### 🟡 Próximos pasos

1. **Ajustes finales de Home (Sesión 14, pendiente de aplicar):** ver checklist en la sección de la Home más abajo
2. **Fase 2 del hero (avión con scroll-scrub):** implementada en rama `feat/plane-takeoff-hero`, pendiente de mergear a `main` una vez aplicados los ajustes finales
3. Badge `top10_monthly` — única condición de badge sin implementar, es ranking-based, necesita lógica propia contra `get_academy_ranking()`
4. `/beneficios` — página de canje de créditos
5. Testimonios reales para `TestimonialsSection` (hoy feature-flagged off)
6. **[NUEVO]** Decidir destino de la feature de cuotas MP para vivenciales (retomar o dar de baja, ver Sesión 15)
7. **[NUEVO]** Dominio propio y revisión visual del flujo de vivenciales (ver arriba)

---

## VIVENCIALES — CIERRE DE VENTA POR WHATSAPP (Sesión 15)

### Contexto y decisión de negocio

Travexa no factura vivenciales — son montos altos (viajes reales) y, a diferencia de los cursos, no se procesan dentro de la plataforma. La venta se gestiona íntegramente por WhatsApp con Yesica, quien administra la transferencia bancaria (fuera de Mercado Pago) por chat y después registra manualmente en el backoffice lo que cobró.

### Iteración de diseño

Esta feature se diseñó en dos vueltas dentro de la misma sesión:

1. **Primera iteración (self-service):** seña por transferencia + saldo por transferencia (con cola de aprobación de Yesica) + saldo/total pagable en cuotas vía Mercado Pago, con reserva automática de cupo al primer pago y recálculo de saldo vía trigger. Se construyó completa: wizard, settings, 3 botones de pago, 2 edge functions, backoffice con cola de aprobación.
2. **Pivote:** definido que Travexa no cobra vivenciales, se simplificó el frontend a un solo botón de contacto. La base de datos de la primera iteración (ledger de pagos + trigger de recálculo) se mantuvo intacta y sirve igual para el modelo manual — solo cambiaron las policies de quién puede insertar qué y se agregó un camino de inserción directa (ya aprobada) para el admin.

### Flujo final (en producción)

**Página del vivencial (sin inscripción):**
- 2-3 tags informativos (no clickeables): "Transferencia en un pago", "Cuotas cómoda — pagás cuando querés, siempre antes de viajar", y opcionalmente "Seña sugerida: $X" si está cargada en el wizard.
- 1 botón: **"Quiero anotarme"** → abre WhatsApp al número de `travexa_whatsapp_business`, con mensaje pre-armado: *"Hola! Estoy interesado/a en ser parte del vivencial {nombre}"* — el género (interesado/interesada) sale de `academy_profiles.genero` del usuario logueado (Masculino/Femenino confirmados como valores reales en producción); sin sesión o sin género cargado, usa "interesado/a" genérico.

**Gestión de la venta (Yesica, fuera de la plataforma):** cierra la venta por WhatsApp, indica los datos bancarios por chat (ya no se muestran en la plataforma).

**Backoffice — alta + carga de pagos:**
- "Cargar inscripción manual" (ya existía desde Sesión 10): busca al usuario, crea el enrollment y descuenta cupo. Simplificado en Sesión 15 para pedir solo el monto total — la seña ya no se carga acá, se carga como un pago más.
- "+ Cargar pago" por inscripto (nuevo, Sesión 15): monto, fecha, comprobante, tipo (Seña/Transferencia). Al guardar, se inserta **ya en `estado='aprobado'`** — sin pasar por ninguna cola — y el trigger recalcula el saldo al instante. Se pueden cargar tantos pagos como haga falta a lo largo del tiempo.

**Página del vivencial (con inscripción activa):**
- Resumen Total/Pagado/Pendiente (ya construido, sigue igual).
- Botón "Subir comprobante" → mismo modal de siempre, pero **sin mostrar CBU/alias** (Yesica ya se lo pasó por chat) — solo monto + fecha + archivo. Este camino sigue quedando `pendiente` hasta que Yesica lo apruebe desde el backoffice.
- Si `vivencial_whatsapp_url` tiene valor (Yesica lo carga más cerca de la fecha de salida): botón/link al **grupo de WhatsApp del viaje**.

**Historial (backoffice + perfil del viajero):** conviven en la misma tabla los pagos que carga Yesica (ya aprobados, sin acciones sobre ellos, son registro histórico) y los que sube el viajero (con acciones de aprobar/rechazar mientras estén pendientes). Se distingue visualmente quién subió cada uno.

### Cambios de schema (Sesión 15 — aplicados por Claude IA vía MCP)

- Tabla nueva `academy_vivencial_payments` (ledger de comprobantes: monto declarado/aprobado, fecha, comprobante, estado, quién y cuándo revisó).
- `academy_courses`: columnas `vivencial_precio_cuotas_ars/usd` (de la primera iteración, sin uso en UI actual), `vivencial_whatsapp_url` resemantizado (grupo del viaje, no consultas).
- `academy_enrollments`: columnas `pago_completado` (bool) y `fecha_limite_pago` (date). `monto_señado_ars`/`monto_pendiente_ars` cambiaron de significado — ahora los recalcula el trigger, nunca se editan a mano.
- `academy_payments`: columnas `enrollment_id` y `comprobante_url`; constraint de `tipo` acepta también `'vivencial_cuotas'`.
- RPCs: `academy_reserve_vivencial_spot` (ahora solo fallback), `academy_liberar_cupo_vivencial` (admin, libera cupo vencido), `academy_recalc_vivencial_balance` (interna, trigger-only).
- Trigger de recálculo extendido para disparar también en INSERT (no solo UPDATE) — necesario para que la carga directa de Yesica impacte el saldo al instante.
- Bucket privado `academy-comprobantes` (10MB, jpg/png/webp/pdf) con RLS: el viajero sube/lee su propia carpeta, el admin lee y sube todo.
- Settings nuevos: `travexa_whatsapp_business` (en uso), `travexa_datos_transferencia` y `mp_monto_minimo_cuotas_ars` (de la primera iteración, sin uso en UI actual).

### Bug preexistente encontrado y corregido (no introducido en esta sesión)

En `mp-webhook-academy`, la rama de pagos de curso escribía el status crudo de Mercado Pago en inglés directo en la columna `estado` (que solo acepta español por `CHECK` constraint) — el `update` fallaba en silencio porque el código no revisaba el error de retorno. El acceso al curso se otorgaba igual, pero el registro de pago quedaba mal. Corregido con un mapeo compartido (`estadoMap`/`toEstado()`) entre la rama de cursos y la de vivenciales, más logging de errores. No afectó datos reales (tabla vacía, `MP_ACCESS_TOKEN` nunca cargado).

### Verificación

Todo lo reportado por Claude Code en esta sesión fue confirmado independientemente por Claude IA vía MCP antes de darlo por cerrado: código real de ambas edge functions releído, migraciones confirmadas contra `list_migrations`, valores reales de settings y de `genero` chequeados en producción, y estado de deploy confirmado contra Vercel (commit `67f680c` → `dpl_C8NiJo6f3fKmxW7Vt6A2UDPnur7n` → `READY`).

---

## PORTAL DE INSTRUCTORES (`/instructor/*`) — Sesión 16

### Qué es

Un portal de **solo lectura** para que cada instructor vea sus propios cursos, fechas, ventas, proyección de ganancia y liquidaciones. Reusa los componentes y tokens de `/admin/*` (`admin.css`, `.card`, `.tbl`, `.kpi-card`, `.chip`) — no es un sistema de diseño nuevo.

**Lo único que un instructor puede escribir:** su propio perfil (bio, avatar, especialidad, redes), la factura de un período, y la respuesta a comentarios/reseñas de sus propios cursos. Nada más.

**La carga de cursos sigue siendo 100% admin.** El instructor nunca crea ni edita cursos, precios, fechas ni `revenue_share_pct`.

### Acceso

- `InstructorGate` (análogo a `AdminGate`): exige una fila en `academy_instructors` con `user_id = auth.uid()` y `activo = true`.
- **Prioridad admin:** si la persona es admin, el gate la manda a `/admin/*`. El botón "Backoffice" del header apunta a `/admin/resumen` para admins y a `/instructor/resumen` para instructores.
- **Auto-link por email (en DB, sin intervención):** cargar un instructor con email ya registrado completa su `user_id` al instante; si el instructor se registra después, `handle_new_user()` lo vincula. Los dos órdenes están cubiertos por triggers.
- Los instructores **sí pasan por `OnboardingGate`** como cualquier alumno (a diferencia de los admins, que lo saltean).

### Liquidaciones — corte de mes MANUAL

**No hay `pg_cron`.** La extensión no está instalada y el corte automático mensual del diseño original se descartó. En su lugar:

`academy_close_instructor_month(p_instructor_id uuid, p_periodo date)` — RPC `SECURITY DEFINER`, admin-only (lanza excepción si `is_academy_admin()` es falso). Suma `academy_payments` (`tipo='curso'`, `estado='aprobado'`) de los cursos de ese instructor dentro del mes, aplica `revenue_share_pct`, y hace upsert sobre `(instructor_id, periodo)`. **Es idempotente:** correrla dos veces recalcula, no duplica.

La dispara Yesica desde `/admin/pagos-instructores`.

### Reglas de dinero

- `pagado` **nunca** se escribe desde el frontend: lo pone en `true` un trigger al guardarse `comprobante_pago_url`.
- El trigger `protect_payout_admin_fields` revierte cualquier intento del instructor de tocar montos, comprobante, fecha de pago o `pagado`. El frontend solo expone `factura_url`/`factura_subida_at`.
- El trigger `protect_instructor_admin_fields` hace lo mismo sobre `academy_instructors` con `nombre`, `email`, `user_id`, `revenue_share_pct` y `activo`.
- **La ganancia sale siempre de los pagos aprobados reales**, nunca de `precio_ars × inscriptos`: el precio de un curso puede haber cambiado entre ventas.
- Yesica no tiene `user_id` vinculado y sus cursos no generan liquidación — la ganancia queda 100% Travexa. No tocar.

### Nombres de terceros — no se abre `profiles`

El instructor **no tiene lectura sobre `profiles`**. Todo nombre de tercero llega por RPC `SECURITY DEFINER`, cada una validando `is_academy_admin() OR is_instructor_of_course()`. Nunca email ni teléfono.

- `get_instructor_course_buyer_names(p_course_id)` → `enrollment_id, nombre, apellido, created_at` de los inscriptos activos. Se usa en el detalle de curso.
- `get_instructor_comment_author_names(p_course_id)` → `user_id, nombre, apellido` de quienes comentaron **o reseñaron** el curso (`UNION` de `academy_lesson_comments` y `academy_reviews`, migración `instructor_comment_author_names_union_reviews`). Se usa como mapa en la pestaña "Comentarios".

Si un autor no aparece en el mapa, la UI cae al genérico "Alumno/a" (`displayName`) en vez de inventar un nombre.

### Storage — bucket privado `academy-comprobantes`

- Factura del instructor: `instructor-facturas/{user_id}/{periodo}.ext`. El instructor tiene `INSERT`, `UPDATE` y `SELECT` sobre su carpeta → se sube con `upsert: true`, path estable.
- Comprobante de pago: `instructor-pagos/{instructor_user_id}/{periodo}-{timestamp}.ext`. **El admin tiene `INSERT` y `SELECT` pero NO `UPDATE`**, así que el path lleva timestamp y se sube con `upsert: false`. No cambiar a un path fijo sin agregar antes la policy de `UPDATE`.
- Al ser privado, todo archivo se muestra con `createSignedUrl()` (helper `signedComprobanteUrl` en `src/lib/storage.ts`, compartido con el flujo de vivenciales).

### Rutas

```
/instructor/resumen      → ventas del mes, proyección, próximas fechas, último payout
/instructor/cursos       → lista de sus cursos, con inscriptos pagos y ganancia
/instructor/cursos/:id   → tabs "Resumen" (proyección o ganancia final + ventas
                            posteriores) y "Comentarios" (responder preguntas/reseñas)
/instructor/calendario   → grilla mensual: live_date de cursos + fecha_vivo de clases
/instructor/metricas     → por mes: ventas, alumnos, ganancia (real si el mes está
                            cerrado, proyectada si no)
/instructor/pagos        → historial de payouts + subida de factura
/instructor/perfil       → bio, avatar, especialidad, redes
```

### Admin — `/admin/pagos-instructores`

Pantalla deliberadamente mínima (sección "Negocio" del sidebar): selector de instructor + período → "Cerrar mes"; tabla de payouts con monto pagado, fecha y upload de comprobante. Sin cola de aprobación. **La mejora visual del backoffice admin queda pendiente para una sesión futura — no construir de más acá.**

---

## HOME PÚBLICA (`/`) — Sesión 14

### Qué es y por qué existe

Hasta esta sesión, Academy no tenía una landing pública propia — `/cursos` cumplía ese rol de facto. La Home nueva es la puerta de entrada real del producto, pensada específicamente para adquisición (conversión de visitante anónimo a registro gratuito).

**Decisión de producto:** `/` es la home pública. El post-login **sigue aterrizando en `/cursos` sin cambios** — no se tocó ese flujo. Menor riesgo, y evita tener que condicionar los CTAs de Home según si hay sesión activa o no.

### Prototipo visual

`academy_home.html`, en la raíz del proyecto junto a los demás prototipos aprobados (`academy_catalogo.html`, `academy_perfil.html`, `academy_vivencial.html`, `academy_onboarding_proto.html`). Mismo estatus: fuente de verdad visual, replicar tal cual.

### Estructura

Hero (con o sin animación de avión, ver Fase 2 abajo) → proof strip (stats reales) → 4 pilares ("Cuatro formas de crecer") → catálogo destacado (marquee de cursos) → vivencial headliner → "Cómo funciona" ("Elegís, pagás una vez, es tuyo") → testimonios (hoy oculto, ver abajo) → gamificación ("Tu nivel acá es tu reputación en Travexa Marketplace") → CTA final → footer.

Componentes bajo `src/components/home/`, orquestados en `src/pages/Home.tsx`.

### Datos reales vs. placeholder — IMPORTANTE

El prototipo HTML tenía números y testimonios inventados para mostrar el diseño (867 asesores, 4.7/5, reseñas con nombre y foto). Se resolvió así en producción, aplicando el principio de integridad de datos (ver arriba):

| Elemento | Estado en producción |
|---|---|
| Proof strip (cantidad de cursos, vivenciales, instructores) | Conectado a `useCourses()`, datos reales. Si la DB da todo en cero, la tira completa se oculta en vez de mostrar ceros |
| Catálogo destacado / vivencial headliner | Conectados a `academy_courses` real (`publicado=true AND archivado=false`), con estado vacío diseñado explícitamente mientras la DB esté en cero |
| Testimonios (5 reseñas con nombre/foto, rating 4.8/5, "+300 reseñas") | **`TestimonialsSection` feature-flagged off (`SHOW_TESTIMONIALS = false`)**. No hay reseñas reales todavía. Todo el markup/data queda en el archivo, comentado/detrás del flag, para activar cuando existan reseñas reales |
| Avatares del hero (cluster de 4 fotos bajo "Formación hecha por y para asesores de viajes") | Reemplazados por avatares genéricos (ícono, no fotos de stock de personas reales) |
| Cards de sincronización Academy↔Marketplace en gamificación ("Marina Sosa") | Reemplazadas por "Tu perfil" + avatar genérico — es un mockup de feature, no un testimonio, pero llevaba foto de una persona real y se corrigió igual |

### Header y WhatsApp flotante

Reusados de los componentes ya existentes en el proyecto (los que ya usan `/cursos`, `/vivencial`, etc.) — no se recrearon desde el HTML del prototipo, que trae su propio header inline solo para verse completo como mockup standalone.

### Fase 2 — Hero animado (avión con scroll-scrub)

En rama `feat/plane-takeoff-hero`, no mergeada a `main` todavía (pendiente de los ajustes finales, ver checklist).

**Técnica:** frame-sequence + `<canvas>`, no `video.currentTime` (seek de video no es frame-accurate ni fluido cross-browser). 116 frames extraídos de `avion.mov` (ubicado en `assets/source/`, gitignored — no referenciar rutas de `~/Downloads`) vía `ffmpeg` + `cwebp`.

**Layout:** dos columnas. Texto a la izquierda con **ancho fijo** (no proporcional/`fr`) para garantizar que el video nunca lo tape. Columna de video contenida a la derecha, nunca full-bleed. Texto y video en `position: sticky` sincronizados al mismo valor de progreso de scroll (0→1) — deben moverse en lockstep, sin desfasarse.

**Fallback:** `prefers-reduced-motion` y conexiones lentas muestran el frame final estático, sin scroll-jacking.

**Bugs encontrados y corregidos durante el QA de esta fase:**
- Header roto por una regla de `scroll-snap` que interfería con la detección de dirección de scroll de framer-motion (`useScroll`) — no era un bug del propio Header, era el snap.
- Secciones que no medían exactamente `100dvh` (se colaba un pedacito de la sección anterior arriba).
- `scroll-snap-type`/`scroll-snap-align` agregados sin haber sido pedidos, y rompían la llegada al final real de la página (el usuario no podía ver el CTA final completo) — eliminados por completo. Ver principio de "scroll libre" arriba.
- Sección de gamificación partida en dos pantallas para que "entrara" en una pantalla cada una, y luego reunificada en una sola ajustando espaciados (padding, gaps) en vez de recortar contenido.
- Texto y video del hero desincronizados al final del scrub (el video subía, el título se quedaba fijo) — corregido aplicando el mismo `translateY` calculado por scroll a ambas columnas.

**Checklist de ajustes finales pendientes (Sesión 14, prompt ya redactado):**
1. Tags de los 4 pilares: "Formación" → "Conocer más" (link a `/cursos`); "Comunidad" → texto que refleje que lleva a gamificación + link/scroll a esa sección dentro de la misma Home.
2. Headers de las secciones vacías de Formación y Vivenciales: reposicionar arriba de la sección (hoy están centrados en el medio); cards de estado vacío al doble de tamaño.
3. Sacar el tag "GRATIS" de la card de ejemplo "Operatoria turística argentina" en "Elegís, pagás una vez, es tuyo".
4. Color del glow de fondo de la sección de gamificación: debe coincidir con el glow (color + animación) ya usado en la sección CTA final, no un color nuevo.

---

## PROTOTIPOS HTML APROBADOS

Los prototipos viven en la **raíz del proyecto**: `academy_catalogo.html`, `academy_perfil.html`, `academy_vivencial.html`, `academy_onboarding_proto.html`, `academy_home.html`, `travexa_academy_backoffice.html`. Son la **fuente de verdad visual**. Claude Code debe replicar ese diseño exactamente en React, no reinterpretarlo.

**`academy_home.html`** (Sesión 14) — referencia de `/`:
- Hero con headline orientado a resultado ("La formación que se nota en tus ventas"), CTA único "Empezar gratis", trust cluster de avatares genéricos.
- 4 pilares con hover y tags/links a sus páginas correspondientes.
- Catálogo y vivencial destacados en marquee horizontal con loop infinito y hover-reveal de descripción, con estado vacío diseñado.
- "Cómo funciona" con card tipo "pase de embarque" mostrando un ejemplo de acceso.
- Testimonios en marquee (hoy oculto en producción, ver Regla de integridad de datos).
- Gamificación con diagrama de sincronización Academy↔Marketplace, value props y stepper de niveles.
- Glows animados (radial-gradient + transform) reutilizados en hero, gamificación y CTA final — mismo color/técnica en los tres lugares.

**`academy_catalogo.html`** — referencia de `/cursos` y `/cursos/:slug`: (sin cambios respecto a la versión anterior de este documento)

**`academy_onboarding_proto.html`** — referencia de `/onboarding`: (sin cambios)

**`academy_vivencial.html`** — referencia de `/vivencial/:slug` y `/viaje/:slug`: desde Sesión 15, la sección de CTA de pago del prototipo queda desactualizada respecto a producción (el prototipo original mostraba botones de pago propios; producción usa el botón único "Quiero anotarme" → WhatsApp, ver sección dedicada arriba). Si se retoca este prototipo en el futuro, actualizarlo primero para no volver a divergir.

---

## IDENTIDAD VISUAL — COMBINADA

### Enfoque "combinado"
- **Base dark navy** (cinematic, Academy) + **teal como primario** (Travexa Core) + **cards blancas en áreas de contenido**
- Precios y textos destacados: **blanco** (`#F5F3EC`), NO gold
- Gold: solo para logotipo, badge vivencial, achievements

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
- **Dark by default** — sin light mode en MVP
- **Área de contenido del detalle:** fondo `#F2F5F4` con inner white `#fff`, texto oscuro `#1A3040`
- **Cinematic:** thumbnails foto full-bleed + gradient overlay oscuro
- **Motion:** Emil Kowalski — `cubic-bezier(0.23,1,0.32,1)`, stagger 60ms, `scale(0.97)` en :active
- **No spinners** — shimmer skeleton siempre
- **Mobile first** — 375px funciona antes que desktop
- **Ningún control de scroll fuera del pedido explícitamente** (ver principio no negociable arriba)

---

## SCHEMA DE BASE DE DATOS (ya existe — NO re-crear)

**Hub de identidad:**
```
profiles          → id, email, nombre, apellido, avatar_url, telefono
academy_profiles  → bio, ciudad, pais (default 'Argentina'), username, referral_code,
                    puntos, creditos, nivel, tipo_cuenta,
                    fecha_nacimiento, genero, tipo_vendedor, anos_experiencia,
                    destinos_principales (array), onboarding_completo (bool, default false),
                    streak_actual, streak_maximo, total_cursos_completados, total_vivenciales
```

⚠️ `onboarding_completo` es el campo canónico del gate de acceso — no confundir ni duplicar con ningún otro nombre similar. Gatea `/onboarding` vía `OnboardingGate` para toda ruta privada, sea cual sea el método de login (email o Google).

⚠️ `referral_code`: hoy se genera con un default de 8 caracteres random en Postgres. El formato legible tipo `TRVX-NOMBRE-2026` quedó evaluado pero sin decisión final — revisar si se aplica antes de que el código empiece a compartirse en volumen.

⚠️ `genero`: valores reales confirmados en producción (Sesión 15): `Masculino`, `Femenino` (capitalizados). Usado para personalizar el mensaje de WhatsApp de "Quiero anotarme" en vivenciales.

**Catálogo:**
```
academy_categories    → nombre, slug, icon, color, orden, activo
academy_instructors   → nombre, bio, avatar_url, user_id (opcional — instructor externo/influencer
                        sin cuenta), especialidad, redes (JSONB: instagram/tiktok/web/whatsapp,
                        solo claves no vacías), revenue_share_pct, activo, email, telefono
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
                        vivencial_precio_seña_ars, vivencial_precio_seña_usd (referencia interna,
                        Yesica la menciona por WhatsApp — no dispara ningún cobro),
                        vivencial_precio_cuotas_ars, vivencial_precio_cuotas_usd (Sesión 15,
                        de la primera iteración — sin uso en UI actual, ver backlog),
                        vivencial_whatsapp_url (Sesión 15: link al GRUPO de WhatsApp del viaje,
                        no es de consultas — lo carga Yesica cerca de la fecha de salida)
academy_modules       → course_id, titulo, orden
academy_lessons       → module_id, course_id, titulo, video_url, duracion_segundos,
                        orden, es_preview (bool), recursos (JSONB),
                        fecha_vivo, live_url (clases en vivo con grabación)
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
academy_credit_redemptions  → user_id, ...(canje de créditos), benefit_id (→ academy_benefits;
                              null en canjes históricos previos al catálogo)
```

⚠️ Valores reales de `academy_badges.condicion` confirmados contra la DB: `first_lesson`, `first_review`, `first_vivencial`, `first_referral`, `streak_7`, `streak_100`, `top10_monthly`. `top10_monthly` es la única sin lógica implementada todavía.

**Beneficios (catálogo de canjes con créditos, admin en `/admin/beneficios`):**
```
academy_benefits → id, titulo, descripcion, tipo ('curso_gratis'|'descuento_pct'|'descuento_fijo'|
                   'sorteo_vivencial'|'otro'), imagen_url, costo_creditos, course_id, descuento_valor,
                   cupo_maximo, cupo_usado, fecha_inicio, fecha_vencimiento, publicado, archivado,
                   ganador_user_id + ganador_anunciado_at (solo sorteo_vivencial)
```
⚠️ `/admin/beneficios` solo administra el catálogo — la tienda pública de canjes (`/beneficios`) todavía no existe.

**Pagos de vivenciales (Sesión 15 — nuevo):**
```
academy_vivencial_payments → id, enrollment_id, user_id, tipo ('sena'|'transferencia' — solo
                             etiqueta de reporting, no cambia el mecanismo), monto_declarado_ars,
                             monto_aprobado_ars (lo carga el admin al aprobar, puede diferir de lo
                             declarado), comprobante_url (bucket privado academy-comprobantes),
                             fecha_declarada, estado ('pendiente'|'aprobado'|'rechazado'),
                             notas_admin, revisado_por, revisado_at
```
⚠️ Nunca se borra (auditoría). El admin puede insertar directo en `estado='aprobado'` (carga manual); el viajero solo puede insertar en `estado='pendiente'` (queda a la espera de aprobación).

**Liquidaciones a instructores (Sesión 16 — nuevo):**
```
academy_instructor_payouts → id, instructor_id, periodo (primer día del mes),
                             monto_bruto_ars, monto_instructor_ars, cantidad_ventas,
                             factura_url + factura_subida_at (los escribe el instructor),
                             comprobante_pago_url, monto_pagado_ars, fecha_pago (admin),
                             pagado (bool, lo pone un trigger al cargarse el comprobante)
                             UNIQUE (instructor_id, periodo)
```
⚠️ `pagado` nunca se escribe desde el frontend. Los campos de dinero los protege el trigger `protect_payout_admin_fields` contra escrituras de instructor. El mes lo cierra el admin a mano con `academy_close_instructor_month()` — no hay `pg_cron`.

**Extras:**
```
academy_wishlists     → user_id, course_id
academy_notifications → user_id, tipo, titulo, mensaje, leida, url
academy_referrals     → referrer_id, referred_id, estado
```

**Progreso y pagos:**
```
academy_enrollments       → user_id, course_id, tipo_acceso, progreso_pct, completado,
                             activo, fecha_completado,
                             seña_pagada, monto_total_ars, monto_señado_ars, monto_pendiente_ars,
                             pago_completado (bool, Sesión 15), fecha_limite_pago (date, Sesión 15)
academy_lesson_progress   → user_id, lesson_id, course_id, completada, segundos_vistos
academy_payments          → user_id, tipo ('curso'|'suscripcion'|'vivencial_cuotas'), course_id,
                             enrollment_id (Sesión 15), monto_ars, monto_usd, mp_payment_id,
                             mp_external_reference, mp_status, estado, comprobante_url (Sesión 15,
                             respaldo documental del admin, no gatea nada)
```

⚠️ `monto_señado_ars`/`monto_pendiente_ars` de `academy_enrollments`: desde Sesión 15 **no se editan a mano nunca**. Los recalcula `academy_recalc_vivencial_balance()` vía trigger cuando algo en `academy_vivencial_payments` o `academy_payments` (tipo `vivencial_cuotas`) pasa a `estado='aprobado'`.

**Reglas canónicas:**
- Acceso a curso: `academy_enrollments` con `activo = true` O `lesson.es_preview = true`
- `external_reference` siempre: `ACAD-COURSE-{userId}-{courseId}` (cursos) / `ACAD-VIV-{enrollmentId}-{timestamp}` (vivenciales, hoy sin uso — ver backlog)
- Tipo de curso: `'grabado'` | `'en_vivo'` | `'vivencial'` | `'ebook'` (ebook = pago único, se lee en canvas, sin descarga)
- `tipo_acceso`: `'gratuito'` | `'pago'` | `'suscripcion'` | `'b2b_incluido'`

---

## EDGE FUNCTIONS DEPLOYADAS

| Función | Estado | Uso |
|---|---|---|
| `create-course-payment` | ✅ ACTIVE | Genera link de pago MP para cursos |
| `confirm-course-payment` | ✅ ACTIVE | Verifica pago de curso y crea enrollment (redirect de éxito) |
| `mp-webhook-academy` | ✅ ACTIVE (v3) | Recibe notificaciones de MP (cursos, suscripciones y vivenciales-cuotas). Bugfix de mapeo de estado en Sesión 15 |
| `award-points` | ✅ ACTIVE | Acredita XP/Créditos por acción, dispara check-badges |
| `check-badges` | ✅ ACTIVE | Evalúa condiciones y otorga badges nuevas |
| `create-vivencial-cuotas-payment` | ✅ ACTIVE (sin uso) | Sesión 15, primera iteración — genera link de pago en cuotas para saldo de vivencial. Ningún botón la invoca desde el pivote a WhatsApp. Ver backlog |

```
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/confirm-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/award-points
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/check-badges
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-vivencial-cuotas-payment
```

**Además, en DB:** `handle_new_user()` (trigger sobre `auth.users`) crea `academy_profiles` para cualquier signup — email o Google por igual — copia metadata y acredita referidos vía `award_points_and_credits()`. No recrear esta lógica en el frontend ni en una edge function aparte.

---

## STACK TÉCNICO

```
Frontend:    React 18 + Vite + TypeScript
UI:          shadcn/ui + Tailwind v4 + lucide-react + framer-motion
Routing:     react-router-dom v7
Data:        TanStack Query v5
Backend:     Supabase (fvrwtqhkskbaixqbxami)
Edge Fn:     Deno (Supabase Functions)
Package mgr: bun (o npm si bun no está disponible)
Deploy:      Vercel (push a main → deploy automático)
Pagos:       Mercado Pago (Preference API) — solo cursos. Vivenciales: sin cobro en plataforma,
             cierre por WhatsApp (Sesión 15)
Video:       YouTube iframe embed nocookie (MVP); canvas + frame-sequence para el hero animado
Storage:     Supabase Storage — bucket `academy-media` (público, 5MB max, solo imágenes) +
             bucket `academy-comprobantes` (privado, 10MB max, imágenes/PDF, Sesión 15)
```

---

## INFRAESTRUCTURA

```
Repo:     github.com/travexa2-0/travexa-academy (público)
Vercel:   travexa-academy (prj_EVk9I5qgCzTEJ5FAqNODm1t5N8AC)
Producción: https://travexa-academy.vercel.app (dominio propio academy.travexa.com.ar pendiente
            de cutover)
Supabase: fvrwtqhkskbaixqbxami (São Paulo)
Local:    /Users/nicolasbelinco/Projects/travexa/travexa-academy
Proto:    Prototipos HTML en la raíz del proyecto — academy_catalogo.html, academy_perfil.html,
          academy_vivencial.html, academy_onboarding_proto.html, academy_home.html,
          travexa_academy_backoffice.html
Assets fuente (no commiteados como tal, ver .gitignore): assets/source/avion.mov — video fuente
          del hero animado, frames extraídos en public/frames/takeoff y public/frames/takeoff-mobile
```

**`vercel.json` (raíz del proyecto) — no borrar:**
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Sin esto, cualquier ruta de React Router accedida directo o refrescada da 404 en Vercel.

**NO confundir con:**
- `yzzquqseobovorbasogc` → Supabase de Lovable/Travexa B2B — NO TOCAR
- `grwzbijirkboccdqkacj` → proyecto personal de Nico — NO USAR

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
- `onContextMenu` preventDefault en área de video
- `@media print { body { display: none } }`
- Watermark con email del usuario (opacity 0.06, rotate -30deg)
- PDFs en canvas (react-pdf), nunca link descargable

---

## PÁGINAS

### Públicas ✅
- **`/` — Home pública (Sesión 14).** Puerta de entrada real del producto, pensada para adquisición. Post-login sigue en `/cursos`, no en `/`
- `/cursos` — Catálogo
- `/cursos/:slug` — Detalle de curso
- `/vivencial`, `/vivencial/:slug` — Catálogo y detalle de vivenciales. Desde Sesión 15, CTA de "Quiero anotarme" (WhatsApp) en vez de pago propio
- `/login` — Login (email + Google OAuth)
- `/registro` — Registro con tipo de cuenta
- `/auth/callback` — Callback de OAuth
- `/pago-confirmado` / `/pago-error`
- `/u/:username` — Perfil público del alumno

### Privadas ✅
- `/onboarding` — Obligatorio, 3 pasos, gateado vía `OnboardingGate`
- `/dashboard` — Existe la ruta, sin uso en el flujo actual
- `/mis-cursos` — Cursos enrollados + vivenciales
- `/cursos/:slug/aprender` — Player
- `/perfil` — Perfil del alumno. Tab Vivenciales muestra estado de pago + botón "Subir comprobante" (Sesión 15)
- `/viaje/:slug` — Detalle de vivencial para el inscripto (itinerario, pagos, grupo de WhatsApp)

### Admin ✅
- `/admin/resumen`, `/admin/cursos`, `/admin/vivenciales`, `/admin/instructores`, `/admin/beneficios`, `/admin/comentarios`, `/admin/metricas`, `/admin/pagos-instructores` (Sesión 16)
- `/admin/vivenciales`: tab Inscriptos con "Cargar inscripción manual" + "+ Cargar pago" por inscripto (Sesión 15)
- Gate: `AdminGate` (RLS + `profiles.es_admin`)

### Instructor ✅ (Sesión 16)
- `/instructor/resumen`, `/instructor/cursos`, `/instructor/cursos/:id`, `/instructor/calendario`, `/instructor/metricas`, `/instructor/pagos`, `/instructor/perfil`
- Gate: `InstructorGate` (RLS + fila propia en `academy_instructors` con `activo = true`). Admin tiene prioridad
- Solo lectura salvo: perfil propio, factura del período, respuesta a comentarios/reseñas de cursos propios

### Pendientes
- Tienda pública de canjes (`/beneficios`)
- Drag-and-drop para reordenar módulos/lecciones e itinerario

---

## BACKLOG — QUÉ FALTA PARA TERMINAR ACADEMY

Consolidado a Sesión 15. Orden aproximado por bloqueo/impacto, no es estricto.

### 🔴 Bloqueante para abrir a usuarios reales / cobrar de verdad
- [ ] `MP_ACCESS_TOKEN` cargado en Supabase Secrets — bloquea el cobro real de **cursos** (vivenciales ya no lo necesitan)
- [ ] Reactivar "Confirm email" en Supabase Auth (protección contra account-takeover en el auto-linking Google↔password)
- [ ] SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real
- [ ] Test users / sacar el Google OAuth Client de modo "Testing"
- [ ] JavaScript origins del Google OAuth Client (completar, hoy vacío)
- [ ] Dominio propio `academy.travexa.com.ar`: alta en Vercel + DNS + Site URL/Redirect URLs de Supabase Auth + Authorized origins/redirect URIs de Google OAuth
- [ ] Revisión visual end-to-end del flujo de vivenciales por WhatsApp (deployado, no probado por un humano todavía)

### 🟡 Producto — pilares incompletos o features a medio construir
- [ ] Testimonios reales para `TestimonialsSection` de la Home (hoy oculto, activar cuando existan reseñas)
- [ ] Ajustes finales de la Home (checklist de Sesión 14, ver arriba)
- [ ] Mergear Fase 2 del hero animado (`feat/plane-takeoff-hero`) a `main`
- [ ] Tienda pública de canjes `/beneficios` — solo existe el lado de administración del catálogo
- [ ] Badge `top10_monthly` (ranking-based, contra `get_academy_ranking()`)
- [ ] Auditar `academy_badges.condicion` completo contra lo que cubren `useGamification.ts`/`check-badges`
- [ ] Certificados: título para certificados externos + generación de PDF en backend
- [ ] Backoffice: drag-and-drop para reordenar módulos/lecciones e itinerario de vivenciales
- [ ] **Comunidad** (uno de los 4 pilares): feed social + directorio de miembros — no construido
- [ ] **Eventos** (uno de los 4 pilares): webinars con cards tipo boarding pass — no construido
- [ ] Decidir destino de la feature de cuotas MP para vivenciales que quedó deployada sin uso (retomar o dar de baja: edge function, columnas `vivencial_precio_cuotas_*`, settings `travexa_datos_transferencia`/`mp_monto_minimo_cuotas_ars`)
- [ ] `referral_code` con formato legible (`TRVX-NOMBRE-2026`) — evaluado, sin decisión final
- [ ] **[Sesión 16]** Rediseño visual completo del backoffice admin (`/admin/pagos-instructores` quedó intencionalmente básica)
- [ ] **[Sesión 16]** Probar el portal con un instructor real: hace falta que Yesica/Nico carguen un `academy_instructors` con el email de una cuenta existente y que haya al menos un pago de curso aprobado. Es carga de datos, no código
- [ ] **[Sesión 16]** Exportar CSV de liquidaciones

### 🔵 Más adelante / infraestructura de fondo
- [ ] Repos privados + Vercel Pro (cuando el negocio lo justifique)
- [ ] Actualizar prototipo `academy_vivencial.html` para reflejar el CTA de WhatsApp (hoy desactualizado respecto a producción)

---

## PRINCIPIOS NO NEGOCIABLES

1. **TypeScript estricto.** Sin `any`.
2. **RLS siempre activo.** Nunca `service_role` desde el frontend.
3. **Nunca hardcodear secrets.**
4. **No borrar datos.** Soft-delete siempre.
5. **No re-crear tablas.** Solo `ALTER TABLE`.
6. **Modelo:** registro gratis, pago por curso/evento vía Mercado Pago; vivenciales pagados por fuera de la plataforma (WhatsApp + registro manual). Sin suscripciones.
7. **Diseño:** prototipos HTML en la raíz del proyecto son la fuente de verdad visual.
8. **Nunca shippear estadísticas, testimonios o prueba social inventada** (ver principio dedicado arriba, Sesión 14).
9. **Nunca agregar scroll-snap o scroll-jacking no pedido** (ver principio dedicado arriba, Sesión 14).
10. **Los vivenciales no se cobran dentro de la plataforma** (ver principio dedicado arriba, Sesión 15). El saldo de un vivencial nunca se edita a mano — lo recalcula el trigger.
11. **Comentarios y reseñas:** responde el admin (cualquier curso) o el instructor dueño del curso (Sesión 16). Ya no es "solo Yesica". El `pagado` de un payout y los campos de dinero nunca se escriben desde el frontend — los protegen triggers.
12. **Actualizar este archivo** con cada sesión.

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
