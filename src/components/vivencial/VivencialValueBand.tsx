import { motion } from 'framer-motion'
import { MapPin, GraduationCap, MessagesSquare, Users } from 'lucide-react'

// Oferta de valor del pilar Vivencial: 4 tarjetas que explican por qué un
// vivencial no es un viaje de turista. Copy estático (no depende de la DB).
// Se muestra en la Home de /vivencial, entre el hero y los filtros (fondo dark).

const CARDS: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <MapPin className="h-[18px] w-[18px]" />,
    title: 'Conocé el destino real',
    desc: 'Hoteles, actividades y lugares, de primera mano — no en una ficha técnica.',
  },
  {
    icon: <GraduationCap className="h-[18px] w-[18px]" />,
    title: 'Talleres con expertos',
    desc: 'Formación teórico-práctica en el mismo viaje, con referentes del rubro.',
  },
  {
    icon: <MessagesSquare className="h-[18px] w-[18px]" />,
    title: 'Role-play y ventas en vivo',
    desc: 'Practicás simulaciones reales de venta, con feedback al instante.',
  },
  {
    icon: <Users className="h-[18px] w-[18px]" />,
    title: 'Grupo reducido, acompañado',
    desc: 'Con instructores de la academia, cupos limitados.',
  },
]

export default function VivencialValueBand() {
  return (
    <section style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[1200px] mx-auto px-[22px] py-12">
        <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              className="rounded-2xl border p-[22px]"
              style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 }}
            >
              <div
                className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3"
                style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', color: 'var(--neon)' }}
              >
                {c.icon}
              </div>
              <h3 className="font-display font-bold" style={{ fontSize: '1rem', color: 'var(--text-1)' }}>{c.title}</h3>
              <p style={{ fontSize: '.86rem', color: 'var(--text-3)', marginTop: 6, lineHeight: 1.55 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
