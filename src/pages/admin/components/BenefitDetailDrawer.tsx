import { useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { benefitTypeMeta, benefitValueLabel } from './benefitMeta'
import { formatDate } from '../format'
import {
  useAdminBenefit, useBenefitRedemptions,
  useToggleBenefitPublish, useArchiveBenefit, useHardDeleteBenefit, useMarkBenefitWinner,
} from '@/hooks/admin/useAdminBenefits'
import type { Benefit } from '@/types'

interface Props {
  benefit: Benefit | null
  open: boolean
  onClose: () => void
  onEdit: (b: Benefit) => void
}

type Tab = 'info' | 'canjes'

function redemptionName(r: { profile?: { nombre: string | null; apellido: string | null; email: string | null }; user_id: string }): string {
  const p = r.profile
  return [p?.nombre, p?.apellido].filter(Boolean).join(' ') || p?.email || r.user_id.slice(0, 8)
}

export default function BenefitDetailDrawer({ benefit, open, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [winnerPick, setWinnerPick] = useState('')

  const { data: full } = useAdminBenefit(open && benefit ? benefit.id : undefined)
  const { data: redemptions } = useBenefitRedemptions(open && benefit ? benefit.id : undefined)
  const togglePublish = useToggleBenefitPublish()
  const archive = useArchiveBenefit()
  const hardDelete = useHardDeleteBenefit()
  const markWinner = useMarkBenefitWinner()

  if (!benefit) return null
  const b = full ?? benefit
  const meta = benefitTypeMeta(b.tipo)
  const valueLabel = benefitValueLabel(b.tipo, b.descuento_valor)
  const isSorteo = b.tipo === 'sorteo_vivencial'
  const statusLabel = b.archivado ? 'Archivado' : b.publicado ? 'Publicado' : 'Borrador'
  const canjes = redemptions ?? []

  const doPublish = async (publicado: boolean) => {
    try { await togglePublish.mutateAsync({ id: b.id, publicado }); toast.success(publicado ? 'Publicado' : 'Despublicado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doArchive = async (archivado: boolean) => {
    try { await archive.mutateAsync({ id: b.id, archivado }); toast.success(archivado ? 'Archivado' : 'Restaurado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doDelete = async () => {
    try { await hardDelete.mutateAsync(b.id); toast.success('Eliminado definitivamente'); onClose() }
    catch (e) { toast.error((e as Error).message) }
    finally { setConfirmDelete(false) }
  }
  const doMarkWinner = async () => {
    if (!winnerPick) { toast.error('Elegí un ganador de la lista.'); return }
    try { await markWinner.mutateAsync({ id: b.id, userId: winnerPick }); toast.success('Ganador anunciado 🎉') }
    catch (e) { toast.error((e as Error).message) }
  }

  const ganador = b.ganador_user_id ? canjes.find(r => r.user_id === b.ganador_user_id) : null

  return (
    <Overlay open={open} onClose={onClose} alignRight>
      <div className="slideover">
        <div className="slideover-hero" style={{ backgroundImage: b.imagen_url ? `url('${b.imagen_url}')` : 'linear-gradient(135deg,#0A1E29,#16323F)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="slideover-hero-top">
            <button className="modal-close" style={{ background: 'rgba(10,30,41,0.4)', color: '#fff' }} onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{statusLabel}</span>
          </div>
          <div className="slideover-hero-bottom">
            <div className="cat">{meta.label}</div>
            <h2>{b.titulo}</h2>
          </div>
        </div>

        <div className="slideover-tabs">
          <button className={`so-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Info general</button>
          <button className={`so-tab${tab === 'canjes' ? ' active' : ''}`} onClick={() => setTab('canjes')}>Canjes {canjes.length ? `· ${canjes.length}` : ''}</button>
        </div>

        <div className="slideover-body">
          {tab === 'info' && (
            <div className="so-panel active">
              <div className="stat-mini-grid">
                <div className="stat-mini"><div className="v">{b.costo_creditos > 0 ? `${b.costo_creditos} 🪙` : 'Gratis'}</div><div className="l">Costo</div></div>
                <div className="stat-mini"><div className="v">{b.cupo_maximo != null ? `${b.cupo_usado}/${b.cupo_maximo}` : b.cupo_usado}</div><div className="l">{b.cupo_maximo != null ? 'canjeado/cupo' : 'canjes · sin límite'}</div></div>
                <div className="stat-mini"><div className="v">{valueLabel ?? (b.course ? '1' : '—')}</div><div className="l">{valueLabel ? 'descuento' : b.course ? 'curso asociado' : 'sin asociado'}</div></div>
              </div>
              {b.descripcion && <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>{b.descripcion}</p>}

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head"><h3 style={{ fontSize: 13 }}>Datos del beneficio</h3></div>
                <div className="card-pad" style={{ padding: '14px 20px', fontSize: 12.6, color: 'var(--ink-soft)', display: 'grid', gap: 6 }}>
                  <div>Tipo: <b>{meta.label}</b></div>
                  {b.course && <div>Asociado a: <b>{b.course.titulo}</b></div>}
                  {valueLabel && <div>Descuento: <b>{valueLabel}</b></div>}
                  <div>Vigencia: <b>{b.fecha_inicio ? formatDate(b.fecha_inicio) : 'inmediata'}</b> → <b>{b.fecha_vencimiento ? formatDate(b.fecha_vencimiento) : 'sin vencimiento'}</b></div>
                  {isSorteo && ganador && <div>Ganador: <b>{redemptionName(ganador)}</b> · anunciado {formatDate(b.ganador_anunciado_at)}</div>}
                </div>
              </div>

              <div className="card">
                <div className="card-head"><h3 style={{ fontSize: 13 }}>Administrar</h3></div>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 18px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => onEdit(b)}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>Editar
                  </button>
                  {b.publicado
                    ? <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doPublish(false)}>Despublicar</button>
                    : <button className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doPublish(true)} disabled={b.archivado}>Publicar</button>}
                  {b.archivado
                    ? <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doArchive(false)}>Restaurar de archivo</button>
                    : <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doArchive(true)}>Archivar</button>}
                  {b.cupo_usado === 0 ? (
                    !confirmDelete
                      ? <button className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setConfirmDelete(true)}>Eliminar definitivamente</button>
                      : <div style={{ background: 'var(--clay-soft)', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 12.4, color: 'var(--clay-deep)', marginBottom: 8 }}>¿Seguro? Solo se puede porque nadie lo canjeó. Esta acción no se puede deshacer.</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-danger btn-sm" onClick={doDelete} disabled={hardDelete.isPending}>Sí, eliminar</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                          </div>
                        </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', padding: '2px 2px' }}>Ya tiene canjes: no se puede eliminar, solo archivar (un canje es un dato del alumno).</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'canjes' && (
            <div className="so-panel active">
              {isSorteo && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-head"><h3 style={{ fontSize: 13 }}>Sorteo</h3></div>
                  <div className="card-pad" style={{ padding: '14px 18px' }}>
                    {ganador ? (
                      <div style={{ fontSize: 13, color: 'var(--ink)' }}>🏆 Ganador: <b>{redemptionName(ganador)}</b><div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>Anunciado el {formatDate(b.ganador_anunciado_at)}</div></div>
                    ) : canjes.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Todavía nadie participó. El ganador se elige entre quienes canjean.</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="select" style={{ flex: 1, minWidth: 200 }} value={winnerPick} onChange={e => setWinnerPick(e.target.value)}>
                          <option value="">Elegir ganador…</option>
                          {canjes.map(r => <option key={r.id} value={r.user_id}>{redemptionName(r)}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={doMarkWinner} disabled={markWinner.isPending}>{markWinner.isPending ? 'Guardando…' : 'Marcar ganador'}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {canjes.length === 0
                ? <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Todavía no hay canjes.</div>
                : canjes.map(r => (
                    <div key={r.id} className="row-flex" style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 7 }}>
                      <div className="tbl-avatar">{redemptionName(r).slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.8 }}>{redemptionName(r)}{b.ganador_user_id === r.user_id ? ' 🏆' : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{r.created_at ? formatDate(r.created_at) : ''} · {r.creditos_consumidos} 🪙</div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
