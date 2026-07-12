// ── Database schema types — Travexa Academy ──

export type PlanName = 'free' | 'mensual' | 'anual'
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'pending'
export type TipoCuenta = 'asesor' | 'agencia' | 'instructor' | 'externo'
// Valores reales del CHECK de academy_courses.tipo_acceso.
export type TipoAcceso = 'gratuito' | 'pago'
export type NivelCurso = 'principiante' | 'intermedio' | 'avanzado'
export type TipoCurso = 'grabado' | 'en_vivo' | 'vivencial' | 'ebook'
export type TipoPunto = 'ganado' | 'canjeado'
export type NivelUsuario = 'Explorador' | 'Asesor' | 'Experto' | 'Embajador'

export function nivelFromPuntos(puntos: number): NivelUsuario {
  if (puntos >= 5001) return 'Embajador'
  if (puntos >= 2001) return 'Experto'
  if (puntos >= 501)  return 'Asesor'
  return 'Explorador'
}

// ── Niveles de formación (fuente de verdad: proto academy_perfil) ──
// 5 niveles con thresholds de XP. academy_profiles.nivel guarda el número (1-5).
export interface NivelDef {
  n: number
  nombre: string
  min: number       // XP mínimo para alcanzar el nivel
  benefit: string
}

export const NIVELES: readonly NivelDef[] = [
  { n: 1, nombre: 'Explorador',     min: 0,    benefit: 'Acceso a todos los cursos gratuitos' },
  { n: 2, nombre: 'Aventurero',     min: 500,  benefit: '+5% de Créditos en cada compra' },
  { n: 3, nombre: 'Viajero',        min: 1000, benefit: 'Acceso anticipado a cursos nuevos' },
  { n: 4, nombre: 'Expedicionista', min: 2000, benefit: 'Acceso anticipado a vivenciales + badge exclusivo' },
  { n: 5, nombre: 'Embajador',      min: 5000, benefit: 'Descuento exclusivo en vivenciales + acceso VIP' },
] as const

export interface NivelInfo {
  actual: NivelDef
  siguiente: NivelDef | null
  progresoPct: number   // 0-100 dentro de la banda del nivel actual
  xpEnBanda: number     // XP acumulado dentro del nivel actual
  xpParaSiguiente: number // XP total del siguiente nivel (o el actual si es el último)
}

export function nivelInfo(puntos: number): NivelInfo {
  const xp  = Math.max(0, puntos)
  let idx = 0
  for (let i = 0; i < NIVELES.length; i++) {
    if (xp >= NIVELES[i].min) idx = i
  }
  const actual    = NIVELES[idx]
  const siguiente = NIVELES[idx + 1] ?? null
  if (!siguiente) {
    return { actual, siguiente: null, progresoPct: 100, xpEnBanda: xp - actual.min, xpParaSiguiente: actual.min }
  }
  const banda     = siguiente.min - actual.min
  const xpEnBanda = xp - actual.min
  const progresoPct = banda > 0 ? Math.min(100, Math.round((xpEnBanda / banda) * 100)) : 100
  return { actual, siguiente, progresoPct, xpEnBanda, xpParaSiguiente: siguiente.min }
}

// ── profiles (tabla hub compartida con todo Travexa) ──
export interface Profile {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  avatar_url: string | null
  telefono: string | null
  es_admin: boolean
  created_at: string
  updated_at: string
}

// ── academy_profiles (extensión Academy) ──
export interface AcademyProfile {
  id: string
  user_id: string
  plan_name: PlanName
  subscription_status: SubscriptionStatus
  subscription_start: string | null
  subscription_end: string | null
  mp_subscription_id: string | null
  tipo_cuenta: TipoCuenta
  travexa_b2b_member: boolean
  puntos: number
  nivel: number
  onboarding_completo: boolean
  ultimo_ingreso: string | null
  // nuevos campos
  pais: string | null
  bio: string | null
  ciudad: string | null
  especialidades: string[]
  username: string | null
  referral_code: string | null
  total_cursos_completados: number
  total_vivenciales: number
  streak_actual: number
  streak_maximo: number
  ultimo_acceso_leccion: string | null
  // gamificación económica + datos del asesor
  creditos: number
  fecha_nacimiento: string | null
  dni: string | null                        // capturado en onboarding (migración PROPUESTA)
  genero: string | null
  tipo_vendedor: string | null
  anos_experiencia: string | null
  destinos_principales: string[]
}

// ── academy_categories ──
export interface Category {
  id: string
  nombre: string
  slug: string
  icon: string | null
  color: string | null
  orden: number
  activo: boolean
}

// ── academy_instructors ──
export interface InstructorRedes {
  whatsapp?: string
  instagram?: string
  tiktok?: string
  web?: string
  [key: string]: string | undefined
}

export interface Instructor {
  id: string
  nombre: string
  bio: string | null
  avatar_url: string | null
  user_id: string | null
  revenue_share_pct: number
  activo: boolean
  especialidad?: string | null
  redes?: InstructorRedes | null
  email?: string | null
  telefono?: string | null
  created_at?: string
  updated_at?: string
}

// ── academy_benefits ──
export type BenefitTipo = 'curso_gratis' | 'descuento_pct' | 'descuento_fijo' | 'sorteo_vivencial' | 'otro'

export interface Benefit {
  id: string
  titulo: string
  descripcion: string | null
  tipo: BenefitTipo
  imagen_url: string | null
  costo_creditos: number
  course_id: string | null
  descuento_valor: number | null
  cupo_maximo: number | null
  cupo_usado: number
  fecha_inicio: string | null
  fecha_vencimiento: string | null
  publicado: boolean
  archivado: boolean
  ganador_user_id: string | null
  ganador_anunciado_at: string | null
  created_at: string
  updated_at: string
  // join opcional
  course?: { id: string; titulo: string; slug: string; tipo: string } | null
}

// ── academy_credit_redemptions (canje de un beneficio) ──
export interface BenefitRedemption {
  id: string
  user_id: string
  benefit_id: string | null
  tipo: string
  creditos_consumidos: number
  referencia_id: string | null
  descripcion: string | null
  created_at: string | null
  profile?: { id: string; nombre: string | null; apellido: string | null; email: string | null; avatar_url: string | null }
}

// ── Itinerario day (vivencial) ──
export interface ItinerarioDia {
  dia: string   // texto libre, ej: "Día 1", "Días 3-4"
  titulo: string
  descripcion: string
}

// ── Punto de salida (vivencial) ──
// `detalle_encuentro` es texto libre que cubre a la vez el punto de embarque y
// las instrucciones de encuentro (ej: "Terminal 2, mostrador Aerolíneas
// Argentinas, 3hs antes del vuelo"). Absorbe el viejo "punto de encuentro": no
// hay campo separado. `id` es solo client-side (key estable en el builder), no
// se persiste en el JSONB.
export interface VivencialPuntoSalida {
  ciudad: string
  detalle_encuentro: string
  id?: string
}

// ── Hotel del vivencial ──
// `id` es solo client-side (key estable en el builder), no se persiste.
export interface VivencialHotel {
  nombre: string
  noches: number
  link: string
  foto_url: string | null
  id?: string
}

// Opciones fijas de los filtros de vivencial (alimentan backoffice y público).
export const TIPO_TRASLADO_OPTIONS = ['Bus', 'Aéreo', 'Navegación', 'Crucero'] as const
export const REGIMEN_ALIMENTOS_OPTIONS = [
  'Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Media Pensión', 'Pensión Completa', 'All Inclusive',
] as const

// Lista fija de países para el dropdown del wizard (no input libre).
export const PAISES = [
  'Argentina', 'Uruguay', 'Chile', 'Brasil', 'Paraguay', 'Bolivia', 'Perú', 'Ecuador',
  'Colombia', 'Venezuela', 'México', 'Estados Unidos', 'Canadá', 'Cuba', 'República Dominicana',
  'Panamá', 'Costa Rica', 'España', 'Portugal', 'Francia', 'Italia', 'Reino Unido', 'Alemania',
  'Grecia', 'Turquía', 'Egipto', 'Marruecos', 'Sudáfrica', 'Emiratos Árabes Unidos', 'Tailandia',
  'Japón', 'China', 'India', 'Indonesia', 'Australia', 'Nueva Zelanda',
] as const

// ── Perfil resumido embebido en joins (reseñas, comentarios) ──
export interface ProfileMini {
  id: string
  nombre: string | null
  apellido: string | null
  avatar_url: string | null
}

// ── academy_reviews ──
// Se publica al responder (trigger en DB setea publicado=true al completar respuesta).
// Responden: el admin (cualquier curso) o el instructor dueño del curso (Sesión 16).
// Constraint en DB: comentario con mínimo 5 palabras. Unicidad (user_id, course_id).
export interface Review {
  id: string
  course_id: string
  user_id: string | null
  rating: number
  comentario: string | null
  publicado: boolean
  respuesta: string | null
  respondido_at: string | null
  created_at: string
  // joined
  profile?: ProfileMini | null
}

// ── academy_lesson_comments ──
// Pregunta del alumno bajo una lección. No es un foro entre alumnos: responde el admin
// o el instructor dueño del curso (Sesión 16).
// Se publica automáticamente vía trigger en DB cuando se completa `respuesta`.
export interface LessonComment {
  id: string
  lesson_id: string
  course_id: string
  user_id: string
  comentario: string
  respuesta: string | null
  respondido_at: string | null
  publicado: boolean
  created_at: string
  updated_at: string
  // joined
  profile?: ProfileMini | null
}

// ── academy_ebook_progress ──
export interface EbookProgress {
  id: string
  user_id: string
  course_id: string
  ultima_pagina: number
  completado: boolean
  completado_at: string | null
  created_at: string
  updated_at: string
}

// ── academy_courses ──
export interface Course {
  id: string
  titulo: string
  slug: string
  descripcion: string | null
  descripcion_larga: string | null
  thumbnail_url: string | null
  trailer_url: string | null
  category_id: string | null
  instructor_id: string | null
  nivel: NivelCurso
  tags: string[]
  tipo_acceso: TipoAcceso
  precio_usd: number | null
  precio_ars: number | null              // precio final tarjeta/cuotas
  precio_neto_ars: number | null         // lo que el negocio quiere cobrarse
  precio_transferencia_ars: number | null // precio final por transferencia
  publicado: boolean
  destacado: boolean
  archivado: boolean
  orden: number
  idioma: string | null
  duracion_minutos: number
  rating_promedio: number
  total_alumnos: number
  created_at: string
  // nuevos campos
  tipo: TipoCurso
  live_date: string | null
  live_url: string | null
  live_duration_minutes: number | null
  // ebook (solo cuando tipo='ebook')
  pdf_url: string | null
  total_paginas: number | null
  fotos: string[]
  // texto libre compartido con vivenciales (markdown **negrita**, un ítem por línea). NULL si vacío.
  incluye: string | null
  no_incluye: string | null
  duracion_total_minutos: number
  total_lecciones: number
  rating_avg: number
  rating_count: number
  // vivencial
  vivencial_fecha_salida: string | null
  vivencial_fecha_regreso: string | null
  vivencial_ciudad_salida: string | null   // DEPRECADA — usar vivencial_puntos_salida
  vivencial_pais: string | null
  vivencial_region: string | null
  vivencial_localidades: string[]           // filtro público por localidad
  vivencial_punto_encuentro: string | null  // DEPRECADA — absorbido en detalle_encuentro
  vivencial_cupo_maximo: number | null
  vivencial_cupo_disponible: number | null
  vivencial_itinerario: ItinerarioDia[]
  vivencial_hotel: string | null            // DEPRECADA — usar vivencial_hoteles
  vivencial_puntos_salida: VivencialPuntoSalida[]
  vivencial_hoteles: VivencialHotel[]
  // Desglose de precio. precio_usd/precio_ars pasan a ser el TOTAL FINAL:
  // total = base + impuestos + (base + impuestos) * gastos_admin_pct / 100
  vivencial_precio_base_usd: number | null
  vivencial_precio_base_ars: number | null
  vivencial_impuestos_usd: number | null    // monto fijo
  vivencial_impuestos_ars: number | null    // monto fijo
  vivencial_gastos_admin_pct: number | null // porcentaje, ej. 2.5
  vivencial_tipo_traslado: string[]         // Bus | Aéreo | Navegación | Crucero
  vivencial_regimen_alimentos: string[]
  vivencial_precio_seña_ars: number | null
  vivencial_precio_seña_usd: number | null
  vivencial_precio_cuotas_ars: number | null
  vivencial_precio_cuotas_usd: number | null
  vivencial_whatsapp_url: string | null
  // joined
  category?: Category
  instructor?: Instructor
  modules?: Module[]
}

// ── academy_modules ──
export interface Module {
  id: string
  course_id: string
  titulo: string
  descripcion: string | null
  orden: number
  lessons?: Lesson[]
}

// ── academy_lessons ──
export interface Lesson {
  id: string
  module_id: string
  course_id: string
  titulo: string
  video_url: string | null
  duracion_segundos: number | null
  orden: number
  es_preview: boolean
  recursos: LessonRecurso[] | Record<string, unknown> | null
  // clases en vivo con grabación
  fecha_vivo: string | null
  live_url: string | null
  // portada propia de la lección; cae al thumbnail del curso si es null
  thumbnail_url: string | null
}

// Recurso adjunto a una lección (PDF, link, etc.). Los PDFs se leen en canvas, nunca se descargan.
export interface LessonRecurso {
  tipo?: string
  titulo?: string
  url: string
}

// Estado inferido de una lección en vivo (no hay campo explícito en DB).
// - programada: falta para el vivo (o no hay link cargado todavía).
// - en_vivo: el vivo está al aire (dentro de la ventana desde fecha_vivo).
// - grabacion_pendiente: ya pasó el vivo pero no hay link ni grabación.
// - grabada: hay video (grabado subido, o el vivo que YouTube ya dejó como grabación en la misma live_url).
// - sin_video: no hay nada cargado.
export type LiveLessonState = 'programada' | 'en_vivo' | 'grabacion_pendiente' | 'grabada' | 'sin_video'

// Cuánto tiempo, desde fecha_vivo, se considera que una lección sigue "en vivo".
// No hay duración por lección en el schema, así que usamos una ventana fija.
// El chat embed de YouTube igual sólo renderiza mientras el stream está realmente al aire.
export const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000

export function liveLessonState(lesson: Pick<Lesson, 'video_url' | 'live_url' | 'fecha_vivo'>): LiveLessonState {
  // Grabado subido directo: siempre se reproduce como video normal.
  if (lesson.video_url) return 'grabada'
  // Lección en vivo (con fecha programada).
  if (lesson.fecha_vivo) {
    const start = new Date(lesson.fecha_vivo).getTime()
    const now = Date.now()
    if (!lesson.live_url) {
      // Todavía sin link de YouTube: antes de la fecha es "programada", después "grabación pendiente".
      return now < start ? 'programada' : 'grabacion_pendiente'
    }
    if (now < start) return 'programada'
    if (now <= start + LIVE_WINDOW_MS) return 'en_vivo'
    // Pasó la ventana: YouTube ya dejó la grabación en la misma URL.
    return 'grabada'
  }
  // Sin fecha pero con link cargado → tratarlo como grabado disponible.
  if (lesson.live_url) return 'grabada'
  return 'sin_video'
}

// ── academy_enrollments ──
export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  tipo_acceso: TipoAccesoEnrollment
  progreso_pct: number
  completado: boolean
  created_at: string
  // nuevos campos
  activo: boolean
  fecha_completado: string | null
  seña_pagada: boolean
  monto_total_ars: number | null
  monto_señado_ars: number | null
  monto_pendiente_ars: number | null
  pago_completado: boolean
  fecha_limite_pago: string | null
  // Reserva automática v3 (migración PROPUESTA 20260712010000, ver §7c):
  numero_reserva: string | null        // VIV-{año}-{consecutivo}, lo pone un trigger
  punto_salida_elegido: string | null  // punto de salida/embarque que eligió el viajero
  // joined
  course?: Course
}

// ── academy_vivencial_payments ──
export type VivencialPaymentEstado = 'pendiente' | 'aprobado' | 'rechazado'
export type VivencialPaymentTipo = 'sena' | 'transferencia'

// Método real del pago informado (distinto de `tipo`, que es seña vs saldo).
export type MetodoTransferencia = 'deposito' | 'transferencia'

export interface VivencialPayment {
  id: string
  enrollment_id: string
  user_id: string
  tipo: VivencialPaymentTipo
  monto_declarado_ars: number
  monto_aprobado_ars: number | null
  comprobante_url: string
  fecha_declarada: string
  estado: VivencialPaymentEstado
  notas_admin: string | null
  revisado_por: string | null
  revisado_at: string | null
  created_at: string
  updated_at: string
  // Datos del formulario "Informar transferencia" (migración PROPUESTA 20260712010000).
  // Nullable: los pagos que carga Yesica desde el backoffice pueden no traerlos.
  metodo: MetodoTransferencia | null
  depositante_nombre: string | null
  depositante_dni: string | null
  cupon_numero: string | null
  cuenta_destino: string | null
}

// ── travexa_datos_transferencia (setting key/value) ──
// Hoy es un único objeto. Si en el futuro se guarda un array, el form muestra un
// selector de cuenta destino. `normalizeCuentas()` (lib/vivencial) unifica ambos shapes.
export interface CuentaTransferencia {
  titular: string
  banco: string
  cbu: string
  alias: string
}

// ── academy_lesson_progress ──
export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completada: boolean
  segundos_vistos: number
}

// ── academy_payments ──
export interface Payment {
  id: string
  user_id: string
  tipo: 'curso' | 'suscripcion' | 'vivencial_cuotas'
  course_id: string | null
  enrollment_id: string | null
  plan_name: PlanName | null
  monto_ars: number | null
  monto_usd: number | null
  mp_payment_id: string | null
  mp_preference_id: string | null
  mp_external_reference: string | null
  mp_status: string | null
  estado: string
  created_at: string
}

// ── academy_subscriptions ──
export interface Subscription {
  id: string
  user_id: string
  plan_name: PlanName
  status: SubscriptionStatus
  mp_preapproval_id: string | null
  mp_plan_id: string | null
  inicio: string | null
  proximo_cobro: string | null
}

// ── academy_points_transactions ──
export type PointsPool = 'xp' | 'creditos'

export interface PointsTransaction {
  id: string
  user_id: string
  puntos: number
  tipo: TipoPunto
  motivo: string
  referencia_id: string | null
  pool: PointsPool
  created_at: string
}

// ── Ranking (RPC get_academy_ranking) ──
export interface RankingRow {
  user_id: string
  nombre: string | null
  apellido: string | null
  puntos: number
  nivel: number
  posicion: number
}

// ── academy_badges ──
export interface Badge {
  id: string
  nombre: string
  descripcion: string | null
  icono: string
  color: string
  condicion: string
  activo: boolean
}

// ── academy_user_badges ──
export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

// ── academy_certificates ──
export interface Certificate {
  id: string
  user_id: string
  course_id: string
  enrollment_id: string
  numero: string
  emitido_at: string
  course?: Course
}

// ── academy_wishlists ──
export interface Wishlist {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

// ── academy_notifications ──
export interface Notification {
  id: string
  user_id: string
  tipo: string
  titulo: string
  mensaje: string | null
  leida: boolean
  url: string | null
  created_at: string
}

// ── academy_referrals ──
export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  estado: 'pendiente' | 'completado'
  created_at: string
}

// ── Backoffice / admin ──

// Valores reales del CHECK de academy_enrollments.tipo_acceso (distinto del legacy TipoAcceso público).
export type TipoAccesoEnrollment = 'pago' | 'suscripcion' | 'gratuito' | 'regalo' | 'b2b'

// academy_settings (key/value jsonb, RLS admin-only)
export interface AcademySetting {
  key: string
  value: unknown
}

export interface AdminSettings {
  tipo_cambio_usd_ars: number
  comision_mp_pct: number
  meta_ingresos_mensual_ars: number
  inversion_marketing_mensual_ars: number
  mp_monto_minimo_cuotas_ars: number
  dias_limite_pago_vivencial: number
  travexa_whatsapp_business: string
  mp_recargo_tarjeta_pct: number
  mp_recargo_transferencia_pct: number
  mp_cuotas_max: number
}

// Inscripción con el perfil del alumno resuelto (para la tabla de inscriptos)
export interface EnrollmentWithProfile extends Enrollment {
  profile?: Pick<Profile, 'id' | 'nombre' | 'apellido' | 'email' | 'avatar_url' | 'telefono'>
  // Datos del asesor (academy_profiles) para la vista por viajero del backoffice.
  fecha_nacimiento?: string | null
  dni?: string | null
}

// KPIs del panel de Resumen
export interface AdminSummaryKpis {
  ingresosMesArs: number
  ventasMes: number
  alumnosNuevosMes: number
  cursosPublicados: number
  cursosBorrador: number
  vivencialesCupoAbierto: number
}

// ── academy_instructor_payouts ──
// Liquidación mensual por instructor. El mes lo cierra el admin a mano vía
// `academy_close_instructor_month`; `pagado` lo setea un trigger al cargarse
// `comprobante_pago_url`, nunca el frontend.
export interface InstructorPayout {
  id: string
  instructor_id: string
  periodo: string
  monto_bruto_ars: number
  monto_instructor_ars: number
  cantidad_ventas: number
  factura_url: string | null
  factura_subida_at: string | null
  comprobante_pago_url: string | null
  monto_pagado_ars: number | null
  fecha_pago: string | null
  pagado: boolean
  created_at: string
  updated_at: string
}

// ── Database type map ──
export interface Database {
  public: {
    Views:          Record<string, never>
    Functions:      Record<string, never>
    Enums:          Record<string, readonly string[]>
    CompositeTypes: Record<string, Record<string, unknown>>
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      academy_profiles: {
        Row: AcademyProfile
        Insert: {
          id?: string
          user_id: string
          plan_name: PlanName
          subscription_status: SubscriptionStatus
          tipo_cuenta: TipoCuenta
          [key: string]: unknown
        }
        Update: Partial<Omit<AcademyProfile, 'id' | 'user_id'>>
        Relationships: []
      }
      academy_categories: {
        Row: Category
        Insert: Omit<Category, 'id'>
        Update: Partial<Omit<Category, 'id'>>
        Relationships: []
      }
      academy_instructors: {
        Row: Instructor
        Insert: Omit<Instructor, 'id'>
        Update: Partial<Omit<Instructor, 'id'>>
        Relationships: []
      }
      academy_instructor_payouts: {
        Row: InstructorPayout
        Insert: Omit<InstructorPayout, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InstructorPayout, 'id'>>
        Relationships: []
      }
      academy_courses: {
        Row: Omit<Course, 'category' | 'instructor' | 'modules'>
        Insert: Omit<Course, 'id' | 'created_at' | 'total_alumnos' | 'category' | 'instructor' | 'modules'>
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'category' | 'instructor' | 'modules'>>
        Relationships: []
      }
      academy_modules: {
        Row: Omit<Module, 'lessons'>
        Insert: Omit<Module, 'id' | 'lessons'>
        Update: Partial<Omit<Module, 'id' | 'lessons'>>
        Relationships: []
      }
      academy_lessons: {
        Row: Lesson
        Insert: Omit<Lesson, 'id'>
        Update: Partial<Omit<Lesson, 'id'>>
        Relationships: []
      }
      academy_enrollments: {
        Row: Enrollment
        Insert: Omit<Enrollment, 'id' | 'created_at'>
        Update: Partial<Omit<Enrollment, 'id' | 'user_id' | 'course_id' | 'created_at'>>
        Relationships: []
      }
      academy_lesson_progress: {
        Row: LessonProgress
        Insert: Omit<LessonProgress, 'id'>
        Update: Partial<Omit<LessonProgress, 'id' | 'user_id' | 'lesson_id'>>
        Relationships: []
      }
      academy_payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      academy_subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id'>
        Update: Partial<Omit<Subscription, 'id' | 'user_id'>>
        Relationships: []
      }
      academy_points_transactions: {
        Row: PointsTransaction
        Insert: Omit<PointsTransaction, 'id' | 'created_at'>
        Update: Partial<Omit<PointsTransaction, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      academy_badges: {
        Row: Badge
        Insert: Omit<Badge, 'id'>
        Update: Partial<Omit<Badge, 'id'>>
        Relationships: []
      }
      academy_user_badges: {
        Row: UserBadge
        Insert: Omit<UserBadge, 'id' | 'earned_at'>
        Update: Partial<Omit<UserBadge, 'id'>>
        Relationships: []
      }
      academy_certificates: {
        Row: Certificate
        Insert: Omit<Certificate, 'id' | 'numero' | 'emitido_at'>
        Update: Partial<Omit<Certificate, 'id'>>
        Relationships: []
      }
      academy_wishlists: {
        Row: Wishlist
        Insert: Omit<Wishlist, 'id' | 'created_at'>
        Update: Partial<Omit<Wishlist, 'id'>>
        Relationships: []
      }
      academy_notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      academy_referrals: {
        Row: Referral
        Insert: Omit<Referral, 'id' | 'created_at'>
        Update: Partial<Omit<Referral, 'id'>>
        Relationships: []
      }
      academy_reviews: {
        Row: Omit<Review, 'profile'>
        Insert: Omit<Review, 'id' | 'created_at' | 'publicado' | 'respuesta' | 'respondido_at' | 'profile'>
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'profile'>>
        Relationships: []
      }
      academy_lesson_comments: {
        Row: Omit<LessonComment, 'profile'>
        Insert: Omit<LessonComment, 'id' | 'created_at' | 'updated_at' | 'publicado' | 'respuesta' | 'respondido_at' | 'profile'>
        Update: Partial<Omit<LessonComment, 'id' | 'created_at' | 'profile'>>
        Relationships: []
      }
      academy_ebook_progress: {
        Row: EbookProgress
        Insert: Omit<EbookProgress, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EbookProgress, 'id' | 'user_id' | 'course_id' | 'created_at'>>
        Relationships: []
      }
      academy_settings: {
        Row: AcademySetting
        Insert: AcademySetting
        Update: Partial<AcademySetting>
        Relationships: []
      }
    }
  }
}
