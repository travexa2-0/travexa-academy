import { BookOpen, Gift, GraduationCap, Plane } from 'lucide-react'
import type { StatCard } from '@/lib/communityStats'
import { useCommunityStats } from '@/lib/communityStats'
import StatCardItem from '@/components/shared/StatCardItem'

interface Props {
  coursesCount: number
  vivencialCount: number
  freeCount: number
  instructorsCount: number
  loading: boolean
}

// Tira de indicadores del Home. Adopta el estilo de la tira de Formación
// (card + ícono + número + label, ver StatCardItem/communityStats), Sesión 43.
// Las 4 propias del Home (con link a su sección) son conteos REALES y se muestran
// siempre. Las 4 de comunidad (useCommunityStats, datos reales vía RPC, sin link)
// se agregan SOLO si hay volumen real → mientras no lo haya, el Home queda con
// sus 4 cards propias. Si no hay nada publicado, la tira entera se oculta.
export default function ProofStrip({ coursesCount, vivencialCount, freeCount, instructorsCount, loading }: Props) {
  const community = useCommunityStats()
  if (loading) return null
  const hasContent = coursesCount > 0 || vivencialCount > 0
  if (!hasContent) return null

  const propios: StatCard[] = [
    { key: 'disponibles', n: String(coursesCount),     label: coursesCount === 1 ? 'Curso disponible' : 'Cursos disponibles', icon: <BookOpen className="h-[19px] w-[19px]" />,      color: '#00E5C8',  tint: 'rgba(0,229,200,.14)',   to: '/cursos' },
    { key: 'gratis',      n: String(freeCount),         label: freeCount === 1 ? 'Curso gratis' : 'Cursos gratis',               icon: <Gift className="h-[19px] w-[19px]" />,          color: 'var(--gold)', tint: 'rgba(201,154,58,.15)', to: '/beneficios' },
    { key: 'instructores', n: String(instructorsCount), label: instructorsCount === 1 ? 'Instructor' : 'Instructores',           icon: <GraduationCap className="h-[19px] w-[19px]" />, color: '#A78BFA',  tint: 'rgba(167,139,250,.16)', to: '/instructores' },
    { key: 'vivencial',   n: String(vivencialCount),    label: vivencialCount === 1 ? 'Vivencial activo' : 'Vivenciales activos', icon: <Plane className="h-[19px] w-[19px]" />,         color: '#EF6B35',  tint: 'rgba(239,107,53,.15)', to: '/vivencial' },
  ]

  const items = [...propios, ...community]

  return (
    <section className="proof-strip">
      <div className="container">
        <div className="grid gap-[14px] grid-cols-2 md:grid-cols-4">
          {items.map((s) => (
            <StatCardItem key={s.key} stat={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
