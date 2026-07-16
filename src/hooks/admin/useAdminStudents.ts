import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'

// Alumnos = usuarios de la plataforma que NO son admin. Un instructor que además
// es alumno puede aparecer; los admin quedan fuera de la lista y del conteo.
//
// No hay FK embebida confiable entre academy_enrollments / academy_profiles y
// profiles (mismo motivo que useAdminEnrollments), así que traemos cada tabla por
// separado y armamos el join en JS.

const COURSE_TIPOS = ['grabado', 'en_vivo', 'ebook'] as const

export interface StudentRow {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  avatar_url: string | null
  telefono: string | null
  created_at: string
  ciudad: string | null
  pais: string | null
  ultimo_ingreso: string | null
  activo: boolean           // profiles.activo — soft-delete de bookkeeping interno
  cursosCount: number       // enrollments activos con curso grabado/en_vivo/ebook
  vivencialesCount: number  // enrollments activos con curso vivencial
}

type ProfileLite = {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  avatar_url: string | null
  telefono: string | null
  created_at: string
  activo: boolean
}
type AcademyLite = { user_id: string; ciudad: string | null; pais: string | null; ultimo_ingreso: string | null }
type EnrollmentLite = { user_id: string; course_id: string; activo: boolean }
type CourseTipoLite = { id: string; tipo: string }

async function fetchStudents(): Promise<StudentRow[]> {
  const { data: profilesData, error } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido, avatar_url, telefono, created_at, activo')
    .eq('es_admin', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const profiles = (profilesData as ProfileLite[] | null) ?? []
  const userIds = profiles.map(p => p.id)
  if (userIds.length === 0) return []

  const [{ data: academyData }, { data: enrollData }, { data: courseData }] = await Promise.all([
    supabase.from('academy_profiles').select('user_id, ciudad, pais, ultimo_ingreso').in('user_id', userIds),
    supabase.from('academy_enrollments').select('user_id, course_id, activo').eq('activo', true).in('user_id', userIds),
    supabase.from('academy_courses').select('id, tipo'),
  ])

  const academyByUser = new Map((academyData as AcademyLite[] | null ?? []).map(a => [a.user_id, a]))
  const tipoByCourse = new Map((courseData as CourseTipoLite[] | null ?? []).map(c => [c.id, c.tipo]))

  // Conteo de cursos vs vivenciales por alumno según el tipo del curso inscripto.
  const cursos = new Map<string, number>()
  const vivenciales = new Map<string, number>()
  for (const e of (enrollData as EnrollmentLite[] | null ?? [])) {
    const tipo = tipoByCourse.get(e.course_id)
    if (!tipo) continue
    if (tipo === 'vivencial') vivenciales.set(e.user_id, (vivenciales.get(e.user_id) ?? 0) + 1)
    else if ((COURSE_TIPOS as readonly string[]).includes(tipo)) cursos.set(e.user_id, (cursos.get(e.user_id) ?? 0) + 1)
  }

  return profiles.map(p => {
    const a = academyByUser.get(p.id)
    return {
      id: p.id,
      email: p.email,
      nombre: p.nombre,
      apellido: p.apellido,
      avatar_url: p.avatar_url,
      telefono: p.telefono,
      created_at: p.created_at,
      ciudad: a?.ciudad ?? null,
      pais: a?.pais ?? null,
      ultimo_ingreso: a?.ultimo_ingreso ?? null,
      activo: p.activo,
      cursosCount: cursos.get(p.id) ?? 0,
      vivencialesCount: vivenciales.get(p.id) ?? 0,
    }
  })
}

export function useAdminStudents() {
  return useQuery({ queryKey: ['admin-students'], queryFn: fetchStudents, staleTime: 1000 * 30 })
}

// ── Detalle de un alumno (drawer) ─────────────────────────────────
export interface StudentGamification {
  puntos: number
  nivel: number
  streak_actual: number
  streak_maximo: number
  total_cursos_completados: number
  total_vivenciales: number
  dni: string | null
  fecha_nacimiento: string | null
  genero: string | null
  tipo_cuenta: string | null
  username: string | null
  bio: string | null
  creditos: number
}

export interface StudentEnrollment {
  id: string
  course_id: string
  titulo: string
  tipo: string
  progreso_pct: number
  completado: boolean
  created_at: string
  numero_reserva: string | null
  seña_pagada: boolean
  pago_completado: boolean
  monto_total_ars: number | null
  monto_señado_ars: number | null
  monto_pendiente_ars: number | null
}

export interface StudentPayment {
  id: string
  tipo: string
  monto_ars: number | null
  estado: string
  created_at: string
  comprobante_url: string | null
}

export interface StudentDetail {
  gamification: StudentGamification | null
  enrollments: StudentEnrollment[]
  payments: StudentPayment[]
}

type EnrollmentFull = {
  id: string
  course_id: string
  progreso_pct: number
  completado: boolean
  created_at: string
  numero_reserva: string | null
  seña_pagada: boolean
  pago_completado: boolean
  monto_total_ars: number | null
  monto_señado_ars: number | null
  monto_pendiente_ars: number | null
}

async function fetchStudentDetail(userId: string): Promise<StudentDetail> {
  const [academyRes, enrollRes, payRes] = await Promise.all([
    supabase
      .from('academy_profiles')
      .select('puntos, nivel, streak_actual, streak_maximo, total_cursos_completados, total_vivenciales, dni, fecha_nacimiento, genero, tipo_cuenta, username, bio, creditos')
      .eq('user_id', userId)
      .maybeSingle<StudentGamification>(),
    supabase
      .from('academy_enrollments')
      .select('id, course_id, progreso_pct, completado, created_at, numero_reserva, seña_pagada, pago_completado, monto_total_ars, monto_señado_ars, monto_pendiente_ars')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('academy_payments')
      .select('id, tipo, monto_ars, estado, created_at, comprobante_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const enrollments = (enrollRes.data as EnrollmentFull[] | null) ?? []
  const courseIds = [...new Set(enrollments.map(e => e.course_id))]
  const titleByCourse = new Map<string, { titulo: string; tipo: string }>()
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('academy_courses')
      .select('id, titulo, tipo')
      .in('id', courseIds)
    for (const c of (courses as { id: string; titulo: string; tipo: string }[] | null ?? [])) {
      titleByCourse.set(c.id, { titulo: c.titulo, tipo: c.tipo })
    }
  }

  return {
    gamification: academyRes.data ?? null,
    enrollments: enrollments.map(e => ({
      id: e.id,
      course_id: e.course_id,
      titulo: titleByCourse.get(e.course_id)?.titulo ?? 'Curso',
      tipo: titleByCourse.get(e.course_id)?.tipo ?? '',
      progreso_pct: e.progreso_pct,
      completado: e.completado,
      created_at: e.created_at,
      numero_reserva: e.numero_reserva,
      seña_pagada: e.seña_pagada,
      pago_completado: e.pago_completado,
      monto_total_ars: e.monto_total_ars,
      monto_señado_ars: e.monto_señado_ars,
      monto_pendiente_ars: e.monto_pendiente_ars,
    })),
    payments: (payRes.data as StudentPayment[] | null) ?? [],
  }
}

export function useStudentDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin-student-detail', userId],
    queryFn:  () => fetchStudentDetail(userId!),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  })
}

// ── Dar de baja / reactivar (soft-delete) ─────────────────────────
// Flag interno de bookkeeping: profiles.activo = false. NUNCA un delete, y no
// toca Supabase Auth (no bloquea el login: eso sería otra tarea con service_role).
export function useToggleStudentActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabaseWrite.from('profiles').update({ activo }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-students'] })
      qc.invalidateQueries({ queryKey: ['admin-student-detail', id] })
    },
  })
}
