import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

async function fetchNotifications(userId: string): Promise<Notification[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('academy_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as Notification[]
}

async function markOneRead(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('academy_notifications').update({ leida: true }).eq('id', id)
}

async function markAllRead(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('academy_notifications')
    .update({ leida: true })
    .eq('user_id', userId)
    .eq('leida', false)
}

export async function createNotification(
  userId: string,
  tipo: string,
  titulo: string,
  mensaje?: string,
  url?: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('academy_notifications').insert({
    user_id: userId,
    tipo,
    titulo,
    mensaje: mensaje ?? null,
    url: url ?? null,
    leida: false,
  })
}

export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn:  () => fetchNotifications(userId!),
    staleTime: 0,
    enabled:  !!userId,
  })

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes' as Parameters<ReturnType<typeof supabase.channel>['on']>[0],
        {
          event: 'INSERT',
          schema: 'public',
          table: 'academy_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ['notifications', userId] })
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId, qc])

  const { mutate: markRead } = useMutation({
    mutationFn: markOneRead,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['notifications', userId] })
      const prev = qc.getQueryData<Notification[]>(['notifications', userId]) ?? []
      qc.setQueryData<Notification[]>(['notifications', userId], prev.map(n => n.id === id ? { ...n, leida: true } : n))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['notifications', userId], ctx.prev) },
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => markAllRead(userId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', userId] }),
  })

  const unreadCount = (query.data ?? []).filter(n => !n.leida).length

  return { notifications: query.data ?? [], unreadCount, markRead, markAll, isLoading: query.isLoading }
}
