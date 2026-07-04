import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { EASE, revealContainer } from './revealVariants'

// Reveal-on-scroll — framer-motion equivalent of the prototype's
// IntersectionObserver `.reveal` pattern (Regla #4). Fade + rise once,
// on enter. Respects prefers-reduced-motion (renders final state).
// Stagger-item variants live in ./revealVariants (import `revealItem`).

/** Animated <Link> for cards inside stagger grids (keeps SPA navigation). */
export const MotionLink = motion.create(Link)

interface RevealProps {
  children: ReactNode
  className?: string
  /** Extra delay in seconds. */
  delay?: number
}

/** Single element that fades up when it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
}

/**
 * Container whose direct children (marked with `variants={revealItem}`)
 * fade up in a stagger. Use with `<motion.* variants={revealItem}>` items
 * or `<MotionLink variants={revealItem}>`.
 */
export function RevealGroup({ children, className }: RevealGroupProps) {
  return (
    <motion.div
      className={className}
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
