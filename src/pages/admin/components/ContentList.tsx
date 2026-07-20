import { useMemo, useState, useRef, useEffect } from 'react'
import ContentCard from './ContentCard'
import ListErrorState from './ListErrorState'
import type { Course } from '@/types'

type Status = 'todos' | 'publicado' | 'borrador' | 'archivado'

interface Props {
  kind: 'cursos' | 'vivenciales'
  courses: Course[]
  onNew: () => void
  onOpen: (course: Course) => void
  error?: unknown
  onRetry?: () => void
}

function FilterDropdown({ label, options, selected, onToggle }: {
  label: string; options: string[]; selected: Set<string>; onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <div className="filter-dd" ref={ref}>
      <button className="filter-btn" onClick={() => setOpen(v => !v)}>
        {label} {selected.size > 0 && <span className="filter-dd-count">{selected.size}</span>}
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ marginLeft: 2 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className={`filter-dd-panel${open ? ' open' : ''}`}>
        {options.length === 0 && <label style={{ color: 'var(--ink-faint)' }}>Sin opciones</label>}
        {options.map(o => (
          <label key={o}><input type="checkbox" checked={selected.has(o)} onChange={() => onToggle(o)} /> {o}</label>
        ))}
      </div>
    </div>
  )
}

export default function ContentList({ kind, courses, onNew, onOpen, error, onRetry }: Props) {
  const [search, setSearch] = useState('')
  const [cats, setCats] = useState<Set<string>>(new Set())
  const [tipos, setTipos] = useState<Set<string>>(new Set())
  const [instructors, setInstructors] = useState<Set<string>>(new Set())
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState<Status>('todos')

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v); else next.add(v)
    setter(next)
  }

  const catOptions = useMemo(() => [...new Set(courses.map(c => c.category?.nombre).filter(Boolean) as string[])], [courses])
  const instrOptions = useMemo(() => [...new Set(courses.map(c => c.instructor?.nombre).filter(Boolean) as string[])], [courses])

  const counts = useMemo(() => ({
    todos: courses.length,
    publicado: courses.filter(c => c.publicado && !c.archivado).length,
    borrador: courses.filter(c => !c.publicado && !c.archivado).length,
    archivado: courses.filter(c => c.archivado).length,
  }), [courses])

  const filtered = useMemo(() => courses.filter(c => {
    if (status === 'publicado' && !(c.publicado && !c.archivado)) return false
    if (status === 'borrador' && !(!c.publicado && !c.archivado)) return false
    if (status === 'archivado' && !c.archivado) return false
    if (search && !c.titulo.toLowerCase().includes(search.toLowerCase())) return false
    if (cats.size > 0 && !(c.category?.nombre && cats.has(c.category.nombre))) return false
    if (instructors.size > 0 && !(c.instructor?.nombre && instructors.has(c.instructor.nombre))) return false
    if (featured && !c.destacado) return false
    if (kind === 'cursos' && tipos.size > 0) {
      const label = c.tipo === 'en_vivo' ? 'En vivo' : 'Grabado'
      if (!tipos.has(label)) return false
    }
    return true
  }), [courses, status, search, cats, instructors, featured, tipos, kind])

  const clearFilters = () => { setSearch(''); setCats(new Set()); setTipos(new Set()); setInstructors(new Set()); setFeatured(false); setStatus('todos') }

  const isViv = kind === 'vivenciales'

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido · Academy</div>
          <h1 className="page-title">{isViv ? 'Vivenciales' : 'Cursos'}</h1>
          <p className="page-sub">{isViv
            ? 'Fam trips y viajes educativos. Se crean como borrador; publicás cuando estén listos.'
            : 'Grabados y en vivo. Se crean como borrador, vos elegís cuándo mostrarlos con una preview antes de publicar.'}</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
          {isViv ? 'Nuevo vivencial' : 'Nuevo curso'}
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input type="text" placeholder="Buscar por título…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <FilterDropdown label="Categoría" options={catOptions} selected={cats} onToggle={v => toggle(cats, setCats, v)} />
        {!isViv && <FilterDropdown label="Formato" options={['Grabado', 'En vivo']} selected={tipos} onToggle={v => toggle(tipos, setTipos, v)} />}
        <FilterDropdown label="Instructor" options={instrOptions} selected={instructors} onToggle={v => toggle(instructors, setInstructors, v)} />
        <button className={`filter-btn${featured ? ' is-set' : ''}`} onClick={() => setFeatured(v => !v)}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" /></svg>
          Destacado
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['todos', 'publicado', 'borrador', 'archivado'] as Status[]).map(s => (
          <span key={s} className={`chip${status === s ? ' chip-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setStatus(s)}>
            {s === 'todos' ? 'Todos' : s === 'publicado' ? 'Publicados' : s === 'borrador' ? 'Borrador' : 'Archivados'} · {counts[s]}
          </span>
        ))}
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={onRetry} />
      ) : filtered.length > 0 ? (
        <div className="item-grid">
          {filtered.map(c => <ContentCard key={c.id} course={c} onClick={() => onOpen(c)} />)}
        </div>
      ) : (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></div>
            <h4>{courses.length === 0 ? `Todavía no cargaste ${isViv ? 'vivenciales' : 'cursos'}` : 'Nada coincide con estos filtros'}</h4>
            <p>{courses.length === 0 ? 'Creá el primero para empezar.' : 'Probá sacar algún filtro o buscar con otras palabras.'}</p>
            {courses.length === 0
              ? <button className="btn btn-primary btn-sm" onClick={onNew}>{isViv ? 'Nuevo vivencial' : 'Nuevo curso'}</button>
              : <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Limpiar filtros</button>}
          </div>
        </div>
      )}
    </>
  )
}
