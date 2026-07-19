import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademyProfile } from '@/hooks/useProfile'
import {
  usePublicBenefits, useMyRedemptions, useMyEnrolledCourseIds, useRedeemBenefit,
} from '@/hooks/useBenefitsStore'
import FeaturedCarousel from '@/components/beneficios/FeaturedCarousel'
import RedeemModal from '@/components/beneficios/RedeemModal'
import EarnModal from '@/components/beneficios/EarnModal'
import {
  filterCatOf, badgeInfo, valueBlock, artStyle, computeUserState, stateChip, fmt,
  type FilterCat,
} from '@/components/beneficios/benefitStoreMeta'
import { nivelInfo } from '@/types'
import type { Benefit } from '@/types'
import './beneficios.css'

const CATS: { value: FilterCat; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'curso_gratis', label: 'Cursos' },
  { value: 'descuento', label: 'Descuentos' },
  { value: 'sorteo_vivencial', label: 'Sorteos' },
  { value: 'otro', label: 'Otros' },
]

const RANGES: { value: string; label: string }[] = [
  { value: 'all', label: 'Cualquier costo' },
  { value: '0-200', label: 'Hasta 200' },
  { value: '200-500', label: '200 a 500' },
  { value: '500-99999', label: 'Más de 500' },
]

// Partículas de monedas ambientales (posición/delay fijos por render de página).
const COINS = Array.from({ length: 14 }, () => ({
  left: 5 + Math.random() * 90,
  top: 60 + Math.random() * 40,
  delay: Math.random() * 11,
  dur: 9 + Math.random() * 7,
}))

export default function Beneficios() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const logged = !!user
  const { data: profile } = useAcademyProfile(user?.id)
  const creditos = profile?.creditos ?? 0
  const puntos = profile?.puntos ?? 0
  const nInfo = nivelInfo(puntos)

  const { data: benefits = [] } = usePublicBenefits()
  const { data: redemptions = [] } = useMyRedemptions(user?.id)
  const { data: enrolledCourseIds = new Set<string>() } = useMyEnrolledCourseIds(user?.id)
  const redeemMut = useRedeemBenefit(user?.id)

  const [cat, setCat] = useState<FilterCat>('todos')
  const [alcanza, setAlcanza] = useState(false)
  const [range, setRange] = useState('all')

  const [redeemBenefit, setRedeemBenefit] = useState<Benefit | null>(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [earnOpen, setEarnOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Índice estable por beneficio (para el arte por gradiente cuando no hay imagen).
  const artIndex = useMemo(() => {
    const m = new Map<string, number>()
    benefits.forEach((b, i) => m.set(b.id, i))
    return m
  }, [benefits])

  const featured = useMemo(() => benefits.filter(b => b.destacado), [benefits])

  const grid = useMemo(() => benefits.filter(b => {
    if (cat !== 'todos' && filterCatOf(b.tipo) !== cat) return false
    if (alcanza && logged && b.costo_creditos > creditos) return false
    if (range !== 'all') {
      const [a, z] = range.split('-').map(Number)
      if (b.costo_creditos < a || b.costo_creditos > z) return false
    }
    return true
  }), [benefits, cat, alcanza, logged, creditos, range])

  const openRedeem = (b: Benefit) => { setRedeemBenefit(b); setRedeemOpen(true) }

  // Al aterrizar con #b-<id> (vuelta del login), abre ese beneficio.
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#b-') && benefits.length) {
      const id = hash.slice(3)
      const b = benefits.find(x => x.id === id)
      if (b) { setRedeemBenefit(b); setRedeemOpen(true) }
    }
  }, [benefits])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const redeemState = redeemBenefit ? computeUserState(redeemBenefit, redemptions, enrolledCourseIds) : null

  return (
    <div className="bene-store">
      <Header />

      <div className="ambient" aria-hidden="true">
        <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
        {COINS.map((c, i) => (
          <div key={i} className="coin" style={{ left: `${c.left}%`, top: `${c.top}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
        ))}
      </div>

      <div className="wrap">
        {/* ── HERO ── */}
        <header className="hero">
          <div className="hero-left">
            <h1 className="brand-title">Travexa Academy <span>Points</span></h1>
            <h2 className="hero-sub">Tu formación suma. <em>Canjeá tus créditos</em> por cursos, descuentos y experiencias.</h2>
            <p>Cada curso, cada lección y cada logro en Travexa Academy te da créditos. Acá los convertís en más formación para tu carrera.</p>
          </div>

          <section className="points-zone" aria-label="Tus créditos">
            {logged ? (
              <div className="points-card">
                <div className="points-inner">
                  <div className="coin-badge" aria-hidden="true">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.4 5.1 5.6.7-4.1 3.8 1.1 5.5L12 15.4 7 18.1l1.1-5.5L4 8.8l5.6-.7L12 3z" fill="#4a3410" /></svg>
                  </div>
                  <div className="points-main">
                    <div className="points-label">Tus créditos</div>
                    <div className="points-value"><NumberFlow value={creditos} locales="es-AR" /><small>disponibles</small></div>
                    <div className="points-meta">Los créditos vencen al año de obtenidos · <span className="lvl">Nivel {nInfo.actual.n} · {nInfo.actual.nombre}</span></div>
                    <div className="points-cta">
                      <button className="btn btn-gold" onClick={() => setEarnOpen(true)}>+ Ganar más créditos</button>
                      <button className="btn btn-ghost" onClick={() => navigate('/perfil#canjes')}>Ver mis canjes</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="points-card guest">
                <div className="points-inner">
                  <div className="coin-badge" aria-hidden="true">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.4 5.1 5.6.7-4.1 3.8 1.1 5.5L12 15.4 7 18.1l1.1-5.5L4 8.8l5.6-.7L12 3z" fill="#4a3410" /></svg>
                  </div>
                  <div className="points-main">
                    <div className="guest-title">Empezá a sumar créditos <em>hoy mismo</em></div>
                    <div className="points-meta" style={{ marginTop: 6 }}>Creá tu cuenta gratis y recibí <b style={{ color: 'var(--b-gold)' }}>20 créditos de bienvenida</b> + 50 al completar tu perfil.</div>
                    <div className="points-cta">
                      <button className="btn btn-teal" onClick={() => navigate(`/registro?redirect=${encodeURIComponent('/beneficios')}`)}>Crear mi cuenta</button>
                      <button className="btn btn-ghost" onClick={() => setEarnOpen(true)}>¿Cómo funciona?</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </header>

        {/* ── CARRUSEL DESTACADOS ── */}
        {featured.length > 0 && (
          <section className="featured" aria-label="Beneficios destacados">
            <div className="section-head center"><h2>✦ Destacados <span>de la semana</span></h2></div>
            <FeaturedCarousel benefits={featured} onOpen={openRedeem} />
          </section>
        )}

        {/* ── FILTROS ── */}
        <div className="filters">
          <div className="filters-row">
            {CATS.map(c => (
              <button key={c.value} className={`chip${cat === c.value ? ' on' : ''}`} onClick={() => setCat(c.value)}>{c.label}</button>
            ))}
            {logged && (
              <button className={`chip toggle${alcanza ? ' on' : ''}`} onClick={() => setAlcanza(v => !v)}>✓ Me alcanza</button>
            )}
            <select className="range-select" value={range} onChange={e => setRange(e.target.value)} aria-label="Rango de créditos">
              {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="spacer" />
            <button className="btn-how" onClick={() => setEarnOpen(true)}>Cómo conseguir puntos</button>
          </div>
        </div>

        {/* ── GRILLA ── */}
        <section className="grid-zone" aria-label="Todos los beneficios">
          <div className="section-head">
            <h2>Todos los beneficios</h2>
            <div className="hint">{grid.length ? `${grid.length} disponibles` : ''}</div>
          </div>
          {grid.length === 0 ? (
            <div className="bgrid"><div className="empty">{benefits.length === 0 ? 'Pronto vas a poder canjear tus créditos ✈' : 'No hay beneficios con estos filtros. Probá ampliar la búsqueda ✈'}</div></div>
          ) : (
            <div className="bgrid">
              {grid.map((b, i) => {
                const st = computeUserState(b, redemptions, enrolledCourseIds)
                const chip = stateChip(b, st, logged, creditos)
                const bg = badgeInfo(b.tipo)
                const v = valueBlock(b)
                const cupoLeft = b.cupo_maximo != null && b.cupo_usado < b.cupo_maximo ? b.cupo_maximo - b.cupo_usado : null
                return (
                  <motion.article
                    key={b.id}
                    className="bcard"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: Math.min(i, 8) * 0.055, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
                    onClick={() => openRedeem(b)}
                  >
                    <span className={`badge ${bg.cls}`}>{bg.label}</span>
                    {cupoLeft != null && <span className="cupo-pill">Quedan {cupoLeft}</span>}
                    <div className="bart" style={artStyle(b, artIndex.get(b.id) ?? i)}><div className="art-topo" /></div>
                    <div className="bbody">
                      <h3>{b.titulo}</h3>
                      {b.descripcion && <div className="bdesc">{b.descripcion}</div>}
                      <div className="bfoot">
                        <div className="bpts">{v.big}<small>{v.sub ?? v.lbl}</small></div>
                        <span className={`bstate ${chip.cls}`}>{chip.text}</span>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />

      {/* ── MODALES ── */}
      <RedeemModal
        benefit={redeemBenefit}
        artIndex={redeemBenefit ? (artIndex.get(redeemBenefit.id) ?? 0) : 0}
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        logged={logged}
        saldo={creditos}
        userState={redeemState}
        onEarnClick={() => { setRedeemOpen(false); setEarnOpen(true) }}
        onRedeemed={(gastados) => setToast(`Canje exitoso · −${fmt(gastados)} créditos`)}
        redeem={redeemMut.mutateAsync}
      />
      <EarnModal open={earnOpen} onClose={() => setEarnOpen(false)} />

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="bene-toast"
            initial={{ opacity: 0, x: '-50%', y: 80 }}
            animate={{ opacity: 1, x: '-50%', y: 0 }}
            exit={{ opacity: 0, x: '-50%', y: 80 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          >
            <span className="gold">✓</span><span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
