import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InstructorRedes } from '@/types'

// Instructores para la página pública /instructores. Se leen SOLO los campos que
// se muestran en la tarjeta (no email/teléfono/revenue_share, aunque la policy
// "Instructores públicos" permita la fila entera). Fuente única: la tabla real
// `academy_instructors` — nada hardcodeado, así sumar/sacar un instructor no
// requiere tocar código.
export interface PublicInstructor {
  id: string
  nombre: string
  bio: string | null
  avatar_url: string | null
  especialidad: string | null
  redes: InstructorRedes | null
}

async function fetchInstructors(): Promise<PublicInstructor[]> {
  const { data, error } = await supabase
    .from('academy_instructors')
    .select('id, nombre, bio, avatar_url, especialidad, redes')
    .eq('activo', true)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PublicInstructor[]
}

export function useInstructors() {
  return useQuery({
    queryKey: ['public-instructors'],
    queryFn: fetchInstructors,
    staleTime: 1000 * 60 * 10,
  })
}
