import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Benefit } from '@/types'
import { badgeInfo, valueBlock, artStyle } from './benefitStoreMeta'

// Carrusel 3D de destacados. Réplica del prototipo pero con Framer Motion:
// springs de baja rigidez / alto amortiguamiento → la misma sensación lenta y
// elegante, con drag interrumpible. `prefers-reduced-motion` → solo crossfade.

interface Props {
  benefits: Benefit[]
  onOpen: (b: Benefit) => void
}

const DRAG_THRESHOLD = 48

export default function FeaturedCarousel({ benefits, onOpen }: Props) {
  const n = benefits.length
  const [current, setCurrent] = useState(0)
  const [stageW, setStageW] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Drag / swipe
  const dragStartX = useRef<number | null>(null)
  const draggedRef = useRef(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setStageW(el.clientWidth))
    ro.observe(el)
    setStageW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const rotate = useCallback((dir: number) => {
    if (n === 0) return
    setCurrent(c => ((c + dir) % n + n) % n)
  }, [n])

  // Teclado ← →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') rotate(-1)
      if (e.key === 'ArrowRight') rotate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rotate])

  const relOffset = (i: number) => {
    let off = i - current
    if (off > n / 2) off -= n
    if (off < -n / 2) off += n
    return off
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    draggedRef.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return
    if (Math.abs(e.clientX - dragStartX.current) > 8) draggedRef.current = true
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return
    const dx = e.clientX - dragStartX.current
    if (Math.abs(dx) > DRAG_THRESHOLD) rotate(dx < 0 ? 1 : -1)
    dragStartX.current = null
  }

  if (n === 0) return null

  const mobile = stageW > 0 && stageW < 760
  const cardW = stageW > 0 ? Math.min(780, stageW * 0.92) : 780
  const cardH = mobile ? 400 : 320

  return (
    <>
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => { dragStartX.current = null }}
      >
        <button className="stage-nav prev" onClick={() => rotate(-1)} aria-label="Anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="stage-nav next" onClick={() => rotate(1)} aria-label="Siguiente">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        {benefits.map((b, i) => {
          const off = relOffset(i)
          const abs = Math.abs(off)
          const x = off * (mobile ? 0.66 : 0.46) * cardW
          const rotY = off * (mobile ? -16 : -14)
          const scale = off === 0 ? 1 : abs === 1 ? 0.82 : 0.68
          const opacity = abs > 2 ? 0 : off === 0 ? 1 : 0.55
          const bg = badgeInfo(b.tipo)
          const v = valueBlock(b)
          return (
            <motion.article
              key={b.id}
              className={`fcard ${off === 0 ? 'center' : 'side'}`}
              style={{ marginLeft: -cardW / 2, marginTop: -cardH / 2, zIndex: 20 - abs * 5, pointerEvents: abs > 2 ? 'none' : 'auto' }}
              animate={reduce
                ? { opacity, x, rotateY: rotY, scale, filter: off === 0 ? 'none' : 'brightness(.72) saturate(.85)' }
                : { opacity, x, rotateY: rotY, scale, filter: off === 0 ? 'brightness(1)' : 'brightness(.72) saturate(.85)' }}
              transition={reduce
                ? { duration: 0.2 }
                : { type: 'spring', stiffness: 50, damping: 18, mass: 1, opacity: { duration: 0.5 }, filter: { duration: 0.6 } }}
              onClick={() => {
                if (draggedRef.current) return
                if (off === 0) onOpen(b)
                else rotate(off)
              }}
            >
              <div className="art" style={artStyle(b, i)}><div className="art-topo" /></div>
              <div className="glass-edge" />
              <div className="content">
                <span className={`badge ${bg.cls}`}>{bg.label}</span>
                <h3>{b.titulo}</h3>
                {b.descripcion && <div className="desc">{b.descripcion}</div>}
                <div className="price-tag">
                  <div className="pt-big">{v.big}</div>
                  <div className="pt-lbl">{v.lbl}</div>
                  {v.sub && <div className="pt-extra">{v.sub}</div>}
                  {v.extra && <div className="pt-extra">{v.extra}</div>}
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="dots">
        {benefits.map((b, i) => (
          <button key={b.id} className={i === current ? 'on' : ''} aria-label={`Ir al destacado ${i + 1}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </>
  )
}
