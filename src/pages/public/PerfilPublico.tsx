import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Plane, Flame, Award, Star, Lock, ExternalLink, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import type { AcademyProfile, Badge, UserBadge, Certificate } from '@/types'
import { nivelFromPuntos } from '@/types'
import { staggerContainer, staggerItem, EASE_OUT } from '@/lib/motion'
import { LinkedinShareButton } from 'react-share'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ── Data fetch ────────────────────────────────────────────────────

interface PublicProfileData {
  profile: AcademyProfile & { nombre?: string; apellido?: string; avatar_url?: string; email?: string }
  badges: (UserBadge & { badge: Badge })[]
  certificates: (Certificate & { course?: { titulo?: string; thumbnail_url?: string; slug?: string } })[]
  allBadges: Badge[]
}

async function fetchPublicProfile(username: string): Promise<PublicProfileData | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Buscar por username en academy_profiles
  const { data: ap } = await db
    .from('academy_profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!ap) return null

  // Datos base del usuario desde profiles
  const { data: baseProfile } = await supabase
    .from('profiles')
    .select('nombre, apellido, avatar_url, email')
    .eq('id', ap.user_id)
    .maybeSingle()

  // Badges del usuario
  const { data: userBadges } = await db
    .from('academy_user_badges')
    .select('*, badge:academy_badges(*)')
    .eq('user_id', ap.user_id)
    .order('earned_at', { ascending: false })

  // Todos los badges (para mostrar los bloqueados)
  const { data: allBadges } = await db
    .from('academy_badges')
    .select('*')
    .eq('activo', true)

  // Certificados (públicos)
  const { data: certs } = await db
    .from('academy_certificates')
    .select('*, course:academy_courses(titulo, thumbnail_url, slug)')
    .eq('user_id', ap.user_id)
    .order('emitido_at', { ascending: false })

  return {
    profile:      { ...ap, ...(baseProfile ?? {}) } as PublicProfileData['profile'],
    badges:       (userBadges ?? []) as PublicProfileData['badges'],
    certificates: (certs ?? []) as PublicProfileData['certificates'],
    allBadges:    (allBadges ?? []) as Badge[],
  }
}

// ── Stat pill ─────────────────────────────────────────────────────

function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-mono px-3 py-1.5 rounded-full" style={{ background: 'var(--card)', color }}>
      {icon}
      <strong>{value}</strong>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

// ── Badge card (read-only) ────────────────────────────────────────

function PublicBadgeCard({ badge, earned, earnedAt }: { badge: Badge; earned: boolean; earnedAt?: string }) {
  return (
    <motion.div
      variants={staggerItem}
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center"
      style={{
        background:  earned ? 'var(--bg-2)' : 'var(--card)',
        borderColor: earned ? badge.color + '40' : 'var(--line)',
        opacity:     earned ? 1 : 0.4,
        filter:      earned ? 'none' : 'grayscale(0.9)',
      }}
    >
      {!earned && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ backdropFilter: 'blur(2px)', background: 'rgba(10,30,41,.5)', zIndex: 1 }}>
          <Lock className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
        </div>
      )}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative z-10" style={{ background: earned ? badge.color + '25' : 'var(--card)' }}>
        {badge.icono}
      </div>
      <div className="relative z-10">
        <p className="font-display font-bold text-xs leading-tight" style={{ color: earned ? 'var(--text-1)' : 'var(--text-3)' }}>
          {badge.nombre}
        </p>
        {earned && earnedAt && (
          <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {formatDistanceToNow(new Date(earnedAt), { addSuffix: true, locale: es })}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────

export default function PerfilPublico() {
  const { username } = useParams<{ username: string }>()
  const [copied, setCopied] = useState(false)
  const profileUrl = `${window.location.origin}/u/${username ?? ''}`

  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn:  () => fetchPublicProfile(username!),
    enabled:  !!username,
    staleTime: 1000 * 60 * 5,
  })

  const copy = async () => {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--card)' }}>
            <BookOpen className="h-8 w-8" style={{ color: 'var(--text-3)' }} />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-1)' }}>Perfil no encontrado</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>El usuario @{username} no existe o no tiene perfil público.</p>
          <Link to="/cursos" className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
            Explorar cursos
          </Link>
        </div>
      </div>
    )
  }

  const { profile, badges, certificates, allBadges } = data
  const puntos   = profile.puntos ?? 0
  const streak   = profile.streak_actual ?? 0
  const nivel    = nivelFromPuntos(puntos)
  const nombre   = `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || username

  const earnedIds    = new Set(badges.map(b => b.badge_id))
  const unearnedBadges = allBadges.filter(b => !earnedIds.has(b.id))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* Hero profile */}
      <section
        className="border-b px-4 pt-12 pb-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--bg-2) 0%, var(--bg) 100%)', borderColor: 'var(--line)' }}
      >
        {/* BG glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 pointer-events-none" style={{ background: 'var(--primary)', filter: 'blur(100px)' }} />

        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={nombre}
                  className="w-24 h-24 rounded-3xl object-cover border-2"
                  style={{ borderColor: 'var(--primary)' }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center font-display font-bold text-3xl border-2"
                  style={{ background: 'var(--primary-s)', color: 'var(--primary-l)', borderColor: 'var(--primary)' }}
                >
                  {nombre?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              className="flex-1 min-w-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: EASE_OUT }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-1)' }}>{nombre}</h1>
                {username && (
                  <span className="font-mono text-sm" style={{ color: 'var(--text-3)' }}>@{username}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="font-mono text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
                  <Star className="h-3 w-3 inline mr-1" />{nivel}
                </span>
                {profile.ciudad && (
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--card)', color: 'var(--text-3)' }}>
                    📍 {profile.ciudad}
                  </span>
                )}
                {profile.tipo_cuenta && (
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
                    {profile.tipo_cuenta}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm mb-4 max-w-md" style={{ color: 'var(--text-2)' }}>{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={<Award className="h-3.5 w-3.5" />} value={puntos.toLocaleString('es-AR')} label="pts" color="var(--gold)" />
                {streak > 0 && <StatPill icon={<Flame className="h-3.5 w-3.5" />} value={streak} label={streak === 1 ? 'día' : 'días'} color="var(--pending)" />}
                <StatPill icon={<BookOpen className="h-3.5 w-3.5" />} value={profile.total_cursos_completados ?? 0} label="cursos" color="var(--primary)" />
                {(profile.total_vivenciales ?? 0) > 0 && (
                  <StatPill icon={<Plane className="h-3.5 w-3.5" />} value={profile.total_vivenciales!} label="viajes" color="var(--primary-l)" />
                )}
              </div>
            </motion.div>

            {/* Share */}
            <div className="flex gap-2 sm:flex-col sm:items-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => void copy()}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border"
                style={{ borderColor: 'var(--line)', color: copied ? 'var(--primary-l)' : 'var(--text-2)', background: copied ? 'var(--primary-s)' : 'transparent' }}
              >
                {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar link</>}
              </motion.button>
              <LinkedinShareButton url={profileUrl} title={`Mirá el perfil de ${nombre} en Travexa Academy — ${nivel} en formación turística.`}>
                <div className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border" style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}>
                  <ExternalLink className="h-4 w-4" /> LinkedIn
                </div>
              </LinkedinShareButton>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-12">

        {/* Logros */}
        {(badges.length > 0 || allBadges.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Award className="h-5 w-5" style={{ color: 'var(--gold)' }} />
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>
                Logros
              </h2>
              <span className="font-mono text-sm ml-1" style={{ color: 'var(--text-3)' }}>
                {badges.length} de {allBadges.length}
              </span>
            </div>

            {badges.length > 0 && (
              <div className="mb-6">
                <p className="font-mono text-xs font-semibold mb-3" style={{ color: 'var(--text-3)' }}>OBTENIDOS</p>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                >
                  {badges.map(ub => (
                    <PublicBadgeCard key={ub.id} badge={ub.badge} earned earnedAt={ub.earned_at} />
                  ))}
                </motion.div>
              </div>
            )}

            {unearnedBadges.length > 0 && (
              <div>
                <p className="font-mono text-xs font-semibold mb-3" style={{ color: 'var(--text-3)' }}>POR DESBLOQUEAR</p>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                >
                  {unearnedBadges.map(b => (
                    <PublicBadgeCard key={b.id} badge={b} earned={false} />
                  ))}
                </motion.div>
              </div>
            )}
          </section>
        )}

        {/* Certificados */}
        {certificates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="h-5 w-5" style={{ color: 'var(--primary-l)' }} />
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>
                Certificados
              </h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {certificates.map(cert => (
                <motion.div
                  key={cert.id}
                  variants={staggerItem}
                  className="flex gap-4 p-4 rounded-2xl border"
                  style={{ background: 'var(--bg-2)', borderColor: 'rgba(201,154,58,.2)' }}
                >
                  {cert.course?.thumbnail_url ? (
                    <img src={cert.course.thumbnail_url} alt="" className="w-16 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gold-soft)' }}>
                      <Award className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm line-clamp-2 leading-snug" style={{ color: 'var(--text-1)' }}>
                      {cert.course?.titulo ?? 'Certificado'}
                    </p>
                    <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                      #{cert.numero} · {new Date(cert.emitido_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <LinkedinShareButton
                    url={`${window.location.origin}/certificados/${cert.numero}`}
                    title={`Obtuve el certificado "${cert.course?.titulo ?? ''}" en Travexa Academy`}
                    className="shrink-0 self-center"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(10,102,194,.15)', color: '#0a66c2' }}>
                      <Share2 className="h-3.5 w-3.5" />
                    </div>
                  </LinkedinShareButton>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Empty state si no hay nada */}
        {badges.length === 0 && certificates.length === 0 && (
          <div className="text-center py-16">
            <Award className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
            <p className="font-display font-semibold" style={{ color: 'var(--text-2)' }}>{nombre} todavía está construyendo su perfil</p>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--text-3)' }}>Pronto aparecerán sus logros y certificados acá.</p>
            <Link to="/cursos" className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
              Explorar cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
