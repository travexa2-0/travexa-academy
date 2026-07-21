import { motion } from 'framer-motion'
import { Users, BookOpen, CheckCircle2, Trophy } from 'lucide-react'
import type { StatCard } from '@/lib/communityStats'
import StatCardItem from '@/components/shared/StatCardItem'

// Fila de tarjetas destacadas del hero de /cursos.
//
// HARDCODE INTENCIONAL: números de ejemplo en la tira de Formación, decisión
// explícita de Nico (sesión jul-2026, revirtiendo el cableado a datos reales de
// la Sesión 43b). No "corregir" pensando que es un bug: los datos reales del RPC
// (32/2/0/0 hoy) son demasiado bajos para mostrarse de cara al público, así que se
// vuelve a los números de ejemplo del mockup. Mismo criterio que los cupos
// hardcodeados de vivenciales (cupo.ts, Sesión 41). El Home (/) NO usa esto: sigue
// con datos reales vía RPC + piso de 50 (useCommunityStats). El hook
// `useFormacionStats` real queda disponible por si se quiere reconectar acá.
const STATS: StatCard[] = [
  { key: 'usuarios',     n: '195', label: 'Usuarios activos',   icon: <Users className="h-[19px] w-[19px]" />,        color: '#2FC4AE',       tint: 'rgba(47,196,174,.14)' },
  { key: 'iniciados',    n: '769', label: 'Cursos iniciados',   icon: <BookOpen className="h-[19px] w-[19px]" />,      color: 'var(--text-1)', tint: 'rgba(245,243,236,.10)' },
  { key: 'completados',  n: '567', label: 'Cursos completados', icon: <CheckCircle2 className="h-[19px] w-[19px]" />,  color: '#4ADE80',       tint: 'rgba(74,222,128,.14)' },
  { key: 'certificados', n: '422', label: 'Certificados',       icon: <Trophy className="h-[19px] w-[19px]" />,        color: '#E0A24E',       tint: 'rgba(224,162,78,.15)' },
]

export default function FormacionStatsRow() {
  return (
    <motion.div
      className="relative z-[1] w-full max-w-[1200px] mx-auto px-[22px] mt-12 grid gap-[14px] grid-cols-2 lg:grid-cols-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.7 }}
    >
      {STATS.map(s => (
        <StatCardItem key={s.key} stat={s} />
      ))}
    </motion.div>
  )
}
