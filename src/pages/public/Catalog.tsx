import { useState } from 'react'
import { Search } from 'lucide-react'
import Header from '@/components/layout/Header'
import CourseGrid from '@/components/courses/CourseGrid'
import { Input } from '@/components/ui/input'
import { useCourses, useCategories } from '@/hooks/useCourses'

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  const { data: courses = [], isLoading } = useCourses(selectedCategory)
  const { data: categories = [] } = useCategories()

  const filtered = search.trim()
    ? courses.filter(c =>
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor?.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : courses

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero section */}
      <section className="bg-gradient-to-b from-brand-navy-2 to-brand-navy border-b border-surface py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-brand-gold text-xs tracking-widest uppercase mb-3">Trade turístico argentino</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary mb-4">
            Todos los cursos
          </h1>
          <p className="text-text-secondary text-base mb-8 max-w-xl">
            Formación práctica para asesores y agencias de viajes. Aprendé de los mejores del sector.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Buscar cursos o instructores..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-brand-navy border-surface text-text-primary placeholder:text-text-muted focus:border-brand-gold"
            />
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`font-mono text-xs px-4 py-1.5 rounded-full border transition-colors ${
                !selectedCategory
                  ? 'bg-brand-gold text-brand-navy border-brand-gold font-semibold'
                  : 'border-surface text-text-muted hover:border-surface-border-strong hover:text-text-secondary'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
                className={`font-mono text-xs px-4 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-brand-gold text-brand-navy border-brand-gold font-semibold'
                    : 'border-surface text-text-muted hover:border-surface-border-strong hover:text-text-secondary'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}

        <CourseGrid courses={filtered} loading={isLoading} />
      </section>
    </div>
  )
}
