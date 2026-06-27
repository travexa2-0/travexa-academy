import CourseCard from './CourseCard'
import SkeletonCard from '@/components/shared/SkeletonCard'
import type { Course } from '@/types'
import { BookOpen } from 'lucide-react'

interface Props {
  courses: Course[]
  loading: boolean
}

export default function CourseGrid({ courses, loading }: Props) {
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
        <BookOpen className="h-12 w-12 text-text-muted mb-4" />
        <h3 className="font-display font-semibold text-text-secondary text-lg">No hay cursos disponibles</h3>
        <p className="text-text-muted text-sm mt-1">Pronto habrá nuevos cursos. ¡Volvé a chequear!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courses.map(course => <CourseCard key={course.id} course={course} />)}
    </div>
  )
}
