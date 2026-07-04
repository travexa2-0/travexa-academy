import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Hero con avión que despega al hacer scroll (scroll-scrubbing frame a frame
// sobre <canvas>, técnica Apple/Vercel). Layout de dos columnas: texto con
// ancho fijo (520px) a la izquierda + card de video a la derecha. El scroll
// del track (columna derecha) controla qué frame se dibuja.
//
// Fallback obligatorio: con prefers-reduced-motion (o Save-Data / conexión
// lenta) no se activa el scrub — la card muestra el poster estático y el
// layout es de dos columnas normal, sin scrolljacking.

// ── constantes tuneables ──
const TOTAL_FRAMES = 116          // frames extraídos de avion.mov (fps=15)
const TRACK_VH_DESKTOP = 200      // alto del track de scroll (desktop)
const TRACK_VH_MOBILE = 140       // alto del track de scroll (mobile)
// Velocidad neta a la que la card se mueve respecto del scroll mientras dura el
// track (~1/8). En vez de pinnearla (sticky = velocidad 0 = pantalla congelada),
// la desplazamos con translateY para que avance lento pero continuo, y que el
// último frame aterrice justo cuando el track termina y entra la sección siguiente.
const CARD_SCROLL_RATIO = 0.12
const COLLAPSE_MQ = '(max-width: 920px)' // el grid colapsa a 1 columna
const SMALL_MQ = '(max-width: 767px)'    // se sirven los frames mobile

const framePath = (dir: string, i: number) =>
  `/frames/${dir}/frame_${String(i).padStart(3, '0')}.webp`

interface NetworkInformation { saveData?: boolean; effectiveType?: string }

function prefersStatic(): boolean {
  if (typeof window === 'undefined') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
  if (conn?.saveData) return true
  if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return true
  return false
}

export default function PlaneTakeoffHero() {
  const trackRef  = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastFrame = useRef(-1)

  // Decididos una sola vez al montar (cliente).
  const [staticMode] = useState(prefersStatic)
  const [isMobile]   = useState(() => typeof window !== 'undefined' && window.matchMedia(SMALL_MQ).matches)
  const [trackVh]    = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(COLLAPSE_MQ).matches ? TRACK_VH_MOBILE : TRACK_VH_DESKTOP)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (staticMode) return
    const canvas = canvasRef.current
    const sticky = stickyRef.current
    const track  = trackRef.current
    if (!canvas || !sticky || !track) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dir = isMobile ? 'takeoff-mobile' : 'takeoff'
    const frames: HTMLImageElement[] = []
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = framePath(dir, i)
      frames.push(img)
    }
    let cancelled = false
    let raf = 0

    const sizeCanvas = () => {
      const r = sticky.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
    }
    const drawFrame = (idx: number) => {
      const img = frames[idx]
      if (!img || !img.complete || img.naturalWidth === 0) return
      const cw = canvas.width, ch = canvas.height
      const iw = img.naturalWidth, ih = img.naturalHeight
      const scale = Math.max(cw / iw, ch / ih)   // cover
      const dw = iw * scale, dh = ih * scale
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }
    const render = () => {
      const scrollable = track.offsetHeight - sticky.offsetHeight
      const top = track.getBoundingClientRect().top
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 0
      // Posición de la card: en flujo normal subiría 1:1 con el scroll (progress*
      // scrollable). La contrarrestamos dejando que sólo suba una fracción
      // (CARD_SCROLL_RATIO), o sea trasladándola hacia abajo el resto. Mismo
      // progress que el frame → posición y frame llegan juntos a su estado final.
      const translateY = progress * scrollable * (1 - CARD_SCROLL_RATIO)
      sticky.style.transform = `translate3d(0, ${translateY}px, 0)`
      const idx = Math.round(progress * (TOTAL_FRAMES - 1))
      if (idx !== lastFrame.current) { drawFrame(idx); lastFrame.current = idx }
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render) }
    const onResize = () => { sizeCanvas(); lastFrame.current = -1; render() }

    // Primer frame decodificado → mostramos y dibujamos (no dejar canvas en blanco).
    frames[0].decode?.().catch(() => {}).finally(() => {
      if (cancelled) return
      setReady(true)
      sizeCanvas()
      render()
    })

    // Solo escuchamos scroll cuando el track está cerca del viewport (ahorra CPU).
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          window.addEventListener('scroll', onScroll, { passive: true })
          onScroll()
        } else {
          window.removeEventListener('scroll', onScroll)
        }
      }
    }, { rootMargin: '600px 0px 600px 0px' })
    io.observe(track)
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [staticMode, isMobile])

  const trustAvatars = (
    <div className="hero-trust">
      <div className="avatar-stack" aria-hidden="true">
        {[0, 1, 2, 3].map(i => (
          <span className="av" key={i}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </span>
        ))}
      </div>
      <div className="trust-text">Formación hecha por y para <b>asesores de viajes</b><br />de toda Argentina</div>
    </div>
  )

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
          {trustAvatars}
        </div>

        {staticMode ? (
          // Fallback: card estática con el poster, sin track ni sticky.
          <div className="hero-video-track">
            <div className="hero-video-card hero-video-static">
              <img className="takeoff-poster" src="/frames/takeoff-poster.webp" alt="Un avión despegando de la pista" />
            </div>
          </div>
        ) : (
          <div className="hero-video-track" ref={trackRef} style={{ height: `${trackVh}vh` }}>
            <div className="hero-video-card hero-video-scrub" ref={stickyRef}>
              <canvas ref={canvasRef} className="takeoff-canvas" aria-hidden="true" />
              {!ready && <div className="takeoff-skeleton" aria-hidden="true" />}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
