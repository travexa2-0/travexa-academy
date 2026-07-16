import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Instructor, InstructorRedes } from '@/types'

// Instructor con métricas derivadas para el listado del backoffice.
export interface InstructorRow extends Instructor {
  cursosPublicados: number
  cursosTotales: number
}

interface CourseLite {
  id: string
  titulo: string
  slug: string
  tipo: string
  instructor_id: string | null
  publicado: boolean
  archivado: boolean
  total_alumnos: number | null
}

// ── List + conteo de cursos por instructor ────────────────────────
async function fetchInstructorsFull(): Promise<InstructorRow[]> {
  const [instrRes, courseRes] = await Promise.all([
    supabase.from('academy_instructors').select('*').order('nombre', { ascending: true }),
    supabase.from('academy_courses').select('id, instructor_id, publicado, archivado'),
  ])
  if (instrRes.error) throw new Error(instrRes.error.message)

  const instructors = (instrRes.data ?? []) as Instructor[]
  const courses = (courseRes.data as Pick<CourseLite, 'id' | 'instructor_id' | 'publicado' | 'archivado'>[] | null) ?? []

  return instructors.map(i => {
    const suyos = courses.filter(c => c.instructor_id === i.id && !c.archivado)
    return {
      ...i,
      cursosTotales: suyos.length,
      cursosPublicados: suyos.filter(c => c.publicado).length,
    }
  })
}

export function useInstructorsFull() {
  return useQuery({ queryKey: ['admin-instructors-full'], queryFn: fetchInstructorsFull, staleTime: 1000 * 30 })
}

// ── Cursos de un instructor (para el detalle) ─────────────────────
export interface InstructorCourse {
  id: string
  titulo: string
  slug: string
  tipo: string
  publicado: boolean
  archivado: boolean
  total_alumnos: number
}

async function fetchInstructorCourses(instructorId: string): Promise<InstructorCourse[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('id, titulo, slug, tipo, publicado, archivado, total_alumnos')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data as CourseLite[] | null) ?? []).map(c => ({
    id: c.id, titulo: c.titulo, slug: c.slug, tipo: c.tipo,
    publicado: c.publicado, archivado: c.archivado, total_alumnos: c.total_alumnos ?? 0,
  }))
}

export function useInstructorCourses(instructorId: string | undefined) {
  return useQuery({
    queryKey: ['admin-instructor-courses', instructorId],
    queryFn:  () => fetchInstructorCourses(instructorId!),
    enabled:  !!instructorId,
    staleTime: 1000 * 30,
  })
}

// ── Create / update (formulario completo) ─────────────────────────
export interface InstructorInput {
  id?: string
  nombre: string
  bio: string | null
  avatar_url: string | null
  especialidad: string | null
  redes: InstructorRedes
  revenue_share_pct: number
  email: string | null
  telefono: string | null
  activo: boolean
  user_id: string | null
}

async function upsertInstructor(input: InstructorInput): Promise<Instructor> {
  const { id, ...rest } = input
  if (id) {
    const { data, error } = await supabaseWrite
      .from('academy_instructors')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return data as Instructor
  }
  const { data, error } = await supabaseWrite
    .from('academy_instructors')
    .insert(rest)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Instructor
}

export function useUpsertInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertInstructor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-instructors-full'] })
      qc.invalidateQueries({ queryKey: ['admin-instructors'] })
    },
  })
}

// ── Activar / desactivar ──────────────────────────────────────────
export function useToggleInstructorActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabaseWrite.from('academy_instructors').update({ activo }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-instructors-full'] })
      qc.invalidateQueries({ queryKey: ['admin-instructors'] })
    },
  })
}

// Hard delete solo si no tiene cursos vinculados.
export function useDeleteInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('academy_courses')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', id)
      if (countError) throw new Error(countError.message)
      if ((count ?? 0) > 0) {
        throw new Error('No se puede eliminar: tiene cursos vinculados. Desactivalo en su lugar.')
      }
      const { error } = await supabaseWrite.from('academy_instructors').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-instructors-full'] })
      qc.invalidateQueries({ queryKey: ['admin-instructors'] })
    },
  })
}

// ── Buscar la cuenta de usuario detrás de un email ─────────────────
// Se usa tanto para vincular manualmente (user_id) como para avisarle al admin,
// mientras carga un instructor, que ese email YA tiene cuenta en la plataforma
// y precargar lo que el usuario ya cargó (nombre, teléfono).
export interface AccountByEmail {
  id: string
  nombre: string | null
  apellido: string | null
  telefono: string | null
}

export async function findProfileByEmail(email: string): Promise<AccountByEmail | null> {
  const mail = email.trim().toLowerCase()
  if (!mail) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, telefono')
    .eq('email', mail)
    .maybeSingle<AccountByEmail>()
  if (error) throw new Error(error.message)
  return data
}
