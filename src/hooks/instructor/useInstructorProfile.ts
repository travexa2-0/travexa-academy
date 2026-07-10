import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { InstructorRedes } from '@/types'

// Campos que el instructor puede editar de su propia fila. `nombre`, `email`,
// `user_id`, `revenue_share_pct` y `activo` los revierte el trigger
// `protect_instructor_admin_fields` si llegaran a mandarse — no se exponen en el form.
export interface InstructorProfileInput {
  instructorId: string
  bio: string | null
  avatar_url: string | null
  especialidad: string | null
  redes: InstructorRedes
}

export function useUpdateInstructorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ instructorId, bio, avatar_url, especialidad, redes }: InstructorProfileInput) => {
      const { error } = await supabaseWrite
        .from('academy_instructors')
        .update({ bio, avatar_url, especialidad, redes, updated_at: new Date().toISOString() })
        .eq('id', instructorId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['instructor-self'] })
    },
  })
}

// El avatar va al bucket público `academy-media`, bajo la carpeta del usuario
// (las policies de update/delete exigen que el primer segmento sea auth.uid()).
export async function uploadInstructorAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/instructor-avatar-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('academy-media')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('academy-media').getPublicUrl(path)
  return data.publicUrl
}
