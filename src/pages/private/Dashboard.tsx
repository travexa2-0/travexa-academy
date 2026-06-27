import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCourses } from '@/hooks/useCourses'
import CourseCard from '@/components/courses/CourseCard'
import SkeletonCard from '@/components/shared/SkeletonCard'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: featured = [], isLoading } = useCourses()

  const nombre = (user?.user_metadata as { nombre?: string } | undefined)?.nombre ?? 'Bienvenido'

  return (
    <div className="min-h-screen">
      <Header />

      {/* Welcome */}
      <section className="bg-gradient-to-b from-brand-navy-2 to-brand-navy border-b border-surface px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-brand-gold text-xs tracking-widest uppercase mb-2">Mi panel</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary">
            Hola, {nombre} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">Tu formación en turismo profesional continúa acá.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Mis cursos en progreso — empty state por ahora */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-text-primary">Mis cursos</h2>
            <Link to="/mis-cursos" className="text-brand-gold text-sm hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-surface bg-brand-navy-2 p-10 text-center">
            <BookOpen className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <h3 className="font-display font-semibold text-text-secondary mb-1">Todavía no empezaste ningún curso</h3>
            <p className="text-text-muted text-sm mb-5">Explorá el catálogo y empezá a aprender hoy.</p>
            <Link to="/cursos">
              <Button className="bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold">
                Explorar cursos
              </Button>
            </Link>
          </div>
        </section>

        {/* Cursos destacados */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-gold" />
              <h2 className="font-display font-bold text-xl text-text-primary">Cursos destacados</h2>
            </div>
            <Link to="/cursos" className="text-brand-gold text-sm hover:underline flex items-center gap-1">
              Ver catálogo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 3).map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
