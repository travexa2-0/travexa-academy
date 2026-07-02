// ── Database schema types — Travexa Academy ──

export type PlanName = 'free' | 'mensual' | 'anual'
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'pending'
export type TipoCuenta = 'asesor' | 'agencia' | 'instructor' | 'externo'
export type TipoAcceso = 'free' | 'paid' | 'subscription'
export type NivelCurso = 'principiante' | 'intermedio' | 'avanzado'
export type TipoCurso = 'grabado' | 'en_vivo' | 'vivencial'
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
export interface Instructor {
  id: string
  nombre: string
  bio: string | null
  avatar_url: string | null
  user_id: string | null
  revenue_share_pct: number
  activo: boolean
}

// ── Itinerario day (vivencial) ──
export interface ItinerarioDia {
  dia: string   // texto libre, ej: "Día 1", "Días 3-4"
  titulo: string
  descripcion: string
}

// ── academy_reviews ──
export interface Review {
  id: string
  course_id: string
  user_id: string | null
  nombre: string
  rating: number
  comentario: string | null
  publicado: boolean
  created_at: string
}

// ── academy_courses ──
export interface Course {
  id: string
  titulo: string
  slug: string
  descripcion: string | null
  thumbnail_url: string | null
  trailer_url: string | null
  category_id: string | null
  instructor_id: string | null
  nivel: NivelCurso
  tipo_acceso: TipoAcceso
  precio_usd: number | null
  precio_ars: number | null
  publicado: boolean
  destacado: boolean
  total_alumnos: number
  created_at: string
  // nuevos campos
  tipo: TipoCurso
  live_date: string | null
  live_url: string | null
  live_duration_minutes: number | null
  fotos: string[]
  incluye: string[]
  no_incluye: string[]
  duracion_total_minutos: number
  total_lecciones: number
  rating_avg: number
  rating_count: number
  // vivencial
  vivencial_fecha_salida: string | null
  vivencial_fecha_regreso: string | null
  vivencial_ciudad_salida: string | null
  vivencial_pais: string | null
  vivencial_punto_encuentro: string | null
  vivencial_cupo_maximo: number | null
  vivencial_cupo_disponible: number | null
  vivencial_itinerario: ItinerarioDia[]
  vivencial_hotel: string | null
  vivencial_precio_seña_ars: number | null
  vivencial_precio_seña_usd: number | null
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
  recursos: Record<string, unknown> | null
}

// ── academy_enrollments ──
export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  tipo_acceso: TipoAcceso
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
  // joined
  course?: Course
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
  tipo: 'curso' | 'suscripcion'
  course_id: string | null
  plan_name: PlanName | null
  monto_ars: number | null
  monto_usd: number | null
  mp_payment_id: string | null
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
    }
  }
}
