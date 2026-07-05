import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
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

// ── Realtime: UN solo canal por usuario, ref-contado ──────────────────
// useNotifications se monta en más de un componente a la vez (Header + Drawer).
// Sin esto, cada consumidor hacía supabase.channel(mismo-topic).on(...).subscribe():
// supabase-js reusa el canal por topic, así que el segundo .on() caía sobre un canal
// ya suscripto y tiraba "cannot add postgres_changes callbacks after subscribe()",
// error sincrónico no capturado que rompía el render (pantalla en blanco).
// Ahora se crea un único canal por userId, con todos los .on() antes del único
// .subscribe(), compartido por ref-count y limpiado cuando se va el último consumidor.
interface ChannelEntry {
  channel: RealtimeChannel
  refs: number
  listeners: Set<() => void>
}
const notifChannels = new Map<string, ChannelEntry>()
let notifChannelSeq = 0

function acquireNotifChannel(userId: string, listener: () => void): () => void {
  let entry = notifChannels.get(userId)

  if (!entry) {
    const listeners = new Set<() => void>()
    try {
      // Topic único por creación (contador monótono): evita reusar un canal viejo
      // pendiente de removeChannel, incluso en remounts inmediatos (StrictMode).
      const channel = supabase
        .channel(`notifications:${userId}:${++notifChannelSeq}`)
        .on(
          'postgres_changes' as Parameters<ReturnType<typeof supabase.channel>['on']>[0],
          { event: 'INSERT', schema: 'public', table: 'academy_notifications', filter: `user_id=eq.${userId}` },
          () => { listeners.forEach(l => { try { l() } catch { /* un listener no debe tumbar a los demás */ } }) },
        )
        .subscribe()
      entry = { channel, refs: 0, listeners }
      notifChannels.set(userId, entry)
    } catch (err) {
      // Realtime es best-effort: si falla, la app sigue (el query igual refetchea por staleTime/foco).
      console.warn('[notifications] no se pudo suscribir a realtime, se degrada:', err)
      return () => { /* no-op */ }
    }
  }

  entry.refs += 1
  entry.listeners.add(listener)

  return () => {
    const e = notifChannels.get(userId)
    if (!e) return
    e.listeners.delete(listener)
    e.refs -= 1
    if (e.refs <= 0) {
      try { void supabase.removeChannel(e.channel) } catch { /* ignore */ }
      notifChannels.delete(userId)
    }
  }
}

export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn:  () => fetchNotifications(userId!),
    staleTime: 0,
    enabled:  !!userId,
  })

  // Real-time subscription (canal único ref-contado + tolerante a fallos)
  useEffect(() => {
    if (!userId) return
    try {
      return acquireNotifChannel(userId, () => {
        void qc.invalidateQueries({ queryKey: ['notifications', userId] })
      })
    } catch (err) {
      console.warn('[notifications] realtime desactivado:', err)
      return
    }
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
