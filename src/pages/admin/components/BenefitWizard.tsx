import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { BENEFIT_TYPES, benefitTypeMeta, needsCourse, isDescuento } from './benefitMeta'
import { uploadMedia, slugify } from '@/hooks/admin/useAdminCourses'
import { useUpsertBenefit, useCourseOptions, type BenefitWrite } from '@/hooks/admin/useAdminBenefits'
import type { Benefit, BenefitTipo } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Benefit | null
  onSaved?: (b: Benefit) => void
}

interface FormState {
  tipo: BenefitTipo
  titulo: string
  descripcion: string
  imagen_url: string | null
  course_id: string
  descuento_valor: string
  costo_creditos: string
  cupo_ilimitado: boolean
  cupo_maximo: string
  fecha_inicio: string
  sin_vencimiento: boolean
  fecha_vencimiento: string
  destacado: boolean
  terminos: string
}

const STEPS = ['Beneficio', 'Configuración', 'Reglas']

function toDateInput(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : ''
}

function initialState(initial?: Benefit | null): FormState {
  return {
    tipo: initial?.tipo ?? 'curso_gratis',
    titulo: initial?.titulo ?? '',
    descripcion: initial?.descripcion ?? '',
    imagen_url: initial?.imagen_url ?? null,
    course_id: initial?.course_id ?? '',
    descuento_valor: initial?.descuento_valor != null ? String(initial.descuento_valor) : '',
    costo_creditos: initial?.costo_creditos != null ? String(initial.costo_creditos) : '0',
    cupo_ilimitado: initial ? initial.cupo_maximo == null : true,
    cupo_maximo: initial?.cupo_maximo != null ? String(initial.cupo_maximo) : '',
    fecha_inicio: toDateInput(initial?.fecha_inicio ?? null),
    sin_vencimiento: initial ? initial.fecha_vencimiento == null : true,
    fecha_vencimiento: toDateInput(initial?.fecha_vencimiento ?? null),
    destacado: initial?.destacado ?? false,
    terminos: initial?.terminos ?? '',
  }
}

export default function BenefitWizard({ open, onClose, initial, onSaved }: Props) {
  const { data: courses } = useCourseOptions()
  const upsert = useUpsertBenefit()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) { setForm(initialState(initial)); setStep(1) }
  }, [open, initial])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const meta = benefitTypeMeta(form.tipo)
  const courseList = form.tipo === 'sorteo_vivencial'
    ? (courses ?? []).filter(c => c.tipo === 'vivencial')
    : (courses ?? [])

  const validateStep = (s: number): string | null => {
    if (s === 1 && form.titulo.trim().length < 3) return 'El título es obligatorio (mínimo 3 caracteres).'
    if (s === 2) {
      if (needsCourse(form.tipo) && !form.course_id) return form.tipo === 'sorteo_vivencial' ? 'Elegí el vivencial a sortear.' : 'Elegí el curso o vivencial asociado.'
      if (form.tipo === 'descuento_pct') {
        const pct = Number(form.descuento_valor) || 0
        if (pct < 1 || pct > 99) return 'El porcentaje de descuento debe estar entre 1 y 99.'
      }
      if (form.tipo === 'descuento_fijo' && (Number(form.descuento_valor) || 0) <= 0) return 'El monto de descuento debe ser mayor a 0.'
    }
    if (s === 3) {
      if ((Number(form.costo_creditos) || 0) <= 0) return 'El costo en créditos debe ser mayor a 0.'
      if (!form.cupo_ilimitado && (Number(form.cupo_maximo) || 0) <= 0) return 'Definí un cupo mayor a 0 o marcá "sin límite".'
      if (form.fecha_inicio && !form.sin_vencimiento && form.fecha_vencimiento &&
          new Date(form.fecha_inicio) >= new Date(form.fecha_vencimiento)) {
        return 'La fecha de inicio debe ser anterior a la de vencimiento.'
      }
    }
    return null
  }

  const next = () => {
    const err = validateStep(step)
    if (err) { toast.error(err); return }
    setStep(s => Math.min(STEPS.length, s + 1))
  }
  const prev = () => setStep(s => Math.max(1, s - 1))
  // Un paso es clickeable si todos los demás (menos el destino) están completos.
  const canJumpTo = (target: number) => STEPS.every((_, i) => i + 1 === target || validateStep(i + 1) === null)

  const onPickFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadMedia(`benefit-${slugify(form.titulo) || 'nuevo'}`, file, 'thumbnail')
      set('imagen_url', url)
      toast.success('Imagen subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const finish = async () => {
    for (let s = 1; s <= 3; s++) { const err = validateStep(s); if (err) { toast.error(err); setStep(s); return } }
    setSaving(true)
    try {
      const payload: BenefitWrite & { id?: string } = {
        id: initial?.id,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        imagen_url: form.imagen_url,
        costo_creditos: Number(form.costo_creditos) || 0,
        course_id: needsCourse(form.tipo) ? (form.course_id || null) : null,
        descuento_valor: isDescuento(form.tipo) ? (Number(form.descuento_valor) || 0) : null,
        cupo_maximo: form.cupo_ilimitado ? null : (Number(form.cupo_maximo) || null),
        fecha_inicio: form.fecha_inicio ? new Date(`${form.fecha_inicio}T00:00:00`).toISOString() : null,
        fecha_vencimiento: form.sin_vencimiento || !form.fecha_vencimiento ? null : new Date(`${form.fecha_vencimiento}T23:59:59`).toISOString(),
        destacado: form.destacado,
        terminos: form.tipo === 'sorteo_vivencial' ? (form.terminos.trim() || null) : null,
      }
      const benefit = await upsert.mutateAsync(payload)
      toast.success(initial ? 'Beneficio actualizado' : 'Beneficio guardado como borrador')
      onSaved?.(benefit)
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setSaving(false) }
  }

  const selectedCourse = courseList.find(c => c.id === form.course_id)

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <h2>{initial ? 'Editar beneficio' : 'Nuevo beneficio'}</h2>
            <div className="sub">Se guarda como borrador. Nadie lo canjea hasta que vos lo publiques.</div>
          </div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="route-stepper">
          {STEPS.map((label, i) => {
            const n = i + 1
            const jumpable = n !== step && canJumpTo(n)
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={`rs-step${n === step ? ' current' : ''}${n < step ? ' done' : ''}${jumpable ? ' clickable' : ''}`}
                  onClick={() => { if (jumpable) setStep(n) }} style={jumpable ? { cursor: 'pointer' } : undefined}>
                  <div className="rs-node">{n}</div><div className="rs-label">{label}</div>
                </div>
                {n < STEPS.length && <div className={`rs-track${n < step ? ' done' : ''}${n === step ? ' current-track' : ''}`}><span className="plane">✈</span></div>}
              </div>
            )
          })}
        </div>

        <div className="modal-body">
          {/* STEP 1 — BENEFICIO */}
          {step === 1 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">¿Qué tipo de beneficio es?</div>
              <div className="wiz-step-sub">Definí de qué se trata y cómo se muestra en la tienda de canjes.</div>
              <div className="field">
                <label className="f-label">Tipo</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
                  {BENEFIT_TYPES.map(t => {
                    const on = form.tipo === t.value
                    return (
                      <button key={t.value} type="button" onClick={() => set('tipo', t.value)}
                        style={{
                          textAlign: 'left', padding: '12px 13px', borderRadius: 12, cursor: 'pointer',
                          border: `1.5px solid ${on ? t.deep : 'var(--line)'}`,
                          background: on ? t.soft : 'var(--surface)',
                          display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                        <span style={{ color: t.deep, fontSize: 18, display: 'inline-flex' }}>{t.icon}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{t.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.35 }}>{t.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="field">
                <label className="f-label">Título</label>
                <input className="input" type="text" placeholder="Ej: 50% OFF en cualquier curso grabado" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
              </div>
              <div className="field">
                <label className="f-label">Descripción <span className="opt">— cómo se explica al alumno</span></label>
                <textarea className="textarea" placeholder="Qué obtiene, condiciones, cómo se usa" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
              </div>
              <div className="field">
                <label className="f-label">Imagen <span className="opt">— opcional</span></label>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f) }} />
                <div className="upload-zone" onClick={() => fileRef.current?.click()} style={form.imagen_url ? { backgroundImage: `url('${form.imagen_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 120 } : undefined}>
                  {!form.imagen_url && <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                    <div className="u-title">{uploading ? 'Subiendo…' : 'Subir imagen'}</div>
                    <div className="u-sub">1280×720 recomendado</div>
                  </>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — CONFIGURACIÓN */}
          {step === 2 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Configuración</div>
              <div className="wiz-step-sub">Depende del tipo de beneficio elegido.</div>
              {needsCourse(form.tipo) ? (
                <>
                  <div className="field">
                    <label className="f-label">{form.tipo === 'sorteo_vivencial' ? 'Vivencial a sortear' : 'Curso o vivencial asociado'}</label>
                    <select className="select" value={form.course_id} onChange={e => set('course_id', e.target.value)}>
                      <option value="">Elegir…</option>
                      {courseList.map(c => <option key={c.id} value={c.id}>{c.titulo}{c.tipo === 'vivencial' ? ' · vivencial' : c.tipo === 'en_vivo' ? ' · en vivo' : ''}</option>)}
                    </select>
                    {courseList.length === 0 && <div className="f-hint">No hay {form.tipo === 'sorteo_vivencial' ? 'vivenciales' : 'cursos'} disponibles todavía.</div>}
                  </div>
                  {isDescuento(form.tipo) && (
                    <div className="field" style={{ maxWidth: 260 }}>
                      <label className="f-label">{form.tipo === 'descuento_pct' ? 'Porcentaje de descuento' : 'Monto de descuento (ARS)'}</label>
                      <div className="input-prefix-wrap">
                        <span className="input-prefix">{form.tipo === 'descuento_pct' ? '%' : '$'}</span>
                        <input className="input" type="number" value={form.descuento_valor} onChange={e => set('descuento_valor', e.target.value)} />
                      </div>
                    </div>
                  )}
                  {form.tipo === 'sorteo_vivencial' && (
                    <div className="field">
                      <label className="f-label">Bases y condiciones <span className="opt">— opcional</span></label>
                      <textarea className="textarea" placeholder="Fecha del sorteo, cómo se elige el ganador, cómo se entrega el premio…" value={form.terminos} onChange={e => set('terminos', e.target.value)} />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 16, border: '1px dashed var(--line-strong)', borderRadius: 12, fontSize: 13, color: 'var(--ink-soft)' }}>
                  Este tipo de beneficio no necesita configuración extra. El título y la descripción del paso anterior alcanzan.
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — REGLAS + PREVIEW */}
          {step === 3 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Reglas de canje</div>
              <div className="wiz-step-sub">Costo, cupo y vigencia. Después vas a poder ver la preview y publicarlo.</div>
              <div className="field-row cols-2">
                <div className="field">
                  <label className="f-label">{form.tipo === 'sorteo_vivencial' ? 'Valor de 1 chance (créditos)' : 'Costo en créditos'}</label>
                  <div className="input-prefix-wrap"><span className="input-prefix">🪙</span><input className="input" type="number" value={form.costo_creditos} onChange={e => set('costo_creditos', e.target.value)} /></div>
                  <div className="f-hint">{form.tipo === 'sorteo_vivencial' ? 'Créditos que cuesta cada chance. El alumno elige cuántas comprar.' : 'Cuántos créditos gasta el alumno para canjearlo.'}</div>
                </div>
                <div className="field">
                  <label className="f-label">Cupo</label>
                  <label className="row-flex" style={{ fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
                    <input type="checkbox" checked={form.cupo_ilimitado} onChange={e => set('cupo_ilimitado', e.target.checked)} /> Sin límite de cupo
                  </label>
                  {!form.cupo_ilimitado && (
                    <input className="input" type="number" placeholder="Cantidad máxima" value={form.cupo_maximo} onChange={e => set('cupo_maximo', e.target.value)} />
                  )}
                </div>
              </div>
              <div className="field-row cols-2">
                <div className="field">
                  <label className="f-label">Fecha de inicio <span className="opt">— opcional</span></label>
                  <input className="input" type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
                </div>
                <div className="field">
                  <label className="f-label">Fecha de vencimiento</label>
                  <label className="row-flex" style={{ fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
                    <input type="checkbox" checked={form.sin_vencimiento} onChange={e => set('sin_vencimiento', e.target.checked)} /> Sin vencimiento
                  </label>
                  {!form.sin_vencimiento && (
                    <input className="input" type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} />
                  )}
                </div>
              </div>

              <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'var(--gold-soft)', borderRadius: 12, marginTop: 4 }}>
                <div>
                  <label className="f-label" style={{ margin: 0 }}>★ Destacado en la tienda</label>
                  <div className="f-hint" style={{ marginTop: 2 }}>Aparece en el carrusel de "Destacados de la semana"</div>
                </div>
                <span className="switch"><input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} /><span className="track" /><span className="thumb" /></span>
              </div>

              <div className="preview-frame" style={{ marginTop: 6 }}>
                <div className="preview-hero" style={{ backgroundImage: form.imagen_url ? `url('${form.imagen_url}')` : `linear-gradient(135deg,#0A1E29,#16323F)` }}>
                  <div className="preview-hero-content">
                    <div className="cat">{meta.label}</div>
                    <h3>{form.titulo || 'Título del beneficio'}</h3>
                  </div>
                </div>
                <div className="preview-body">
                  <div className="stat-mini-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-mini"><div className="v">{Number(form.costo_creditos) || 0} 🪙</div><div className="l">Costo</div></div>
                    <div className="stat-mini"><div className="v">{form.cupo_ilimitado ? '∞' : (form.cupo_maximo || '—')}</div><div className="l">Cupo</div></div>
                    <div className="stat-mini"><div className="v">{selectedCourse?.titulo ?? (needsCourse(form.tipo) ? '—' : 'Libre')}</div><div className="l">{isDescuento(form.tipo) ? `${form.descuento_valor || 0}${form.tipo === 'descuento_pct' ? '% OFF' : ' ARS OFF'}` : 'Asociado'}</div></div>
                  </div>
                </div>
              </div>
              <div className="draft-banner" style={{ marginTop: 18, marginBottom: 0 }}>
                <div className="draft-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg></div>
                <div className="draft-banner-text"><b>Se va a guardar como borrador</b><span>Publicar es un paso aparte, desde el detalle, después de revisar la preview.</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={prev} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>← Atrás</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            {step < STEPS.length
              ? <button className="btn btn-primary" onClick={next}>Siguiente<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg></button>
              : <button className="btn btn-primary" onClick={finish} disabled={saving}>{saving ? 'Guardando…' : (initial ? 'Guardar cambios' : 'Guardar borrador')}</button>}
          </div>
        </div>
      </div>
    </Overlay>
  )
}
