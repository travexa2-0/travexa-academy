import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContentList from './components/ContentList'
import ContentDetailDrawer from './components/ContentDetailDrawer'
import CourseWizard from './components/CourseWizard'
import { useAdminCourses } from '@/hooks/admin/useAdminCourses'
import type { Course } from '@/types'

export default function Cursos() {
  const { data: courses } = useAdminCourses(['grabado', 'en_vivo'])
  const [searchParams, setSearchParams] = useSearchParams()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [detail, setDetail] = useState<Course | null>(null)

  // Deep-link: /admin/cursos?nuevo=1 opens the wizard (from command palette / KPIs).
  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setEditing(null)
      setWizardOpen(true)
      searchParams.delete('nuevo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const openNew = () => { setEditing(null); setWizardOpen(true) }
  const openEdit = (course: Course) => { setDetail(null); setEditing(course); setWizardOpen(true) }

  return (
    <>
      <ContentList kind="cursos" courses={courses ?? []} onNew={openNew} onOpen={c => setDetail(c)} />
      <ContentDetailDrawer course={detail} open={!!detail} onClose={() => setDetail(null)} onEdit={openEdit} />
      <CourseWizard open={wizardOpen} onClose={() => setWizardOpen(false)} initial={editing} />
    </>
  )
}
