import { motion } from 'framer-motion'
import { useCommunityStats } from '@/lib/communityStats'
import StatCardItem from '@/components/shared/StatCardItem'

// Fila de tarjetas destacadas del hero de /cursos.
//
// Datos REALES vía RPC `academy_public_formacion_stats` (ver useCommunityStats /
// useFormacionStats), NUNCA hardcodeados. Se OCULTA entera mientras no haya
// volumen real (usuarios activos por debajo del piso). Desde Sesión 43 son 4
// (sin "Tasa de finalización").
export default function FormacionStatsRow() {
  const cards = useCommunityStats()
  if (cards.length === 0) return null

  return (
    <motion.div
      className="relative z-[1] w-full max-w-[1200px] mx-auto px-[22px] mt-12 grid gap-[14px] grid-cols-2 lg:grid-cols-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.7 }}
    >
      {cards.map(s => (
        <StatCardItem key={s.key} stat={s} />
      ))}
    </motion.div>
  )
}
