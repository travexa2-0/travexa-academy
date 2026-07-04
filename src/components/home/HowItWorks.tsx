import { Reveal, RevealGroup } from './Reveal'
import { revealItem } from './revealVariants'
import { motion } from 'framer-motion'

// "Elegís, pagás una vez, es tuyo" — sección estática (no depende de DB).
export default function HowItWorks() {
  return (
    <section className="como">
      <div className="bg-fx" aria-hidden="true">
        <span className="bg-cloud a" style={{ animationDelay: '-40s' }} />
        <span className="bg-cloud b" style={{ animationDelay: '-70s' }} />
      </div>
      <div className="container">
        <div className="como-grid">
          <div>
            <Reveal><div className="section-label">Sin fricción</div></Reveal>
            <Reveal delay={0.05}><h2 className="section-title">Elegís, pagás una vez, es tuyo</h2></Reveal>
            <Reveal delay={0.1}>
              <p className="section-sub">
                Nada de planes ni renovaciones automáticas. Te registrás gratis y solo pagás
                por lo que realmente vas a usar.
              </p>
            </Reveal>

            <RevealGroup className="como-steps">
              <motion.div className="como-step" variants={revealItem}>
                <div className="como-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
                <div>
                  <h4>Te registrás gratis</h4>
                  <p>Sin tarjeta. Completás tu perfil en menos de 2 minutos y ya tenés acceso al catálogo completo.</p>
                </div>
              </motion.div>
              <motion.div className="como-step" variants={revealItem}>
                <div className="como-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg></div>
                <div>
                  <h4>Elegís y pagás una vez</h4>
                  <p>Curso, vivencial o evento — pago único por Mercado Pago. Nunca te vuelve a cobrar solo.</p>
                </div>
              </motion.div>
              <motion.div className="como-step" variants={revealItem}>
                <div className="como-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                <div>
                  <h4>Accedés de por vida</h4>
                  <p>El contenido queda tuyo para siempre, con certificado al completar y recursos descargables.</p>
                </div>
              </motion.div>
            </RevealGroup>
          </div>

          <Reveal>
            <div className="ticket">
              <div className="ticket-row">
                <div>
                  <div className="ticket-label">Pase de acceso</div>
                  <h5>Operatoria turística argentina</h5>
                </div>
                <span className="ticket-badge">Gratis</span>
              </div>
              <div className="ticket-dash" />
              <div className="ticket-grid">
                <div><div className="l">Tipo de pago</div><div className="v">Pago único</div></div>
                <div><div className="l">Vencimiento</div><div className="v">Nunca</div></div>
                <div><div className="l">Certificado</div><div className="v check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Incluido</div></div>
                <div><div className="l">Renovación</div><div className="v check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>No aplica</div></div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
