# Travexa Academy — Instrucciones para Claude Code
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Actualizado: 6 Julio 2026 — Sesión 15**

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

Plataforma de formación del trade turístico argentino. URL destino: `academy.travexa.com.ar`. Producción actual: `https://travexa-academy.vercel.app`.

**Los 4 pilares:**
1. **Formación** — Cursos grabados por Yesica e instructores/influencers del sector
2. **Vivencial** — Viajes educativos en grupo (fam trips). El diferenciador absoluto.
3. **Eventos** — Webinars, masterclasses, paneles.
4. **Comunidad** — Feed social + directorio de miembros + gamificación

---

## MODELO DE NEGOCIO — CRÍTICO

**El registro es GRATUITO. No hay planes ni suscripciones.**

El usuario paga por lo que consume:
- **Curso individual** → pago único por curso
- **Vivencial** → pago único por experiencia (precio en USD, cobrado en ARS)
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
| **Sesión 14** | **Home pública (`/`) diseñada, implementada y en producción**, con hero animado de scroll-scrub en curso (Fase 2, rama aparte). Ver detalle completo más abajo |
| **Sesión 15** | **Vivenciales dejan de cobrarse dentro de la plataforma — cierre de venta por WhatsApp con Yesica.** Ver sección dedicada más abajo |

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones
- 7 edge functions deployadas y ACTIVE (las 3 de pagos + `award-points` + `check-badges`, más las 2 originales de MP)
- Bucket `academy-media` creado en Storage (avatars, fotos de cursos)
- Onboarding obligatorio en producción
- **Home pública (`/`) en producción**, ver Sesión 14

### 🔴 Acción manual pendiente

- `MP_ACCESS_TOKEN` → cargar en `supabase.com/dashboard/project/fvrwtqhkskbaixqbxami/settings/functions`
- Test users de Google OAuth → mientras el OAuth Client esté en modo "Testing", solo loguean cuentas agregadas a mano en Google Cloud Console
- Volver a activar "Confirm email" en Supabase (se apagó para testear sin rate limit)
- SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real

### 🟡 Próximos pasos

1. **Ajustes finales de Home (Sesión 14, pendiente de aplicar):** ver checklist en la sección de la Home más abajo
2. **Fase 2 del hero (avión con scroll-scrub):** implementada en rama `feat/plane-takeoff-hero`, pendiente de mergear a `main` una vez aplicados los ajustes finales
3. Badge `top10_monthly` — única condición de badge sin implementar, es ranking-based, necesita lógica propia contra `get_academy_ranking()`
4. `/beneficios` — página de canje de créditos
5. Testimonios reales para `TestimonialsSection` (hoy feature-flagged off)

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

## VIVENCIALES SIN COBRO EN PLATAFORMA (`Sesión 15`) — CRÍTICO

Cambio de modelo: **los vivenciales ya no se facturan ni se cobran dentro de la app.** Todo el cierre de venta pasa por WhatsApp con Yesica. La plataforma solo muestra la propuesta, registra inscriptos y guarda comprobantes; no inicia ningún cobro automático.

**Cambios de DB (aplicados por Claude IA vía MCP, NO correr migraciones):**
- Policy de admin en `academy_vivencial_payments` (`Admin crea comprobante` INSERT, además de las de UPDATE/SELECT que ya estaban).
- Trigger `trg_academy_vivencial_payment_change` extendido a INSERT: si el pago entra en `estado='aprobado'`, dispara `academy_recalc_vivencial_balance()` que recalcula `monto_señado_ars` / `monto_pendiente_ars` / `seña_pagada` / `pago_completado` del enrollment (suma de `monto_aprobado_ars` de pagos aprobados + cuotas MP aprobadas). El total base es `academy_enrollments.monto_total_ars`.
- Nuevo setting `academy_settings.travexa_whatsapp_business` (jsonb string, hoy `"+54 9 11 5697-4099"`) — número global al que va el botón "Quiero anotarme".

**Frontend:**
- **`VivencialPagoCTA`** (compartido por `/viaje/:slug`, `/vivencial/:slug` y perfil): sin enrollment muestra 2 tags informativos (Transferencia en un pago / Cuotas cómoda) + tag de seña sugerida + botón **"Quiero anotarme"** → WhatsApp Business global. Con enrollment activo: resumen Total/Pagado/Pendiente + **"Subir comprobante"** (abre `TransferModal`). **Se quitó el botón "Pagar en cuotas (MP)" de todos lados.** La edge function `create-vivencial-cuotas-payment` queda deployada pero sin invocación (no borrar).
- **Link "Quiero anotarme":** `buildAnotarmeWaUrl()` en `useVivencialPago.ts`. Limpia el número a dígitos, arma `wa.me/<num>?text=...`. Mensaje "Hola! Estoy {interesado/a} en ser parte del vivencial {nombre}", donde interesado/a depende de `academy_profiles.genero` (`Femenino`→interesada, `Masculino`→interesado, resto/sin sesión→interesado/a).
- **`TransferModal`:** ya no muestra CBU/alias/titular (Yesica los pasa por WhatsApp). Solo monto + fecha + comprobante. Acepta `enrollmentId`: si viene, NO llama `academy_reserve_vivencial_spot` (usa el enrollment que creó Yesica); el RPC queda solo como fallback defensivo. El INSERT del viajero sigue entrando en `estado='pendiente'` (espera aprobación en backoffice).
- **Backoffice (`VivencialInscriptoRow`):** botón "+ Cargar pago" por inscripto → sube comprobante al bucket `academy-comprobantes` e inserta en `academy_vivencial_payments` con `estado='aprobado'`, `monto_declarado_ars=monto_aprobado_ars`, `revisado_por=auth.uid()`, `revisado_at=now()`. El trigger recalcula el saldo. Se pueden cargar varios pagos en el tiempo. El historial distingue pendientes del viajero (card de aprobar/rechazar) de los aprobados/históricos.
- **`ManualEnrollmentForm`:** solo pide email + tipo de acceso + monto total. La seña y los pagos se cargan después como comprobantes (ya no hay campos de seña acá).
- **`SettingsDrawer`:** se sacó la sección "Datos de transferencia" (CBU/alias/titular/banco). Se agregó campo **"WhatsApp Business"** (→ `travexa_whatsapp_business`).
- **`VivencialWizard`:** se sacó "Precio en cuotas". La seña queda como referencia (no dispara cobro). El campo WhatsApp se relabeló a **"Link del grupo de WhatsApp del viaje"** (→ `vivencial_whatsapp_url`, es el grupo del viaje, NO el número de consultas).
- **`vivencial_whatsapp_url` cambió de significado:** ahora es el **grupo de WhatsApp del viaje** (botón "Unirme al grupo"), no un contacto de consultas. Las consultas y el "Quiero anotarme" van al número global `travexa_whatsapp_business`.

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
                        vivencial_precio_seña_ars, vivencial_precio_seña_usd,
                        vivencial_whatsapp_url
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
                             seña_pagada, monto_total_ars, monto_señado_ars, monto_pendiente_ars
academy_lesson_progress   → user_id, lesson_id, course_id, completada, segundos_vistos
academy_payments          → user_id, tipo, course_id, monto_ars, monto_usd, mp_payment_id,
                             mp_external_reference, mp_status, estado
```

**Reglas canónicas:**
- Acceso a curso: `academy_enrollments` con `activo = true` O `lesson.es_preview = true`
- `external_reference` siempre: `ACAD-COURSE-{userId}-{courseId}`
- Tipo de curso: `'grabado'` | `'en_vivo'` | `'vivencial'` | `'ebook'` (ebook = pago único, se lee en canvas, sin descarga)
- `tipo_acceso`: `'gratuito'` | `'pago'` | `'suscripcion'` | `'b2b_incluido'`

---

## EDGE FUNCTIONS DEPLOYADAS

| Función | Estado | Uso |
|---|---|---|
| `create-course-payment` | ✅ ACTIVE | Genera link de pago MP |
| `confirm-course-payment` | ✅ ACTIVE | Verifica pago y crea enrollment |
| `mp-webhook-academy` | ✅ ACTIVE | Recibe notificaciones de MP |
| `award-points` | ✅ ACTIVE | Acredita XP/Créditos por acción, dispara check-badges |
| `check-badges` | ✅ ACTIVE | Evalúa condiciones y otorga badges nuevas |

```
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/confirm-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/award-points
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/check-badges
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
Pagos:       Mercado Pago (Preference API)
Video:       YouTube iframe embed nocookie (MVP); canvas + frame-sequence para el hero animado
Storage:     Supabase Storage — bucket `academy-media` (público, 5MB max, solo imágenes)
```

---

## INFRAESTRUCTURA

```
Repo:     github.com/travexa2-0/travexa-academy (público)
Vercel:   travexa-academy (prj_EVk9I5qgCzTEJ5FAqNODm1t5N8AC)
Producción: https://travexa-academy.vercel.app
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
- `/perfil` — Perfil del alumno
- `/viaje/:slug` — Detalle de vivencial

### Admin ✅
- `/admin/resumen`, `/admin/cursos`, `/admin/vivenciales`, `/admin/instructores`, `/admin/beneficios`, `/admin/comentarios`, `/admin/metricas`
- Gate: `AdminGate` (RLS + `profiles.es_admin`)

### Pendientes
- Tienda pública de canjes (`/beneficios`)
- Drag-and-drop para reordenar módulos/lecciones e itinerario

---

## BACKLOG (NO CONSTRUIR AHORA)

- [x] Backoffice completo (Sesión 10)
- [x] Backoffice: instructores y beneficios (Sesión 13)
- [x] Home pública con hero estático (Sesión 14)
- [ ] Hero animado (Fase 2) mergeado a `main` — en rama, pendiente de ajustes finales
- [ ] Testimonios reales para `TestimonialsSection`
- [ ] Tienda pública de canjes (`/beneficios`)
- [ ] Certificados PDF auto-generados
- [ ] Comunidad: feed social + directorio
- [ ] Eventos: webinars con cards boarding pass
- [ ] Badge `top10_monthly`
- [ ] MP_ACCESS_TOKEN carga en Supabase Secrets
- [ ] SMTP propio para confirmación de email en volumen real

---

## PRINCIPIOS NO NEGOCIABLES

1. **TypeScript estricto.** Sin `any`.
2. **RLS siempre activo.** Nunca `service_role` desde el frontend.
3. **Nunca hardcodear secrets.**
4. **No borrar datos.** Soft-delete siempre.
5. **No re-crear tablas.** Solo `ALTER TABLE`.
6. **Modelo:** registro gratis, pago por curso/vivencial/evento. Sin suscripciones.
7. **Diseño:** prototipos HTML en la raíz del proyecto son la fuente de verdad visual.
8. **Nunca shippear estadísticas, testimonios o prueba social inventada** (ver principio dedicado arriba, Sesión 14).
9. **Nunca agregar scroll-snap o scroll-jacking no pedido** (ver principio dedicado arriba, Sesión 14).
10. **Actualizar este archivo** con cada sesión.

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
