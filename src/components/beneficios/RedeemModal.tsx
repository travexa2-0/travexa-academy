import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StoreModal, { ModalClose } from './StoreModal'
import { RedeemError } from '@/hooks/useBenefitsStore'
import { loginRedirect } from '@/lib/utils'
import { badgeInfo, artStyle, fmt, fmtArs, sorteoDate, type BenefitUserState } from './benefitStoreMeta'
import type { Benefit, RedeemResult, RedemptionEstado } from '@/types'

interface Props {
  benefit: Benefit | null
  artIndex: number
  open: boolean
  onClose: () => void
  logged: boolean
  saldo: number
  userState: BenefitUserState | null
  onEarnClick: () => void
  onRedeemed: (creditosGastados: number) => void
  redeem: (args: { benefitId: string; cantidadChances?: number }) => Promise<RedeemResult>
}

const CONFETTI_COLORS = ['#2fd6b1', '#e6b95c', '#9db8ff', '#f7e0a8']

function burstConfetti(container: HTMLElement) {
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('div')
    c.className = 'bene-confetti'
    c.style.background = CONFETTI_COLORS[i % 4]
    container.appendChild(c)
    const ang = Math.random() * Math.PI * 2
    const dist = 90 + Math.random() * 130
    c.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 70}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' })
    setTimeout(() => c.remove(), 1500)
  }
}

export default function RedeemModal({
  benefit, artIndex, open, onClose, logged, saldo, userState, onEarnClick, onRedeemed, redeem,
}: Props) {
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [phase, setPhase] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ estado: RedemptionEstado; chances: number } | null>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Reset al abrir / cambiar de beneficio
  useEffect(() => {
    if (open) { setQty(1); setPhase('form'); setError(null); setSuccess(null); setLoading(false) }
  }, [open, benefit?.id])

  // Confetti cuando entra la pantalla de éxito
  useEffect(() => {
    if (phase === 'success' && successRef.current) burstConfetti(successRef.current)
  }, [phase])

  if (!benefit) return null

  const isSorteo = benefit.tipo === 'sorteo_vivencial'
  const isDescuento = benefit.tipo === 'descuento_pct' || benefit.tipo === 'descuento_fijo'
  const bg = badgeInfo(benefit.tipo)
  const chances = isSorteo ? Math.max(1, qty) : 1
  const cost = benefit.costo_creditos * chances
  const after = saldo - cost
  const slug = benefit.course?.slug

  const st = userState
  const soldOut = st?.soldOut ?? false
  const owned = st?.owned ?? false

  // "Qué recibís" según tipo
  const whatBox = (() => {
    if (benefit.tipo === 'curso_gratis') {
      return <>Recibís <b>acceso completo e inmediato</b> al curso, con certificado incluido. Queda tuyo para siempre.</>
    }
    if (benefit.tipo === 'descuento_pct') {
      return <>Activás un <b>{benefit.descuento_valor}% de descuento</b> que se aplica <b>automáticamente</b> la próxima vez que compres este curso. No vence.</>
    }
    if (benefit.tipo === 'descuento_fijo') {
      return <>Activás un descuento de <b>{benefit.descuento_valor != null ? fmtArs(benefit.descuento_valor) : ''}</b> que se aplica <b>automáticamente</b> la próxima vez que compres este curso. No vence.</>
    }
    if (isSorteo) {
      return <>Cada chance suma una participación. <b>Más chances, más probabilidades.</b>{benefit.fecha_vencimiento ? ` Sorteo: ${sorteoDate(benefit.fecha_vencimiento)}.` : ''}{benefit.terminos ? <> <a href={benefit.terminos} target="_blank" rel="noreferrer">Bases y condiciones</a>.</> : null}</>
    }
    return <>Canjeás este beneficio y <b>nos contactamos con vos</b> para coordinar la entrega.</>
  })()

  const doRedeem = async () => {
    if (!logged) {
      navigate(loginRedirect(`/beneficios#b-${benefit.id}`))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await redeem({ benefitId: benefit.id, cantidadChances: chances })
      setSuccess({ estado: res.estado, chances })
      setPhase('success')
      onRedeemed(res.creditos_gastados)
    } catch (e) {
      const msg = e instanceof RedeemError ? e.message : 'No pudimos completar el canje. Intentá de nuevo.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Botón del formulario
  let btnLabel = 'Confirmar canje'
  let btnDisabled = false
  let note: React.ReactNode = 'Los créditos se descuentan al confirmar. Esta acción no se puede deshacer.'
  if (!logged) {
    btnLabel = 'Ingresar para canjear'
    note = 'Creá tu cuenta gratis y empezá a sumar créditos.'
  } else if (owned) {
    btnLabel = 'Ya tenés este curso'; btnDisabled = true
    note = 'Un curso comprado queda tuyo para siempre.'
  } else if (soldOut) {
    btnLabel = 'Cupo agotado'; btnDisabled = true
    note = 'Este beneficio alcanzó su cupo máximo.'
  } else if (after < 0) {
    btnLabel = `Te faltan ${fmt(Math.abs(after))} créditos`; btnDisabled = true
    note = <a href="#earn" onClick={(e) => { e.preventDefault(); onEarnClick() }}>Mirá cómo conseguir más créditos →</a>
  }

  // Pantalla de éxito
  const successView = (() => {
    const t = benefit.tipo
    if (t === 'curso_gratis') return {
      title: '¡Curso habilitado! 🎉',
      desc: 'Ya tenés acceso completo. Aparece en tu perfil, en Mis Cursos.',
      cta: 'Empezar el curso ahora',
      onCta: () => { onClose(); if (slug) navigate(`/cursos/${slug}/aprender`) },
    }
    if (isDescuento) return {
      title: 'Descuento activado ✓',
      desc: 'Se va a aplicar automáticamente cuando compres el curso. Lo ves en tu perfil → Logros → Tus canjes.',
      cta: 'Ir al curso',
      onCta: () => { onClose(); if (slug) navigate(`/cursos/${slug}`) },
    }
    if (isSorteo) return {
      title: `¡Estás participando con ${success?.chances ?? chances} chance${(success?.chances ?? chances) > 1 ? 's' : ''}! 🍀`,
      desc: 'Te avisamos por notificación el día del sorteo. ¡Mucha suerte!',
      cta: 'Listo',
      onCta: onClose,
    }
    return {
      title: '¡Canje realizado! ✓',
      desc: 'Nos vamos a contactar con vos por mail para coordinar la entrega.',
      cta: 'Listo',
      onCta: onClose,
    }
  })()

  return (
    <StoreModal open={open} onClose={onClose} labelledBy="redeem-title">
      <ModalClose onClose={onClose} />
      {phase === 'form' ? (
        <>
          <div className="m-art" style={artStyle(benefit, artIndex)}>
            <span className={`badge ${bg.cls}`}>{bg.label}</span>
          </div>
          <div className="m-body">
            <h3 id="redeem-title">{benefit.titulo}</h3>
            {benefit.descripcion && <p className="m-desc">{benefit.descripcion}</p>}
            <div className="m-benefit-box">{whatBox}</div>

            {isSorteo && (
              <div className="stepper">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Menos chances">−</button>
                <div className="qty">{qty}<small>chances</small></div>
                <button onClick={() => setQty(q => q + 1)} aria-label="Más chances">+</button>
              </div>
            )}

            <div className="m-cost">
              <div>
                <div className="cost-num">{fmt(cost)}</div>
                <div className="cost-lbl">créditos</div>
              </div>
              <div className={`after${logged && after < 0 ? ' negative' : ''}`}>
                {logged
                  ? <>Tenés <b>{fmt(saldo)}</b><br />Te quedan <b>{fmt(after)}</b></>
                  : 'Ingresá para ver tu saldo'}
              </div>
            </div>

            <div className="m-actions">
              <button className="btn btn-gold btn-redeem" disabled={btnDisabled || loading} onClick={doRedeem}>
                {loading ? 'Procesando…' : btnLabel}
              </button>
              <div className="m-note">{note}</div>
              {error && <div className="m-error">{error}</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="m-success" ref={successRef}>
          <div className="check-ring">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M4.5 12.5l5 5 10-11" stroke="#2fd6b1" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h3>{successView.title}</h3>
          <p>{successView.desc}</p>
          <button className="btn btn-teal btn-redeem" onClick={successView.onCta}>{successView.cta}</button>
        </div>
      )}
    </StoreModal>
  )
}
