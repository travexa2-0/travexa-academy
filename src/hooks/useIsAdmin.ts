import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Reads profiles.es_admin for the current user. RLS lets every user read their own
// profile row, so a normal user simply resolves to false.
async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('es_admin')
    .eq('id', userId)
    .single<{ es_admin: boolean | null }>()

  if (error) return false
  return data?.es_admin === true
}

export function useIsAdmin() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn:  () => fetchIsAdmin(user!.id),
    staleTime: 1000 * 60 * 5,
    enabled:  !!user?.id,
  })
  return {
    isAdmin:   query.data === true,
    isLoading: query.isLoading,
  }
}
