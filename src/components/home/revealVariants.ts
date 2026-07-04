import type { Variants } from 'framer-motion'

export const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1]

// Item variant for children inside a <RevealGroup> (stagger fade-up).
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const revealContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}
