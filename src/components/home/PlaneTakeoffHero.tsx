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
// Alto del track = cuánto scroll dura el scrub de los 116 frames. Con la curva
// de aceleración (g'(1)=1) la card iguala la velocidad de scroll al final, así
// que un track largo NO deja hueco con la sección siguiente. Lo dimensionamos
// para que el ÚLTIMO frame caiga justo cuando la primera sección está por salir
// del viewport (progress=1 en scroll ≈ track − alto card ≈ next section top).
const TRACK_VH_DESKTOP = 200      // alto del track de scroll (desktop)
const TRACK_VH_MOBILE = 175       // alto del track de scroll (mobile)
// Movimiento de la card durante el scrub. En vez de una velocidad constante
// (se sentía estática al final y después "saltaba" al soltar), usamos una
// curva: arranca lenta (START_SPEED del scroll, se siente pinneada mientras el
// avión carretea) y acelera hasta IGUALAR la velocidad de scroll al terminar el
// track — así el traspaso a la sección siguiente es continuo, sin salto, y para
// el final la card ya subió lo suficiente como para dejar ver lo que viene.
const START_SPEED = 0.16
const SCRUB_K = 1 - START_SPEED   // pendiente de la curva de scrub
// Espacio muerto que deja el holdback del translateY al final del track: la card
// termina su recorrido a 0.42·scrollable del piso del track (translateY final =
// SCRUB_K/2·scrollable), dejando (1 − SCRUB_K/2)·scrollable de track vacío antes
// de la sección siguiente. Lo compensamos con un margin-bottom negativo del track
// para que la sección de abajo quede pegada, sin perder el scrub lento.
const DEAD_TAIL_FACTOR = 1 - SCRUB_K / 2
// Umbral de progress a partir del cual el video se funde a oscuro, y opacidad
// máxima del velo: NO llega a negro total (si no, la card parece un hueco vacío
// al final); se oscurece lo justo para leer "el video está terminando".
const FADE_START = 0.72
const FADE_MAX = 0.58
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
  const fadeRef   = useRef<HTMLDivElement>(null)
  const innerRef  = useRef<HTMLDivElement>(null)
  const lastFrame = useRef(-1)

  // Decididos una sola vez al montar (cliente).
  const [staticMode] = useState(prefersStatic)
  const [isMobile]   = useState(() => typeof window !== 'undefined' && window.matchMedia(SMALL_MQ).matches)
  // Layout colapsado (1 columna): el texto va en flujo normal arriba del video,
  // así que NO le aplicamos el translateY del scrub (rompería el apilado).
  const [isCollapsed] = useState(() => typeof window !== 'undefined' && window.matchMedia(COLLAPSE_MQ).matches)
  const [trackVh]    = useState(() => (isCollapsed ? TRACK_VH_MOBILE : TRACK_VH_DESKTOP))
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (staticMode) return
    const canvas = canvasRef.current
    const sticky = stickyRef.current
    const track  = trackRef.current
    const fade   = fadeRef.current
    const inner  = isCollapsed ? null : innerRef.current
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
    // Recorta el espacio muerto del final del track (ver DEAD_TAIL_FACTOR) con un
    // margin-bottom negativo, así la sección siguiente arranca justo donde la card
    // termina su recorrido y queda alineada, sin el hueco enorme.
    const trimTrackTail = () => {
      const scrollable = track.offsetHeight - sticky.offsetHeight
      const dead = Math.max(0, scrollable * DEAD_TAIL_FACTOR)
      track.style.marginBottom = `-${dead}px`
    }
    // Devuelve true solo si llegó a dibujar. Clave para el frame 0: si el primer
    // render corre antes de que la imagen esté decodificada, NO queremos marcar
    // ese idx como "ya dibujado" (si no, el render posterior al decode se saltea
    // y el canvas queda en blanco hasta el primer scroll).
    const drawFrame = (idx: number): boolean => {
      const img = frames[idx]
      if (!img || !img.complete || img.naturalWidth === 0) return false
      const cw = canvas.width, ch = canvas.height
      const iw = img.naturalWidth, ih = img.naturalHeight
      const scale = Math.max(cw / iw, ch / ih)   // cover
      const dw = iw * scale, dh = ih * scale
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
      return true
    }
    const render = () => {
      const scrollable = track.offsetHeight - sticky.offsetHeight
      const top = track.getBoundingClientRect().top
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -top / scrollable)) : 0
      // translateY = scrollable·(k·p − k/2·p²) con k = 1−START_SPEED. La card
      // sube lento al principio (g'(0)=START_SPEED) y acelera hasta igualar el
      // scroll al final (g'(1)=1): traspaso continuo, sin salto al soltar el track.
      const k = SCRUB_K
      const translateY = scrollable * (k * progress - (k / 2) * progress * progress)
      const tf = `translate3d(0, ${translateY}px, 0)`
      sticky.style.transform = tf
      // Mismo translateY para el texto: viaja en lockstep con el video (no queda
      // desfasado al final del scrub). En 1 columna (isCollapsed) no se aplica.
      if (inner) inner.style.transform = tf
      // Fundido a oscuro en el tramo final, con el mismo progress que el frame.
      if (fade) {
        const f = Math.min(1, Math.max(0, (progress - FADE_START) / (1 - FADE_START)))
        fade.style.opacity = String(f * FADE_MAX)
      }
      const idx = Math.round(progress * (TOTAL_FRAMES - 1))
      // Solo avanzamos lastFrame si drawFrame realmente dibujó: así el frame 0 se
      // reintenta en el próximo render (o en el .finally del decode) si la imagen
      // todavía no estaba lista, en vez de quedar el canvas en blanco.
      if (idx !== lastFrame.current && drawFrame(idx)) lastFrame.current = idx
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render) }
    const onResize = () => { sizeCanvas(); trimTrackTail(); lastFrame.current = -1; render() }

    // El margin negativo depende de las alturas reales (track vs card): lo
    // aplicamos ya en el mount, antes de que se vea el hueco.
    trimTrackTail()

    // Primer frame decodificado → mostramos y dibujamos (no dejar canvas en blanco).
    frames[0].decode?.().catch(() => {}).finally(() => {
      if (cancelled) return
      setReady(true)
      sizeCanvas()
      trimTrackTail()
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
  }, [staticMode, isMobile, isCollapsed])

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
        <div className="hero-inner" ref={innerRef}>
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
              <div ref={fadeRef} className="takeoff-fade" aria-hidden="true" />
              {!ready && <div className="takeoff-skeleton" aria-hidden="true" />}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
