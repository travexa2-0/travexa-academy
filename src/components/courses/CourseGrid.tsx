import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import CourseCard from './CourseCard'
import SkeletonCard from '@/components/shared/SkeletonCard'
import type { Course } from '@/types'
import { BookOpen } from 'lucide-react'

interface Props {
  courses: Course[]
  loading: boolean
  wishlist?: string[]
  onWishlistToggle?: (courseId: string) => void
  staggerItem?: Variants
}

export default function CourseGrid({ courses, loading, wishlist = [], onWishlistToggle, staggerItem }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 mb-4" style={{ color: 'var(--text-3)' }} />
        <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-2)' }}>No hay cursos disponibles</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Pronto habrá nuevos cursos. ¡Volvé a chequear!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map(course => (
        staggerItem ? (
          <motion.div key={course.id} variants={staggerItem}>
            <CourseCard course={course} wishlisted={wishlist.includes(course.id)} onWishlistToggle={onWishlistToggle} />
          </motion.div>
        ) : (
          <div key={course.id}>
            <CourseCard course={course} wishlisted={wishlist.includes(course.id)} onWishlistToggle={onWishlistToggle} />
          </div>
        )
      ))}
    </div>
  )
}
