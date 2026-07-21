import { motion } from 'framer-motion'
import { useFormacionStats } from '@/hooks/useFormacionStats'
import { buildCommunityStats } from '@/lib/communityStats'
import StatCardItem from '@/components/shared/StatCardItem'

// Fila de tarjetas destacadas del hero de /cursos.
//
// Datos REALES vía RPC `academy_public_formacion_stats` (useFormacionStats), NUNCA
// hardcodeados. Desde Sesión 43b (decisión de Nico) NO se aplica piso de volumen acá:
// Formación muestra SIEMPRE sus 4 indicadores reales, incluso con números bajos o 0
// (son datos reales, no un error). Solo se oculta si el RPC no devuelve nada. Son 4
// (sin "Tasa de finalización"). El piso de 50 sigue vigente solo en el Home.
export default function FormacionStatsRow() {
  const { data: stats } = useFormacionStats()
  if (!stats) return null
  const cards = buildCommunityStats(stats)

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
