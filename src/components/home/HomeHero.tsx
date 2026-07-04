import { Link } from 'react-router-dom'

// Hero de la Home. Réplica 1:1 del prototipo `academy_home.html`
// (columna única). La Fase 2 (efecto avión) reestructura esto a dos
// columnas con el <canvas> scrubbeado a la derecha.
export default function HomeHero() {
  return (
    <header className="hero">
      <div
        className="glow-orb"
        aria-hidden="true"
        style={{
          width: 560, height: 560, left: '6%', top: -140,
          background: 'radial-gradient(circle, rgba(78,205,184,0.20), transparent 70%)',
          animation: 'home-glowMoveA 22s ease-in-out infinite',
        }}
      />
      <div className="container hero-grid">
        <div className="hero-inner">
          <p className="eyebrow">Trade turístico argentino</p>
          <h1>La formación que se nota <em>en tus ventas.</em></h1>
          <p className="lead">
            Cursos, viajes educativos y una comunidad armada por quien vende viajes todos
            los días. Sin planes, sin letra chica — pagás lo que consumís.
          </p>
          <div className="hero-cta">
            <Link to="/registro" className="btn-lg">
              Empezar gratis
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <span className="hero-cta-sub">Sin tarjeta · Acceso inmediato</span>
          </div>
          <div className="hero-trust">
            <div className="avatar-stack">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" alt="" />
              <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80" alt="" />
            </div>
            {/* Sin número inventado de "asesores formados": no hay conteo real
                público todavía (RLS). Mensaje honesto, no-numérico. */}
            <div className="trust-text">Formación hecha por y para <b>asesores de viajes</b><br />de toda Argentina</div>
          </div>
        </div>
      </div>
    </header>
  )
}
