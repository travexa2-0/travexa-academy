import { motion } from 'framer-motion'
import { Target, Brain, TrendingUp, Users, GraduationCap, Award } from 'lucide-react'
import { useFormacionStats } from '@/hooks/useFormacionStats'

// Oferta de valor de Formación: 3 tarjetas (por qué esta formación) + una tira
// de métricas reales. Las tarjetas son copy estático; las métricas salen de la
// base (ver useFormacionStats) y NUNCA se hardcodean. Si no hay dato real, la
// tira entera se oculta (integridad de datos).

const VALUE_CARDS: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <Target className="h-[18px] w-[18px]" />,
    title: '100% aplicable',
    desc: 'Herramientas para tu próxima consulta, no teoría para el cajón.',
  },
  {
    icon: <Brain className="h-[18px] w-[18px]" />,
    title: 'Base en psicología',
    desc: 'Método de los 9 Momentos®, pensado para cerrar ventas reales.',
  },
  {
    icon: <TrendingUp className="h-[18px] w-[18px]" />,
    title: 'Se nota en tu facturación',
    desc: 'Diseñado para que veas el impacto en tus ventas, no en un diploma.',
  },
]

// Volumen mínimo de usuarios para que la tira sea prueba social creíble. Por
// debajo de este piso la sección se oculta entera (la regla no es solo "ocultar
// en cero" sino también con números bajos: mostrar "3 usuarios" es peor que no
// mostrar nada). Subir/bajar según criterio de negocio.
const MIN_USUARIOS = 50

// Tira de métricas reales. Se oculta si no hay volumen creíble; si se muestra,
// solo aparecen los tiles con dato > 0 (nunca un cero crudo ni el número
// inventado de la referencia).
function MetricsStrip() {
  const { data: stats } = useFormacionStats()
  if (!stats || stats.usuariosActivos < MIN_USUARIOS) return null

  const tiles = [
    { n: stats.usuariosActivos, label: 'Usuarios activos', icon: <Users className="h-4 w-4" /> },
    { n: stats.cursosCompletados, label: 'Cursos completados', icon: <GraduationCap className="h-4 w-4" /> },
    { n: stats.certificados, label: 'Certificados emitidos', icon: <Award className="h-4 w-4" /> },
  ].filter(t => t.n > 0)

  if (tiles.length === 0) return null

  return (
    <div
      className="mt-5 grid rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--line)', background: 'var(--card)', gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}
    >
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className="flex flex-col items-center gap-1 py-5 px-3 text-center"
          style={i > 0 ? { borderLeft: '1px solid var(--line)' } : undefined}
        >
          <span style={{ color: 'var(--neon)' }}>{t.icon}</span>
          <span className="font-display font-bold" style={{ fontSize: '1.7rem', color: 'var(--text-1)', lineHeight: 1 }}>
            {new Intl.NumberFormat('es-AR').format(t.n)}
          </span>
          <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--text-3)' }}>
            {t.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function FormacionValueSection() {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-[22px] pt-10 pb-2">
      <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-3">
        {VALUE_CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            className="rounded-2xl border p-[22px]"
            style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: i * 0.07 }}
          >
            <div
              className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3"
              style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', color: 'var(--neon)' }}
            >
              {c.icon}
            </div>
            <h3 className="font-display font-bold" style={{ fontSize: '1.02rem', color: 'var(--text-1)' }}>{c.title}</h3>
            <p style={{ fontSize: '.88rem', color: 'var(--text-3)', marginTop: 6, lineHeight: 1.55 }}>{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <MetricsStrip />
    </section>
  )
}
