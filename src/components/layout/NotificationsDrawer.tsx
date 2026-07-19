import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { EASE_DRAWER } from '@/lib/motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Notification icon map ─────────────────────────────────────────

const TIPO_META: Record<string, { emoji: string; color: string; bg: string }> = {
  pago_confirmado:    { emoji: '✅', color: 'var(--success)',  bg: 'var(--success-s)' },
  curso_completado:   { emoji: '🎓', color: 'var(--primary-l)', bg: 'var(--primary-s)' },
  streak:             { emoji: '🔥', color: 'var(--pending)',  bg: 'var(--pending-s)' },
  streak_peligro:     { emoji: '⚠️', color: 'var(--pending)',  bg: 'var(--pending-s)' },
  live_pronto:        { emoji: '📅', color: '#ef4444',         bg: 'rgba(239,68,68,.12)' },
  vivencial_pronto:   { emoji: '✈️', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  vivencial_completo: { emoji: '✈️', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  badge_desbloqueado: { emoji: '🏆', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  referido_registrado:{ emoji: '👥', color: 'var(--primary-l)', bg: 'var(--primary-s)' },
  nuevo_curso:        { emoji: '⭐', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  puntos_ganados:     { emoji: '🪙', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  canje_beneficio:    { emoji: '🎁', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
  sorteo_resultado:   { emoji: '🏆', color: 'var(--gold)',     bg: 'var(--gold-soft)' },
}

function getMeta(tipo: string) {
  return TIPO_META[tipo] ?? { emoji: '🔔', color: 'var(--text-2)', bg: 'var(--card)' }
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
  } catch {
    return ''
  }
}

// ── Group notifications by date ───────────────────────────────────

function groupByDate(notifications: ReturnType<typeof useNotifications>['notifications']) {
  const hoy   = new Date().toDateString()
  const ayer  = new Date(Date.now() - 86400000).toDateString()
  const groups: { label: string; items: typeof notifications }[] = [
    { label: 'Hoy',     items: [] },
    { label: 'Ayer',    items: [] },
    { label: 'Antes',   items: [] },
  ]
  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString()
    if (d === hoy)  groups[0].items.push(n)
    else if (d === ayer) groups[1].items.push(n)
    else groups[2].items.push(n)
  }
  return groups.filter(g => g.items.length > 0)
}

// ── Escala de capas (z-index) ─────────────────────────────────────
// Orden consistente de arriba hacia abajo:
//   modales de página (700/800) > notificaciones (60/70) > header (50) >
//   menú mobile (40) > barras sticky de página, ej. tabs de /perfil (30) > contenido.
// El panel de notificaciones arranca DEBAJO del header (no lo invade) y queda por
// encima en z, así nunca lo recorta ni le tapa el nav. El backdrop también arranca
// bajo el header, para que el header y su campana sigan visibles y clickeables.
const HEADER_OFFSET = 56 // alto del header fijo (coincide con el spacer h-14)

interface Props {
  open: boolean
  onClose: () => void
}

export default function NotificationsDrawer({ open, onClose }: Props) {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { notifications, unreadCount, markRead, markAll, isLoading } = useNotifications(user?.id)

  const groups = groupByDate(notifications)

  const handleClick = (id: string, leida: boolean, url: string | null) => {
    if (!leida) markRead(id)
    if (url) { navigate(url); onClose() }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — arranca debajo del header, así el header queda intacto */}
          <motion.div
            className="fixed left-0 right-0 bottom-0 z-[60]"
            style={{ top: HEADER_OFFSET, background: 'rgba(6,13,20,.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer — abre debajo del header (no invade el nav) y por encima en z */}
          <motion.aside
            className="fixed right-0 bottom-0 z-[70] flex flex-col border-l border-t overflow-hidden"
            style={{
              top: HEADER_OFFSET,
              width: 'min(380px, 95vw)',
              background: 'var(--bg-2)',
              borderColor: 'var(--line)',
              boxShadow: '-8px 0 32px rgba(0,0,0,.5)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: EASE_DRAWER }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: 'var(--text-2)' }} />
                <h2 className="font-display font-bold" style={{ color: 'var(--text-1)' }}>Notificaciones</h2>
                {unreadCount > 0 && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAll()}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ color: 'var(--primary-l)', background: 'var(--primary-s)' }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Leer todo
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-3)' }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--card)' }}>
                    <Bell className="h-7 w-7" style={{ color: 'var(--text-3)' }} />
                  </div>
                  <p className="font-display font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Sin notificaciones</p>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Acá vas a ver tus logros, recordatorios y novedades.</p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <p className="px-5 py-2.5 text-xs font-mono font-semibold sticky top-0" style={{ color: 'var(--text-3)', background: 'var(--bg-2)' }}>
                      {group.label.toUpperCase()}
                    </p>
                    {group.items.map(notif => {
                      const meta = getMeta(notif.tipo)
                      return (
                        <motion.button
                          key={notif.id}
                          className="w-full flex items-start gap-3 px-5 py-4 text-left border-b transition-colors relative"
                          style={{
                            borderColor: 'var(--line)',
                            background: notif.leida ? 'transparent' : 'rgba(14,107,92,.06)',
                          }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          whileHover={{ background: 'rgba(255,255,255,.04)' } as any}
                          onClick={() => handleClick(notif.id, notif.leida, notif.url)}
                        >
                          {/* Unread dot */}
                          {!notif.leida && (
                            <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
                          )}

                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
                            style={{ background: meta.bg }}
                          >
                            {meta.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug mb-0.5" style={{ color: notif.leida ? 'var(--text-2)' : 'var(--text-1)' }}>
                              {notif.titulo}
                            </p>
                            {notif.mensaje && (
                              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-3)' }}>
                                {notif.mensaje}
                              </p>
                            )}
                            <p className="text-[10px] font-mono mt-1.5" style={{ color: 'var(--text-3)' }}>
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
