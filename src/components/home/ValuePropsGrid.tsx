import { Reveal, RevealGroup, MotionLink } from './Reveal'
import { revealItem } from './revealVariants'

interface Pilar {
  to: string
  photo: string
  icon: React.ReactNode
  title: string
  desc: string
  tag: string
}

interface Props {
  coursesCount: number
}

// "Cuatro formas de crecer" — contenido estático (no depende de DB).
// El único dato vivo es el tag de cantidad de cursos.
export default function ValuePropsGrid({ coursesCount }: Props) {
  const pilares: Pilar[] = [
    {
      to: '/cursos',
      photo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=70',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
      title: 'Formación',
      desc: 'Cursos grabados por Yesica e instructores del rubro. A tu ritmo, con certificado.',
      tag: coursesCount > 0 ? `${coursesCount} ${coursesCount === 1 ? 'curso' : 'cursos'}` : 'Próximamente',
    },
    {
      to: '/vivencial',
      photo: 'https://images.unsplash.com/photo-1483168527879-c66136b56105?w=500&q=70',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>,
      title: 'Vivencial',
      desc: 'Viajes educativos en grupo. Conocé el destino antes de venderlo. El diferencial absoluto.',
      tag: 'Cupos limitados',
    },
    {
      to: '/cursos',
      photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=70',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
      title: 'Eventos',
      desc: 'Webinars, masterclasses y paneles en vivo con quienes están vendiendo hoy.',
      tag: 'En vivo',
    },
    {
      to: '/cursos',
      photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=70',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
      title: 'Comunidad',
      desc: 'Feed, directorio de asesores y gamificación. Crecé acompañado, no solo.',
      tag: 'En construcción',
    },
  ]

  return (
    <section className="pilares">
      <div className="bg-fx" aria-hidden="true">
        <span className="bg-cloud a" />
        <span className="bg-cloud b" />
        <span className="bg-cloud c" />
      </div>
      <div className="container">
        <Reveal><div className="section-label">Qué encontrás</div></Reveal>
        <Reveal delay={0.05}><h2 className="section-title">Cuatro formas de crecer, un solo lugar</h2></Reveal>

        <RevealGroup className="pilar-grid">
          {pilares.map((p) => (
            <MotionLink key={p.title} to={p.to} className="pilar-card" variants={revealItem}>
              <div className="pilar-photo" style={{ backgroundImage: `url('${p.photo}')` }} />
              <div className="pilar-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <span className="pilar-tag">{p.tag}</span>
            </MotionLink>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
