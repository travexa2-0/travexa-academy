import { useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Camera, Share2, Copy, Award, BookOpen, Plane,
  Flame, Star, ExternalLink, Users, Edit3, X, Check, Loader2,
  Gift, Lock, Link as LinkIcon,
} from 'lucide-react'
import { WhatsappShareButton, LinkedinShareButton } from 'react-share'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  useAcademyProfile, useUpdateProfile, uploadAvatar,
  useBadges, useCertificates, useReferrals,
} from '@/hooks/useProfile'
import { nivelFromPuntos } from '@/types'
import type { AcademyProfile, Badge } from '@/types'
import { staggerContainer, staggerItem, scaleIn, EASE_OUT } from '@/lib/motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ── Badge card ────────────────────────────────────────────────────

function BadgeCard({ badge, earned, earnedAt }: { badge: Badge; earned: boolean; earnedAt?: string }) {
  const [hovered, setHovered] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      variants={staggerItem}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={shouldReduce ? undefined : { y: -4 }}
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all"
      style={{
        background: earned ? 'var(--bg-2)' : 'var(--card)',
        borderColor: earned ? badge.color + '40' : 'var(--line)',
        opacity: earned ? 1 : 0.55,
        filter: earned ? 'none' : 'grayscale(0.8)',
      }}
    >
      {!earned && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ backdropFilter: 'blur(3px)', background: 'rgba(10,30,41,.4)', zIndex: 1 }}>
          <Lock className="h-5 w-5" style={{ color: 'var(--text-3)' }} />
        </div>
      )}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative z-10"
        style={{ background: earned ? badge.color + '25' : 'var(--card)' }}
      >
        {badge.icono}
      </div>
      <div className="relative z-10">
        <p className="font-display font-bold text-xs leading-tight" style={{ color: earned ? 'var(--text-1)' : 'var(--text-3)' }}>
          {badge.nombre}
        </p>
        {earned && earnedAt && (
          <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {new Date(earnedAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      {/* Tooltip en hover */}
      <AnimatePresence>
        {hovered && earned && badge.descripcion && (
          <motion.div
            {...scaleIn}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs w-36 text-center pointer-events-none z-20"
            style={{ background: 'var(--card-solid)', color: 'var(--text-2)', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}
          >
            {badge.descripcion}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Puntos level bar ──────────────────────────────────────────────

const LEVELS = [
  { nombre: 'Explorador', min: 0,    max: 500  },
  { nombre: 'Asesor',     min: 501,  max: 2000 },
  { nombre: 'Experto',    min: 2001, max: 5000 },
  { nombre: 'Embajador',  min: 5001, max: Infinity },
]

function LevelProgress({ puntos }: { puntos: number }) {
  const levelIdx  = LEVELS.findIndex((l, i) => puntos >= l.min && (i === LEVELS.length - 1 || puntos <= l.max))
  const level     = LEVELS[levelIdx]
  const nextLevel = LEVELS[levelIdx + 1]
  const pct       = nextLevel
    ? Math.min(100, Math.round(((puntos - level.min) / (nextLevel.min - level.min)) * 100))
    : 100

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-3)' }}>Nivel actual</p>
          <p className="font-display font-bold text-xl" style={{ color: 'var(--gold)' }}>{level.nombre}</p>
        </div>
        {nextLevel && (
          <div className="text-right">
            <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-3)' }}>Siguiente</p>
            <p className="font-mono text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{nextLevel.nombre}</p>
          </div>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span style={{ color: 'var(--text-3)' }}>{puntos.toLocaleString('es-AR')} pts</span>
        {nextLevel && <span style={{ color: 'var(--text-3)' }}>Faltan {(nextLevel.min - puntos).toLocaleString('es-AR')} pts</span>}
      </div>
    </div>
  )
}

// ── Certificate card ──────────────────────────────────────────────

function CertificateCard({ cert }: { cert: { id: string; numero: string; emitido_at: string; course?: { titulo?: string; thumbnail_url?: string; slug?: string } } }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/certificados/${cert.numero}`

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div variants={staggerItem} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-2)', borderColor: 'rgba(201,154,58,.25)' }}>
      {/* Preview */}
      <div className="relative h-28 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--bg-deep), #1a2e1a)' }}>
        {cert.course?.thumbnail_url
          ? <img src={cert.course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          : null
        }
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--gold-soft)' }}>
            <Award className="h-6 w-6" style={{ color: 'var(--gold)' }} />
          </div>
          <p className="font-mono text-[10px]" style={{ color: 'var(--gold)' }}>#{cert.numero}</p>
        </div>
      </div>
      {/* Info */}
      <div className="p-4 space-y-3">
        <p className="font-display font-semibold text-sm line-clamp-2 leading-snug" style={{ color: 'var(--text-1)' }}>
          {cert.course?.titulo ?? 'Certificado'}
        </p>
        <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
          Emitido el {new Date(cert.emitido_at).toLocaleDateString('es-AR')}
        </p>
        <div className="flex gap-2">
          <button onClick={() => void copy()} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl border" style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}>
            {copied ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Link</>}
          </button>
          <LinkedinShareButton url={shareUrl} title={`Obtuve el certificado "${cert.course?.titulo ?? ''}" en Travexa Academy`} className="flex-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl border w-full" style={{ borderColor: 'rgba(10,102,194,.4)', color: '#0a66c2' }}>
              <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
            </div>
          </LinkedinShareButton>
        </div>
      </div>
    </motion.div>
  )
}

// ── Edit profile modal ────────────────────────────────────────────

function EditProfileModal({
  profile,
  onClose,
}: {
  profile: AcademyProfile
  onClose: () => void
}) {
  const { user } = useAuth()
  const { mutate: updateProfile, isPending } = useUpdateProfile(user?.id)
  const [bio, setBio]       = useState(profile.bio ?? '')
  const [ciudad, setCiudad] = useState(profile.ciudad ?? '')

  const handleSave = () => {
    updateProfile({ bio, ciudad }, { onSuccess: onClose })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,20,.8)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        {...scaleIn}
        className="w-full max-w-md rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>Editar perfil</h3>
          <button onClick={onClose} style={{ color: 'var(--text-3)' }}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'var(--text-2)' }}>Bio</Label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Contá algo sobre vos..."
              maxLength={300}
              rows={3}
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
            />
            <p className="text-xs text-right font-mono" style={{ color: 'var(--text-3)' }}>{bio.length}/300</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm" style={{ color: 'var(--text-2)' }}>Ciudad</Label>
            <Input
              value={ciudad}
              onChange={e => setCiudad(e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className="h-10"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="ghost" className="flex-1" style={{ color: 'var(--text-3)' }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1 font-semibold" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Perfil page ──────────────────────────────────────────────

export default function Perfil() {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const qc                = useQueryClient()
  const fileInputRef      = useRef<HTMLInputElement>(null)

  const { data: profile }               = useAcademyProfile(user?.id)
  const { all: allBadges, earned: userBadges, earnedIds } = useBadges(user?.id)
  const { data: certificates = [] }     = useCertificates(user?.id)
  const { data: referrals = [] }        = useReferrals(user?.id)

  const [avatarUrl, setAvatarUrl]     = useState<string | null>(user?.user_metadata?.avatar_url as string ?? null)
  const [uploadingAvatar, setUploading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeSection, setActiveSection] = useState<'logros' | 'certificados' | 'referidos' | 'datos'>('logros')
  const [copiedRef, setCopiedRef]       = useState(false)
  const [showShareProfile, setShowShareProfile] = useState(false)

  const nombre   = (user?.user_metadata as { nombre?: string })?.nombre ?? ''
  const apellido = (user?.user_metadata as { apellido?: string })?.apellido ?? ''
  const puntos   = profile?.puntos ?? 0
  const streak   = profile?.streak_actual ?? 0
  const nivel    = nivelFromPuntos(puntos)

  const referralCode = profile?.referral_code ?? ''
  const referralUrl  = `${window.location.origin}/registro?ref=${referralCode}`
  const completados  = referrals.filter(r => r.estado === 'completado').length
  const profileUrl   = `${window.location.origin}/u/${profile?.username ?? user?.id}`

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploading(true)
    const url = await uploadAvatar(user.id, file)
    if (url) {
      setAvatarUrl(url)
      // Sincronizar auth metadata para que user_metadata.avatar_url quede consistente
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      // profiles.avatar_url ya se guardó dentro de uploadAvatar; invalidar queries
      void qc.invalidateQueries({ queryKey: ['academy-profile', user.id] })
      void qc.invalidateQueries({ queryKey: ['public-profile'] })
    }
    setUploading(false)
    // Resetear input para permitir re-subir el mismo archivo
    e.target.value = ''
  }

  const copyRef = async () => {
    await navigator.clipboard.writeText(referralUrl)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const SECTIONS = [
    { key: 'logros' as const,       label: 'Logros',       icon: <Award className="h-3.5 w-3.5" /> },
    { key: 'certificados' as const, label: 'Certificados', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'referidos' as const,    label: 'Referidos',    icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'datos' as const,        label: 'Mis datos',    icon: <Edit3 className="h-3.5 w-3.5" /> },
  ]

  const earnedBadges   = userBadges.map(ub => ({ badge: ub.badge as Badge, earnedAt: ub.earned_at })).filter(b => b.badge)
  const unearnedBadges = allBadges.filter(b => !earnedIds.has(b.id))

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* Profile header */}
      <section
        className="border-b px-4 pt-10 pb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--bg-2) 0%, var(--bg) 100%)', borderColor: 'var(--line)' }}
      >
        {/* Background blur decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'var(--primary)', filter: 'blur(80px)' }} />

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2" style={{ borderColor: 'var(--primary)' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-bold text-3xl" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
                    {nombre?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{ background: 'var(--primary)', borderColor: 'var(--bg)', color: '#fff' }}
              >
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => void handleAvatarUpload(e)} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-1)' }}>
                  {nombre} {apellido}
                </h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--card)', color: 'var(--text-3)' }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="font-mono text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
                  <Star className="h-3 w-3 inline mr-1" />{nivel}
                </span>
                {profile?.ciudad && (
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--card)', color: 'var(--text-3)' }}>
                    📍 {profile.ciudad}
                  </span>
                )}
                {profile?.tipo_cuenta && (
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
                    {profile.tipo_cuenta}
                  </span>
                )}
              </div>

              {profile?.bio && (
                <p className="text-sm mb-3 max-w-lg" style={{ color: 'var(--text-2)' }}>{profile.bio}</p>
              )}

              {/* Stats pills */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <Award className="h-3.5 w-3.5" />, value: puntos.toLocaleString('es-AR'), label: 'pts', color: 'var(--gold)' },
                  { icon: <Flame className="h-3.5 w-3.5" />, value: streak, label: streak === 1 ? 'día' : 'días', color: 'var(--pending)' },
                  { icon: <BookOpen className="h-3.5 w-3.5" />, value: profile?.total_cursos_completados ?? 0, label: 'cursos', color: 'var(--primary)' },
                  { icon: <Plane className="h-3.5 w-3.5" />, value: profile?.total_vivenciales ?? 0, label: 'viajes', color: 'var(--primary-l)' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--card)', color: s.color }}>
                    {s.icon}
                    <strong>{s.value}</strong>
                    <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share profile */}
            <div className="sm:self-start flex flex-col gap-2 sm:items-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShareProfile(!showShareProfile)}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border"
                style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
              >
                <Share2 className="h-4 w-4" /> Compartir perfil
              </motion.button>
              <AnimatePresence>
                {showShareProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="rounded-xl border p-3 space-y-2 w-48"
                    style={{ background: 'var(--card-solid)', borderColor: 'var(--line)', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}
                  >
                    <WhatsappShareButton url={profileUrl} title={`Mirá mi perfil en Travexa Academy: soy ${nivel} en formación turística 🎓`} className="w-full">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full" style={{ color: '#25D366' }}>
                        <span>💬</span> WhatsApp
                      </div>
                    </WhatsappShareButton>
                    <button onClick={() => { void navigator.clipboard.writeText(profileUrl).then(() => setShowShareProfile(false)) }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full" style={{ color: 'var(--text-2)' }}>
                      <Copy className="h-3.5 w-3.5" /> Copiar link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Level progress */}
          <div className="mt-6">
            <LevelProgress puntos={puntos} />
          </div>
        </div>
      </section>

      {/* Section tabs */}
      <div className="sticky top-16 z-20 border-b" style={{ background: 'rgba(10,30,41,.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--line)' }}>
        <div className="max-w-4xl mx-auto px-4 flex overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all"
              style={{
                borderColor: activeSection === s.key ? 'var(--primary)' : 'transparent',
                color:       activeSection === s.key ? 'var(--text-1)' : 'var(--text-3)',
              }}
            >
              {s.icon}{s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── LOGROS ────────────────────────────────────────── */}
            {activeSection === 'logros' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>Mis logros</h2>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    {earnedBadges.length} de {allBadges.length} badges obtenidos
                  </p>
                </div>

                {/* Earned badges */}
                {earnedBadges.length > 0 && (
                  <div>
                    <p className="font-mono text-xs mb-4 font-semibold" style={{ color: 'var(--text-3)' }}>OBTENIDOS</p>
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                    >
                      {earnedBadges.map(({ badge, earnedAt }) => (
                        <BadgeCard key={badge.id} badge={badge} earned earnedAt={earnedAt} />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* Unearned badges */}
                {unearnedBadges.length > 0 && (
                  <div>
                    <p className="font-mono text-xs mb-4 font-semibold" style={{ color: 'var(--text-3)' }}>POR DESBLOQUEAR</p>
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                    >
                      {unearnedBadges.map(badge => (
                        <BadgeCard key={badge.id} badge={badge} earned={false} />
                      ))}
                    </motion.div>
                  </div>
                )}

                {allBadges.length === 0 && (
                  <div className="text-center py-16">
                    <Award className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                    <p className="font-display font-semibold" style={{ color: 'var(--text-2)' }}>Los badges se cargarán pronto</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>El sistema de gamificación se activa con las migraciones.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── CERTIFICADOS ──────────────────────────────────── */}
            {activeSection === 'certificados' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>Mis certificados</h2>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Cada certificado tiene un número único verificable.</p>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
                    <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                    <p className="font-display font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Sin certificados todavía</p>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Completá un curso para obtener tu primer certificado.</p>
                    <button onClick={() => navigate('/cursos')} className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
                      Explorar cursos
                    </button>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                  >
                    {certificates.map(cert => (
                      <CertificateCard
                        key={cert.id}
                        cert={{
                          id: cert.id,
                          numero: cert.numero,
                          emitido_at: cert.emitido_at,
                          course: cert.course as { titulo?: string; thumbnail_url?: string; slug?: string } | undefined,
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* ── REFERIDOS ─────────────────────────────────────── */}
            {activeSection === 'referidos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>Referidos</h2>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Invitá colegas y ganen puntos los dos.</p>
                </div>

                {/* CTA banner */}
                <div
                  className="rounded-2xl border p-6 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--primary-s), var(--gold-soft))', borderColor: 'rgba(14,107,92,.3)' }}
                >
                  <div className="absolute top-0 right-0 text-6xl opacity-10 pointer-events-none select-none">🎁</div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-s)' }}>
                      <Gift className="h-6 w-6" style={{ color: 'var(--primary-l)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-bold text-base" style={{ color: 'var(--text-1)' }}>
                        Vos ganás +500 pts · Tu colega gana +200 pts
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
                        Cada vez que alguien se inscribe en un curso con tu código.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm font-bold px-3 py-2 rounded-xl" style={{ background: 'var(--card-solid)', color: 'var(--gold)' }}>
                      <Award className="h-4 w-4" />
                      {completados} referidos exitosos
                    </div>
                  </div>
                </div>

                {/* Código */}
                {referralCode && (
                  <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Tu código de referido</p>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                        <LinkIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-3)' }} />
                        <code className="text-sm font-mono" style={{ color: 'var(--primary-l)' }}>{referralCode}</code>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => void copyRef()}
                        className="px-4 py-2 rounded-xl font-medium text-sm"
                        style={{
                          background: copiedRef ? 'var(--success-s)' : 'var(--primary)',
                          color:      copiedRef ? 'var(--success)' : 'var(--text-1)',
                        }}
                      >
                        {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </motion.button>
                    </div>

                    <div className="flex gap-2">
                      <WhatsappShareButton
                        url={referralUrl}
                        title={`Registrate en Travexa Academy con mi código ${referralCode} y empezá gratis. Formación real para asesores de viajes 🎓✈`}
                        className="flex-1"
                      >
                        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(37,211,102,.15)', color: '#25D366' }}>
                          💬 Compartir por WhatsApp
                        </div>
                      </WhatsappShareButton>
                    </div>
                  </div>
                )}

                {/* Lista de referidos */}
                {referrals.length > 0 ? (
                  <div className="space-y-3">
                    <p className="font-mono text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                      HISTORIAL ({referrals.length} invitaciones)
                    </p>
                    {referrals.map(ref => (
                      <div key={ref.id} className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm" style={{ background: 'var(--card)', color: 'var(--text-3)' }}>?</div>
                          <p className="text-sm font-mono" style={{ color: 'var(--text-3)' }}>
                            {new Date(ref.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{
                            background: ref.estado === 'completado' ? 'var(--success-s)' : 'var(--pending-s)',
                            color:      ref.estado === 'completado' ? 'var(--success)' : 'var(--pending)',
                          }}
                        >
                          {ref.estado === 'completado' ? '✓ +500 pts' : 'pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
                    <Users className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                    <p className="font-display font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Todavía no referiste a nadie</p>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>Compartí tu código con colegas del trade.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── MIS DATOS ─────────────────────────────────────── */}
            {activeSection === 'datos' && (
              <div className="space-y-6 max-w-lg">
                <div>
                  <h2 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>Mis datos</h2>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Información de tu cuenta.</p>
                </div>

                <div className="rounded-2xl border divide-y divide-[var(--line)]" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                  {[
                    { label: 'Nombre', value: `${nombre} ${apellido}`.trim() },
                    { label: 'Email', value: user?.email ?? '' },
                    { label: 'Tipo de cuenta', value: profile?.tipo_cuenta ?? '' },
                    { label: 'Ciudad', value: profile?.ciudad ?? '—' },
                    { label: 'Miembro desde', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : '' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm" style={{ color: 'var(--text-3)' }}>{item.label}</span>
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-1)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowEditModal(true)}
                  variant="ghost"
                  className="w-full border"
                  style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
                >
                  <Edit3 className="h-4 w-4 mr-2" /> Editar bio y ciudad
                </Button>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                  <button
                    onClick={() => { void signOut().then(() => navigate('/login')) }}
                    className="text-sm font-medium"
                    style={{ color: 'rgb(248 113 113)' }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {showEditModal && profile && (
          <EditProfileModal profile={profile} onClose={() => setShowEditModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
