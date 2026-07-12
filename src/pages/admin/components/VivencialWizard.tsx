import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import RichTextArea from './RichTextArea'
import ItineraryBuilder from './ItineraryBuilder'
import { formatArs } from '../format'
import { useCategories } from '@/hooks/useCourses'
import { useUpsertCourse, uploadMedia, slugify, type CourseWrite } from '@/hooks/admin/useAdminCourses'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import type { Course, ItinerarioDia } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Course | null
  onSaved?: (course: Course) => void
}

interface FormState {
  titulo: string
  pais: string
  region: string
  category_id: string
  ciudad_salida: string
  punto_encuentro: string
  fecha_salida: string
  fecha_regreso: string
  cupo_maximo: string
  hotel: string
  thumbnail_url: string | null
  fotos: string[]
  precio_usd: string
  sena_usd: string
  whatsapp: string
  itinerario: ItinerarioDia[]
  incluye: string
  no_incluye: string
}

const STEPS = ['Destino', 'Precio', 'Itinerario', 'Incluye', 'Revisión']

function initialState(initial?: Course | null): FormState {
  return {
    titulo: initial?.titulo ?? '',
    pais: initial?.vivencial_pais ?? 'Argentina',
    region: initial?.vivencial_region ?? '',
    category_id: initial?.category_id ?? '',
    ciudad_salida: initial?.vivencial_ciudad_salida ?? '',
    punto_encuentro: initial?.vivencial_punto_encuentro ?? '',
    fecha_salida: initial?.vivencial_fecha_salida ?? '',
    fecha_regreso: initial?.vivencial_fecha_regreso ?? '',
    cupo_maximo: initial?.vivencial_cupo_maximo != null ? String(initial.vivencial_cupo_maximo) : '15',
    hotel: initial?.vivencial_hotel ?? '',
    thumbnail_url: initial?.thumbnail_url ?? null,
    fotos: initial?.fotos ?? [],
    precio_usd: initial?.precio_usd != null ? String(initial.precio_usd) : '',
    sena_usd: initial?.vivencial_precio_seña_usd != null ? String(initial.vivencial_precio_seña_usd) : '',
    whatsapp: initial?.vivencial_whatsapp_url ?? '',
    itinerario: initial?.vivencial_itinerario ?? [],
    incluye: initial?.incluye ?? '',
    no_incluye: initial?.no_incluye ?? '',
  }
}

export default function VivencialWizard({ open, onClose, initial, onSaved }: Props) {
  const { data: categories } = useCategories()
  const { data: settings } = useAdminSettings()
  const upsert = useUpsertCourse()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { if (open) { setForm(initialState(initial)); setStep(1) } }, [open, initial])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const tc = settings?.tipo_cambio_usd_ars ?? 1450
  const precioArs = useMemo(() => (Number(form.precio_usd) || 0) * tc, [form.precio_usd, tc])
  const senaArs = useMemo(() => (Number(form.sena_usd) || 0) * tc, [form.sena_usd, tc])

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (form.titulo.trim().length < 3) return 'El título es obligatorio.'
      if (!form.fecha_salida || !form.fecha_regreso) return 'Indicá fecha de salida y regreso.'
      if (form.fecha_regreso < form.fecha_salida) return 'La fecha de regreso no puede ser anterior a la de salida.'
      if ((Number(form.cupo_maximo) || 0) <= 0) return 'El cupo debe ser mayor a 0.'
    }
    if (s === 2 && (Number(form.precio_usd) || 0) <= 0) return 'El precio total debe ser mayor a 0.'
    return null
  }
  const next = () => { const err = validateStep(step); if (err) { toast.error(err); return } setStep(s => Math.min(STEPS.length, s + 1)) }
  const prev = () => setStep(s => Math.max(1, s - 1))

  const onPickFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadMedia(slugify(form.titulo) || 'nuevo', file, 'gallery')
      set('fotos', [...form.fotos, url])
      if (!form.thumbnail_url) set('thumbnail_url', url)
      toast.success('Foto subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const finish = async () => {
    for (let s = 1; s <= 2; s++) { const err = validateStep(s); if (err) { toast.error(err); setStep(s); return } }
    setSaving(true)
    try {
      const cupo = Number(form.cupo_maximo) || 0
      const payload: CourseWrite & { id?: string } = {
        id: initial?.id,
        titulo: form.titulo.trim(),
        slug: initial?.slug ?? slugify(form.titulo),
        tipo: 'vivencial',
        tipo_acceso: 'pago',
        category_id: form.category_id || null,
        thumbnail_url: form.thumbnail_url ?? form.fotos[0] ?? null,
        fotos: form.fotos,
        precio_usd: Number(form.precio_usd) || 0,
        precio_ars: Math.round(precioArs),
        incluye: form.incluye.trim() || null,
        no_incluye: form.no_incluye.trim() || null,
        vivencial_pais: form.pais || null,
        vivencial_region: form.region || null,
        vivencial_ciudad_salida: form.ciudad_salida || null,
        vivencial_punto_encuentro: form.punto_encuentro || null,
        vivencial_fecha_salida: form.fecha_salida || null,
        vivencial_fecha_regreso: form.fecha_regreso || null,
        vivencial_cupo_maximo: cupo,
        // On create, available seats start at max; on edit we keep the existing available count.
        vivencial_cupo_disponible: initial ? (initial.vivencial_cupo_disponible ?? cupo) : cupo,
        vivencial_hotel: form.hotel || null,
        vivencial_precio_seña_usd: Number(form.sena_usd) || 0,
        vivencial_precio_seña_ars: Math.round(senaArs),
        // Cuotas retiradas del flujo; se preservan valores previos sin borrarlos.
        vivencial_precio_cuotas_usd: initial?.vivencial_precio_cuotas_usd ?? null,
        vivencial_precio_cuotas_ars: initial?.vivencial_precio_cuotas_ars ?? null,
        vivencial_whatsapp_url: form.whatsapp || null,
        vivencial_itinerario: form.itinerario,
      }
      const course = await upsert.mutateAsync(payload)
      toast.success(initial ? 'Vivencial actualizado' : 'Vivencial guardado como borrador')
      onSaved?.(course)
      onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <h2>{initial ? 'Editar vivencial' : 'Nuevo vivencial'}</h2>
            <div className="sub">Se guarda como borrador. Nadie lo ve hasta que vos lo publiques.</div>
          </div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="route-stepper">
          {STEPS.map((label, i) => {
            const n = i + 1
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={`rs-step${n === step ? ' current' : ''}${n < step ? ' done' : ''}`}><div className="rs-node">{n}</div><div className="rs-label">{label}</div></div>
                {n < STEPS.length && <div className={`rs-track${n < step ? ' done' : ''}${n === step ? ' current-track' : ''}`}><span className="plane">✈</span></div>}
              </div>
            )
          })}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Destino y datos generales</div>
              <div className="wiz-step-sub">Dónde es, cuándo sale y cuántos lugares hay.</div>
              <div className="field"><label className="f-label">Título del vivencial</label><input className="input" type="text" placeholder="Ej: Fam Trip: Salta y los Valles Calchaquíes" value={form.titulo} onChange={e => set('titulo', e.target.value)} /></div>
              <div className="field-row cols-3">
                <div className="field"><label className="f-label">País</label><input className="input" type="text" value={form.pais} onChange={e => set('pais', e.target.value)} /></div>
                <div className="field"><label className="f-label">Región / Provincia</label><input className="input" type="text" placeholder="Ej: Salta" value={form.region} onChange={e => set('region', e.target.value)} /></div>
                <div className="field"><label className="f-label">Categoría</label>
                  <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                    <option value="">Sin categoría</option>
                    {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Ciudad de salida</label><input className="input" type="text" placeholder="Ej: Buenos Aires" value={form.ciudad_salida} onChange={e => set('ciudad_salida', e.target.value)} /></div>
                <div className="field"><label className="f-label">Punto de encuentro</label><input className="input" type="text" placeholder="Ej: Aeroparque, mostrador Travexa" value={form.punto_encuentro} onChange={e => set('punto_encuentro', e.target.value)} /></div>
              </div>
              <div className="field-row cols-3">
                <div className="field"><label className="f-label">Fecha de salida</label><input className="input" type="date" value={form.fecha_salida} onChange={e => set('fecha_salida', e.target.value)} /></div>
                <div className="field"><label className="f-label">Fecha de regreso</label><input className="input" type="date" value={form.fecha_regreso} onChange={e => set('fecha_regreso', e.target.value)} /></div>
                <div className="field"><label className="f-label">Cupo máximo</label><input className="input" type="number" value={form.cupo_maximo} onChange={e => set('cupo_maximo', e.target.value)} /></div>
              </div>
              <div className="field"><label className="f-label">Hotel / alojamiento</label><input className="input" type="text" placeholder="Nombre del hotel" value={form.hotel} onChange={e => set('hotel', e.target.value)} /></div>
              <div className="field">
                <label className="f-label">Fotos del destino</label>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f) }} />
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  <div className="u-title">{uploading ? 'Subiendo…' : 'Subir galería'}</div>
                  <div className="u-sub">La primera que subas es la portada · {form.fotos.length} cargadas</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Precio y seña</div>
              <div className="wiz-step-sub">Tu modelo de cobro: seña ahora, saldo después.</div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Precio total (USD)</label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="number" value={form.precio_usd} onChange={e => set('precio_usd', e.target.value)} /></div></div>
                <div className="field"><label className="f-label">Equivalente ARS</label><div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="text" value={formatArs(precioArs).replace('$', '')} disabled style={{ color: 'var(--ink-faint)' }} /></div></div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Seña (USD)</label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="number" value={form.sena_usd} onChange={e => set('sena_usd', e.target.value)} /></div></div>
                <div className="field"><label className="f-label">Equivalente ARS</label><div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="text" value={formatArs(senaArs).replace('$', '')} disabled style={{ color: 'var(--ink-faint)' }} /></div></div>
              </div>
              <div className="f-hint" style={{ marginTop: 4 }}>La seña es solo de referencia: la ve Yesica para mencionarla por WhatsApp. No dispara ningún cobro automático.</div>
              <div className="field" style={{ marginTop: 18 }}>
                <label className="f-label">Link del grupo de WhatsApp del viaje</label>
                <input className="input" type="text" placeholder="https://chat.whatsapp.com/…" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                <div className="f-hint">Es el grupo del viaje al que se suman los inscriptos. No es el número de consultas (ese sale del botón “Quiero mi lugar”, que va al WhatsApp Business global).</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Itinerario día por día</div>
              <div className="wiz-step-sub">Esto es lo que más mira un asesor antes de anotarse.</div>
              <ItineraryBuilder days={form.itinerario} onChange={d => set('itinerario', d)} />
            </div>
          )}

          {step === 4 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Qué incluye y qué no</div>
              <div className="wiz-step-sub">Esto se muestra tal cual en la página de venta.</div>
              <div className="field"><label className="f-label">✓ Incluye</label><RichTextArea value={form.incluye} onChange={v => set('incluye', v)} placeholder={'Alojamiento\nDesayuno diario\n**Bonus:** kit del viajero'} /></div>
              <div className="field"><label className="f-label">✕ No incluye</label><RichTextArea value={form.no_incluye} onChange={v => set('no_incluye', v)} placeholder={'Pasajes aéreos\nGastos personales'} /></div>
            </div>
          )}

          {step === 5 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Revisión final</div>
              <div className="wiz-step-sub">Así va a quedar guardado. Vas a poder ver la preview y publicarlo desde el detalle.</div>
              <div className="preview-frame">
                <div className="preview-hero" style={{ backgroundImage: form.thumbnail_url ? `url('${form.thumbnail_url}')` : 'linear-gradient(135deg,#0A1E29,#16323F)' }}>
                  <div className="preview-hero-content">
                    <div className="cat">{[form.region, form.pais].filter(Boolean).join(', ') || 'Destino'}</div>
                    <h3>{form.titulo || 'Título del vivencial'}</h3>
                  </div>
                </div>
                <div className="preview-body">
                  <div className="stat-mini-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-mini"><div className="v">US$ {Number(form.precio_usd) || 0}</div><div className="l">Seña US$ {Number(form.sena_usd) || 0}</div></div>
                    <div className="stat-mini"><div className="v">{form.cupo_maximo || 0}</div><div className="l">Cupo máximo</div></div>
                    <div className="stat-mini"><div className="v">{form.itinerario.length}</div><div className="l">Días de itinerario</div></div>
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
