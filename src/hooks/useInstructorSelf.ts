import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Instructor } from '@/types'

// Reads the academy_instructors row linked to the current user. The link itself is
// established in DB (auto-link by email), so an instructor never has to do anything
// for this to resolve. RLS lets anyone read active instructors, so a normal user
// simply resolves to null.
async function fetchInstructorSelf(userId: string): Promise<Instructor | null> {
  const { data, error } = await supabase
    .from('academy_instructors')
    .select('*')
    .eq('user_id', userId)
    .eq('activo', true)
    .maybeSingle<Instructor>()

  if (error) return null
  return data
}

export function useInstructorSelf() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['instructor-self', user?.id],
    queryFn:  () => fetchInstructorSelf(user!.id),
    staleTime: 1000 * 60 * 5,
    enabled:  !!user?.id,
  })

  return {
    instructor:   query.data ?? null,
    isInstructor: !!query.data,
    isLoading:    query.isLoading,
  }
}
