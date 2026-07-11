import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import RichTextArea from './RichTextArea'
import ModuleBuilder from './ModuleBuilder'
import { NIVEL_OPTIONS, ACCESO_OPTIONS } from './wizardData'
import { useAdminUI } from '../adminContext'
import { formatArs } from '../format'
import { useCategories } from '@/hooks/useCourses'
import { useAdminInstructors, useUpsertCourse, useSaveCurriculum, uploadMedia, slugify, type ModuleInput, type CourseWrite } from '@/hooks/admin/useAdminCourses'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import { grossFromNet } from '@/hooks/usePricing'
import type { Course, Module } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  initial?: (Course & { modules?: Module[] }) | null
  onSaved?: (course: Course) => void
}

interface FormState {
  titulo: string
  category_id: string
  nivel: 'principiante' | 'intermedio' | 'avanzado'
  instructor_id: string
  tipo: 'grabado' | 'en_vivo' | 'ebook'
  descripcion: string
  descripcion_larga: string
  thumbnail_url: string | null
  trailer_url: string
  tipo_acceso: 'pago' | 'gratuito'
  precio_neto_ars: string
  destacado: boolean
  live_date: string
  live_time: string
  live_duration_minutes: string
  live_url: string
  pdf_url: string | null
  total_paginas: string
  incluye: string
  no_incluye: string
  modules: ModuleInput[]
}

const STEPS = ['General', 'Precio', 'Programa', 'Incluye', 'Revisión']

function toModuleInputs(modules?: Module[]): ModuleInput[] {
  return (modules ?? []).map(m => ({
    id: m.id,
    titulo: m.titulo,
    descripcion: m.descripcion ?? null,
    lessons: (m.lessons ?? []).map(l => ({
      id: l.id, titulo: l.titulo, video_url: l.video_url, duracion_segundos: l.duracion_segundos, es_preview: l.es_preview, recursos: l.recursos,
      live_url: l.live_url, fecha_vivo: l.fecha_vivo, thumbnail_url: l.thumbnail_url,
    })),
  }))
}

function initialState(initial?: (Course & { modules?: Module[] }) | null): FormState {
  const liveDate = initial?.live_date ? new Date(initial.live_date) : null
  return {
    titulo: initial?.titulo ?? '',
    category_id: initial?.category_id ?? '',
    nivel: (initial?.nivel as FormState['nivel']) ?? 'principiante',
    instructor_id: initial?.instructor_id ?? '',
    tipo: (initial?.tipo === 'en_vivo' ? 'en_vivo' : initial?.tipo === 'ebook' ? 'ebook' : 'grabado'),
    descripcion: initial?.descripcion ?? '',
    descripcion_larga: initial?.descripcion_larga ?? '',
    thumbnail_url: initial?.thumbnail_url ?? null,
    trailer_url: initial?.trailer_url ?? '',
    tipo_acceso: (initial?.tipo_acceso === 'gratuito' ? 'gratuito' : 'pago'),
    precio_neto_ars: initial?.precio_neto_ars != null ? String(initial.precio_neto_ars) : '',
    destacado: initial?.destacado ?? false,
    live_date: liveDate ? liveDate.toISOString().slice(0, 10) : '',
    live_time: liveDate ? liveDate.toISOString().slice(11, 16) : '19:00',
    live_duration_minutes: initial?.live_duration_minutes != null ? String(initial.live_duration_minutes) : '90',
    live_url: initial?.live_url ?? '',
    pdf_url: initial?.pdf_url ?? null,
    total_paginas: initial?.total_paginas != null ? String(initial.total_paginas) : '',
    incluye: initial?.incluye ?? '',
    no_incluye: initial?.no_incluye ?? '',
    modules: toModuleInputs(initial?.modules),
  }
}

export default function CourseWizard({ open, onClose, initial, onSaved }: Props) {
  const { openSettings } = useAdminUI()
  const { data: categories } = useCategories()
  const { data: instructors } = useAdminInstructors()
  const { data: settings } = useAdminSettings()
  const upsert = useUpsertCourse()
  const saveCurriculum = useSaveCurriculum()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const pdfRef = useRef<HTMLInputElement>(null)

  // Reset when reopened for a different course.
  useEffect(() => {
    if (open) { setForm(initialState(initial)); setStep(1) }
  }, [open, initial])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const recargoTarjeta = settings?.mp_recargo_tarjeta_pct ?? 23
  const recargoTransferencia = settings?.mp_recargo_transferencia_pct ?? 6
  const neto = useMemo(() => Number(form.precio_neto_ars) || 0, [form.precio_neto_ars])
  const precioTarjeta = useMemo(() => grossFromNet(neto, recargoTarjeta), [neto, recargoTarjeta])
  const precioTransferencia = useMemo(() => grossFromNet(neto, recargoTransferencia), [neto, recargoTransferencia])

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (form.titulo.trim().length < 3) return 'El título es obligatorio (mínimo 3 caracteres).'
      if (form.tipo === 'ebook' && !form.pdf_url) return 'Subí el PDF del ebook.'
    }
    if (s === 2) {
      if (form.tipo_acceso === 'pago' && neto <= 0) return 'El precio neto debe ser mayor a 0.'
      if (form.tipo === 'en_vivo' && !form.live_date) return 'Indicá la fecha del vivo.'
    }
    return null
  }

  const next = () => {
    const err = validateStep(step)
    if (err) { toast.error(err); return }
    setStep(s => Math.min(STEPS.length, s + 1))
  }
  const prev = () => setStep(s => Math.max(1, s - 1))

  const onPickFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadMedia(slugify(form.titulo) || 'nuevo', file, 'thumbnail')
      set('thumbnail_url', url)
      toast.success('Imagen subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const onPickPdf = async (file: File) => {
    setUploadingPdf(true)
    try {
      const url = await uploadMedia(slugify(form.titulo) || 'nuevo', file, 'pdf')
      set('pdf_url', url)
      toast.success('PDF subido')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploadingPdf(false) }
  }

  const finish = async () => {
    for (let s = 1; s <= 2; s++) { const err = validateStep(s); if (err) { toast.error(err); setStep(s); return } }
    setSaving(true)
    try {
      const liveISO = form.tipo === 'en_vivo' && form.live_date
        ? new Date(`${form.live_date}T${form.live_time || '19:00'}:00`).toISOString() : null
      const payload: CourseWrite & { id?: string } = {
        id: initial?.id,
        titulo: form.titulo.trim(),
        slug: initial?.slug ?? slugify(form.titulo),
        tipo: form.tipo,
        category_id: form.category_id || null,
        instructor_id: form.instructor_id || null,
        nivel: form.nivel,
        descripcion: form.descripcion || null,
        descripcion_larga: form.descripcion_larga || null,
        thumbnail_url: form.thumbnail_url,
        trailer_url: form.trailer_url || null,
        tipo_acceso: form.tipo_acceso,
        precio_neto_ars: form.tipo_acceso === 'gratuito' ? 0 : neto,
        precio_ars: form.tipo_acceso === 'gratuito' ? 0 : precioTarjeta,
        precio_transferencia_ars: form.tipo_acceso === 'gratuito' ? 0 : precioTransferencia,
        destacado: form.destacado,
        incluye: form.incluye.trim() || null,
        no_incluye: form.no_incluye.trim() || null,
        live_date: form.tipo === 'en_vivo' ? liveISO : null,
        live_url: form.tipo === 'en_vivo' ? (form.live_url || null) : null,
        live_duration_minutes: form.tipo === 'en_vivo' ? (Number(form.live_duration_minutes) || null) : null,
        pdf_url: form.tipo === 'ebook' ? (form.pdf_url || null) : null,
        total_paginas: form.tipo === 'ebook' ? (Number(form.total_paginas) || null) : null,
      }
      const course = await upsert.mutateAsync(payload)
      await saveCurriculum.mutateAsync({ courseId: course.id, modules: form.modules })
      toast.success(initial ? 'Curso actualizado' : 'Curso guardado como borrador')
      onSaved?.(course)
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setSaving(false) }
  }

  const totalLecciones = form.modules.reduce((n, m) => n + m.lessons.length, 0)

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <h2>{initial ? 'Editar curso' : 'Nuevo curso'}</h2>
            <div className="sub">Se guarda como borrador. Nadie lo ve hasta que vos lo publiques.</div>
          </div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="route-stepper">
          {STEPS.map((label, i) => {
            const n = i + 1
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={`rs-step${n === step ? ' current' : ''}${n < step ? ' done' : ''}`}>
                  <div className="rs-node">{n}</div><div className="rs-label">{label}</div>
                </div>
                {n < STEPS.length && (
                  <div className={`rs-track${n < step ? ' done' : ''}${n === step ? ' current-track' : ''}`}><span className="plane">✈</span></div>
                )}
              </div>
            )
          })}
        </div>

        <div className="modal-body">
          {/* STEP 1 — GENERAL */}
          {step === 1 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Datos generales</div>
              <div className="wiz-step-sub">Cómo se va a llamar y dónde aparece en el catálogo.</div>
              <div className="field">
                <label className="f-label">Título del curso</label>
                <input className="input" type="text" placeholder="Ej: Cómo vender cruceros por el Mediterráneo" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
                <div className="f-hint">El link va a ser <span className="mono">academy.travexa.com.ar/cursos/{slugify(form.titulo) || '…'}</span></div>
              </div>
              <div className="field-row cols-3">
                <div className="field">
                  <label className="f-label">Categoría</label>
                  <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                    <option value="">Sin categoría</option>
                    {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="f-label">Nivel</label>
                  <select className="select" value={form.nivel} onChange={e => set('nivel', e.target.value as FormState['nivel'])}>
                    {NIVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="f-label">Instructor</label>
                  <select className="select" value={form.instructor_id} onChange={e => set('instructor_id', e.target.value)}>
                    <option value="">Sin instructor</option>
                    {(instructors ?? []).map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="f-label">Formato</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`chip${form.tipo === 'grabado' ? ' chip-active' : ''}`} onClick={() => set('tipo', 'grabado')} style={{ cursor: 'pointer' }}>Grabado</span>
                  <span className={`chip${form.tipo === 'en_vivo' ? ' chip-active' : ''}`} onClick={() => set('tipo', 'en_vivo')} style={{ cursor: 'pointer' }}>En vivo</span>
                  <span className={`chip${form.tipo === 'ebook' ? ' chip-active' : ''}`} onClick={() => set('tipo', 'ebook')} style={{ cursor: 'pointer' }}>Ebook / PDF</span>
                </div>
              </div>
              {form.tipo === 'ebook' && (
                <div className="field-row cols-2">
                  <div className="field">
                    <label className="f-label">Archivo PDF</label>
                    <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickPdf(f) }} />
                    <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => pdfRef.current?.click()}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                      {uploadingPdf ? 'Subiendo…' : form.pdf_url ? 'Reemplazar PDF' : 'Subir PDF'}
                    </button>
                    {form.pdf_url && <div className="f-hint" style={{ marginTop: 6 }}>PDF cargado · <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>ver</a></div>}
                  </div>
                  <div className="field">
                    <label className="f-label">Cantidad de páginas <span className="opt">— opcional</span></label>
                    <input className="input" type="number" value={form.total_paginas} onChange={e => set('total_paginas', e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
              <div className="field">
                <label className="f-label">Descripción corta <span className="opt">— aparece en la card del catálogo</span></label>
                <textarea className="textarea" style={{ minHeight: 56 }} placeholder="Una línea que resuma el curso" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
              </div>
              <div className="field">
                <label className="f-label">Descripción completa</label>
                <textarea className="textarea" placeholder="Para qué sirve, a quién está dirigido, qué va a poder hacer al terminar" value={form.descripcion_larga} onChange={e => set('descripcion_larga', e.target.value)} />
              </div>
              <div className="field-row cols-2">
                <div className="field">
                  <label className="f-label">Foto de portada</label>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f) }} />
                  <div className="upload-zone" onClick={() => fileRef.current?.click()} style={form.thumbnail_url ? { backgroundImage: `url('${form.thumbnail_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 120 } : undefined}>
                    {!form.thumbnail_url && <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                      <div className="u-title">{uploading ? 'Subiendo…' : 'Subir imagen'}</div>
                      <div className="u-sub">1280×720 recomendado</div>
                    </>}
                  </div>
                </div>
                <div className="field">
                  <label className="f-label">Trailer <span className="opt">— opcional</span></label>
                  <input className="input" type="text" placeholder="Link de YouTube" value={form.trailer_url} onChange={e => set('trailer_url', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — PRECIO */}
          {step === 2 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Precio y acceso</div>
              <div className="wiz-step-sub">Poné el neto que querés cobrarte; calculamos el precio final según el medio de pago.</div>
              <div className="field">
                <label className="f-label">Tipo de acceso</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ACCESO_OPTIONS.map(o => (
                    <span key={o.value} className={`chip${form.tipo_acceso === o.value ? ' chip-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => set('tipo_acceso', o.value)}>{o.label}</span>
                  ))}
                </div>
              </div>
              {form.tipo_acceso !== 'gratuito' && (
                <div className="field">
                  <label className="f-label">Precio neto <span className="opt">— lo que querés cobrarte</span></label>
                  <div className="input-prefix-wrap" style={{ maxWidth: 260 }}><span className="input-prefix">$</span><input className="input" type="number" value={form.precio_neto_ars} onChange={e => set('precio_neto_ars', e.target.value)} placeholder="0" /></div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ padding: '12px 14px', background: 'var(--surface-2, rgba(78,205,184,0.08))', border: '1px solid var(--line)', borderRadius: 12 }}>
                      <div className="f-hint" style={{ margin: 0 }}>Precio tarjeta/cuotas</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{neto > 0 ? formatArs(precioTarjeta) : '—'}</div>
                      <div className="f-hint" style={{ margin: 0 }}>recargo {recargoTarjeta}%</div>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'var(--gold-soft)', border: '1px solid var(--line)', borderRadius: 12 }}>
                      <div className="f-hint" style={{ margin: 0 }}>Precio transferencia</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{neto > 0 ? formatArs(precioTransferencia) : '—'}</div>
                      <div className="f-hint" style={{ margin: 0 }}>recargo {recargoTransferencia}%</div>
                    </div>
                  </div>
                  <div className="f-hint" style={{ marginTop: 8 }}>Recargos configurados en Ajustes · <a href="#" onClick={e => { e.preventDefault(); openSettings() }} style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>editar</a></div>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--line)', margin: '20px 0 16px' }} />
              <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: 'var(--gold-soft)', borderRadius: 12 }}>
                <div>
                  <label className="f-label" style={{ margin: 0 }}>★ Destacar en el catálogo</label>
                  <div className="f-hint" style={{ marginTop: 2 }}>Aparece primero y con badge dorado</div>
                </div>
                <span className="switch"><input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)} /><span className="track" /><span className="thumb" /></span>
              </div>
              {form.tipo === 'en_vivo' && (
                <div style={{ marginTop: 6, padding: 16, border: '1px dashed var(--line-strong)', borderRadius: 12 }}>
                  <div className="wiz-step-title" style={{ fontSize: 13 }}>Detalles del vivo</div>
                  <div className="field-row cols-3" style={{ marginTop: 12 }}>
                    <div className="field"><label className="f-label">Fecha</label><input className="input" type="date" value={form.live_date} onChange={e => set('live_date', e.target.value)} /></div>
                    <div className="field"><label className="f-label">Hora</label><input className="input" type="time" value={form.live_time} onChange={e => set('live_time', e.target.value)} /></div>
                    <div className="field"><label className="f-label">Duración (min)</label><input className="input" type="number" value={form.live_duration_minutes} onChange={e => set('live_duration_minutes', e.target.value)} /></div>
                  </div>
                  <div className="field"><label className="f-label">Link del vivo</label><input className="input" type="text" placeholder="Zoom / Meet / YouTube Live" value={form.live_url} onChange={e => set('live_url', e.target.value)} /></div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — PROGRAMA */}
          {step === 3 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Programa</div>
              <div className="wiz-step-sub">Módulos y lecciones. Marcá una lección como Preview para que sea gratis.</div>
              {form.tipo === 'ebook' && (
                <div className="f-hint" style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--gold-soft)', borderRadius: 10 }}>
                  Este es un ebook: el contenido es el PDF que subiste. El programa es opcional; podés dejarlo vacío.
                </div>
              )}
              <ModuleBuilder
                modules={form.modules}
                onChange={m => set('modules', m)}
                isLive={form.tipo === 'en_vivo'}
                onUploadThumb={file => uploadMedia(slugify(form.titulo) || 'nuevo', file, 'lesson-thumb')}
              />
            </div>
          )}

          {/* STEP 4 — INCLUYE */}
          {step === 4 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Qué incluye y qué no</div>
              <div className="wiz-step-sub">Un ítem por línea. Si dejás un campo vacío, esa sección no aparece en el curso publicado.</div>
              <div className="field">
                <label className="f-label">✓ Incluye</label>
                <RichTextArea value={form.incluye} onChange={v => set('incluye', v)} placeholder={'Acceso de por vida\nCertificado al completar\n**Bonus:** plantillas editables'} />
              </div>
              <div className="field">
                <label className="f-label">✕ No incluye</label>
                <RichTextArea value={form.no_incluye} onChange={v => set('no_incluye', v)} placeholder={'Mentoría 1 a 1\nSoporte telefónico'} />
              </div>
            </div>
          )}

          {/* STEP 5 — REVISION */}
          {step === 5 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Revisión final</div>
              <div className="wiz-step-sub">Así va a quedar guardado. Vas a poder ver la preview y publicarlo desde el detalle.</div>
              <div className="preview-frame">
                <div className="preview-hero" style={{ backgroundImage: form.thumbnail_url ? `url('${form.thumbnail_url}')` : 'linear-gradient(135deg,#0A1E29,#16323F)' }}>
                  <div className="preview-hero-content">
                    <div className="cat">{categories?.find(c => c.id === form.category_id)?.nombre ?? 'Sin categoría'}</div>
                    <h3>{form.titulo || 'Título del curso'}</h3>
                  </div>
                </div>
                <div className="preview-body">
                  <div className="stat-mini-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-mini"><div className="v">{form.tipo_acceso === 'gratuito' ? 'Gratis' : formatArs(precioTransferencia)}</div><div className="l">{form.tipo_acceso === 'gratuito' ? '—' : `Transferencia · Tarjeta ${formatArs(precioTarjeta)}`}</div></div>
                    {form.tipo === 'ebook'
                      ? <div className="stat-mini"><div className="v">{Number(form.total_paginas) || '—'}</div><div className="l">Páginas · Ebook</div></div>
                      : <div className="stat-mini"><div className="v">{form.modules.length}</div><div className="l">Módulos · {totalLecciones} lecciones</div></div>}
                    <div className="stat-mini"><div className="v">{form.tipo === 'en_vivo' ? 'En vivo' : form.tipo === 'ebook' ? 'Ebook' : 'Grabado'}</div><div className="l">{instructors?.find(i => i.id === form.instructor_id)?.nombre ?? 'Sin instructor'}</div></div>
                  </div>
                </div>
              </div>
              <div className="draft-banner" style={{ marginTop: 18, marginBottom: 0 }}>
                <div className="draft-banner-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg></div>
                <div className="draft-banner-text"><b>Se va a guardar como borrador</b><span>Nadie del catálogo lo ve todavía. Publicar es un paso aparte, después de ver la preview.</span></div>
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
