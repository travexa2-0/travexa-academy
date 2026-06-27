// ── Database schema types — Travexa Academy ──

export type PlanName = 'free' | 'mensual' | 'anual'
export type SubscriptionStatus = 'free' | 'active' | 'cancelled' | 'pending'
export type TipoCuenta = 'asesor' | 'agencia' | 'instructor' | 'externo'
export type TipoAcceso = 'free' | 'paid' | 'subscription'
export type NivelCurso = 'principiante' | 'intermedio' | 'avanzado'

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
  // joined
  category?: Category
  instructor?: Instructor
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

// ── Database type map (para createClient<Database>) ──
// Debe tener Views/Functions/Enums/CompositeTypes + Relationships por tabla
// para que supabase-js resuelva los tipos correctamente.
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
          subscription_start?: string | null
          subscription_end?: string | null
          mp_subscription_id?: string | null
          tipo_cuenta: TipoCuenta
          travexa_b2b_member?: boolean
          puntos?: number
          nivel?: number
          onboarding_completo?: boolean
          ultimo_ingreso?: string | null
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
        Row: Omit<Course, 'category' | 'instructor'>
        Insert: Omit<Course, 'id' | 'created_at' | 'total_alumnos' | 'category' | 'instructor'>
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'category' | 'instructor'>>
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
    }
  }
}
