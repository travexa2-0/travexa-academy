import { Reveal } from './Reveal'

// ⚠️ Contenido de MUESTRA. Todavía no existen reseñas reales en la DB
// (academy_reviews vacía). Por decisión de producto se muestra igual, pero
// visiblemente etiquetado como ejemplo (ver `.sample-tag`). Cuando existan
// reseñas reales, reemplazar SAMPLE_TESTIMONIALS por datos de la DB y quitar
// el tag / los números de muestra (96%, +300, 4.8/5).
interface Testimonial {
  quote: string
  photo: string
  name: string
  role: string
}

const SAMPLE_TESTIMONIALS: Testimonial[] = [
  { quote: 'El vivencial a Iguazú me cambió la forma de vender el destino. Ahora hablo con fotos y experiencia propia, no con un folleto.', photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&q=80', name: 'Marina Sosa', role: 'ASESORA FREELANCE · CÓRDOBA' },
  { quote: 'El curso de operatoria me resolvió dudas que tenía hace dos años. Directo, sin vueltas, hecho por alguien que vende de verdad.', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80', name: 'Diego Ferreyra', role: 'AGENCIA · ROSARIO' },
  { quote: 'La comunidad es lo mejor. Encontrás a otros asesores del país, compartís dudas y no te sentís solo laburando desde casa.', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80', name: 'Julieta Paz', role: 'ASESORA FREELANCE · MENDOZA' },
  { quote: 'Subí de nivel en un mes y ya lo veo en mi perfil de Travexa. Un operador me contactó directo por eso.', photo: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=100&q=80', name: 'Nahuel Ríos', role: 'ASESOR FREELANCE · SALTA' },
  { quote: 'Pagué un curso, no un plan. Me encantó no tener que preocuparme por una suscripción que me olvido de cancelar.', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80', name: 'Carla Medina', role: 'AGENCIA · MAR DEL PLATA' },
]

const QuoteIcon = () => (
  <svg className="testi-quote" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 8C6.4 8 4 10.4 4 13.5S6.4 19 9.5 19c1 0 2-.3 2.7-.8-.5 2-2.2 3.5-4.4 3.8v2c4-.4 7-3.6 7-7.8V13c0-2.8-2.2-5-5-5zm10 0c-3.1 0-5.5 2.4-5.5 5.5S16.4 19 19.5 19c1 0 2-.3 2.7-.8-.5 2-2.2 3.5-4.4 3.8v2c4-.4 7-3.6 7-7.8V13c0-2.8-2.2-5-5-5z" /></svg>
)

function TestiCard({ t }: { t: Testimonial }) {
  return (
    <div className="testi-card">
      <QuoteIcon />
      <div className="testi-stars">★★★★★</div>
      <p>{t.quote}</p>
      <div className="testi-who">
        <img src={t.photo} alt="" />
        <div><div className="name">{t.name}</div><div className="role">{t.role}</div></div>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const loop = [...SAMPLE_TESTIMONIALS, ...SAMPLE_TESTIMONIALS]
  return (
    <section className="testi">
      <div className="testi-visual-zone">
        <div className="container">
          <Reveal><div className="section-label">Comunidad</div></Reveal>
          <Reveal delay={0.05}><h2 className="section-title">Lo que dicen los asesores</h2></Reveal>
          <Reveal delay={0.1}>
            <div className="testi-stats">
              <div className="testi-stat"><span className="v">96%</span><span className="l">LO RECOMENDARÍA A OTRO ASESOR</span></div>
              <div className="testi-stat"><span className="v">+300</span><span className="l">RESEÑAS VERIFICADAS</span></div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <span className="sample-tag" title="Aún no hay reseñas reales cargadas — esto es contenido de ejemplo.">
              Contenido de muestra · reseñas reales próximamente
            </span>
          </Reveal>
        </div>

        <div className="testi-marquee-mask">
          <div className="testi-track">
            {loop.map((t, i) => <TestiCard key={`${t.name}-${i}`} t={t} />)}
          </div>
        </div>

        <div className="testi-photo-pos">
          <div className="testi-photo">
            <div className="testi-photo-img">
              <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" alt="Asesor de viajes preparando un vivencial" />
            </div>
            <div className="testi-float">
              <div>
                <div className="stars">★★★★★</div>
                <div className="num">4.8 / 5</div>
                <div className="lbl">MUESTRA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
