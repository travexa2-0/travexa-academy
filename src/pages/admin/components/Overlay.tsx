import { useEffect } from 'react'

interface OverlayProps {
  open: boolean
  onClose: () => void
  alignRight?: boolean
  children: React.ReactNode
}

// Port of the prototype `.overlay` / `.overlay.open` pattern: fixed backdrop that
// fades in, closes on Escape or backdrop click. Children stay mounted; CSS handles
// the show/hide via the `open` class (display + opacity).
export default function Overlay({ open, onClose, alignRight, children }: OverlayProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={`overlay${alignRight ? ' align-right' : ''}${open ? ' open' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      aria-hidden={!open}
    >
      {children}
    </div>
  )
}
