import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Course, Category, Instructor, Module, TipoCurso, LessonRecurso } from '@/types'

type CourseRow = Omit<Course, 'category' | 'instructor' | 'modules'> & {
  category: Category | null
  instructor: Instructor | null
}

export type CourseWrite = Partial<Omit<Course, 'category' | 'instructor' | 'modules'>>

export interface LessonInput {
  id?: string
  titulo: string
  descripcion: string | null
  video_url: string | null
  duracion_segundos: number | null
  es_preview: boolean
  recursos: LessonRecurso[] | Record<string, unknown> | null
  // clase en vivo por lección (link editable después, fecha/hora del stream)
  live_url: string | null
  fecha_vivo: string | null
  // portada propia; cae al thumbnail del curso si es null
  thumbnail_url: string | null
}
export interface ModuleInput {
  id?: string
  titulo: string
  descripcion: string | null
  lessons: LessonInput[]
}

const COURSE_SELECT = '*, category:academy_categories(*), instructor:academy_instructors(*)'

// Normalize null joins/jsonb defaults, matching useCourses.normalizeCourse.
function normalize(row: CourseRow): Course {
  return {
    ...row,
    tags: row.tags ?? [],
    fotos: row.fotos ?? [],
    incluye: row.incluye ?? null,
    no_incluye: row.no_incluye ?? null,
    vivencial_itinerario: row.vivencial_itinerario ?? [],
    vivencial_localidades: row.vivencial_localidades ?? [],
    vivencial_puntos_salida: row.vivencial_puntos_salida ?? [],
    vivencial_hoteles: row.vivencial_hoteles ?? [],
    vivencial_tipo_traslado: row.vivencial_tipo_traslado ?? [],
    vivencial_regimen_alimentos: row.vivencial_regimen_alimentos ?? [],
    category: row.category ?? undefined,
    instructor: row.instructor ?? undefined,
  } as Course
}

// ── Slug ─────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── List (admin sees every status) ───────────────────────────────
async function fetchAdminCourses(tipos: TipoCurso[]): Promise<Course[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select(COURSE_SELECT)
    .in('tipo', tipos)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as CourseRow[]).map(normalize)
}

export function useAdminCourses(tipos: TipoCurso[]) {
  return useQuery({
    queryKey: ['admin-courses', tipos.join(',')],
    queryFn:  () => fetchAdminCourses(tipos),
    staleTime: 1000 * 30,
  })
}

// ── Single course + curriculum ───────────────────────────────────
async function fetchAdminCourse(id: string): Promise<Course & { modules: Module[] }> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select(`
      *,
      category:academy_categories(*),
      instructor:academy_instructors(*),
      modules:academy_modules(*, lessons:academy_lessons(*))
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  const course = normalize(data as CourseRow)
  const modules = ((data as CourseRow & { modules?: Module[] }).modules ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map(m => ({ ...m, lessons: (m.lessons ?? []).slice().sort((a, b) => a.orden - b.orden) }))
  return { ...course, modules } as Course & { modules: Module[] }
}

export function useAdminCourse(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-course', id],
    queryFn:  () => fetchAdminCourse(id!),
    enabled:  !!id,
    staleTime: 1000 * 30,
  })
}

// ── Create / update course ───────────────────────────────────────
async function upsertCourse(input: CourseWrite & { id?: string }): Promise<Course> {
  const { id, ...rest } = input
  if (id) {
    const { data, error } = await supabaseWrite
      .from('academy_courses')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(COURSE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return normalize(data as CourseRow)
  }
  const { data, error } = await supabaseWrite
    .from('academy_courses')
    .insert({ ...rest, publicado: false })
    .select(COURSE_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return normalize(data as CourseRow)
}

export function useUpsertCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertCourse,
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-course', course.id] })
      qc.invalidateQueries({ queryKey: ['admin-summary'] })
    },
  })
}

// ── Curriculum diff-save ─────────────────────────────────────────
async function saveCurriculum(courseId: string, modules: ModuleInput[]): Promise<void> {
  const { data: existing } = await supabase
    .from('academy_modules')
    .select('id')
    .eq('course_id', courseId)

  const keepModuleIds = new Set(modules.filter(m => m.id).map(m => m.id!))
  const removedModules = (existing as { id: string }[] | null ?? []).filter(m => !keepModuleIds.has(m.id))

  // Remove modules that are gone (delete their lessons first to satisfy FKs).
  for (const m of removedModules) {
    await supabaseWrite.from('academy_lessons').delete().eq('module_id', m.id)
    await supabaseWrite.from('academy_modules').delete().eq('id', m.id)
  }

  let totalLecciones = 0
  let totalSegundos = 0
  // Fechas de las clases en vivo, para derivar la fecha "en vivo" a nivel curso.
  const liveDates: { fecha: string; live_url: string | null }[] = []

  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi]
    let moduleId = mod.id

    if (moduleId) {
      await supabaseWrite.from('academy_modules').update({ titulo: mod.titulo, descripcion: mod.descripcion || null, orden: mi }).eq('id', moduleId)
    } else {
      const { data, error } = await supabaseWrite.from('academy_modules')
        .insert({ course_id: courseId, titulo: mod.titulo, descripcion: mod.descripcion || null, orden: mi })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      moduleId = (data as { id: string }).id
    }

    // Lessons within this module.
    const { data: existingLessons } = await supabase
      .from('academy_lessons')
      .select('id')
      .eq('module_id', moduleId!)

    const keepLessonIds = new Set(mod.lessons.filter(l => l.id).map(l => l.id!))
    const removedLessons = (existingLessons as { id: string }[] | null ?? []).filter(l => !keepLessonIds.has(l.id))
    for (const l of removedLessons) {
      await supabaseWrite.from('academy_lessons').delete().eq('id', l.id)
    }

    for (let li = 0; li < mod.lessons.length; li++) {
      const lesson = mod.lessons[li]
      totalLecciones += 1
      totalSegundos += lesson.duracion_segundos ?? 0
      if (lesson.fecha_vivo) liveDates.push({ fecha: lesson.fecha_vivo, live_url: lesson.live_url || null })
      const payload = {
        module_id: moduleId,
        course_id: courseId,
        titulo: lesson.titulo,
        descripcion: lesson.descripcion,
        video_url: lesson.video_url,
        duracion_segundos: lesson.duracion_segundos,
        orden: li,
        es_preview: lesson.es_preview,
        recursos: lesson.recursos,
        // Marcador "en vivo" vacío ('') → null al persistir; la clase se reconoce por fecha_vivo.
        live_url: lesson.live_url || null,
        fecha_vivo: lesson.fecha_vivo,
        thumbnail_url: lesson.thumbnail_url,
      }
      if (lesson.id) {
        await supabaseWrite.from('academy_lessons').update(payload).eq('id', lesson.id)
      } else {
        const { error } = await supabaseWrite.from('academy_lessons').insert(payload)
        if (error) throw new Error(error.message)
      }
    }
  }

  // Derivar la fecha "en vivo" a nivel curso desde las lecciones: la próxima futura,
  // o (si todas pasaron) la última. Alimenta la card del catálogo y el estado en vivo
  // sin pedirle al admin que cargue la fecha dos veces. Ventana fija de 3h (180 min).
  const now = Date.now()
  const sorted = liveDates
    .map(d => ({ ...d, t: new Date(d.fecha).getTime() }))
    .filter(d => !Number.isNaN(d.t))
    .sort((a, b) => a.t - b.t)
  const chosen = sorted.find(d => d.t >= now) ?? sorted[sorted.length - 1] ?? null

  // Keep denormalized counters on the course in sync.
  await supabaseWrite.from('academy_courses')
    .update({
      total_lecciones: totalLecciones,
      duracion_total_minutos: Math.round(totalSegundos / 60),
      live_date: chosen ? chosen.fecha : null,
      live_url: chosen ? chosen.live_url : null,
      live_duration_minutes: chosen ? 180 : null,
    })
    .eq('id', courseId)
}

export function useSaveCurriculum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, modules }: { courseId: string; modules: ModuleInput[] }) =>
      saveCurriculum(courseId, modules),
    onSuccess: (_r, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] })
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    },
  })
}

// ── Publish / archive / delete ───────────────────────────────────
export function useTogglePublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, publicado }: { id: string; publicado: boolean }) => {
      const { error } = await supabaseWrite.from('academy_courses').update({ publicado }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-summary'] })
    },
  })
}

export function useArchiveCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archivado }: { id: string; archivado: boolean }) => {
      const { error } = await supabaseWrite.from('academy_courses').update({ archivado }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-summary'] })
    },
  })
}

// Hard delete only when the course has zero enrollments.
export function useHardDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('academy_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', id)
      if (countError) throw new Error(countError.message)
      if ((count ?? 0) > 0) {
        throw new Error('No se puede eliminar: el curso tiene inscriptos. Archivalo en su lugar.')
      }
      // Clean children first (defensive; FKs may not cascade).
      const { data: mods } = await supabase.from('academy_modules').select('id').eq('course_id', id)
      for (const m of (mods as { id: string }[] | null ?? [])) {
        await supabaseWrite.from('academy_lessons').delete().eq('module_id', m.id)
      }
      await supabaseWrite.from('academy_modules').delete().eq('course_id', id)
      await supabaseWrite.from('academy_lessons').delete().eq('course_id', id)
      const { error } = await supabaseWrite.from('academy_courses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-summary'] })
    },
  })
}

// ── Media upload (bucket academy-media) ──────────────────────────
export async function uploadMedia(courseKey: string, file: File, kind: 'thumbnail' | 'trailer' | 'gallery' | 'pdf' | 'lesson-thumb' | `itinerario-${number}`): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `courses/${courseKey}/${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('academy-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('academy-media').getPublicUrl(path)
  return data.publicUrl
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: ({ courseKey, file, kind }: { courseKey: string; file: File; kind: 'thumbnail' | 'trailer' | 'gallery' }) =>
      uploadMedia(courseKey, file, kind),
  })
}

// ── Instructors & categories (wizard dropdowns + drawer quick-add) ─
async function fetchAllInstructors(): Promise<Instructor[]> {
  const { data, error } = await supabase
    .from('academy_instructors')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return data as Instructor[]
}

export function useAdminInstructors() {
  return useQuery({ queryKey: ['admin-instructors'], queryFn: fetchAllInstructors, staleTime: 1000 * 60 })
}

export function useCreateInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string; bio?: string; revenue_share_pct?: number }): Promise<Instructor> => {
      const { data, error } = await supabaseWrite.from('academy_instructors')
        .insert({
          nombre: input.nombre,
          bio: input.bio ?? null,
          avatar_url: null,
          user_id: null,
          revenue_share_pct: input.revenue_share_pct ?? 0,
          activo: true,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data as Instructor
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-instructors'] }),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nombre: string }): Promise<Category> => {
      const { data, error } = await supabaseWrite.from('academy_categories')
        .insert({
          nombre: input.nombre,
          slug: slugify(input.nombre),
          icon: null,
          color: null,
          orden: 99,
          activo: true,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data as Category
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
