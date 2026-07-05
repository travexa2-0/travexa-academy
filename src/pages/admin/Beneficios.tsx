import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BenefitCard from './components/BenefitCard'
import BenefitWizard from './components/BenefitWizard'
import BenefitDetailDrawer from './components/BenefitDetailDrawer'
import { BENEFIT_TYPES } from './components/benefitMeta'
import { useAdminBenefits } from '@/hooks/admin/useAdminBenefits'
import type { Benefit, BenefitTipo } from '@/types'

type Status = 'todos' | 'publicado' | 'borrador' | 'archivado'

function TipoFilter({ selected, onToggle }: { selected: Set<BenefitTipo>; onToggle: (v: BenefitTipo) => void }) {
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
        Tipo {selected.size > 0 && <span className="filter-dd-count">{selected.size}</span>}
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ marginLeft: 2 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className={`filter-dd-panel${open ? ' open' : ''}`}>
        {BENEFIT_TYPES.map(t => (
          <label key={t.value}><input type="checkbox" checked={selected.has(t.value)} onChange={() => onToggle(t.value)} /> {t.label}</label>
        ))}
      </div>
    </div>
  )
}

export default function Beneficios() {
  const { data: benefits } = useAdminBenefits()
  const [searchParams, setSearchParams] = useSearchParams()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<Benefit | null>(null)
  const [detail, setDetail] = useState<Benefit | null>(null)

  const [search, setSearch] = useState('')
  const [tipos, setTipos] = useState<Set<BenefitTipo>>(new Set())
  const [status, setStatus] = useState<Status>('todos')

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setEditing(null)
      setWizardOpen(true)
      searchParams.delete('nuevo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const list = benefits ?? []

  const counts = useMemo(() => ({
    todos: list.length,
    publicado: list.filter(b => b.publicado && !b.archivado).length,
    borrador: list.filter(b => !b.publicado && !b.archivado).length,
    archivado: list.filter(b => b.archivado).length,
  }), [list])

  const filtered = useMemo(() => list.filter(b => {
    if (status === 'publicado' && !(b.publicado && !b.archivado)) return false
    if (status === 'borrador' && !(!b.publicado && !b.archivado)) return false
    if (status === 'archivado' && !b.archivado) return false
    if (search && !b.titulo.toLowerCase().includes(search.toLowerCase())) return false
    if (tipos.size > 0 && !tipos.has(b.tipo)) return false
    return true
  }), [list, status, search, tipos])

  const toggleTipo = (v: BenefitTipo) => {
    const next = new Set(tipos)
    if (next.has(v)) next.delete(v); else next.add(v)
    setTipos(next)
  }
  const clearFilters = () => { setSearch(''); setTipos(new Set()); setStatus('todos') }

  const openNew = () => { setEditing(null); setWizardOpen(true) }
  const openEdit = (b: Benefit) => { setDetail(null); setEditing(b); setWizardOpen(true) }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Comunidad · Academy</div>
          <h1 className="page-title">Beneficios</h1>
          <p className="page-sub">Tienda de canjes: cursos gratis, descuentos y sorteos que los alumnos pagan con créditos. Se crean como borrador, publicás cuando estén listos.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
          Nuevo beneficio
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input type="text" placeholder="Buscar por título…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <TipoFilter selected={tipos} onToggle={toggleTipo} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['todos', 'publicado', 'borrador', 'archivado'] as Status[]).map(s => (
          <span key={s} className={`chip${status === s ? ' chip-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setStatus(s)}>
            {s === 'todos' ? 'Todos' : s === 'publicado' ? 'Publicados' : s === 'borrador' ? 'Borrador' : 'Archivados'} · {counts[s]}
          </span>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="item-grid">
          {filtered.map(b => <BenefitCard key={b.id} benefit={b} onClick={() => setDetail(b)} />)}
        </div>
      ) : (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg></div>
            <h4>{list.length === 0 ? 'Todavía no cargaste beneficios' : 'Nada coincide con estos filtros'}</h4>
            <p>{list.length === 0 ? 'Creá el primero para armar la tienda de canjes.' : 'Probá sacar algún filtro o buscar con otras palabras.'}</p>
            {list.length === 0
              ? <button className="btn btn-primary btn-sm" onClick={openNew}>Nuevo beneficio</button>
              : <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Limpiar filtros</button>}
          </div>
        </div>
      )}

      <BenefitDetailDrawer benefit={detail} open={!!detail} onClose={() => setDetail(null)} onEdit={openEdit} />
      <BenefitWizard open={wizardOpen} onClose={() => setWizardOpen(false)} initial={editing} />
    </>
  )
}
