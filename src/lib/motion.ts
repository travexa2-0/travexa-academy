// Curvas y constantes de animación — Emil Kowalski style

export const EASE_OUT    = [0.23, 1, 0.32, 1] as const
export const EASE_IO     = [0.77, 0, 0.175, 1] as const
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

export const fadeUp = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: EASE_OUT },
}

export const fadeIn = {
  initial:   { opacity: 0 },
  animate:   { opacity: 1 },
  exit:      { opacity: 0 },
  transition: { duration: 0.18 },
}

export const scaleIn = {
  initial:   { opacity: 0, scale: 0.95 },
  animate:   { opacity: 1, scale: 1 },
  exit:      { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: EASE_OUT },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
}

export const shakeX = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.4, ease: EASE_IO },
}
