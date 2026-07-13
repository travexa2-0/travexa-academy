import { motion } from 'framer-motion'
import { Users, PlayCircle, GraduationCap, Award, Percent } from 'lucide-react'
import { useFormacionStats } from '@/hooks/useFormacionStats'

// Fila de tarjetas destacadas del hero de /cursos, con el mismo lenguaje visual
// que las KPI cards del Centro de control admin (ícono + número grande + label).
// Datos 100% reales vía RPC `academy_public_formacion_stats` (ver useFormacionStats).
//
// Integridad de datos (Sesión 14): la fila entera se OCULTA hasta que haya
// volumen real — no se muestran ceros crudos ni números bajos poco creíbles en
// una landing pública. Se aplica el mismo piso de usuarios activos que ya usaba
// la tira de métricas de Formación.
const MIN_USUARIOS = 50

const nf = new Intl.NumberFormat('es-AR')

export default function FormacionStatsRow() {
  const { data: stats } = useFormacionStats()

  // Piso de volumen: por debajo, no hay prueba social creíble → ocultar todo.
  if (!stats || stats.usuariosActivos < MIN_USUARIOS) return null

  const tiles = [
    { n: nf.format(stats.usuariosActivos), label: 'Usuarios activos', icon: <Users className="h-[18px] w-[18px]" /> },
    { n: nf.format(stats.cursosIniciados), label: 'Cursos iniciados', icon: <PlayCircle className="h-[18px] w-[18px]" /> },
    { n: nf.format(stats.cursosCompletados), label: 'Cursos completados', icon: <GraduationCap className="h-[18px] w-[18px]" /> },
    { n: nf.format(stats.certificados), label: 'Certificados', icon: <Award className="h-[18px] w-[18px]" /> },
    { n: `${nf.format(stats.tasaFinalizacion)}%`, label: 'Tasa de finalización', icon: <Percent className="h-[18px] w-[18px]" /> },
  ]

  return (
    <motion.div
      className="relative z-[1] w-full max-w-[1200px] mx-auto px-[22px] mt-12 grid gap-[12px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.7 }}
    >
      {tiles.map(t => (
        <div
          key={t.label}
          className="rounded-2xl border p-[18px] flex flex-col gap-2"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', color: 'var(--neon)' }}
          >
            {t.icon}
          </div>
          <span className="font-display font-bold" style={{ fontSize: '2rem', lineHeight: 1, color: 'var(--text-1)' }}>
            {t.n}
          </span>
          <span className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '.09em', color: 'var(--text-3)' }}>
            {t.label}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
