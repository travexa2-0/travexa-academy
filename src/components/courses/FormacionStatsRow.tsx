import { motion } from 'framer-motion'
import { Users, BookOpen, CheckCircle2, Trophy, TrendingUp } from 'lucide-react'

// Fila de tarjetas destacadas del hero de /cursos.
//
// ⚠️ Números ILUSTRATIVOS por decisión explícita de producto (Nico, Sesión 27):
// son valores fijos de referencia, NO conectados a ninguna query. Se pidieron así
// a propósito (override consciente del principio de integridad de datos para este
// elemento decorativo del hero). Si en el futuro se quieren números reales, existe
// el RPC `academy_public_formacion_stats` (useFormacionStats) listo para enchufar.
const STATS: { n: string; label: string; icon: React.ReactNode; color: string; tint: string }[] = [
  { n: '195',  label: 'Usuarios activos',    icon: <Users className="h-[19px] w-[19px]" />,        color: '#2FC4AE', tint: 'rgba(47,196,174,.14)' },
  { n: '769',  label: 'Cursos iniciados',    icon: <BookOpen className="h-[19px] w-[19px]" />,      color: 'var(--text-1)', tint: 'rgba(245,243,236,.10)' },
  { n: '567',  label: 'Cursos completados',  icon: <CheckCircle2 className="h-[19px] w-[19px]" />,   color: '#4ADE80', tint: 'rgba(74,222,128,.14)' },
  { n: '422',  label: 'Certificados',        icon: <Trophy className="h-[19px] w-[19px]" />,         color: '#E0A24E', tint: 'rgba(224,162,78,.15)' },
  { n: '74%',  label: 'Tasa de finalización', icon: <TrendingUp className="h-[19px] w-[19px]" />,     color: '#A78BFA', tint: 'rgba(167,139,250,.16)' },
]

export default function FormacionStatsRow() {
  return (
    <motion.div
      className="relative z-[1] w-full max-w-[1200px] mx-auto px-[22px] mt-12 grid gap-[14px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.7 }}
    >
      {STATS.map(s => (
        <div
          key={s.label}
          className="flex items-center gap-[13px] rounded-2xl border px-[18px] py-[17px]"
          style={{ background: 'var(--card)', borderColor: 'var(--line)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
            style={{ background: s.tint, color: s.color }}
          >
            {s.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold" style={{ fontSize: '1.9rem', lineHeight: 1, color: s.color, letterSpacing: '-.02em' }}>
              {s.n}
            </span>
            <span className="mt-[5px]" style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '.01em' }}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
