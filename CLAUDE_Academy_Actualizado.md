# Travexa Academy — Instrucciones para Claude Code
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Actualizado: 3 Julio 2026 — Sesión 10**

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

Plataforma de formación del trade turístico argentino. URL destino: `academy.travexa.com.ar`.

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
| Sesión 10 | **Backoffice `/admin/*`** (Resumen, Cursos, Vivenciales, Métricas) conectado a Supabase. Migración `backoffice_admin_rls` (función `is_academy_admin()` + policies admin CRUD/lectura). `AdminGate` + redirect admin post-login salteando onboarding. Wizards de 5 pasos (curso/vivencial) con react-hook-form/zod, TAG_SUGGESTIONS, upload a `academy-media`, currículum, itinerario con renumeración, preview reusando `CourseDetail` (`?preview=1`), inscripción manual con decremento de cupo, drawer de settings (`academy_settings`), command palette ⌘K. Catálogo público endurecido a `publicado=true AND archivado=false` (RLS + query). Fix latente: `tipo_acceso` legacy `'free'`→valores reales de la DB (`gratuito`…) |

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones
- 7 edge functions deployadas y ACTIVE (las 3 de pagos + `award-points` + `check-badges`, más las 2 originales de MP)
- Bucket `academy-media` creado en Storage (avatars, fotos de cursos)
- Datos seed cargados: 8 cursos, 3 instructores, 5 categorías, 7 badges
- Onboarding obligatorio en producción: `academy_profiles.onboarding_completo` gatea todas las rutas privadas (`OnboardingGate`), sin depender de localStorage ni de la config de Redirect URLs

### 🔴 Acción manual pendiente

- `MP_ACCESS_TOKEN` → cargar en `supabase.com/dashboard/project/fvrwtqhkskbaixqbxami/settings/functions`
- Google OAuth en producción → funciona en local; falta agregar el dominio de Vercel prod (no preview) a Redirect URLs de Supabase + Authorized redirect URIs de Google Cloud Console
- Test users de Google OAuth → mientras el OAuth Client esté en modo "Testing", solo loguean cuentas agregadas a mano en Google Cloud Console
- Volver a activar "Confirm email" en Supabase (se apagó para testear sin rate limit)
- SMTP propio (Resend/SendGrid) — el mail default de Supabase no aguanta volumen real

### 🟡 Próximos pasos

1. Badge `top10_monthly` ("Top Learner") — única condición de badge sin implementar, es ranking-based, necesita lógica propia contra `get_academy_ranking()`
2. Auditar `academy_badges.condicion` completo contra la DB real por si hay condiciones cargadas que nada cubre todavía
3. `/beneficios` — página de canje de créditos
4. Backoffice: módulos/días desde el panel

---

## PROTOTIPOS HTML APROBADOS

Los prototipos viven en la **raíz del proyecto** (no en `docs/proto/` pese a lo que digan versiones viejas de este documento): `academy_catalogo.html`, `academy_perfil.html`, `academy_vivencial.html`, `academy_onboarding_proto.html`. Son la **fuente de verdad visual**. Claude Code debe replicar ese diseño exactamente en React, no reinterpretarlo.

**`academy_catalogo.html`** — referencia de `/cursos` y `/cursos/:slug`:
- Header liquid glass pill (iOS behavior: desaparece al scrollear abajo, reaparece al subir)
- Page header blanco con foto de fondo + esfumado blanco→navy
- Filtros en 2 filas: **Modalidad** (Todos / A tu ritmo / En Vivo / Vivencial / Gratis) + **Categoría**
- Sort dropdown (5 opciones)
- Cards con DirectionAwareHover: overlay entra desde la dirección del mouse
- Badge EN VIVO pulsante con ring animado, Badge VIVENCIAL con shimmer gold
- Skeleton shimmer loading antes de que carguen las cards
- Wishlist heart con micro-bounce
- Detalle: hero cinematográfico + tabs (Descripción / Contenido / Instructor / Reseñas / Trailer opcional)
- Sliding indicator animado en tabs
- Fondo blanco en área de contenido del detalle (texto oscuro)
- CTA card dark flotante con sombra prominente
- Botones: Comprar / Regalar / Preguntas frecuentes (abre modal)
- FAQ modal con accordion
- Copiar link en hero del detalle
- WhatsApp flotante bottom-right (siempre visible)
- Mobile responsive: barra CTA fija en bottom en mobile

**`academy_onboarding_proto.html`** — referencia de `/onboarding` (implementado Sesión 9):
- Stepper de 3 pasos con línea punteada tipo ruta de vuelo, avioncito indicador de progreso
- Paso 3: código de referido en formato "pase de embarque" (tarjeta troquelada, shimmer antes de mostrar el código)
- Gold solo en el logo y en el bloque de recompensa de créditos — en ningún otro lugar
- Sin botón de "omitir": el onboarding es obligatorio

---

## IDENTIDAD VISUAL — COMBINADA (ACTUALIZADA SESIÓN 5)

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
academy_instructors   → nombre, bio, avatar_url, user_id, revenue_share_pct, activo
academy_courses       → titulo, slug, descripcion, thumbnail_url, trailer_url,
                        category_id, instructor_id, nivel, tipo_acceso,
                        tipo ('grabado'|'en_vivo'|'vivencial'),
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
                        orden, es_preview (bool), recursos (JSONB)
```

**Gamificación:**
```
academy_points_transactions → user_id, puntos, tipo, motivo, referencia_id, pool ('xp'|'creditos')
academy_badges              → nombre, descripcion, icono, color, condicion, activo
academy_user_badges         → user_id, badge_id, earned_at
academy_certificates        → user_id, course_id, enrollment_id, numero, emitido_at
academy_credit_redemptions  → user_id, ...(canje de créditos)
```

⚠️ Valores reales de `academy_badges.condicion` confirmados contra la DB (Sesión 9): `first_lesson`, `first_review`, `first_vivencial`, `first_referral`, `streak_7`, `streak_100`, `top10_monthly`. Los strings en español (`primera_leccion`, etc.) que aparecían en versiones viejas del código **no existen en la DB** — no reintroducirlos. `top10_monthly` es la única sin lógica implementada todavía (es ranking-based, no evento puntual).

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
- Tipo de curso: `'grabado'` | `'en_vivo'` | `'vivencial'`
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

**Además, en DB:** `handle_new_user()` (trigger sobre `auth.users`) crea `academy_profiles` para cualquier signup — email o Google por igual — copia metadata (nombre/apellido/tipo_cuenta) y, si vino `referral_code`, acredita al referente y al nuevo usuario vía `award_points_and_credits()`. No recrear esta lógica en el frontend ni en una edge function aparte.

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
Video:       YouTube iframe embed nocookie (MVP)
Storage:     Supabase Storage — bucket `academy-media` (público, 5MB max, solo imágenes)
```

---

## INFRAESTRUCTURA

```
Repo:     github.com/travexa2-0/travexa-academy (público)
Vercel:   travexa-academy (prj_EVk9I5qgCzTEJ5FAqNODm1t5N8AC)
Supabase: fvrwtqhkskbaixqbxami (São Paulo)
Local:    /Users/nicolasbelinco/Projects/travexa/travexa-academy
Proto:    Prototipos HTML en la raíz del proyecto (no docs/proto/) — academy_catalogo.html, academy_perfil.html, academy_vivencial.html, academy_onboarding_proto.html
```

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
- `/cursos` — Catálogo. Es el destino post-onboarding (home actual, no `/dashboard` todavía)
- `/cursos/:slug` — Detalle de curso
- `/login` — Login (email + Google OAuth, activo y probado en local)
- `/registro` — Registro con tipo de cuenta (ya no pide `destinos_principales`, eso quedó en el onboarding)
- `/auth/callback` — Callback de OAuth, espera resolución de sesión antes de navegar
- `/pago-confirmado` — Post-pago
- `/pago-error` — Error de pago
- `/u/:username` — Perfil público del alumno

### Privadas ✅
- `/onboarding` — Obligatorio, 3 pasos, gateado vía `OnboardingGate` contra `onboarding_completo`. Autoguardado por paso, resume si se corta a mitad de camino
- `/dashboard` — Home del alumno (existe la ruta, pero el flujo actual no aterriza acá — ver nota arriba)
- `/mis-cursos` — Cursos enrollados + vivenciales
- `/cursos/:slug/aprender` — Player con bottom bar fija
- `/perfil` — Perfil del alumno (badges, certificados, referidos)
- `/viaje/:slug` — Detalle de vivencial (itinerario, pagos, checklist)

### Admin ✅ (Sesión 10)
- `/admin/resumen` — KPIs, gráfico de ingresos, alertas accionables, actividad reciente, estados vacíos reales
- `/admin/cursos` — lista con filtros client-side, wizard 5 pasos, preview, publicar/archivar/eliminar (0 inscriptos)
- `/admin/vivenciales` — mismo motor filtrado por `tipo='vivencial'`, itinerario, inscriptos + inscripción manual (decrementa cupo)
- `/admin/metricas` — ingresos, rentabilidad por instructor, compradores, uso/funnel derivado, ROI marketing
- Gate: `AdminGate` (RLS + `profiles.es_admin`); admin aterriza en `/admin/resumen` salteando `OnboardingGate`

### Pendientes
- Drag-and-drop para reordenar módulos/lecciones e itinerario (hoy el orden es por posición, sin DnD)

---

## BACKLOG (NO CONSTRUIR AHORA)

- [x] Backoffice completo: métricas, gestión de cursos, ventas, estadísticas (Sesión 10)
- [ ] Certificados PDF auto-generados
- [ ] Comunidad: feed social + directorio
- [ ] Eventos: webinars con cards boarding pass
- [ ] Badge `top10_monthly` (ranking-based, necesita `get_academy_ranking()`)
- [ ] MP_ACCESS_TOKEN carga en Supabase Secrets
- [ ] Google OAuth en producción (dominio prod, no preview)
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
8. **Actualizar este archivo** con cada sesión.

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
