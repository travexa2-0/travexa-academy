import { Reveal, RevealGroup } from './Reveal'
import { revealItem } from './revealVariants'
import { motion } from 'framer-motion'

// Sección de gamificación — estática. Niveles/XP son valores fijos del
// sistema (ver types/index.ts nivelInfo), no vienen de la DB. Las tarjetas
// de perfil son ilustrativas del concepto de sincronización con Marketplace.
// Todo vive en UNA sola sección (concepto + sync + niveles); entra en una
// pantalla gracias a los espaciados apretados en home.css (no se recorta copy).
export default function GamificationSection() {
  return (
    <section className="gami">
      <div className="glow-orb" aria-hidden="true" />
      <div className="container">
        <div className="gami-top-text">
          <Reveal><div className="section-label">Progreso que suma</div></Reveal>
          <Reveal delay={0.05}><h2 className="section-title">Tu nivel acá es tu reputación en Travexa Marketplace</h2></Reveal>
          <Reveal delay={0.1}>
            <p className="section-sub">
              Cada curso, vivencial e insignia que sumás arma tu perfil profesional — el mismo
              que ven operadores y agencias en Travexa Marketplace. Sumás XP completando cursos,
              dejando reseñas, viajando en un vivencial o invitando a otro asesor; al acumular XP
              subís de nivel.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="gami-value-row">
          <motion.div className="gami-value-card" variants={revealItem}>
            <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
            <div>
              <h5>Perfil verificado</h5>
              <p>Tu nivel e insignias aparecen en tu perfil público de Travexa Marketplace.</p>
            </div>
          </motion.div>
          <motion.div className="gami-value-card gold" variants={revealItem}>
            <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg></div>
            <div>
              <h5>Más confianza, más cierre</h5>
              <p>El pasajero elige más rápido a quien demuestra que conoce el destino.</p>
            </div>
          </motion.div>
          <motion.div className="gami-value-card" variants={revealItem}>
            <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
            <div>
              <h5>Créditos que valen</h5>
              <p>Canjealos por cursos, vivenciales y beneficios reales dentro del ecosistema.</p>
            </div>
          </motion.div>
        </RevealGroup>

        <Reveal>
          <div className="gami-sync">
            <div className="sync-card academy">
              <div className="sync-label">Travexa Academy</div>
              <div className="sync-top">
                <span className="sync-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <div>
                  <div className="sync-name">Tu perfil</div>
                  <div className="sync-status">Nivel Trotamundos · 1.500 XP</div>
                </div>
              </div>
              <div className="sync-badges">
                <div className="sync-mini-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5" /></svg></div>
                <div className="sync-mini-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" /></svg></div>
              </div>
            </div>

            <div className="sync-arrow">
              <svg viewBox="0 0 100 22" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="homeSyncGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ECDB8" />
                    <stop offset="100%" stopColor="#C99A3A" />
                  </linearGradient>
                </defs>
                <line x1="10" y1="11" x2="90" y2="11" stroke="url(#homeSyncGrad)" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 11 L18 5 M10 11 L18 17" stroke="#4ECDB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M90 11 L82 5 M90 11 L82 17" stroke="#C99A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            <div className="sync-card marketplace">
              <div className="sync-label">Travexa Marketplace</div>
              <div className="sync-top">
                <span className="sync-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <div>
                  <div className="sync-name">Tu perfil</div>
                  <div className="sync-status">Asesora verificada ✦</div>
                </div>
              </div>
              <div className="sync-badges">
                <div className="sync-mini-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal><div className="gami-sync-caption">Mismo login, mismo perfil — un ecosistema, un solo historial</div></Reveal>

        <Reveal>
          <div className="gami-stepper-head">
            <h4>Los 5 niveles de Academy</h4>
          </div>
        </Reveal>
        <Reveal>
          <div className="gami-stepper">
            <div className="stepper-track">
              <div className="stepper-line" />
              <div className="stepper-line-fill" />
              <div className="stepper-node done"><span className="stepper-dot" /><span className="stepper-name">Explorador</span><span className="stepper-xp">0 XP</span></div>
              <div className="stepper-node done"><span className="stepper-dot" /><span className="stepper-name">Viajero</span><span className="stepper-xp">500 XP</span></div>
              <div className="stepper-node active"><span className="stepper-dot" /><span className="stepper-name">Trotamundos</span><span className="stepper-xp">1.500 XP</span></div>
              <div className="stepper-node"><span className="stepper-dot" /><span className="stepper-name">Explorador experto</span><span className="stepper-xp">3.500 XP</span></div>
              <div className="stepper-node"><span className="stepper-dot" /><span className="stepper-name">Embajador</span><span className="stepper-xp">7.000 XP</span></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
