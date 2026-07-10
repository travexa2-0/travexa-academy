import { Link } from 'react-router-dom'
import { Reveal } from './Reveal'
import Footer from '@/components/layout/Footer'

// CTA final + footer de la Home. Estático.
export default function FinalCTA() {
  return (
    <>
      <section className="cta-final">
        <div className="glow-orb" aria-hidden="true" />
        <div className="container">
          <Reveal>
            <div className="cta-final-inner">
              <h2>Empezá a formarte hoy.</h2>
              <p>Gratis, sin tarjeta, sin planes. El primer curso te espera.</p>
              <div className="hero-cta">
                <Link to="/registro" className="btn-lg">
                  Empezar gratis
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </>
  )
}
