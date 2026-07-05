import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { toast } from 'react-hot-toast'
import {
  Users, MapPin, Calendar, Clock, Link as LinkIcon,
  X, Lock, Upload, ChevronDown, Info, Loader2, Play, Copy, Camera,
  BookOpen, CheckCircle2, Layers,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademyProfile, useBadges, useCertificates, useReferrals, validateAvatarFile } from '@/hooks/useProfile'
import AvatarCropModal from '@/components/profile/AvatarCropModal'
import { initialsFrom, avatarGradient } from '@/lib/avatar'
import { useMyEnrollments } from '@/hooks/useCourses'
import {
  useProfilesRow, useWishlistFull, useRemoveWishlist, usePointsTransactions,
  useRanking, useReviewedCourseIds, useSubmitReview, useUpdateDatos, useUploadCertificate,
  type WishlistItem,
} from '@/hooks/useProfilePage'
import { nivelInfo, NIVELES } from '@/types'
import type { Enrollment, Badge, RankingRow, ItinerarioDia } from '@/types'
import { cupoEstado } from '@/lib/cupo'
import { EASE_OUT } from '@/lib/motion'

const NEON = '#00E5C8'
const GOLD = '#C99A3A'

// ── util ──────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-AR')
const money = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
const monthYear = (d: string) => new Date(d).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
const shortDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

// stagger variants
const container = { animate: { transition: { staggerChildren: 0.05 } } }
const item = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } } }
const TABS = ['Resumen', 'Mis Cursos', 'Favoritos', 'Vivenciales', 'Logros', 'Tus datos'] as const

// ── count-up hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) { setVal(target); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setVal(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduce])
  return val
}

// ── SVG progress ring ─────────────────────────────────────────────────
function Ring({ pct, size = 36, stroke = 2.5, color = NEON }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2 - 1
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100)
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(245,243,236,.15)" strokeWidth={stroke} />
      <motion.circle
        cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        style={{ transformOrigin: 'center', rotate: -90 }}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}
      />
    </svg>
  )
}

// ── generic modal ─────────────────────────────────────────────────────
function Modal({ open, onClose, children, maxW = 480 }: { open: boolean; onClose: () => void; children: React.ReactNode; maxW?: number }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[700] flex items-center justify-center p-5"
          style={{ background: 'rgba(6,13,20,.65)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full rounded-[20px] border max-h-[88vh] overflow-y-auto"
            style={{ maxWidth: maxW, background: 'var(--bg-2)', borderColor: 'var(--line-s)', boxShadow: '0 32px 72px rgba(0,0,0,.6)' }}
            initial={{ y: 14, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 14, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
function ModalX({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center z-10"
      style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--text-3)' }}>
      <X className="h-3.5 w-3.5" />
    </button>
  )
}

// ── review mini (below completed course / vivencial) ──────────────────
function ReviewMini({ courseId, label, onDone }: { courseId: string; label: string; onDone: () => void }) {
  const { user } = useAuth()
  const submit = useSubmitReview(user?.id)
  const [rating, setRating] = useState(0)
  const [hover, setHover]   = useState(0)
  const [text, setText]     = useState('')
  const [done, setDone]     = useState(false)

  if (done) {
    return <p className="mt-2.5 pt-2.5 border-t text-xs" style={{ borderColor: 'var(--line)', color: NEON }}>
      ✓ Reseña publicada · ¡Gracias por tu opinión! +10 🪙
    </p>
  }

  const publish = () => {
    if (!rating) { toast('⚠ Seleccioná una calificación'); return }
    if (!text.trim()) { toast('⚠ Escribí tu reseña antes de publicar'); return }
    submit.mutate({ courseId, rating, comentario: text.trim() }, {
      onSuccess: () => { setDone(true); onDone(); toast.success('✓ Reseña publicada · +10 Créditos') },
      onError:   () => toast.error('No se pudo publicar la reseña'),
    })
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--line)' }}>
      <p className="font-mono text-[8.5px] tracking-[.1em] uppercase mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</p>
      <div className="flex gap-1 mb-2" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onMouseEnter={() => setHover(s)} onClick={() => setRating(s)} className="text-lg leading-none"
            style={{ color: (hover || rating) >= s ? GOLD : 'rgba(201,154,58,.25)' }}>★</button>
        ))}
      </div>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Contanos tu experiencia..."
        className="w-full rounded-lg px-2.5 py-2 text-[13px] resize-none h-[52px] outline-none"
        style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--line)', color: 'var(--text-1)' }}
      />
      <button onClick={publish} disabled={submit.isPending}
        className="w-full mt-1.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors"
        style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}>
        {submit.isPending ? 'Publicando…' : 'Publicar reseña'}
      </button>
    </div>
  )
}

// ── course card (Mis Cursos) ──────────────────────────────────────────
function CourseCard({ e, reviewed, onCert, onReviewed }: {
  e: Enrollment; reviewed: boolean; onCert: (c: Enrollment) => void; onReviewed: () => void
}) {
  const navigate = useNavigate()
  const c = e.course
  if (!c) return null
  const done = e.completado
  const cat  = c.category?.nombre ?? 'Curso'

  return (
    <motion.div variants={item} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg-3)' }}>
        {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 50%,rgba(6,13,20,.9))' }} />
        <div className="absolute bottom-2.5 right-2.5 rounded-full p-1" style={{ background: 'rgba(10,30,41,.75)', backdropFilter: 'blur(8px)' }}>
          <Ring pct={e.progreso_pct} size={36} color={done ? GOLD : NEON} />
        </div>
      </div>
      <div className="p-4">
        <div className="font-mono text-[9px] tracking-[.1em] uppercase mb-1.5" style={{ color: 'var(--primary-l)' }}>{cat}</div>
        <div className="font-display font-bold text-[.95rem] leading-tight" style={{ color: 'var(--text-1)' }}>{c.titulo}</div>
        {c.instructor?.nombre && <div className="text-[.78rem] mt-1" style={{ color: 'var(--text-3)' }}>{c.instructor.nombre}</div>}

        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[9px] tracking-wide uppercase mb-1.5" style={{ color: 'var(--text-3)' }}>
            <span>Progreso</span>
            <span style={{ color: done ? GOLD : NEON, fontWeight: 600 }}>{done ? '✓ Completado' : `${e.progreso_pct}%`}</span>
          </div>
          <div className="h-[3px] rounded-sm overflow-hidden" style={{ background: 'rgba(245,243,236,.1)' }}>
            <div className="h-full rounded-sm" style={{ width: `${e.progreso_pct}%`, background: done ? `linear-gradient(90deg,${GOLD},#E5B84A)` : 'linear-gradient(90deg,var(--primary),var(--neon))' }} />
          </div>
        </div>

        <div className="mt-3">
          {done ? (
            <button onClick={() => onCert(e)} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-[9px] text-[12.5px] font-bold border"
              style={{ background: 'var(--gold-soft)', color: GOLD, borderColor: 'rgba(201,154,58,.35)' }}>
              🏅 Ver certificado
            </button>
          ) : (
            <button onClick={() => navigate(`/cursos/${c.slug}/aprender`)} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-[9px] text-[12.5px] font-bold border"
              style={{ background: 'var(--neon-dim)', color: NEON, borderColor: 'rgba(0,229,200,.25)' }}>
              <Play className="h-3.5 w-3.5" /> Continuar donde lo dejé
            </button>
          )}
        </div>

        {done && !reviewed && <ReviewMini courseId={c.id} label="Dejá tu reseña" onDone={onReviewed} />}
      </div>
    </motion.div>
  )
}

// ── favorite card ─────────────────────────────────────────────────────
function FavCard({ w, onRemove }: { w: WishlistItem; onRemove: (id: string) => void }) {
  const navigate = useNavigate()
  const c = w.course
  if (!c) return null
  const priceLabel = c.tipo_acceso === 'gratuito'
    ? 'Gratis'
    : c.precio_ars ? money(c.precio_ars) : 'Consultar'

  return (
    <motion.div variants={item} layout exit={{ opacity: 0, scale: 0.92 }}
      className="rounded-xl border overflow-hidden cursor-pointer" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
      onClick={() => navigate(`/cursos/${c.slug}`)}>
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: 'var(--bg-3)' }}>
        {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 50%,rgba(6,13,20,.8))' }} />
        <div className="absolute bottom-1.5 left-2 right-2 font-display font-bold text-[.78rem] leading-tight text-white">{c.titulo}</div>
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <div className="font-mono text-[8.5px] tracking-[.09em] uppercase" style={{ color: 'var(--primary-l)' }}>{c.category?.nombre ?? ''}</div>
        <div className="font-display text-[.82rem] font-bold mt-0.5" style={{ color: 'var(--text-1)' }}>{priceLabel}</div>
        <button onClick={ev => { ev.stopPropagation(); onRemove(c.id) }}
          className="flex items-center gap-1 font-mono text-[9px] tracking-wide uppercase pt-1.5 transition-colors hover:text-red-400"
          style={{ color: 'var(--text-3)' }}>
          <X className="h-[11px] w-[11px]" /> Quitar
        </button>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════
export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const uid = user?.id

  const { data: ap }            = useAcademyProfile(uid)
  const { data: prow }          = useProfilesRow(uid)
  const enrollmentsQ            = useMyEnrollments(uid)
  const { data: wishlist = [] } = useWishlistFull(uid)
  const removeFav               = useRemoveWishlist(uid)
  const { all: allBadges, earned: userBadges, earnedIds } = useBadges(uid)
  const { data: certificates = [] } = useCertificates(uid)
  const { data: referrals = [] }    = useReferrals(uid)
  const { data: reviewedIds = [] }  = useReviewedCourseIds(uid)
  const { data: pointsTx = [] }     = usePointsTransactions(uid)

  const [tab, setTab] = useState(0)
  const { data: ranking = [] } = useRanking(tab === 4) // solo carga en Logros

  // modals
  const [certFor, setCertFor]   = useState<Enrollment | null>(null)
  const [vivFor, setVivFor]     = useState<Enrollment | null>(null)
  const [showMov, setShowMov]   = useState(false)
  const [showCanjear, setShowCanjear] = useState(false)
  const [showRanking, setShowRanking] = useState(false)
  const [showUpload, setShowUpload]   = useState(false)
  const [showLevels, setShowLevels]   = useState(false)
  const [cropFile, setCropFile]       = useState<File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const enrollments = useMemo(() => (enrollmentsQ.data ?? []).filter(e => e.activo !== false), [enrollmentsQ.data])
  const cursos      = useMemo(() => enrollments.filter(e => e.course?.tipo !== 'vivencial'), [enrollments])
  const vivenciales = useMemo(() => enrollments.filter(e => e.course?.tipo === 'vivencial'), [enrollments])
  const reviewedSet = useMemo(() => new Set(reviewedIds), [reviewedIds])

  const puntos   = ap?.puntos ?? 0
  const creditos = ap?.creditos ?? 0
  const nInfo    = nivelInfo(puntos)

  const nombre   = prow?.nombre   ?? (user?.user_metadata as { nombre?: string })?.nombre ?? ''
  const apellido = prow?.apellido ?? (user?.user_metadata as { apellido?: string })?.apellido ?? ''
  const email    = user?.email ?? prow?.email ?? ''
  const iniciales = initialsFrom(nombre, apellido, email)

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-elegir el mismo archivo
    if (!file) return
    const err = validateAvatarFile(file)
    if (err) { toast.error(err); return }
    setCropFile(file)
  }

  const referralCode = ap?.referral_code ?? ''
  const referralUrl  = `${window.location.origin}/registro?ref=${referralCode}`
  const refCount     = referrals.length

  // count-up stats
  const xpCount   = useCountUp(puntos)
  const credCount = useCountUp(creditos)

  // ── level-up overlay (compara nivel guardado) ──
  const [levelUp, setLevelUp] = useState<number | null>(null)
  useEffect(() => {
    if (!uid || !ap) return
    const key = `last_seen_nivel_${uid}`
    const prev = Number(localStorage.getItem(key) ?? '0')
    const now  = nInfo.actual.n
    if (prev > 0 && now > prev) {
      setLevelUp(now)
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.4 }, colors: [NEON, GOLD] })
      const t = setTimeout(() => setLevelUp(null), 2500)
      localStorage.setItem(key, String(now))
      return () => clearTimeout(t)
    }
    localStorage.setItem(key, String(now))
  }, [uid, ap, nInfo.actual.n])

  const copyReferral = () => {
    void navigator.clipboard.writeText(referralUrl)
    toast.success('✓ Link de referido copiado')
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-9" style={{ background: 'linear-gradient(180deg,#0D2A38 0%,var(--bg) 100%)', borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-[960px] mx-auto px-5">
          <motion.div className="flex flex-col sm:flex-row items-center sm:items-start gap-7 pb-7"
            initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }}>
            {/* avatar + ring */}
            <motion.div variants={{ initial: { opacity: 0, y: 14, scale: 0.85 }, animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } } }}
              className="relative shrink-0" style={{ width: 96, height: 96 }}>
              <svg viewBox="0 0 108 108" className="absolute" style={{ inset: -6, width: 108, height: 108 }}>
                <circle cx="54" cy="54" r="48" fill="none" stroke="rgba(245,243,236,.1)" strokeWidth="3" />
                <motion.circle cx="54" cy="54" r="48" fill="none" stroke={NEON} strokeWidth="3" strokeLinecap="round"
                  style={{ transformOrigin: 'center', rotate: -90 }} strokeDasharray={301.6}
                  initial={{ strokeDashoffset: 301.6 }} animate={{ strokeDashoffset: 301.6 * (1 - nInfo.progresoPct / 100) }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.5 }} />
              </svg>
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-display font-bold text-3xl overflow-hidden"
                style={{ background: prow?.avatar_url ? 'var(--bg-3)' : avatarGradient(uid), border: '2px solid var(--line-s)', color: 'var(--text-1)' }}>
                {prow?.avatar_url ? <img src={prow.avatar_url} alt={nombre} className="w-full h-full object-cover" /> : iniciales}
              </div>
              {/* Cámara: abre el selector de archivo (esquina inferior izq. para no pisar el badge de nivel) */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-0.5 -left-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center"
                style={{ background: 'var(--primary-l)', color: '#0A1E29', border: '2px solid var(--bg)', boxShadow: '0 2px 8px rgba(0,0,0,.35)' }}
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto"
              >
                <Camera className="h-[13px] w-[13px]" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarPick}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center font-display font-bold text-[11px]"
                style={{ background: NEON, color: '#0A1E29', border: '2px solid var(--bg)', boxShadow: '0 0 12px var(--neon-glow)' }}>
                {nInfo.actual.n}
              </div>
            </motion.div>

            {/* info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <motion.div variants={item} className="font-display font-bold text-2xl leading-tight" style={{ color: 'var(--text-1)' }}>
                {nombre} {apellido}
              </motion.div>
              <motion.button variants={item} onClick={() => setShowLevels(true)}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[.1em] uppercase mt-1.5" style={{ color: NEON }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: NEON, boxShadow: '0 0 0 3px var(--neon-dim)' }} />
                Nivel {nInfo.actual.n} · {nInfo.actual.nombre}
                <Info className="h-2.5 w-2.5 opacity-70" />
              </motion.button>

              <motion.div variants={item} className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 mt-2">
                {ap?.ciudad && <Meta icon={<MapPin className="h-3 w-3" />}>{ap.ciudad}</Meta>}
                {user?.created_at && <Meta icon={<Calendar className="h-3 w-3" />}>Desde {monthYear(user.created_at)}</Meta>}
                <Meta icon={<Users className="h-3 w-3" />}>{refCount} {refCount === 1 ? 'referido' : 'referidos'}</Meta>
              </motion.div>

              {/* stats */}
              <motion.div variants={item} className="grid grid-cols-4 mt-5 rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)', background: 'rgba(255,255,255,.03)' }}>
                <Stat value={fmt(xpCount)} label="XP ★" />
                <Stat value={fmt(credCount)} label="Créditos 🪙" color={GOLD} divider />
                <Stat value={String(ap?.total_cursos_completados ?? 0)} label="Cursos" divider />
                <Stat value={String(ap?.total_vivenciales ?? 0)} label="Vivenciales" divider />
              </motion.div>

              {/* xp bar */}
              <motion.div variants={item} className="mt-4">
                <div className="flex items-center justify-between font-mono text-[9px] tracking-wide uppercase mb-1.5" style={{ color: 'var(--text-3)' }}>
                  <span>{nInfo.siguiente ? `Progreso al Nivel ${nInfo.siguiente.n} · ${nInfo.siguiente.nombre}` : 'Nivel máximo alcanzado'}</span>
                  <span style={{ color: NEON }}>{fmt(puntos)} / {fmt(nInfo.xpParaSiguiente)} XP</span>
                </div>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(245,243,236,.1)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,var(--primary),var(--neon))', boxShadow: '0 0 8px var(--neon-glow)' }}
                    initial={{ width: 0 }} animate={{ width: `${nInfo.progresoPct}%` }} transition={{ duration: 1, ease: EASE_OUT, delay: 0.4 }} />
                </div>
              </motion.div>

              <motion.div variants={item} className="mt-4 flex justify-center sm:justify-start">
                <button onClick={copyReferral} className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg"
                  style={{ background: 'var(--card)', color: 'var(--text-2)' }}>
                  <LinkIcon className="h-3 w-3" /> Copiar link de referido
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="sticky top-14 z-[100] border-b" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
        <div className="max-w-[960px] mx-auto px-5 flex overflow-x-auto scrollbar-none">
          {TABS.map((t, i) => {
            const on = tab === i
            const badge = i === 1 ? cursos.length : i === 2 ? wishlist.length : i === 3 ? vivenciales.length : null
            return (
              <button key={t} onClick={() => setTab(i)} className="relative flex items-center gap-1.5 px-4 py-3.5 text-[13px] whitespace-nowrap"
                style={{ color: on ? 'var(--text-1)' : 'var(--text-3)', fontWeight: on ? 600 : 500 }}>
                {t}
                {badge !== null && badge > 0 && (
                  <span className="font-mono text-[9px] font-semibold px-1.5 rounded-full min-w-[18px] text-center"
                    style={{ background: 'var(--neon-dim)', color: NEON, border: '1px solid rgba(0,229,200,.25)' }}>{badge}</span>
                )}
                {on && <motion.div layoutId="tabInd" className="absolute left-0 right-0 -bottom-px h-0.5 rounded" style={{ background: NEON }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[960px] mx-auto px-5 pt-7 pb-16">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: EASE_OUT }}>

            {/* ─────────── TAB 0: RESUMEN ─────────── */}
            {tab === 0 && (
              <ResumenTab
                nombre={nombre} creditos={creditos} cursos={cursos} vivenciales={vivenciales}
                lastBadge={userBadges[0]} onGoLogros={() => setTab(4)} onGoCursos={() => setTab(1)} onGoViv={() => setTab(3)}
              />
            )}

            {/* ─────────── TAB 1: MIS CURSOS ─────────── */}
            {tab === 1 && (
              <MisCursosTab cursos={cursos} loading={enrollmentsQ.isLoading} reviewedSet={reviewedSet}
                onCert={setCertFor} onReviewed={() => { /* form se colapsa localmente */ }} onExplore={() => navigate('/cursos')} />
            )}

            {/* ─────────── TAB 2: FAVORITOS ─────────── */}
            {tab === 2 && (
              <div>
                <SectionHead title="Guardados" action="Explorar más →" onAction={() => navigate('/cursos')} />
                {wishlist.length === 0 ? (
                  <Empty icon="♡" title="Sin favoritos aún" desc="Guardá cursos y vivenciales con el corazón para verlos acá." />
                ) : (
                  <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-2 min-[680px]:grid-cols-3 gap-3.5">
                    <AnimatePresence>
                      {wishlist.map(w => (
                        <FavCard key={w.id} w={w} onRemove={(cid) => removeFav.mutate(cid, { onSuccess: () => toast('Eliminado de favoritos') })} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─────────── TAB 3: VIVENCIALES ─────────── */}
            {tab === 3 && (
              <VivencialesTab vivenciales={vivenciales} reviewedSet={reviewedSet} onDetail={setVivFor} onCert={setCertFor} onExplore={() => navigate('/vivencial')} />
            )}

            {/* ─────────── TAB 4: LOGROS ─────────── */}
            {tab === 4 && (
              <LogrosTab
                uid={uid} puntos={puntos} creditos={creditos} nInfo={nInfo}
                allBadges={allBadges} earnedIds={earnedIds} userBadges={userBadges}
                ranking={ranking} certificates={certificates}
                onMov={() => setShowMov(true)} onCanjear={() => setShowCanjear(true)}
                onRanking={() => setShowRanking(true)} onUpload={() => setShowUpload(true)}
                onCert={(titulo, fecha) => setCertFor({ id: 'ext', completado: true, course: { titulo }, fecha_completado: fecha } as unknown as Enrollment)}
              />
            )}

            {/* ─────────── TAB 5: TUS DATOS ─────────── */}
            {tab === 5 && (
              <DatosTab uid={uid} nombre={nombre} apellido={apellido} email={email}
                telefono={prow?.telefono ?? ''} ap={ap ?? null} referralCode={referralCode} referralUrl={referralUrl} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── MODALS ── */}
      <CertModal enrollment={certFor} userName={`${nombre} ${apellido}`.trim()} onClose={() => setCertFor(null)} />
      <VivModal enrollment={vivFor} onClose={() => setVivFor(null)} />
      <MovModal open={showMov} tx={pointsTx} onClose={() => setShowMov(false)} />
      <CanjearModal open={showCanjear} onClose={() => setShowCanjear(false)} onGo={() => { setShowCanjear(false); navigate('/beneficios') }} />
      <RankingModal open={showRanking} onClose={() => setShowRanking(false)} />
      <UploadModal open={showUpload} uid={uid} onClose={() => setShowUpload(false)} />
      <LevelsModal open={showLevels} currentN={nInfo.actual.n} onClose={() => setShowLevels(false)} />

      {/* ── AVATAR CROP MODAL ── */}
      <AnimatePresence>
        {cropFile && (
          <AvatarCropModal
            file={cropFile}
            userId={uid}
            onClose={() => setCropFile(null)}
            onUploaded={() => setCropFile(null)}
          />
        )}
      </AnimatePresence>

      {/* ── LEVEL-UP OVERLAY ── */}
      <AnimatePresence>
        {levelUp && (
          <motion.div className="fixed inset-0 z-[800] flex items-center justify-center p-6" style={{ background: 'rgba(6,13,20,.8)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLevelUp(null)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }} className="text-center rounded-3xl border p-9 max-w-sm"
              style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)' }}>
              <div className="text-5xl mb-3">🎉</div>
              <div className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>
                ¡Subiste al Nivel {levelUp} · {NIVELES.find(l => l.n === levelUp)?.nombre}!
              </div>
              <button onClick={() => { setLevelUp(null); setTab(4) }} className="mt-5 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: NEON, color: '#0A1E29' }}>
                Ver mis logros
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── small presentational helpers ──────────────────────────────────────
function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{icon}{children}</span>
}
function Stat({ value, label, color, divider }: { value: string; label: string; color?: string; divider?: boolean }) {
  return (
    <div className="py-3 text-center relative" style={divider ? { borderLeft: '1px solid var(--line)' } : undefined}>
      <div className="font-display font-bold text-[1.15rem]" style={{ color: color ?? 'var(--text-1)' }}>{value}</div>
      <div className="font-mono text-[8px] tracking-wider uppercase mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}
function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="font-display font-bold text-[1.05rem]" style={{ color: 'var(--text-1)' }}>{title}</span>
      {action && <button onClick={onAction} className="font-mono text-[10px] tracking-wide uppercase" style={{ color: NEON }}>{action}</button>}
    </div>
  )
}
function Empty({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-14 flex flex-col items-center gap-2.5">
      <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl mb-1.5" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', width: 52, height: 52 }}>{icon}</div>
      <h3 className="font-display font-bold" style={{ color: 'var(--text-2)' }}>{title}</h3>
      <p className="text-sm max-w-[280px]" style={{ color: 'var(--text-3)' }}>{desc}</p>
    </div>
  )
}

// ── RESUMEN TAB ───────────────────────────────────────────────────────
function ResumenTab({ nombre, creditos, cursos, vivenciales, lastBadge, onGoLogros, onGoCursos, onGoViv }: {
  nombre: string; creditos: number; cursos: Enrollment[]; vivenciales: Enrollment[]
  lastBadge?: { badge?: Badge; earned_at: string }; onGoLogros: () => void; onGoCursos: () => void; onGoViv: () => void
}) {
  const navigate = useNavigate()
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  const enCurso = cursos.find(e => !e.completado) ?? cursos[0]
  const proxViv = vivenciales
    .filter(e => e.course?.vivencial_fecha_salida && daysUntil(e.course.vivencial_fecha_salida) >= 0)
    .sort((a, b) => new Date(a.course!.vivencial_fecha_salida!).getTime() - new Date(b.course!.vivencial_fecha_salida!).getTime())[0]

  return (
    <div>
      <div className="font-display font-bold text-[1.3rem] mb-4" style={{ color: 'var(--text-1)' }}>
        {saludo}, <span style={{ color: NEON }}>{nombre.split(' ')[0]}</span> 👋
      </div>

      {/* créditos mini */}
      <button onClick={onGoLogros} className="w-full flex items-center justify-between gap-3.5 rounded-2xl border px-4.5 py-3.5 mb-5 text-left"
        style={{ background: 'var(--bg-2)', borderColor: 'rgba(201,154,58,.3)', padding: '14px 18px' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg,rgba(201,154,58,.25),rgba(201,154,58,.08))', border: '1px solid rgba(201,154,58,.3)' }}>🪙</div>
          <div>
            <div className="font-display font-bold text-[1.05rem]" style={{ color: GOLD }}>{fmt(creditos)} Créditos disponibles</div>
            <div className="font-mono text-[9px] tracking-wide uppercase mt-0.5" style={{ color: 'var(--text-3)' }}>Canjeables por cursos, descuentos y sorteos</div>
          </div>
        </div>
        <span className="font-mono text-[9.5px] tracking-wide uppercase whitespace-nowrap" style={{ color: NEON }}>Canjear →</span>
      </button>

      <SectionHead title="Seguí estudiando" action="Ver todos →" onAction={onGoCursos} />
      <div className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-3.5 mb-6">
        {enCurso?.course ? (
          <button onClick={() => navigate(`/cursos/${enCurso.course!.slug}/aprender`)} className="text-left rounded-[14px] border overflow-hidden" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
            <div className="relative" style={{ height: 186, background: 'var(--bg-3)' }}>
              {enCurso.course.thumbnail_url && <img src={enCurso.course.thumbnail_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,transparent 40%,rgba(6,13,20,.9))' }} />
              <div className="absolute bottom-2 right-2 rounded-full p-1" style={{ background: 'rgba(10,30,41,.75)', backdropFilter: 'blur(8px)' }}>
                <Ring pct={enCurso.progreso_pct} size={28} stroke={2.5} />
              </div>
            </div>
            <div className="p-3.5">
              <div className="font-mono text-[9px] tracking-[.1em] uppercase" style={{ color: 'var(--primary-l)' }}>{enCurso.course.category?.nombre ?? 'Curso'}</div>
              <div className="font-display font-bold text-[.88rem] mt-1 leading-tight line-clamp-2" style={{ color: 'var(--text-1)' }}>{enCurso.course.titulo}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-[9px] uppercase" style={{ color: 'var(--text-3)' }}>{enCurso.progreso_pct}% completado</span>
                <span className="font-display text-[11px] font-bold" style={{ color: NEON }}>Continuar ›</span>
              </div>
              <div className="h-0.5 mt-2.5 rounded-sm overflow-hidden" style={{ background: 'rgba(245,243,236,.1)' }}>
                <div className="h-full" style={{ width: `${enCurso.progreso_pct}%`, background: NEON }} />
              </div>
            </div>
          </button>
        ) : (
          <Empty icon="📚" title="Sin cursos activos" desc="Explorá el catálogo y empezá a aprender." />
        )}

        {proxViv?.course && (
          <button onClick={onGoViv} className="text-left rounded-[14px] overflow-hidden relative" style={{ background: 'var(--bg-2)', border: `1.5px solid ${NEON}`, boxShadow: '0 0 0 0 var(--neon-glow)' }}>
            <div className="relative" style={{ height: 186, background: 'var(--bg-3)' }}>
              {proxViv.course.thumbnail_url && <img src={proxViv.course.thumbnail_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(6,13,20,.05),rgba(6,13,20,.85))' }} />
              <div className="absolute top-2 right-2 text-right rounded-lg px-2.5 py-1" style={{ background: 'rgba(6,13,20,.65)', backdropFilter: 'blur(8px)', border: `1px solid ${NEON}` }}>
                <span className="block font-display font-bold text-[1.1rem] leading-none" style={{ color: NEON }}>{daysUntil(proxViv.course.vivencial_fecha_salida!)}</span>
                <span className="font-mono text-[7px] tracking-wider uppercase" style={{ color: 'rgba(245,243,236,.5)' }}>días</span>
              </div>
              <div className="absolute bottom-2 left-2.5">
                <div className="font-display font-bold text-[.92rem] text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>{proxViv.course.titulo}</div>
                {proxViv.course.vivencial_pais && <div className="font-mono text-[9px] tracking-wide uppercase mt-0.5" style={{ color: 'rgba(245,243,236,.6)' }}>{proxViv.course.vivencial_pais}</div>}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between text-[.75rem]" style={{ color: 'var(--text-2)' }}>
                <span>📅 {proxViv.course.vivencial_fecha_salida ? shortDate(proxViv.course.vivencial_fecha_salida) : ''}</span>
                <span style={{ color: proxViv.seña_pagada ? '#22c55e' : 'var(--urg)', fontWeight: 600 }}>{proxViv.seña_pagada ? '✓ Seña pagada' : 'Seña pendiente'}</span>
              </div>
            </div>
          </button>
        )}
      </div>

      <SectionHead title="Último logro" action="Ver todos →" onAction={onGoLogros} />
      {lastBadge?.badge ? (
        <div className="flex items-center gap-3 rounded-[14px] border px-4 py-3.5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg,rgba(201,154,58,.3),rgba(201,154,58,.1))', color: GOLD }}>{lastBadge.badge.icono}</div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[.88rem]" style={{ color: 'var(--text-1)' }}>{lastBadge.badge.nombre}</div>
            <div className="text-[.78rem] mt-0.5" style={{ color: 'var(--text-3)' }}>{lastBadge.badge.descripcion}</div>
          </div>
          <span className="font-mono text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded" style={{ color: NEON, background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.25)' }}>Nuevo</span>
        </div>
      ) : (
        <div className="rounded-[14px] border px-4 py-5 text-sm" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-3)' }}>
          Todavía no tenés logros. Completá tu primer curso para empezar a sumar. 🎓
        </div>
      )}
    </div>
  )
}

// ── MIS CURSOS TAB ────────────────────────────────────────────────────
type CursoFilter = 'all' | 'prog' | 'done'

const CURSO_FILTERS: { value: CursoFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all',  label: 'Todos',       icon: <Layers className="h-3.5 w-3.5" /> },
  { value: 'prog', label: 'En progreso', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 'done', label: 'Completados', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
]

const CURSO_EMPTY: Record<CursoFilter, { icon: React.ReactNode; title: string; desc: string }> = {
  all:  { icon: <BookOpen className="h-10 w-10" />,     title: 'No hay cursos acá',                    desc: 'Explorá el catálogo y sumá tu primer curso.' },
  prog: { icon: <Play className="h-10 w-10" />,         title: 'No hay cursos en progreso',            desc: 'Explorá el catálogo y empezá a aprender.' },
  done: { icon: <CheckCircle2 className="h-10 w-10" />, title: 'Todavía no completaste ningún curso',  desc: 'Seguí aprendiendo, ¡ya estás cerca!' },
}

function MisCursosTab({ cursos, loading, reviewedSet, onCert, onReviewed, onExplore }: {
  cursos: Enrollment[]; loading: boolean; reviewedSet: Set<string>
  onCert: (e: Enrollment) => void; onReviewed: () => void; onExplore: () => void
}) {
  const [filter, setFilter] = useState<CursoFilter>('all')
  const list = cursos.filter(e => filter === 'all' ? true : filter === 'prog' ? !e.completado : e.completado)

  const counts: Record<CursoFilter, number> = {
    all:  cursos.length,
    prog: cursos.filter(e => !e.completado).length,
    done: cursos.filter(e => e.completado).length,
  }

  return (
    <div>
      {/* Segmented control */}
      <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'var(--bg-2)' }}>
        {CURSO_FILTERS.map(f => {
          const active = filter === f.value
          const count  = counts[f.value]
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? 'var(--bg)' : 'transparent',
                color:      active ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow:  active ? '0 1px 3px rgba(0,0,0,.3)' : 'none',
              }}
            >
              {f.icon}
              <span className="hidden sm:inline">{f.label}</span>
              {count > 0 && (
                <span
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: active ? 'var(--primary-s)' : 'var(--card)', color: active ? 'var(--primary-l)' : 'var(--text-3)' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-4">
          {[0, 1].map(i => <div key={i} className="rounded-2xl border animate-pulse" style={{ height: 300, background: 'var(--bg-2)', borderColor: 'var(--line)' }} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4" style={{ color: 'var(--text-3)' }}>{CURSO_EMPTY[filter].icon}</div>
          <h3 className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-2)' }}>{CURSO_EMPTY[filter].title}</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>{CURSO_EMPTY[filter].desc}</p>
          <button onClick={onExplore} className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
            Ver catálogo
          </button>
        </div>
      ) : (
        <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 min-[640px]:grid-cols-2 gap-4">
          {list.map(e => <CourseCard key={e.id} e={e} reviewed={reviewedSet.has(e.course?.id ?? '')} onCert={onCert} onReviewed={onReviewed} />)}
        </motion.div>
      )}
    </div>
  )
}

// ── VIVENCIALES TAB ───────────────────────────────────────────────────
function VivencialesTab({ vivenciales, reviewedSet, onDetail, onCert, onExplore }: {
  vivenciales: Enrollment[]; reviewedSet: Set<string>
  onDetail: (e: Enrollment) => void; onCert: (e: Enrollment) => void; onExplore: () => void
}) {
  const prox = vivenciales.filter(e => e.course?.vivencial_fecha_salida && daysUntil(e.course.vivencial_fecha_salida) >= 0)
  const past = vivenciales.filter(e => !e.course?.vivencial_fecha_salida || daysUntil(e.course.vivencial_fecha_salida) < 0)

  if (vivenciales.length === 0) return (
    <div>
      <Empty icon="✈️" title="No estás en ningún viaje" desc="Descubrí los fam trips vivenciales exclusivos para asesores." />
      <div className="text-center"><button onClick={onExplore} className="text-sm font-medium" style={{ color: NEON }}>Ver vivenciales →</button></div>
    </div>
  )

  return (
    <div>
      {prox.length > 0 && <SectionLabel>Próximos</SectionLabel>}
      {prox.map(e => {
        const c = e.course!
        const dias = daysUntil(c.vivencial_fecha_salida!)
        const cupo = c.vivencial_cupo_disponible != null ? cupoEstado(c.vivencial_cupo_disponible) : null
        const pendiente = e.monto_pendiente_ars ?? 0
        return (
          <motion.div key={e.id} variants={item} initial="initial" animate="animate" className="rounded-2xl border overflow-hidden mb-3.5" style={{ background: 'var(--bg-2)', borderColor: 'rgba(201,154,58,.35)' }}>
            <div className="relative" style={{ height: 160 }}>
              {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(6,13,20,.1),rgba(6,13,20,.8))' }} />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="font-display font-bold text-[1.1rem] text-white">{c.titulo}</div>
                  {c.vivencial_pais && <div className="font-mono text-[9px] tracking-wide uppercase mt-0.5" style={{ color: GOLD }}>{c.vivencial_pais}</div>}
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-[1.8rem] leading-none" style={{ color: NEON }}>{dias}</div>
                  <div className="font-mono text-[8px] tracking-wider uppercase" style={{ color: 'rgba(245,243,236,.5)' }}>días</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  {c.vivencial_fecha_salida && (
                    <Line icon={<Calendar className="h-3 w-3" />}>{shortDate(c.vivencial_fecha_salida)}{c.vivencial_fecha_regreso ? ` — ${shortDate(c.vivencial_fecha_regreso)}` : ''}</Line>
                  )}
                  {c.vivencial_ciudad_salida && <Line icon={<MapPin className="h-3 w-3" />}>Sale desde {c.vivencial_ciudad_salida}</Line>}
                  {cupo && <Line icon={<Users className="h-3 w-3" />}><span style={{ color: cupo.cls === 'ok' ? 'var(--text-2)' : 'var(--urg)' }}>{cupo.label}</span></Line>}
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wide uppercase rounded px-2 py-0.5 mb-1.5"
                    style={{ color: e.seña_pagada ? '#22c55e' : 'var(--urg)', background: e.seña_pagada ? 'rgba(34,197,94,.1)' : 'rgba(239,107,53,.1)', border: `1px solid ${e.seña_pagada ? 'rgba(34,197,94,.25)' : 'rgba(239,107,53,.25)'}` }}>
                    {e.seña_pagada ? '✓ Seña pagada' : 'Seña pendiente'}
                  </div>
                  {pendiente > 0 && <div className="text-[.78rem]" style={{ color: 'var(--text-3)' }}>Saldo: <strong style={{ color: 'var(--urg)' }}>{money(pendiente)}</strong></div>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onDetail(e)} className="flex-1 py-2.5 rounded-[9px] text-[12.5px] font-bold" style={{ background: NEON, color: '#0A1E29' }}>Ver detalles del viaje</button>
                <button
                  onClick={() => c.vivencial_whatsapp_url && window.open(c.vivencial_whatsapp_url, '_blank')}
                  disabled={!c.vivencial_whatsapp_url}
                  className="px-3.5 py-2.5 rounded-[9px] text-[12.5px] font-semibold border"
                  style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-2)', opacity: c.vivencial_whatsapp_url ? 1 : 0.4, cursor: c.vivencial_whatsapp_url ? 'pointer' : 'not-allowed' }}>
                  💬 Grupo WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}

      {past.length > 0 && <SectionLabel style={{ marginTop: 28 }}>Realizados</SectionLabel>}
      <div className="relative pl-7">
        {past.map(e => {
          const c = e.course!
          return (
            <div key={e.id} className="relative mb-4.5" style={{ marginBottom: 18 }}>
              <div className="absolute rounded-full" style={{ left: -24, top: 16, width: 10, height: 10, background: GOLD, border: '2px solid rgba(201,154,58,.5)' }} />
              <div className="rounded-xl border overflow-hidden flex" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                <div className="shrink-0 overflow-hidden" style={{ width: 80 }}>
                  {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3.5 flex-1 min-w-0">
                  {c.vivencial_fecha_salida && <div className="font-mono text-[9px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{monthYear(c.vivencial_fecha_salida)}</div>}
                  <div className="font-display font-bold text-[.88rem] leading-tight" style={{ color: 'var(--text-1)' }}>{c.titulo}</div>
                  {c.vivencial_pais && <div className="text-[.75rem] mt-0.5" style={{ color: 'var(--text-3)' }}>{c.vivencial_pais}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => onCert(e)} className="font-mono text-[9px] tracking-wide uppercase px-2.5 py-1 rounded" style={{ color: GOLD, background: 'var(--gold-soft)', border: '1px solid rgba(201,154,58,.3)' }}>🏅 Certificado</button>
                  </div>
                  {!reviewedSet.has(c.id) && <ReviewMini courseId={c.id} label="¿Cómo fue el vivencial?" onDone={() => {}} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[9.5px] tracking-[.12em] uppercase mb-3.5" style={{ color: NEON, ...style }}>
      {children}<span className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}
function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 text-[.8rem]" style={{ color: 'var(--text-2)' }}><span style={{ color: 'var(--text-3)' }}>{icon}</span>{children}</div>
}

// ── LOGROS TAB ────────────────────────────────────────────────────────
function LogrosTab({ uid, puntos, creditos, nInfo, allBadges, earnedIds, userBadges, ranking, certificates, onMov, onCanjear, onRanking, onUpload, onCert }: {
  uid?: string; puntos: number; creditos: number; nInfo: ReturnType<typeof nivelInfo>
  allBadges: Badge[]; earnedIds: Set<string>; userBadges: Array<{ badge?: Badge; earned_at: string; badge_id: string }>
  ranking: RankingRow[]; certificates: Array<{ id: string; numero: string; emitido_at: string; course?: { titulo?: string } }>
  onMov: () => void; onCanjear: () => void; onRanking: () => void; onUpload: () => void
  onCert: (numero: string, date: string) => void
}) {
  const earnedAtMap = useMemo(() => {
    const m = new Map<string, string>()
    userBadges.forEach(ub => m.set(ub.badge_id, ub.earned_at))
    return m
  }, [userBadges])

  // confetti para badges nuevos (localStorage)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const fired = useRef(false)
  useEffect(() => {
    if (!uid || fired.current || earnedIds.size === 0) return
    fired.current = true
    const key = `seen_badges_${uid}`
    const seen = new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]') as string[])
    const fresh = [...earnedIds].filter(id => !seen.has(id))
    if (fresh.length > 0) {
      setNewIds(new Set(fresh))
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: [NEON, GOLD] })
    }
    localStorage.setItem(key, JSON.stringify([...earnedIds]))
  }, [uid, earnedIds])

  // ranking slice ±3 alrededor del usuario
  const rankSlice = useMemo(() => {
    if (ranking.length === 0) return []
    const idx = ranking.findIndex(r => r.user_id === uid)
    if (idx < 0) return ranking.slice(0, 7)
    return ranking.slice(Math.max(0, idx - 3), idx + 4)
  }, [ranking, uid])

  const earnCredits = [
    { label: 'Escribir una reseña', v: '+10' },
    { label: 'Referir un asesor', v: '+20' },
    { label: 'Completar un curso', v: '+40' },
    { label: 'Completar vivencial', v: '+300' },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-4 mb-7">
        {/* nivel + ranking */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-14 h-14 rounded-[14px] flex items-center justify-center font-display font-bold text-2xl shrink-0" style={{ background: 'linear-gradient(135deg,var(--primary),var(--neon))', color: '#0A1E29' }}>{nInfo.actual.n}</div>
            <div>
              <div className="font-display font-bold text-[.95rem]" style={{ color: 'var(--text-1)' }}>{nInfo.actual.nombre}</div>
              <div className="text-[.75rem] mt-0.5" style={{ color: 'var(--text-3)' }}>{nInfo.siguiente ? `Próximo: Nivel ${nInfo.siguiente.n} · ${nInfo.siguiente.nombre}` : 'Nivel máximo'}</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(245,243,236,.1)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,var(--primary),var(--neon))', boxShadow: '0 0 10px var(--neon-glow)' }}
              initial={{ width: 0 }} animate={{ width: `${nInfo.progresoPct}%` }} transition={{ duration: 1, ease: EASE_OUT }} />
          </div>
          <div className="flex justify-between font-mono text-[9px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>
            <span>{fmt(puntos)} XP</span><span>{fmt(nInfo.xpParaSiguiente)} XP</span>
          </div>

          {/* ranking */}
          <button onClick={onRanking} className="w-full text-left mt-3.5 pt-3 border-t rounded-lg" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[.1em] uppercase mb-2.5" style={{ color: 'var(--text-3)' }}>
              Tu posición en el ranking <Info className="h-3 w-3" style={{ color: NEON }} />
            </div>
            {rankSlice.length === 0 ? (
              <div className="text-[.78rem]" style={{ color: 'var(--text-3)' }}>El ranking se activa cuando haya más asesores sumando XP.</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {rankSlice.map(r => {
                  const me = r.user_id === uid
                  return (
                    <div key={r.user_id} className="flex items-center gap-2 px-1.5 py-1 rounded-md" style={me ? { background: 'rgba(0,229,200,.08)', border: '1px solid rgba(0,229,200,.2)' } : undefined}>
                      <span className="font-mono text-[9px] min-w-[20px] text-right" style={{ color: me ? NEON : 'var(--text-3)', fontWeight: me ? 700 : 400 }}>{r.posicion}</span>
                      <span className="flex-1 text-[.78rem] truncate" style={{ color: 'var(--text-2)' }}>{[r.nombre, r.apellido].filter(Boolean).join(' ') || 'Asesor'}{me && <span style={{ color: NEON, fontSize: '.7rem' }}> (vos)</span>}</span>
                      <span className="font-mono text-[9px] whitespace-nowrap" style={{ color: me ? NEON : 'var(--text-3)' }}>{fmt(r.puntos)} XP</span>
                    </div>
                  )
                })}
              </div>
            )}
          </button>
        </div>

        {/* créditos card */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'rgba(201,154,58,.35)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg,rgba(201,154,58,.3),rgba(201,154,58,.1))', border: '1px solid rgba(201,154,58,.3)' }}>🪙</div>
              <div className="font-display font-bold text-[1.05rem]" style={{ color: GOLD }}>{fmt(creditos)} Créditos</div>
            </div>
            <button onClick={onMov} className="font-mono text-[9px] tracking-wide uppercase rounded-md px-2.5 py-1" style={{ color: NEON, background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.25)' }}>Movimientos</button>
          </div>
          <div className="font-mono text-[9px] tracking-wide uppercase mb-2" style={{ color: 'var(--text-3)' }}>Cómo ganar más · de menor a mayor</div>
          <div className="flex flex-col">
            {earnCredits.map(c => (
              <div key={c.label} className="flex items-center justify-between text-[.8rem] py-1.5 border-b last:border-b-0" style={{ color: 'var(--text-2)', borderColor: 'rgba(245,243,236,.06)' }}>
                <span>{c.label}</span><span style={{ color: GOLD }}>{c.v} 🪙</span>
              </div>
            ))}
          </div>
          <button onClick={onCanjear} className="w-full mt-3 py-2.5 rounded-[9px] text-[12.5px] font-bold border" style={{ background: 'var(--neon-dim)', color: NEON, borderColor: 'rgba(0,229,200,.25)' }}>Ver cómo canjear →</button>
        </div>
      </div>

      {/* badges */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-bold text-[1.05rem]" style={{ color: 'var(--text-1)' }}>Insignias</span>
        <span className="font-mono text-[9.5px]" style={{ color: 'var(--text-3)' }}>{earnedIds.size} de {allBadges.length} obtenidas</span>
      </div>
      {allBadges.length === 0 ? (
        <div className="rounded-2xl border px-4 py-6 text-sm" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-3)' }}>Las insignias se cargarán pronto.</div>
      ) : (
        <div className="grid grid-cols-3 min-[560px]:grid-cols-4 gap-2.5 mb-7">
          {allBadges.map(b => {
            const earned = earnedIds.has(b.id)
            const isNew  = newIds.has(b.id)
            return (
              <motion.div key={b.id} initial={isNew ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                className="rounded-xl border p-3.5 text-center" title={b.descripcion ?? ''}
                style={{ background: 'var(--bg-2)', borderColor: earned ? 'rgba(201,154,58,.5)' : 'var(--line)', opacity: earned ? 1 : 0.45, filter: earned ? 'none' : 'saturate(0.2)' }}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl mx-auto mb-2" style={{ background: earned ? 'linear-gradient(135deg,rgba(201,154,58,.3),rgba(201,154,58,.1))' : 'rgba(255,255,255,.05)' }}>
                  {earned ? b.icono : <Lock className="h-4 w-4" style={{ color: 'var(--text-3)' }} />}
                </div>
                <div className="font-display font-bold text-[.7rem] leading-tight mb-0.5" style={{ color: 'var(--text-1)' }}>{b.nombre}</div>
                <div className="font-mono text-[7px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{earned && earnedAtMap.get(b.id) ? shortDate(earnedAtMap.get(b.id)!) : b.condicion}</div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* certificados */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-bold text-[1.05rem]" style={{ color: 'var(--text-1)' }}>Certificados</span>
        <button onClick={onUpload} className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-wide uppercase rounded-md px-2.5 py-1.5" style={{ color: 'var(--text-2)', background: 'var(--card)', border: '1px solid var(--line)' }}>
          <Upload className="h-3 w-3" /> Subir documento
        </button>
      </div>
      {certificates.length === 0 ? (
        <div className="rounded-2xl border px-4 py-6 text-sm" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-3)' }}>Completá un curso para obtener tu primer certificado.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {certificates.map(cert => (
            <button key={cert.id} onClick={() => onCert(cert.course?.titulo ?? 'Certificado', cert.emitido_at)} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center shrink-0" style={{ background: 'var(--gold-soft)', border: '1px solid rgba(201,154,58,.3)' }}>🏅</div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[.85rem]" style={{ color: 'var(--text-1)' }}>{cert.course?.titulo ?? 'Certificado'}</div>
                <div className="text-[.75rem] mt-0.5" style={{ color: 'var(--text-3)' }}>Emitido el {shortDate(cert.emitido_at)} · N° {cert.numero}</div>
              </div>
              <span className="font-mono text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: NEON }}>Ver</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TUS DATOS TAB ─────────────────────────────────────────────────────
const GENEROS = ['', 'Femenino', 'Masculino', 'No binario', 'Otro']
const VENDEDORES = ['Freelance independiente', 'Agencia pequeña (1-5 personas)', 'Agencia mediana / grande', 'Otro']
const EXPERIENCIAS = ['Menos de 1 año', '1 a 3 años', '3 a 5 años', '5 a 10 años', 'Más de 10 años']

function DatosTab({ uid, nombre, apellido, email, telefono, ap, referralCode, referralUrl }: {
  uid?: string; nombre: string; apellido: string; email: string; telefono: string
  ap: { fecha_nacimiento?: string | null; genero?: string | null; ciudad?: string | null; tipo_vendedor?: string | null; anos_experiencia?: string | null; destinos_principales?: string[] } | null
  referralCode: string; referralUrl: string
}) {
  const update = useUpdateDatos(uid)
  const initial = useMemo(() => ({
    telefono, fecha_nacimiento: ap?.fecha_nacimiento ?? '', genero: ap?.genero ?? '',
    ciudad: ap?.ciudad ?? '', tipo_vendedor: ap?.tipo_vendedor ?? '', anos_experiencia: ap?.anos_experiencia ?? '',
    destinos: (ap?.destinos_principales ?? []).join(', '),
  }), [telefono, ap])
  const [form, setForm] = useState(initial)
  const [saved, setSaved] = useState(false)
  useEffect(() => { setForm(initial); setSaved(false) }, [initial])

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm({ ...form, [k]: e.target.value }); setSaved(false) }

  const save = () => {
    update.mutate({
      telefono: form.telefono || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      ciudad: form.ciudad || null,
      tipo_vendedor: form.tipo_vendedor || null,
      anos_experiencia: form.anos_experiencia || null,
      destinos_principales: form.destinos.split(',').map(s => s.trim()).filter(Boolean),
    }, {
      onSuccess: () => { setSaved(true); toast.success('✓ Datos guardados') },
      onError:   () => toast.error('No se pudieron guardar los datos'),
    })
  }

  const shareRefWA = () => {
    const msg = `¡Hola! Te invito a Travexa Academy, la plataforma de formación para asesores de viajes. Registrate con mi código ${referralCode} y ganamos Créditos los dos 🪙\n\n${referralUrl}`
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
  }

  return (
    <div className="max-w-[640px]">
      {/* no editables */}
      <div className="mb-6">
        <DataLabel>Datos de cuenta — no editables</DataLabel>
        <div className="grid grid-cols-2 gap-2">
          <LockedField label="Nombre" value={nombre} />
          <LockedField label="Apellido" value={apellido} />
        </div>
        <div className="mt-2"><LockedField label="Email" value={email} /></div>
        <div className="flex items-center gap-1.5 text-[.75rem] mt-2" style={{ color: 'var(--text-3)' }}>
          <Lock className="h-3 w-3" /> Para cambiar tu email o nombre, contactá a soporte.
        </div>
      </div>

      {/* personal */}
      <div className="mb-6">
        <DataLabel>Información personal</DataLabel>
        <div className="grid grid-cols-1 min-[560px]:grid-cols-3 gap-3 mb-3">
          <Field label="Teléfono / WhatsApp"><input className="td-input" type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+54 9 11…" /></Field>
          <Field label="Fecha de nacimiento"><input className="td-input" type="date" value={form.fecha_nacimiento ?? ''} onChange={set('fecha_nacimiento')} /></Field>
          <Field label="Género">
            <select className="td-input" value={form.genero ?? ''} onChange={set('genero')}>
              {GENEROS.map(g => <option key={g} value={g}>{g || 'Preferir no decir'}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3">
          <Field label="Ciudad"><input className="td-input" type="text" value={form.ciudad} onChange={set('ciudad')} placeholder="Buenos Aires" /></Field>
        </div>
      </div>

      {/* actividad */}
      <div className="mb-6">
        <DataLabel>Tu actividad como asesor</DataLabel>
        <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3">
          <Field label="Tipo de vendedor">
            <select className="td-input" value={form.tipo_vendedor} onChange={set('tipo_vendedor')}>
              <option value="">Seleccionar…</option>
              {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Años de experiencia en turismo">
            <select className="td-input" value={form.anos_experiencia} onChange={set('anos_experiencia')}>
              <option value="">Seleccionar…</option>
              {EXPERIENCIAS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Destinos que más vendés (separados por coma)"><input className="td-input" type="text" value={form.destinos} onChange={set('destinos')} placeholder="Ej: Caribe, Europa, Perú" /></Field>
        </div>
      </div>

      {/* referido */}
      <div className="mb-6">
        <DataLabel>Código de referido</DataLabel>
        <div className="flex items-center gap-2.5 rounded-[10px] px-4 py-3" style={{ background: 'rgba(0,229,200,.06)', border: '1px solid rgba(0,229,200,.2)' }}>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] tracking-[.12em] uppercase mb-0.5" style={{ color: NEON }}>Tu código único</div>
            <div className="font-display font-bold text-[1.1rem]" style={{ color: 'var(--text-1)' }}>{referralCode || '—'}</div>
            <div className="text-[.72rem] mt-0.5" style={{ color: 'var(--text-3)' }}>Cada asesor que se registre con tu código te suma +20 Créditos</div>
          </div>
          <button onClick={shareRefWA} className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--card)', color: 'var(--text-2)' }}>💬 Compartir</button>
          <button onClick={() => { void navigator.clipboard.writeText(referralCode); toast.success('Código copiado') }} className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--card)', color: 'var(--text-2)' }}><Copy className="h-3 w-3" /> Copiar</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!dirty || update.isPending}
          className="min-w-[140px] py-2 px-4 rounded-lg text-[13px] font-semibold flex items-center justify-center"
          style={dirty ? { background: NEON, color: '#0A1E29' } : { background: 'rgba(255,255,255,.1)', color: 'var(--text-3)', cursor: 'not-allowed' }}>
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
        </button>
        {dirty && <button onClick={() => setForm(initial)} className="text-sm" style={{ color: 'var(--text-3)' }}>Cancelar</button>}
        {saved && !dirty && <span className="text-[.8rem]" style={{ color: NEON }}>✓ Datos guardados</span>}
      </div>
    </div>
  )
}
function DataLabel({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-[.12em] uppercase mb-3" style={{ color: NEON }}>{children}<span className="flex-1 h-px" style={{ background: 'var(--line)' }} /></div>
}
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5 flex flex-col gap-0.5" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
      <span className="font-mono text-[8.5px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-[.85rem] font-medium truncate" style={{ color: 'var(--text-2)' }}>{value || '—'}</span>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-[.78rem] font-medium" style={{ color: 'var(--text-3)' }}>{label}</span>{children}</label>
}

// ── MODALS ────────────────────────────────────────────────────────────
function CertModal({ enrollment, userName, onClose }: { enrollment: Enrollment | null; userName: string; onClose: () => void }) {
  const c = enrollment?.course
  const fecha = enrollment?.fecha_completado ? shortDate(enrollment.fecha_completado) : ''
  return (
    <Modal open={!!enrollment} onClose={onClose} maxW={500}>
      <ModalX onClose={onClose} />
      <div className="p-6">
        <div className="relative rounded-2xl p-9 text-center overflow-hidden mb-4" style={{ background: 'linear-gradient(145deg,#0D2A38,#0A1E29 60%,#0E2D1F)', border: '1px solid rgba(201,154,58,.4)' }}>
          <div className="font-display font-bold text-[.82rem] tracking-[.12em] uppercase mb-5" style={{ color: 'rgba(201,154,58,.7)' }}>✦ Travexa Academy</div>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg,rgba(201,154,58,.3),rgba(201,154,58,.1))', border: '2px solid rgba(201,154,58,.5)' }}>🏅</div>
          <div className="font-mono text-[8.5px] tracking-[.2em] uppercase mb-1.5" style={{ color: 'var(--text-3)' }}>Certifica que</div>
          <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>{userName || 'Alumno'}</div>
          <div className="text-[.88rem] italic mb-4" style={{ color: 'var(--text-2)' }}>{c?.titulo ?? 'Certificado'}</div>
          <div className="w-[60px] h-0.5 mx-auto mb-3.5" style={{ background: 'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
          <div className="font-mono text-[8.5px] tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{fecha ? `Emitido el ${fecha}` : 'Certificado verificable'}</div>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--line-s)', color: 'var(--text-2)' }}>Cerrar</button>
      </div>
    </Modal>
  )
}

function VivModal({ enrollment, onClose }: { enrollment: Enrollment | null; onClose: () => void }) {
  const [t, setT] = useState(0)
  const [open, setOpen] = useState<number | null>(0)
  useEffect(() => { setT(0); setOpen(0) }, [enrollment])
  const c = enrollment?.course
  const itin = (c?.vivencial_itinerario ?? []) as ItinerarioDia[]
  const pendiente = enrollment?.monto_pendiente_ars ?? 0

  return (
    <Modal open={!!enrollment} onClose={onClose} maxW={700}>
      {c && (
        <>
          <div className="relative" style={{ height: 200 }}>
            {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover rounded-t-[20px]" />}
            <div className="absolute inset-0 rounded-t-[20px]" style={{ background: 'linear-gradient(to bottom,rgba(6,13,20,.1),rgba(6,13,20,.78))' }} />
            <ModalX onClose={onClose} />
            <div className="absolute bottom-3.5 left-4.5 right-4.5" style={{ left: 18, right: 18 }}>
              <div className="font-display font-bold text-[1.35rem] text-white">{c.titulo}</div>
              {c.vivencial_pais && <div className="font-mono text-[9px] tracking-[.12em] uppercase mt-1 flex items-center gap-1.5" style={{ color: NEON }}><span className="w-3 h-px" style={{ background: NEON }} />{c.vivencial_pais}</div>}
            </div>
          </div>
          <div className="p-5" style={{ background: '#F2F5F4' }}>
            {enrollment?.seña_pagada && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-3.5 text-[.8rem] font-semibold" style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', color: '#16a34a' }}>
                ✓ Seña pagada{pendiente > 0 ? ` · Saldo pendiente: ${money(pendiente)}` : ''}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3.5">
              {c.vivencial_fecha_salida && <MetaDark icon={<Calendar className="h-3 w-3" />}>{shortDate(c.vivencial_fecha_salida)}{c.vivencial_fecha_regreso ? ` — ${shortDate(c.vivencial_fecha_regreso)}` : ''}</MetaDark>}
              {c.vivencial_ciudad_salida && <MetaDark icon={<MapPin className="h-3 w-3" />}>Sale desde {c.vivencial_ciudad_salida}</MetaDark>}
              {c.duracion_total_minutos ? <MetaDark icon={<Clock className="h-3 w-3" />}>{Math.round(c.duracion_total_minutos / 60)} h</MetaDark> : null}
            </div>

            <div className="flex border-b mb-4 gap-1 overflow-x-auto" style={{ borderColor: 'rgba(0,0,0,.1)' }}>
              {['Descripción', 'Itinerario', 'Qué incluye', 'Instructor'].map((label, i) => (
                <button key={label} onClick={() => setT(i)} className="relative text-[12px] px-3 py-2.5 whitespace-nowrap" style={{ color: t === i ? 'var(--primary)' : '#6A8590', fontWeight: t === i ? 600 : 500 }}>
                  {label}{t === i && <span className="absolute left-0 right-0 -bottom-px h-0.5" style={{ background: 'var(--primary)' }} />}
                </button>
              ))}
            </div>

            {t === 0 && <p className="text-[.85rem] leading-relaxed" style={{ color: '#4A6070' }}>{c.descripcion ?? 'Experiencia vivencial para asesores.'}</p>}

            {t === 1 && (
              <div className="flex flex-col gap-1.5">
                {itin.length === 0 && <p className="text-[.82rem]" style={{ color: '#6A8590' }}>Itinerario disponible próximamente.</p>}
                {itin.map((d, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,0,0,.1)' }}>
                    <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-3 py-2.5 text-left" style={{ background: 'rgba(0,0,0,.025)' }}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[8.5px] tracking-wide uppercase rounded px-1.5 py-0.5" style={{ color: 'var(--primary)', background: 'rgba(14,107,92,.1)' }}>{d.dia}</span>
                        <span className="font-display text-[.84rem] font-semibold" style={{ color: '#0A1E29' }}>{d.titulo}</span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ color: '#6A8590', transform: open === i ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <AnimatePresence>
                      {open === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div className="px-3 py-2.5 text-[.82rem] leading-relaxed" style={{ color: '#4A6070' }}>{d.descripcion}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {t === 2 && (
              <div>
                <p className="text-[.84rem] font-semibold mb-2.5" style={{ color: '#0A1E29' }}>✅ Incluye</p>
                <ul className="text-[.82rem] leading-relaxed pl-4 list-disc" style={{ color: '#4A6070' }}>
                  {(c.incluye ?? []).length ? c.incluye.map((x, i) => <li key={i}>{x}</li>) : <li>Detalle disponible próximamente.</li>}
                </ul>
                {(c.no_incluye ?? []).length > 0 && (
                  <>
                    <p className="text-[.84rem] font-semibold mt-3.5 mb-2" style={{ color: '#8FA3AB' }}>✗ No incluye</p>
                    <ul className="text-[.82rem] leading-relaxed pl-4 list-disc" style={{ color: '#8FA3AB' }}>{c.no_incluye.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </>
                )}
              </div>
            )}

            {t === 3 && (
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-full flex items-center justify-center font-display font-bold text-[1.1rem] shrink-0" style={{ width: 52, height: 52, background: 'linear-gradient(135deg,var(--primary),var(--neon))', color: '#0A1E29' }}>{(c.instructor?.nombre ?? 'YR').split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                <div>
                  <div className="font-display font-bold" style={{ color: '#0A1E29' }}>{c.instructor?.nombre ?? 'Instructor Travexa'}</div>
                  {c.instructor?.bio && <div className="text-[.78rem] mt-0.5" style={{ color: 'var(--primary)' }}>{c.instructor.bio}</div>}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
function MetaDark({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 text-[.78rem]" style={{ color: '#4A6070' }}><span style={{ color: '#8FA3AB' }}>{icon}</span>{children}</div>
}

function MovModal({ open, tx, onClose }: { open: boolean; tx: Array<{ id: string; puntos: number; motivo: string; pool: string; created_at: string; tipo: string }>; onClose: () => void }) {
  const creds = tx.filter(t => t.pool === 'creditos')
  return (
    <Modal open={open} onClose={onClose} maxW={440}>
      <ModalX onClose={onClose} />
      <div className="p-6">
        <div className="font-display font-bold text-[1.2rem] mb-4" style={{ color: 'var(--text-1)' }}>Movimientos 🪙</div>
        {creds.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Todavía no tenés movimientos de Créditos.</p>
        ) : creds.map(t => {
          const plus = t.puntos >= 0
          return (
            <div key={t.id} className="flex items-center gap-2.5 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
              <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[.85rem] shrink-0" style={{ background: plus ? 'rgba(0,229,200,.1)' : 'rgba(239,68,68,.1)' }}>{plus ? '＋' : '－'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[.82rem] font-semibold capitalize" style={{ color: 'var(--text-1)' }}>{t.motivo.replace(/_/g, ' ')}</div>
                <div className="font-mono text-[8.5px] mt-0.5" style={{ color: 'var(--text-3)' }}>{shortDate(t.created_at)}</div>
              </div>
              <span className="font-display text-[.86rem] font-bold whitespace-nowrap" style={{ color: plus ? NEON : '#EF4444' }}>{plus ? '+' : ''}{fmt(t.puntos)} 🪙</span>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

function CanjearModal({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: () => void }) {
  const opts = [
    { t: '🎓 Curso gratis', d: 'Canjeá tus Créditos equivalentes al precio de cualquier curso para acceder sin abonar nada.' },
    { t: '💸 Descuento en cursos', d: 'Aplicá tus Créditos como descuento directo sobre el precio de cualquier curso al comprar.' },
    { t: '🎯 Sorteo de vivencial', d: 'Comprá entradas al sorteo con tus Créditos. Cada sorteo se realiza 30 días antes de cada salida.' },
  ]
  return (
    <Modal open={open} onClose={onClose} maxW={440}>
      <ModalX onClose={onClose} />
      <div className="p-6">
        <div className="font-display font-bold text-[1.2rem] mb-4" style={{ color: 'var(--text-1)' }}>Cómo canjear tus Créditos 🪙</div>
        <div className="flex flex-col gap-2.5">
          {opts.map(o => (
            <div key={o.t} className="rounded-xl border px-4 py-3.5" style={{ background: 'var(--bg-3)', borderColor: 'var(--line)' }}>
              <div className="font-display text-[.9rem] font-bold mb-1" style={{ color: 'var(--text-1)' }}>{o.t}</div>
              <div className="text-[.8rem] leading-relaxed" style={{ color: 'var(--text-2)' }}>{o.d}</div>
            </div>
          ))}
        </div>
        <button onClick={onGo} className="w-full mt-3.5 py-2.5 rounded-lg font-bold text-sm" style={{ background: NEON, color: '#0A1E29' }}>Ir a Canjear</button>
      </div>
    </Modal>
  )
}

function RankingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} maxW={440}>
      <ModalX onClose={onClose} />
      <div className="p-7">
        <div className="text-center mb-4"><div className="text-3xl mb-2.5">🏆</div><div className="font-display font-bold text-[1.2rem]" style={{ color: 'var(--text-1)' }}>Tu reputación importa</div></div>
        <p className="text-[.88rem] leading-relaxed mb-3.5" style={{ color: 'var(--text-2)' }}>Tu posición en el ranking de Academy no es solo un número. Travexa muestra a los viajeros el perfil de los asesores con mayor formación.</p>
        <p className="text-[.88rem] leading-relaxed mb-3.5" style={{ color: 'var(--text-2)' }}>Un asesor con alto XP aparece primero en los resultados del viajero, genera más confianza y cierra más ventas.</p>
        <div className="rounded-[10px] px-4 py-3.5" style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.2)' }}>
          <p className="text-[.82rem] font-semibold" style={{ color: NEON }}>El mejor momento para subir en el ranking es antes de que los demás lo hagan. Completá más cursos y vivenciales.</p>
        </div>
      </div>
    </Modal>
  )
}

function UploadModal({ open, uid, onClose }: { open: boolean; uid?: string; onClose: () => void }) {
  const upload = useUploadCertificate(uid)
  const [title, setTitle] = useState('')
  const [date, setDate]   = useState('')
  const [file, setFile]   = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setTitle(''); setDate(''); setFile(null) } }, [open])

  const ready = title.trim() && date && file
  const submit = () => {
    if (!ready || !file) return
    upload.mutate(file, {
      onSuccess: () => { toast.success('✓ Certificado subido'); onClose() },
      onError:   () => toast.error('No se pudo subir el archivo'),
    })
  }

  return (
    <Modal open={open} onClose={onClose} maxW={420}>
      <ModalX onClose={onClose} />
      <div className="p-6">
        <div className="font-display font-bold text-[1.2rem] mb-4" style={{ color: 'var(--text-1)' }}>Subir certificado 📎</div>
        <Field label="Título del certificado"><input className="td-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Guía de Turismo — Instituto Nacional" /></Field>
        <div className="mt-3"><Field label="Fecha de emisión"><input className="td-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field></div>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={() => inputRef.current?.click()} className="w-full mt-3 rounded-[10px] p-5.5 text-center" style={{ border: '2px dashed var(--line-s)', padding: 22 }}>
          <Upload className="h-6 w-6 mx-auto mb-1.5" style={{ color: 'var(--text-3)' }} />
          <p className="text-[.8rem]" style={{ color: file ? NEON : 'var(--text-3)' }}>{file ? `📎 ${file.name}` : 'Hacé clic para adjuntar un archivo'}<br /><span className="text-[.7rem] opacity-60">PDF, JPG o PNG · máx. 5MB</span></p>
        </button>
        <div className="flex gap-2 mt-3">
          <button onClick={submit} disabled={!ready || upload.isPending} className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center"
            style={ready ? { background: NEON, color: '#0A1E29' } : { background: 'rgba(255,255,255,.08)', color: 'var(--text-3)', cursor: 'not-allowed' }}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subir certificado'}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--line-s)', color: 'var(--text-2)' }}>Cerrar</button>
        </div>
      </div>
    </Modal>
  )
}

function LevelsModal({ open, currentN, onClose }: { open: boolean; currentN: number; onClose: () => void }) {
  const colors = ['rgba(143,163,171,.15)', 'rgba(78,205,184,.15)', 'rgba(14,107,92,.25)', 'rgba(0,229,200,.2)', 'rgba(201,154,58,.2)']
  return (
    <Modal open={open} onClose={onClose} maxW={480}>
      <ModalX onClose={onClose} />
      <div className="p-7">
        <div className="font-display font-bold text-[1.2rem] mb-4" style={{ color: 'var(--text-1)' }}>Niveles de formación ✦</div>
        <div className="pl-1">
          {NIVELES.map(l => {
            const cur = l.n === currentN
            return (
              <div key={l.n} className="relative flex items-center gap-3 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                {cur && <span className="absolute rounded-r" style={{ left: -28, top: 0, bottom: 0, width: 3, background: NEON }} />}
                <div className="w-9 h-9 rounded-[9px] flex items-center justify-center font-display font-bold text-[.9rem] shrink-0" style={{ background: colors[l.n - 1], color: l.n === 4 ? '#0A1E29' : 'var(--text-1)' }}>{l.n}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[.88rem] leading-tight" style={{ color: cur ? NEON : 'var(--text-1)' }}>{l.nombre}{cur ? ' ← vos' : ''}</div>
                  <div className="text-[.72rem] mt-0.5" style={{ color: 'var(--primary-l)' }}>{l.benefit}</div>
                </div>
                <span className="font-mono text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ background: cur ? 'var(--neon-dim)' : 'rgba(255,255,255,.05)', color: cur ? NEON : 'var(--text-3)' }}>{fmt(l.min)} XP</span>
              </div>
            )
          })}
        </div>
        <div className="text-[.75rem] mt-3.5 pt-3 border-t" style={{ color: 'var(--text-3)', borderColor: 'var(--line)' }}>Los XP son tu historial de aprendizaje — no se gastan. Los Créditos 🪙 son tu moneda canjeable — esos sí se descuentan.</div>
      </div>
    </Modal>
  )
}
