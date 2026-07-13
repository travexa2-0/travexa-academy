import { motion } from 'framer-motion'
import { Target, Brain, TrendingUp } from 'lucide-react'

// Oferta de valor de Formación: 3 tarjetas (por qué esta formación), copy
// estático. Las métricas reales de la plataforma viven ahora en la fila de
// tarjetas destacadas del hero (FormacionStatsRow), para no duplicarlas.

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
    </section>
  )
}
