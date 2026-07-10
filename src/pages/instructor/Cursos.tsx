import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnCourses, useOwnSales } from '@/hooks/instructor/useInstructorCourses'
import { formatArs } from '../admin/format'
import { brutoDe, estadoCurso, gananciaArs } from './earnings'

const TIPO_LABEL: Record<string, string> = {
  grabado: 'Grabado',
  en_vivo: 'En vivo',
  vivencial: 'Vivencial',
  ebook: 'Ebook',
}

function EstadoBadge({ estado }: { estado: string }) {
  const cls =
    estado === 'Borrador'  ? 'badge badge-draft' :
    estado === 'Archivado' ? 'badge badge-archived' :
    estado === 'Próximo'   ? 'badge badge-live' :
    'badge badge-published'
  return <span className={cls}>{estado}</span>
}

export default function InstructorCursos() {
  const navigate = useNavigate()
  const { instructor } = useInstructorSelf()
  const { data: cursos, isLoading } = useOwnCourses(instructor?.id)

  const courseIds = useMemo(() => cursos?.map(c => c.id), [cursos])
  const { data: sales } = useOwnSales(courseIds)

  const share = instructor?.revenue_share_pct ?? 0

  const rows = useMemo(() => (cursos ?? []).map(c => {
    const propias = (sales ?? []).filter(s => s.course_id === c.id)
    const bruto = brutoDe(propias)
    return {
      curso: c,
      inscriptos: propias.length,
      bruto,
      ganancia: gananciaArs(bruto, share),
    }
  }), [cursos, sales, share])

  if (isLoading) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido</div>
          <h1 className="page-title">Mis cursos</h1>
          <p className="page-sub">
            Los cursos que dictás. La carga y edición del contenido la hace el equipo de Travexa —
            acá ves cómo vienen las ventas.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>
            </div>
            <h4>Todavía no tenés cursos asignados</h4>
            <p>Cuando el equipo de Travexa cargue un curso a tu nombre, lo vas a ver acá.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Curso</th><th>Tipo</th><th>Estado</th>
                  <th className="align-right">Inscriptos pagos</th>
                  <th className="align-right">Tu ganancia</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ curso, inscriptos, ganancia }) => (
                  <tr key={curso.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/instructor/cursos/${curso.id}`)}>
                    <td>
                      <div className="row-flex">
                        <div className="thumb" style={curso.thumbnail_url ? { backgroundImage: `url('${curso.thumbnail_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{curso.titulo}</div>
                          {curso.live_date && (
                            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                              {new Date(curso.live_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{TIPO_LABEL[curso.tipo] ?? curso.tipo}</td>
                    <td><EstadoBadge estado={estadoCurso(curso)} /></td>
                    <td className="num">{inscriptos}</td>
                    <td className="num">{formatArs(ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
