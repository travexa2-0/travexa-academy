import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, ZoomIn, Loader2, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUploadAvatar } from '@/hooks/useProfile'
import { scaleIn } from '@/lib/motion'

const VIEWPORT = 260   // diámetro del recorte circular (px)
const OUTPUT = 512     // tamaño del avatar exportado (px)

interface Props {
  file: File
  userId: string | undefined
  onClose: () => void
  onUploaded: (url: string) => void
}

// Recorte circular simple (zoom + arrastre) antes de subir. No sube el archivo
// crudo: exporta el círculo visible a un canvas cuadrado y sube ese blob.
export default function AvatarCropModal({ file, userId, onClose, onUploaded }: Props) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [baseScale, setBaseScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const { mutate: upload, isPending, isError, reset } = useUploadAvatar(userId)

  useEffect(() => () => URL.revokeObjectURL(url), [url])

  // Mantiene la imagen cubriendo el círculo (sin huecos) al arrastrar/zoomear.
  const clamp = useCallback(
    (p: { x: number; y: number }, s: number, base: number, nat: { w: number; h: number }) => {
      const ew = nat.w * base * s
      const eh = nat.h * base * s
      const maxX = Math.max(0, (ew - VIEWPORT) / 2)
      const maxY = Math.max(0, (eh - VIEWPORT) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y)),
      }
    },
    [],
  )

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nat = { w: img.naturalWidth, h: img.naturalHeight }
    const base = Math.max(VIEWPORT / nat.w, VIEWPORT / nat.h) // cubrir el círculo
    setNatural(nat)
    setBaseScale(base)
    setScale(1)
    setPos({ x: 0, y: 0 })
  }

  const handleScale = (s: number) => {
    if (!natural) return
    setScale(s)
    setPos(p => clamp(p, s, baseScale, natural))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: pos.x, y: pos.y, px: e.clientX, py: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !natural) return
    const next = { x: drag.current.x + (e.clientX - drag.current.px), y: drag.current.y + (e.clientY - drag.current.py) }
    setPos(clamp(next, scale, baseScale, natural))
  }
  const onPointerUp = () => { drag.current = null }

  const onWheel = (e: React.WheelEvent) => {
    const next = Math.min(3, Math.max(1, scale - e.deltaY * 0.0015))
    handleScale(Number(next.toFixed(3)))
  }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !natural) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pxPerSrc = baseScale * scale
    const leftEff = VIEWPORT / 2 - (natural.w * pxPerSrc) / 2 + pos.x
    const topEff = VIEWPORT / 2 - (natural.h * pxPerSrc) / 2 + pos.y
    const sx = -leftEff / pxPerSrc
    const sy = -topEff / pxPerSrc
    const sSize = VIEWPORT / pxPerSrc

    ctx.fillStyle = '#0A1E29'
    ctx.fillRect(0, 0, OUTPUT, OUTPUT)
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT)

    canvas.toBlob(
      blob => {
        if (!blob) { toast.error('No se pudo procesar la imagen'); return }
        upload(blob, {
          onSuccess: (uploadedUrl) => {
            toast.success('Foto de perfil actualizada')
            onUploaded(uploadedUrl)
          },
          onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'No se pudo subir la foto'),
        })
      },
      'image/jpeg',
      0.9,
    )
  }

  const dispW = natural ? natural.w * baseScale : 0
  const dispH = natural ? natural.h * baseScale : 0

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,20,.85)', backdropFilter: 'blur(12px)' }}
      {...scaleIn}
    >
      <div className="relative rounded-2xl border p-6 max-w-sm w-full" style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-3)' }} aria-label="Cerrar" disabled={isPending}>
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-4 w-4" style={{ color: 'var(--primary-l)' }} />
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>Ajustá tu foto</h2>
        </div>

        {/* Recorte circular */}
        <div className="flex justify-center">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ width: VIEWPORT, height: VIEWPORT, border: '2px solid var(--line-s)', background: 'var(--bg-deep)' }}
          >
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={onImgLoad}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: dispW || 'auto',
                height: dispH || 'auto',
                transform: `translate(-50%,-50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                transformOrigin: 'center',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Aro guía */}
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(245,243,236,.18)' }} />
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3 mt-5">
          <ZoomIn className="h-4 w-4 shrink-0" style={{ color: 'var(--text-3)' }} />
          <input
            type="range" min={1} max={3} step={0.01} value={scale}
            onChange={e => handleScale(Number(e.target.value))}
            className="flex-1 accent-[color:var(--primary-l)]"
            aria-label="Zoom"
          />
        </div>

        {isError && (
          <p className="text-xs text-center mt-3" style={{ color: 'rgb(248 113 113)' }}>
            No se pudo subir la foto. Probá de nuevo.
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => { reset(); onClose() }}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm border disabled:opacity-45"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !natural}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-45"
            style={{ background: 'var(--primary-l)', color: '#0A1E29' }}
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</> : 'Guardar foto'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
