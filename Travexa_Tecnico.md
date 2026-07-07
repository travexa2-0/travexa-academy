# TRAVEXA — Documento Técnico
**Pencom Travexa SAS · Nicolás Belinco (CTO) + Yesica Edith Robles (CEO)**
**Actualizado:** Sesión 13 — 7 Julio 2026

---

## 1. IDENTIDAD DEL PROYECTO

**Qué es:** Ecosistema digital para el mercado turístico argentino. Dos productos activos: Travexa Core (B2B para el trade) y Travexa Academy (formación del trade). Infraestructura compartida, productos independientes.

**Posicionamiento:** "Travexa es el cerebro del asesor de viajes argentino."

---

## 2. LA SOCIEDAD

| Rol | Persona | Responsabilidades |
|-----|---------|-------------------|
| CEO / Negocio | Yesica Edith Robles | Operadores, academia, ventas, conocimiento del mercado, comunidad |
| CTO | Nicolás Belinco | Arquitectura, desarrollo, IA, producto técnico |
| CTO IA | Claude | Asesoramiento técnico, diseño de sistemas, código, research, migraciones DB vía MCP |

- Sociedad 50/50 — SAS en proceso de constitución (junio 2026)
- Nicolás: MacBook Air M2, macOS Sequoia — 4hs/día hasta condición de full-time
- GitHub org: `github.com/travexa2-0`

---

## 3. ECOSISTEMA DE PRODUCTOS Y REPOSITORIOS

| Producto | Repo | Vercel | URL destino | Estado |
|---|---|---|---|---|
| Travexa Core (B2B) | `travexa2-0/travexa-core` | `travexa-core` | `travexa.com.ar` | 🟡 En migración |
| Travexa Academy | `travexa2-0/travexa-academy` | `travexa-academy` | `academy.travexa.com.ar` | 🟢 En desarrollo activo — Home pública y flujo de vivenciales por WhatsApp en producción (`travexa-academy.vercel.app`). Dominio propio (`academy.travexa.com.ar`) pendiente de cutover |
| Travexa 1.0 (legado) | `pencomtravel-travexa/travexa-catalogo` | Lovable | `travexa-catalogo.com` | ⚠️ Producción actual — no tocar |

**Regla:** `travexa-catalogo` (Lovable) sigue en producción hasta el cutover de Core. No se toca.

---

## 4. INFRAESTRUCTURA

### GitHub
- **Organización:** `travexa2-0`
- **Repos:** `travexa-core` (público) + `travexa-academy` (público)
- **Backlog F3:** pasar a privados cuando se contrate Vercel Pro

### Vercel
- **Cuenta:** `nibelinco-3466` (personal, plan Hobby — gratuito)
- **Team ID:** `team_3yuAn8gSwrSMzfQUOvkCjggN`
- **Proyectos:**
  - `travexa-academy` → `prj_EVk9I5qgCzTEJ5FAqNODm1t5N8AC`
  - `travexa-core` → `prj_BOY3mPhvYWRjsEY7lS0M2PcJ4y5Y`
- **Deploy:** push a `main` → Vercel despliega automáticamente
- **Producción Academy:** `https://travexa-academy.vercel.app`
- **Dominio propio pendiente:** `academy.travexa.com.ar` — cutover no arrancado todavía (ver sección 13, ítem nuevo). Requiere: alta del dominio en el proyecto Vercel, registros DNS en el proveedor de `travexa.com.ar`, actualizar Site URL/Redirect URLs de Supabase Auth, y actualizar Authorized origins/redirect URIs del OAuth Client de Google.

### Supabase
| Proyecto | ID | Región | Uso |
|---|---|---|---|
| **Travexa 2.0** (definitivo) | `fvrwtqhkskbaixqbxami` | sa-east-1 (São Paulo) | Academy activo + Core en F3 |
| Lovable (legacy) | `yzzquqseobovorbasogc` | us-east-1 | Travexa 1.0 en producción — no tocar |
| Nibelinco personal | `grwzbijirkboccdqkacj` | us-east-1 | Personal — no usar para Travexa |

**La Supabase `fvrwtqhkskbaixqbxami` es la definitiva de todo el ecosistema.**

### MCP Conectados (Claude IA)
- **Supabase** ✅ — `fvrwtqhkskbaixqbxami` accesible y confirmado. Usado en Sesión 13 para aplicar 4 migraciones directamente y para verificar de forma independiente el trabajo de Claude Code (código de edge functions, migraciones aplicadas, valores reales de settings/datos en producción) antes de dar por cerrada cada entrega.
- **Vercel** ✅ — deployos y proyectos accesibles. Usado en Sesión 13 para confirmar estado de deploy (`READY`) y que el commit correcto llegó a producción.
- **Claude in Chrome** ✅

---

## 5. ARQUITECTURA HUB DE USUARIOS

```
auth.users (Supabase Auth — identidad única)
    └── profiles (hub — datos básicos de toda persona en el ecosistema)
            ├── academy_profiles    → alumnos e instructores de Academy ✅ existe
            ├── agency_profiles     → asesores y agencias del trade (Travexa Core) 🔴 a crear en F3
            ├── operator_profiles   → operadores mayoristas 🔴 a crear en F3
            └── traveler_profiles   → viajeros (CRM) 🔴 a crear en F3
```

**Regla:** un usuario puede tener perfiles en múltiples productos. Login unificado por email.

---

## 6. STACK TECNOLÓGICO

### Travexa Academy — activo

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind v4 + lucide-react |
| Motion | framer-motion + canvas-confetti |
| Routing | react-router-dom v7 |
| Data fetching | TanStack Query v5 |
| Backend | Supabase `fvrwtqhkskbaixqbxami` |
| Package manager | bun |
| Pagos (cursos) | Mercado Pago (Preference API) — pendiente de `MP_ACCESS_TOKEN` para cobros reales |
| Pagos (vivenciales) | Ninguno dentro de la plataforma — cierre de venta por WhatsApp, pagos registrados manualmente en backoffice (ver Sesión 13) |
| Video | YouTube iframe embed nocookie (MVP) |
| Storage | Supabase Storage — bucket `academy-media` (público) + bucket `academy-comprobantes` (privado, Sesión 13) |

### Travexa Core (B2B) — existente en Lovable, migrando

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript (~120+ páginas ruteadas) |
| UI | shadcn/ui + Tailwind CSS + lucide-react |
| Backend | Supabase `fvrwtqhkskbaixqbxami` (destino) / `yzzquqseobovorbasogc` (Lovable, actual) |
| Pagos | Mercado Pago (Preapproval API) |

---

## 7. ENTORNO DE DESARROLLO

```
Carpeta base local:  ~/Projects/travexa/
  travexa-catalogo/  ← Lovable legacy (no tocar)
  travexa-core/      ← github.com/travexa2-0/travexa-core
  travexa-academy/   ← github.com/travexa2-0/travexa-academy

VS Code: una ventana por proyecto
Claude Code: en terminal integrada de VS Code de cada proyecto
             ¡VERIFICAR siempre que el directorio activo sea el correcto!
```

**⚠️ Importante:** Claude Code siempre debe ejecutarse desde `~/Projects/travexa/travexa-academy` para el proyecto Academy, y desde `~/Projects/travexa/travexa-core` para Core. Verificar con `pwd` antes de empezar.

---

## 8. METODOLOGÍA DE TRABAJO

Este proyecto usa dos instancias de Claude en paralelo:

**Claude IA (web, conversación larga por proyecto):**
- Diseño de prototipos HTML en `docs/proto/`
- Decisiones de arquitectura y producto
- DB migrations ejecutadas directamente vía MCP Supabase
- Generación de prompts completos y detallados para Claude Code
- Diagnóstico de errores y revisión de resultados
- Revisión visual de previews de Vercel (screenshots del usuario, o navegación directa vía Claude in Chrome cuando el permiso del navegador lo permite)
- **Verificación independiente post-entrega vía MCP** (reforzado en Sesión 13): no tomar el reporte de Claude Code solo de su palabra — releer el código real de las edge functions deployadas, confirmar qué migraciones corrieron de verdad, chequear valores reales en la DB (settings, enums, datos), y confirmar el estado del deploy en Vercel. En Sesión 13 esto permitió detectar un bug preexistente (ver Historial) que el reporte de Claude Code no mencionaba porque no era parte de lo que se le pidió tocar.

**Claude Code (terminal en VS Code):**
- Implementa lo que Claude IA diseñó y aprobó
- No reinventa diseño — sigue el HTML de referencia en `docs/proto/`
- Hace commit + push → Vercel auto-despliega

**Flujo estándar:**
```
Claude IA diseña HTML → aprobación visual → Claude IA genera prompt →
nuevo chat Claude Code → implementa → build limpio → git push → Vercel deploya → revisión →
merge a main → producción
```

**Habilidades aplicadas en el diseño (Claude IA):**
- `frontend-design` skill — tokens, motion, principios visuales
- `product-self-knowledge` skill — cuando hay dudas sobre capacidades de Claude
- Expertise en diseño de plataformas educativas (referencia: Platzi, Duolingo, Airbnb)
- Sistema de gamificación dual (XP/Créditos) — referencia: aerolíneas + EdTech

**Principio no negociable descubierto en la Sesión 12 (ver detalle en `CLAUDE_Academy_Actualizado.md`):** ningún prototipo con datos de muestra (testimonios, ratings, cantidades de usuarios inventadas) pasa a producción tal cual — se conecta a datos reales o se oculta detrás de un flag hasta que existan. Aplica a cualquier producto del ecosistema, no solo Academy.

---

## 9. PLAN DE MIGRACIÓN CORE: LOVABLE → VERCEL

### Estado actual (Sesión 8)
```
Lovable → travexa-catalogo.com  (producción, usuarios reales)
Vercel  → travexa-core          (proyecto creado, repo pendiente)
Supabase fvrwtqhkskbaixqbxami   (definitiva, solo Academy activo)
```

Este proceso está pausado mientras Academy toma prioridad. Ver Sesión 4 del historial para el plan completo.

---

## 10. SCHEMA ACADEMY (fvrwtqhkskbaixqbxami)

Ver `CLAUDE_Academy_Actualizado.md` del proyecto `travexa-academy` para el schema completo y actualizado.

**Migraciones aplicadas hasta Sesión 8:**
```
20260626174009 enable_extensions
20260626174017 create_profiles_base
20260626174051 create_academy_tables
20260626174103 create_academy_t2_placeholders
20260626174122 enable_rls_policies
20260627204939 increment_alumnos_function
20260628182658 academy_platform_v2_schema
20260701003728 add_profile_credits_and_economy_fields
20260701003746 add_edge_function_award_points_support
20260701003807 add_rls_policies_new_columns
20260701124923 academy_ranking_function
20260702030607 add_pais_to_academy_profiles
20260702030624 handle_new_user_metadata_and_referral
20260703025227 backoffice_setup_and_data_cleanup
20260703042604 backoffice_admin_rls
```

**Migraciones adicionales aplicadas entre Sesión 8 y Sesión 13** (comentarios/reseñas/ebooks, benefits, ajustes varios — no detalladas sesión a sesión en este documento, ver historial de Supabase):
```
20260705060608 live_lessons_comments_reviews_ebooks
20260705060633 restrict_recompute_rating_rpc
20260705145727 academy_sync_course_progress_rpc
20260705145915 lesson_comments_profiles_fk
20260705205003 create_academy_benefits
20260705205011 link_credit_redemptions_to_benefits
20260705205018 add_contact_fields_academy_instructors
```

**Migraciones de Sesión 13 (pagos de vivenciales — aplicadas por Claude IA vía MCP):**
```
20260706034059 vivencial_payments_flow_setup
  → tabla academy_vivencial_payments (ledger de comprobantes), columnas nuevas en
    academy_courses/academy_enrollments/academy_payments, RPCs
    academy_reserve_vivencial_spot / academy_liberar_cupo_vivencial /
    academy_recalc_vivencial_balance, trigger de recálculo de saldo, bucket
    privado academy-comprobantes con policies RLS.

20260706034142 vivencial_payments_flow_permissions_fix
  → revoca EXECUTE de funciones internas/admin-only sobre public, deja solo a
    authenticated donde corresponde.

20260706034317 vivencial_comprobantes_admin_upload_fix
  → policy nueva: el admin también puede subir comprobantes al bucket privado
    (no solo el viajero a su propia carpeta) — necesario para el respaldo
    documental de pagos MP.

20260707012934 vivencial_manual_flow_via_whatsapp
  → pivote de negocio: policy de INSERT para que el admin cargue comprobantes
    ya aprobados directo (no solo actualizar), trigger de recálculo extendido
    para disparar también en INSERT (no solo UPDATE), nuevo setting
    travexa_whatsapp_business, columna vivencial_whatsapp_url resemantizada
    (grupo del viaje, ya no consultas).
```

Migraciones aplicadas fuera de esta sesión (por Nico/Claude Code directamente, no vía MCP de Claude IA): `20260706170524 fix_handle_new_user_google_name_fallback`, `20260706170530 set_es_admin_nibelinco`.

**RPC disponibles:**
- `award_points_and_credits()` — otorga XP + Créditos en un call
- `deduct_credits()` — descuenta créditos al canjear
- `get_academy_ranking()` — ranking global (SECURITY DEFINER)
- `academy_reserve_vivencial_spot(course_id)` — reserva/reactiva enrollment y descuenta cupo (self-service). Desde el pivote a WhatsApp (Sesión 13) ya no es el camino principal de reserva — Yesica crea el enrollment manual en backoffice — pero se mantiene como fallback defensivo en el modal de subida de comprobante.
- `academy_liberar_cupo_vivencial(enrollment_id)` — admin-only, libera el cupo de un vivencial (el reembolso de lo ya transferido sigue siendo una acción manual externa).
- `academy_recalc_vivencial_balance(enrollment_id)` — interna, llamada solo por triggers. Recalcula `monto_señado_ars`/`monto_pendiente_ars`/`seña_pagada`/`pago_completado` de `academy_enrollments` a partir de los pagos aprobados. **Nunca escribir esos campos a mano desde el frontend.**

---

## 11. SCHEMA TRAVEXA 1.0 (Lovable — campos clave)

| Campo | Tipo | Fuente de verdad para |
|-------|------|-----------------------|
| `plan_name` | TEXT | Plan actual (explorador/guia/capitan) |
| `subscription_status` | TEXT | Acceso (pending/freemium/active/team) |
| `account_status` | TEXT | OBSOLETO — no usar |
| `membresia_vencimiento` | TIMESTAMPTZ | Cuándo vence |
| `ultimo_ingreso` | TIMESTAMPTZ | Último acceso |

**Bug conocido mp-webhook:** external_reference='PlanProfesionales' rompe renovaciones. Fix: fallback por mp_subscription_id.

---

## 12. FLUJO DE ONBOARDING Y PAGOS (Travexa Core — existente)

**MP configurado:**
- Guía: plan `3cf5bc2599b74ec78032951d08825898`
- Capitán: plan `e5cf9b81f3f7474cba3b35e07d5ea0ca`
- Webhook: `yzzquqseobovorbasogc.supabase.co/functions/v1/mp-webhook` ← cambiar al hacer cutover

---

## 13. PENDIENTES TÉCNICOS

### 🔴 Inmediato — Academy

| Item | Detalle |
|------|---------|
| Volver a activar "Confirm email" | Se apagó en Supabase para testear el onboarding sin rate limit. Sesión 10: confirmado que el auto-linking de identidades por email (Google ↔ contraseña, mismo email → misma cuenta) funciona nativo en Supabase Auth, pero solo es seguro contra account-takeover si "Confirm email" está activo. Sin eso, GoTrue auto-confirma signups y pierde esa protección. Es un toggle de Auth (Dashboard → Authentication → Sign In/Providers → Email), no se puede setear por SQL/migración. Activar antes de que Yesica u otro usuario real entre por primera vez |
| SMTP propio | El mail default de Supabase no aguanta volumen real de usuarios registrándose (Resend, SendGrid, etc.) |
| `MP_ACCESS_TOKEN` | Carga manual en Supabase Secrets. Bloquea el cobro real de **cursos** vía Mercado Pago. Ya **no** bloquea nada de vivenciales (esas se cobran fuera de la plataforma, ver Sesión 13) |
| JavaScript origins en Google OAuth Client | Quedó vacío al crear el client — no bloquea, pero conviene completarlo (dominio Vercel prod + localhost, y sumar el dominio propio cuando se haga el cutover) |
| ~~Google OAuth en producción~~ | ✅ Resuelto Sesión 11. No era un problema de Google Cloud Console (el redirect URI ahí ya estaba bien) sino del **Site URL de Supabase Auth**, que apuntaba a `localhost:3000` — puerto que nunca existió en el proyecto (Vite corre en 5173/5174). Se corrigió a `https://travexa-academy.vercel.app` + Redirect URLs con el dominio de Vercel y sus previews |
| Test users de Google OAuth | Mientras el OAuth Client esté en modo "Testing", solo pueden loguearse cuentas agregadas explícitamente en Google Cloud Console → OAuth consent screen → Test users |
| **[NUEVO] Dominio propio `academy.travexa.com.ar`** | Cutover pendiente de arrancar (tema de la próxima sesión). Pasos: alta del dominio en el proyecto Vercel, DNS en el proveedor de `travexa.com.ar`, actualizar Site URL/Redirect URLs de Supabase Auth, actualizar Authorized origins/redirect URIs de Google OAuth Client, verificar que no quede nada hardcodeado a `travexa-academy.vercel.app` en el código |
| **[NUEVO] Revisión visual end-to-end del flujo de vivenciales por WhatsApp** | Deployado en producción (commit `67f680c`, Vercel `dpl_C8NiJo6f3fKmxW7Vt6A2UDPnur7n`, `READY`), verificado a nivel de código/DB por Claude IA, pero todavía no probado por un humano de punta a punta (botón "Quiero anotarme" → WhatsApp, carga manual de pago en backoffice, subida de comprobante del viajero) |

### 🟡 Próximas semanas — Academy

| Item | Detalle |
|------|---------|
| Badge `top10_monthly` ("Top Learner") | Única condición de badge sin implementar — es ranking-based (top 10 mensual), no evento puntual. No la cubre `useGamification.ts` ni `check-badges`. Necesita lógica propia contra `get_academy_ranking()` |
| `/beneficios` | Página de canje de créditos (botón ya apunta a esta ruta) |
| Backoffice módulos/días | Crear módulos en cursos, días en vivenciales desde backoffice; drag-and-drop para reordenar módulos/lecciones e itinerario |
| Título en academy_certificates | Para certificados externos subidos por el usuario |
| PDF de certificados | Generación en backend |
| Auditar `academy_badges.condicion` completo | Se confirmó el set contra la DB real al arreglar `useGamification.ts` (Sesión 9) — verificar si hay condiciones cargadas en la tabla que ni el hook ni `check-badges` cubren todavía, más allá de `top10_monthly` |
| Testimonios reales de Home | `TestimonialsSection` está feature-flagged off (`SHOW_TESTIMONIALS = false`) desde la Sesión 12 — no hay reseñas reales todavía. Activar cuando existan |
| Ajustes finales de Home | Copy y estilos menores pendientes de la Sesión 12 (ver `CLAUDE_Academy_Actualizado.md`) |
| Hero animado (Fase 2) | Rama `feat/plane-takeoff-hero` sin mergear a `main`, pendiente de los 4 ajustes finales de Sesión 12 |
| **[NUEVO] Cuotas MP para vivenciales — decidir destino** | La edge function `create-vivencial-cuotas-payment` quedó deployada (ACTIVE) de la primera iteración de esta feature, pero ningún botón la invoca desde que se pivotó al modelo de WhatsApp (Sesión 13). Decidir si se retoma en el futuro o se da de baja (limpieza de deuda técnica) |
| `referral_code` formato legible | Hoy 8 caracteres random. Formato tipo `TRVX-NOMBRE-2026` evaluado pero sin decisión final — revisar antes de que se comparta en volumen |

### 🔵 F3-F5 — Core y expansión

| Item | Detalle |
|------|---------|
| Cutover DNS Core → Vercel | Lovable se apaga |
| Repos privados + Vercel Pro | Cuando el negocio lo justifique |
| Micrositios asesor.travexa.com.ar | F4 |
| CRM básico de pasajeros | F4 |
| App mobile | F5 |
| Comunidad: feed social + directorio | Pilar de producto de Academy, no construido todavía |
| Eventos: webinars con cards boarding pass | Pilar de producto de Academy, no construido todavía |

---

## 14. HISTORIAL DE SESIONES

### Sesión 1 — 31 Mayo 2026
- Auditoría completa del codebase (82 tablas, 31 edge functions, 120+ páginas)
- Agregados 3 columnas a profiles: membresia_vencimiento, ultimo_ingreso, plan_inicio_actual
- Actualizado mp-webhook para escribir plan/status/fechas

### Sesión 2 — 31 Mayo / 1 Junio 2026
- Auth.tsx: nuevo tab "Registrarse"
- Registro.tsx: conectado a create-subscription-account
- SuscripcionConfirmada.tsx: nueva página post-pago
- Test end-to-end exitoso ✅

### Sesión 3 — 22 Junio 2026
- Pivote estratégico definido
- Decisión: migrar Lovable → Vercel + Supabase propia
- Roadmap F0-F5 definido
- Documentos legales y para contadora redactados

### Sesión 4 — 27 Junio 2026
- Decisión de lanzar Travexa Academy como producto paralelo urgente
- Academy: spec completa creada
- Supabase `fvrwtqhkskbaixqbxami` definida como definitiva del ecosistema
- GitHub org + repos + Vercel configurados
- Arquitectura hub de usuarios definida

### Sesión 5 — 29 Junio 2026 (Academy)
- Schema extendido (tipos, vivencial, gamificación) + datos seed
- Prototipos HTML aprobados: `/cursos` y `/cursos/:slug`

### Sesión 6 — 30 Junio 2026 (Academy — Claude Code)
- Implementación React: `/cursos`, `/cursos/:slug`, `/vivencial`, `/vivencial/:slug`
- `src/lib/cupo.ts` — cupoEstado() como única fuente de verdad
- VivencialCard.tsx, VivencialCatalog.tsx, VivencialDetail.tsx creados
- framer-motion + canvas-confetti instalados

### Sesión 7 — 30 Junio / 1 Julio 2026 (Academy — diseño)
- Prototipo HTML `/vivencial` refinado y aprobado
- Prototipo HTML `/perfil` diseñado y aprobado (6 tabs, 7 modales)
- Sistema dual XP/Créditos definido (sin streaks)
- 5 niveles con nombres de viajero definidos (Explorador → Embajador)
- Sistema de referidos diseñado
- Regla de cupo sin mocking definida

### Sesión 8 — 1 Julio 2026 (Academy — implementación + DB)
- DB migrations aplicadas (3 migraciones en `fvrwtqhkskbaixqbxami`):
  - Nuevos campos en academy_profiles (creditos, fecha_nacimiento, genero, tipo_vendedor, anos_experiencia, destinos_principales)
  - pool en academy_points_transactions ('xp'|'creditos')
  - vivencial_pais, vivencial_region en academy_courses
  - creditos_otorgados en academy_referrals
  - Nueva tabla academy_credit_redemptions
  - Funciones SQL award_points_and_credits() y deduct_credits()
  - RPC get_academy_ranking() (creada por Claude Code, SECURITY DEFINER)
- Profile.tsx implementado por Claude Code (6 tabs, 7 modales, framer-motion completo)
- Header: "Cursos" → "Formación", "Mi perfil" cuando logueado
- Build limpio ✅ deployado en Vercel
- Error detectado en registro (destinos_principales) → backlog
- Google OAuth pendiente activación manual

### Sesión 9 — 2 Julio 2026 (Academy — onboarding obligatorio + referidos)
- Prototipo HTML `academy_onboarding_proto.html` diseñado y aprobado
- Onboarding obligatorio, gateado contra la DB, 3 pasos
- `handle_new_user()` ampliado con acreditación de referidos
- Edge functions `award-points` y `check-badges` deployadas
- Bugs de registro y OAuth corregidos
- Google OAuth activado y probado en local

### Sesión 10 — 3 Julio 2026 (Academy — Backoffice admin v1)
- Backoffice completo: Resumen, Cursos, Vivenciales, Métricas
- Migraciones de RLS admin aplicadas vía MCP
- Wizards de alta/edición en 5 pasos
- Deploy a producción, verificación de RLS end-to-end

### Sesión 11 — 5 Julio 2026 (Academy — bugs de producción + Beneficios/Instructores)
- Bugs de Google OAuth, 404 de SPA (`vercel.json`) y Realtime resueltos
- Auditoría de mocks en `/admin/*` — limpio salvo un label hardcodeado
- `/admin/beneficios` y `/admin/instructores` nuevos

### Sesión 12 — 2-6 Julio 2026 (Academy — Home pública, diseño + hero animado + producción)
- Prototipo `academy_home.html` diseñado desde cero para la nueva Home pública (`/`) de Academy
- Estructura final: hero + proof strip + 4 pilares + catálogo destacado + vivencial headliner + "cómo funciona" + testimonios + gamificación + CTA final + footer
- Principio de integridad de datos establecido: ningún número o testimonio de muestra puede llegar a producción sin conectarse a datos reales u ocultarse detrás de un flag
- Hero animado (Fase 2): diseño de "avión que despega" con scroll-scrubbing, implementado en rama `feat/plane-takeoff-hero`, sin mergear
- Fase 1 (Home estática) mergeada y en producción

### Sesión 13 — 6-7 Julio 2026 (Academy — pagos de vivenciales → pivote a WhatsApp)

**Diseño iterativo (Claude IA, conversación larga):**
- Se diseñó primero un modelo de pago de vivenciales self-service completo: seña por transferencia + saldo por transferencia (con cola de aprobación) + saldo/total en cuotas vía Mercado Pago, con reserva automática de cupo y recálculo de saldo vía trigger de Postgres.
- A mitad de la implementación, definición de negocio: **Travexa no factura vivenciales**. Se pivotó el diseño a un modelo 100% manual: la venta se cierra por WhatsApp con Yesica, quien carga la inscripción y los pagos (ya aprobados) directo en el backoffice. El viajero también puede subir su propio comprobante desde su perfil, sujeto a aprobación. La base de datos construida en la primera iteración (ledger de pagos + trigger de recálculo) sirvió igual para el modelo final, solo cambiaron quién dispara cada paso y las policies de quién puede insertar qué.
- `vivencial_whatsapp_url` se resemantizó: de "WhatsApp de consultas" pasó a ser el link al **grupo** de WhatsApp del viaje (Yesica lo carga cerca de la fecha de salida, visible solo con inscripción activa). El botón "Quiero anotarme" (pre-compra) apunta en cambio a un WhatsApp Business global nuevo (`travexa_whatsapp_business`), con mensaje pre-armado según género del usuario + nombre del vivencial.

**DB (Claude IA, vía MCP, sin pasar por Claude Code):**
- 4 migraciones aplicadas directamente (ver Sección 10 para el detalle): tabla `academy_vivencial_payments`, columnas nuevas en `academy_courses`/`academy_enrollments`/`academy_payments`, 3 RPCs, trigger de recálculo de saldo (extendido para disparar en INSERT y no solo UPDATE), bucket privado `academy-comprobantes` con RLS, nuevos settings.
- Verificado contra `pg_policies`/`pg_constraint`/advisors de Supabase antes y después de cada migración.

**Implementación (Claude Code, dos entregas):**
- Entrega 1: wizard con campo de cuotas, settings drawer con datos de transferencia, CTA de 3 botones (seña/transferencia/cuotas) + modales, edge function `create-vivencial-cuotas-payment`, rama nueva en `mp-webhook-academy` para vivenciales, backoffice con cola de aprobación.
- Entrega 2 (post-pivote): CTA reducido a 1 botón ("Quiero anotarme" → WhatsApp) + tags informativos, carga de pago directo desde backoffice (sin cola de aprobación para lo que carga el admin), `TransferModal` simplificado (sin mostrar CBU), wizard y settings drawer ajustados al nuevo modelo.

**Bug preexistente encontrado y corregido (no introducido en esta sesión):**
- En `mp-webhook-academy`, la rama de pagos de curso (`ACAD-COURSE-`) escribía el status crudo de Mercado Pago en inglés (`approved`, etc.) directo en la columna `estado`, que tiene un `CHECK` que solo acepta español. El `update` violaba el constraint y fallaba en silencio (el código no revisaba el `error` de retorno). Efecto: el acceso al curso se otorgaba igual (esa parte usa el status crudo de MP, no depende del campo), pero `academy_payments.estado` para compras de curso quedaba pegado en `'pendiente'` para siempre cuando el webhook era el único camino que procesaba el pago — subestimando ingresos en `/admin/metricas`. Corregido con un `estadoMap`/`toEstado()` compartido entre ambas ramas del webhook + logging de errores en los `update()`. No afectó nunca datos reales porque `academy_payments` estaba vacía (cero pagos procesados, `MP_ACCESS_TOKEN` nunca cargado).

**Verificación (Claude IA, vía MCP, independiente del reporte de Claude Code):**
- Código real de ambas edge functions (`create-vivencial-cuotas-payment`, `mp-webhook-academy` v2 y v3) releído y comparado contra lo pedido, no solo tomado del reporte.
- Migraciones confirmadas contra `list_migrations` (ninguna extra, ninguna faltante).
- Valores reales en producción confirmados: `travexa_whatsapp_business`, `genero` de `academy_profiles` (Masculino/Femenino).
- Deploy confirmado contra Vercel: commit `67f680c` → `dpl_C8NiJo6f3fKmxW7Vt6A2UDPnur7n` → `READY` → producción (`travexa-academy.vercel.app`).

**Quedó construido pero sin uso actualmente** (no se removió, ver Sección 13 - Pendientes): columnas `vivencial_precio_cuotas_ars/usd`, settings `travexa_datos_transferencia` y `mp_monto_minimo_cuotas_ars`, edge function `create-vivencial-cuotas-payment`, RPC `academy_reserve_vivencial_spot` (ahora solo fallback).

**Pendiente al cierre de la sesión:** revisión visual end-to-end del flujo por un humano (no probado todavía); dominio propio `academy.travexa.com.ar` (tema de la próxima sesión).

---

## 15. INSTRUCCIONES PARA CLAUDE (CTO IA)

- **Idioma:** español rioplatense en respuestas y UI. Código y comments en inglés.
- **Modo de trabajo:** preguntar antes de ejecutar en decisiones de arquitectura o producción. En tareas claras, ejecutar directo.
- **Respuestas:** cortas y directas. No listas largas innecesarias.
- **Stack:** React + Vite + TypeScript + Supabase + bun. No cambiar sin razón crítica.
- **Supabase definitiva:** `fvrwtqhkskbaixqbxami`. Nunca confundir con la de Lovable.
- **Lovable:** producción activa. No tocar hasta el cutover confirmado.
- **Repos:** `travexa-core` para el B2B, `travexa-academy` para Academy. No mezclar.
- **Campos canónicos Core:** `plan_name` + `subscription_status`. NUNCA `account_status`.
- **Hub de usuarios:** profiles → extensiones por producto. No duplicar campos entre tablas.
- **Nunca borrar datos de usuarios.**
- **Nunca romper producción.**
- **`vercel.json` con el rewrite catch-all de SPA es obligatorio en la raíz de cada proyecto React — no borrar ni "limpiar" pensando que no se usa.**
- **Nunca shippear estadísticas, testimonios o prueba social inventada.** Se conecta a datos reales o se oculta detrás de un flag hasta que existan — no alcanza con marcarlo como "muestra" visible al usuario (ver Sesión 12).
- **No agregar scroll-snap, scroll-jacking u otro comportamiento de scroll no pedido explícitamente** — cualquier control de scroll fuera de lo pedido se revierte (ver Sesión 12).
- **Los vivenciales no se cobran dentro de la plataforma.** La venta se cierra por WhatsApp y los pagos se registran manualmente en backoffice — no reintroducir un checkout propio para vivenciales sin que Yesica/Nico lo pidan explícitamente (ver Sesión 13).
- **El saldo de un vivencial nunca se edita a mano.** Se recalcula solo vía `academy_recalc_vivencial_balance()` cuando un pago pasa a `estado='aprobado'` — ver Sesión 13.
- **Los .md del proyecto son la fuente de verdad.**
- **Archivo de instrucciones Academy:** `CLAUDE_Academy_Actualizado.md` — no `CLAUDE.md`

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
