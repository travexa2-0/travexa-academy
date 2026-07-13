import { useMemo } from 'react'
import Header from '@/components/layout/Header'
import WhatsAppFloat from '@/components/shared/WhatsAppFloat'
import PlaneTakeoffHero from '@/components/home/PlaneTakeoffHero'
import ProofStrip from '@/components/home/ProofStrip'
import ValuePropsGrid from '@/components/home/ValuePropsGrid'
import FeaturedCoursesMarquee from '@/components/home/FeaturedCoursesMarquee'
import VivencialHighlight from '@/components/home/VivencialHighlight'
import HowItWorks from '@/components/home/HowItWorks'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import GamificationSection from '@/components/home/GamificationSection'
import FinalCTA from '@/components/home/FinalCTA'
import { useCourses } from '@/hooks/useCourses'
import '@/components/home/home.css'

// Home pública (/) — puerta de entrada del producto. Réplica del prototipo
// aprobado `academy_home.html`, con datos reales de academy_courses donde
// corresponde (Regla #2). El header y el WhatsApp float son los componentes
// compartidos, no recreados desde el HTML del prototipo (Regla #1).
export default function Home() {
  const { data: courses = [], isLoading } = useCourses()

  const { formacion, vivencial, coursesCount, vivencialCount, freeCount, instructorsCount } = useMemo(() => {
    const vivenciales = courses.filter(c => c.tipo === 'vivencial')
    const formacionList = courses.filter(c => c.tipo !== 'vivencial')
    const free = formacionList.filter(c => c.tipo_acceso === 'gratuito' || c.precio_ars === 0)
    const instructorIds = new Set(courses.map(c => c.instructor_id).filter(Boolean))
    return {
      formacion: formacionList,
      vivencial: vivenciales[0] ?? null,
      coursesCount: formacionList.length,
      vivencialCount: vivenciales.length,
      freeCount: free.length,
      instructorsCount: instructorIds.size,
    }
  }, [courses])

  return (
    <div className="home-root">
      <Header />
      <PlaneTakeoffHero />
      <ProofStrip
        coursesCount={coursesCount}
        vivencialCount={vivencialCount}
        freeCount={freeCount}
        instructorsCount={instructorsCount}
        loading={isLoading}
      />
      {/* Orden de negocio: después de los números va Vivenciales (prioritario),
          después Formación/cursos, y recién después "Qué encontrás". */}
      <VivencialHighlight vivencial={vivencial} loading={isLoading} />
      <FeaturedCoursesMarquee courses={formacion} loading={isLoading} />
      <ValuePropsGrid coursesCount={coursesCount} />
      <HowItWorks />
      <TestimonialsSection />
      <GamificationSection />
      <FinalCTA />
      <WhatsAppFloat />
    </div>
  )
}
