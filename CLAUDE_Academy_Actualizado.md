# CLAUDE.md — Travexa Academy
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Robles (CEO)**
**Actualizado: 29 Junio 2026 — Sesión 5**

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
| Sesión 8 | `/perfil` construido: `Profile.tsx` (6 tabs — Resumen, Mis Cursos, Favoritos, Vivenciales, Logros, Tus datos) replicando `academy_perfil.html`. Hooks nuevos (`useProfilePage.ts`), RPC `get_academy_ranking()`, tokens `--bg-3/--bg-4` + `.td-input`, tipos extendidos (creditos, fecha_nacimiento, genero, tipo_vendedor, anos_experiencia, destinos_principales, pool, NIVELES/nivelInfo). Header: "Cursos"→"Formación", "Perfil"→"Mi perfil". Reemplazó el `Perfil.tsx` viejo (4 secciones). |

### ✅ Infraestructura lista

- Supabase `fvrwtqhkskbaixqbxami` creada, schema completo con RLS y todas las migraciones
- 5 edge functions deployadas y ACTIVE
- Bucket `academy-media` creado en Storage (avatars, fotos de cursos)
- Datos seed cargados: 8 cursos, 3 instructores, 5 categorías, 7 badges

### 🔴 Acción manual pendiente

- `MP_ACCESS_TOKEN` → cargar en `supabase.com/dashboard/project/fvrwtqhkskbaixqbxami/settings/functions`
- Google OAuth → activar en Supabase Auth providers

### 🟡 Próximos pasos (Sesión 6)

Replicar el prototipo HTML aprobado en React:
1. `/cursos` — Catalog.tsx: filtros por modalidad + categoría, sort, search, cards con DAH hover, badges de tipo
2. `/cursos/:slug` — CourseDetail.tsx: hero, tabs, accordion, CTA sticky, FAQ modal, share, regalar
3. Instalar dependencias nuevas: `framer-motion`, `canvas-confetti`, `react-share`, `date-fns`

---

## PROTOTIPO HTML APROBADO

El archivo `docs/proto/academy_catalogo.html` en el repo es la **fuente de verdad visual** para `/cursos` y `/cursos/:slug`. Claude Code debe replicar ese diseño exactamente en React.

**Lo que tiene el prototipo:**
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
academy_profiles  → bio, ciudad, username, referral_code, puntos, nivel,
                    streak_actual, streak_maximo, total_cursos_completados, total_vivenciales
```

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
academy_points_transactions → user_id, puntos, tipo, motivo, referencia_id
academy_badges              → nombre, descripcion, icono, color, condicion, activo
academy_user_badges         → user_id, badge_id, earned_at
academy_certificates        → user_id, course_id, enrollment_id, numero, emitido_at
```

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

```
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/create-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/confirm-course-payment
https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy
```

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
Proto:    docs/proto/academy_catalogo.html — referencia visual aprobada
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
- `/cursos` — Catálogo
- `/cursos/:slug` — Detalle de curso
- `/login` — Login (email + Google OAuth)
- `/registro` — Registro con tipo de cuenta
- `/pago-confirmado` — Post-pago
- `/pago-error` — Error de pago
- `/u/:username` — Perfil público del alumno

### Privadas ✅
- `/dashboard` — Home del alumno
- `/mis-cursos` — Cursos enrollados + vivenciales
- `/cursos/:slug/aprender` — Player con bottom bar fija
- `/perfil` — Perfil del alumno (badges, certificados, referidos)
- `/viaje/:slug` — Detalle de vivencial (itinerario, pagos, checklist)

### Vivencial (nuevas — Sesión 7)
- `/vivencial` — Catálogo público de vivenciales ✅
- `/vivencial/:slug` — Detalle público de vivencial ✅

### Pendientes
- `/admin/*` — Backoffice Academy (backlog)

---

## BACKLOG (NO CONSTRUIR AHORA)

- [ ] Backoffice completo: métricas, gestión de cursos, ventas, estadísticas
  - Al crear/editar **curso**: agregar N módulos (titulo + descripcion) → `academy_modules`. Dentro de cada módulo, lecciones → `academy_lessons`.
  - Al crear/editar **vivencial**: agregar N días (titulo + descripcion) que se guardan como JSONB en `vivencial_itinerario`. Cada item: `{ "dia": "Día 1", "titulo": "...", "descripcion": "..." }`. El campo `dia` es texto libre (soporta rangos tipo "Días 3-4").
- [ ] Certificados PDF auto-generados
- [ ] Comunidad: feed social + directorio
- [ ] Eventos: webinars con cards boarding pass
- [ ] Google OAuth activación (paso manual en Supabase dashboard)
- [ ] MP_ACCESS_TOKEN carga en Supabase Secrets

---

## PRINCIPIOS NO NEGOCIABLES

1. **TypeScript estricto.** Sin `any`.
2. **RLS siempre activo.** Nunca `service_role` desde el frontend.
3. **Nunca hardcodear secrets.**
4. **No borrar datos.** Soft-delete siempre.
5. **No re-crear tablas.** Solo `ALTER TABLE`.
6. **Modelo:** registro gratis, pago por curso/vivencial/evento. Sin suscripciones.
7. **Diseño:** prototipo HTML en `docs/proto/` es la fuente de verdad visual.
8. **Actualizar este archivo** con cada sesión.

---

*Pencom Travexa SAS · Junio 2026 · Uso interno confidencial*
