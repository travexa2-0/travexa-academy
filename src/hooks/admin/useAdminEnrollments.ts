import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Enrollment, EnrollmentWithProfile, Profile, TipoAccesoEnrollment } from '@/types'

type ProfileLite = Pick<Profile, 'id' | 'nombre' | 'apellido' | 'email' | 'avatar_url'>

// Enrollments for one course, with each student's profile merged in JS
// (no reliable PostgREST FK embed between academy_enrollments and profiles).
async function fetchEnrollments(courseId: string): Promise<EnrollmentWithProfile[]> {
  const { data, error } = await supabase
    .from('academy_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const enrollments = (data ?? []) as Enrollment[]
  const userIds = [...new Set(enrollments.map(e => e.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email, avatar_url')
    .in('id', userIds)

  const byId = new Map((profiles as ProfileLite[] | null ?? []).map(p => [p.id, p]))
  return enrollments.map(e => ({ ...e, profile: byId.get(e.user_id) }))
}

export function useCourseEnrollments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-enrollments', courseId],
    queryFn:  () => fetchEnrollments(courseId!),
    enabled:  !!courseId,
    staleTime: 1000 * 30,
  })
}

export interface ManualEnrollmentInput {
  courseId: string
  userId: string
  tipoAcceso: TipoAccesoEnrollment
  isVivencial: boolean
  montoTotalArs?: number | null
  montoSeñadoArs?: number | null
  señaPagada?: boolean
}

// Creates a manual enrollment. For vivenciales it also decrements the available
// seat count by 1 (floored at 0), since that seat is now taken.
async function createManualEnrollment(input: ManualEnrollmentInput): Promise<void> {
  const montoTotal = input.montoTotalArs ?? null
  const montoSeñado = input.montoSeñadoArs ?? null
  const pendiente = montoTotal != null && montoSeñado != null ? Math.max(0, montoTotal - montoSeñado) : null

  const { error } = await supabaseWrite.from('academy_enrollments').insert({
    user_id: input.userId,
    course_id: input.courseId,
    tipo_acceso: input.tipoAcceso,
    activo: true,
    seña_pagada: input.señaPagada ?? false,
    monto_total_ars: montoTotal,
    monto_señado_ars: montoSeñado,
    monto_pendiente_ars: pendiente,
  })
  if (error) throw new Error(error.message)

  if (input.isVivencial) {
    const { data: course } = await supabase
      .from('academy_courses')
      .select('vivencial_cupo_disponible')
      .eq('id', input.courseId)
      .single<{ vivencial_cupo_disponible: number | null }>()
    const current = course?.vivencial_cupo_disponible
    if (typeof current === 'number') {
      await supabaseWrite.from('academy_courses')
        .update({ vivencial_cupo_disponible: Math.max(0, current - 1) })
        .eq('id', input.courseId)
    }
  }
}

export function useManualEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createManualEnrollment,
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['admin-enrollments', input.courseId] })
      qc.invalidateQueries({ queryKey: ['admin-course', input.courseId] })
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
    },
  })
}
