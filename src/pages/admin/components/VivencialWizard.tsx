import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import RichTextArea from './RichTextArea'
import ItineraryBuilder from './ItineraryBuilder'
import PuntosSalidaBuilder from './PuntosSalidaBuilder'
import HotelesBuilder from './HotelesBuilder'
import { formatArs, formatNum, formatUsd } from '../format'
import { useCategories } from '@/hooks/useCourses'
import { useUpsertCourse, uploadMedia, slugify, type CourseWrite } from '@/hooks/admin/useAdminCourses'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import {
  PAISES, TIPO_TRASLADO_OPTIONS, REGIMEN_ALIMENTOS_OPTIONS,
  type Course, type ItinerarioDia, type VivencialPuntoSalida, type VivencialHotel,
} from '@/types'

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
  localidades: string[]
  category_id: string
  puntos_salida: VivencialPuntoSalida[]
  fecha_salida: string
  fecha_regreso: string
  cupo_maximo: string
  hoteles: VivencialHotel[]
  tipo_traslado: string[]
  regimen_alimentos: string[]
  thumbnail_url: string | null
  fotos: string[]
  // Desglose de precio (todo en USD; el ARS se deriva con el tipo de cambio).
  base_usd: string
  impuestos_usd: string
  gastos_admin_pct: string
  // Seña: dos campos independientes (ninguno derivado del otro) — Yesica carga la
  // que le sirva en cada moneda; ambas son opcionales, solo de referencia.
  sena_usd: string
  sena_ars: string
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
    localidades: initial?.vivencial_localidades ?? [],
    category_id: initial?.category_id ?? '',
    // Backfill: si el vivencial viejo solo tenía ciudad_salida, la traemos como primer punto.
    // Se asigna un `id` client-side a cada fila para tener key estable en el builder.
    puntos_salida: (initial?.vivencial_puntos_salida?.length
      ? initial.vivencial_puntos_salida.map(p => ({ ...p, id: crypto.randomUUID() }))
      : initial?.vivencial_ciudad_salida
        ? [{ ciudad: initial.vivencial_ciudad_salida, detalle_encuentro: initial.vivencial_punto_encuentro ?? '', id: crypto.randomUUID() }]
        : []),
    fecha_salida: initial?.vivencial_fecha_salida ?? '',
    fecha_regreso: initial?.vivencial_fecha_regreso ?? '',
    cupo_maximo: initial?.vivencial_cupo_maximo != null ? String(initial.vivencial_cupo_maximo) : '15',
    hoteles: (initial?.vivencial_hoteles?.length
      ? initial.vivencial_hoteles.map(h => ({ ...h, id: crypto.randomUUID() }))
      : initial?.vivencial_hotel
        ? [{ nombre: initial.vivencial_hotel, noches: 0, link: '', foto_url: null, id: crypto.randomUUID() }]
        : []),
    tipo_traslado: initial?.vivencial_tipo_traslado ?? [],
    regimen_alimentos: initial?.vivencial_regimen_alimentos ?? [],
    thumbnail_url: initial?.thumbnail_url ?? null,
    fotos: initial?.fotos ?? [],
    base_usd: initial?.vivencial_precio_base_usd != null ? String(initial.vivencial_precio_base_usd) : '',
    impuestos_usd: initial?.vivencial_impuestos_usd != null ? String(initial.vivencial_impuestos_usd) : '',
    gastos_admin_pct: initial?.vivencial_gastos_admin_pct != null ? String(initial.vivencial_gastos_admin_pct) : '',
    sena_usd: initial?.vivencial_precio_seña_usd != null ? String(initial.vivencial_precio_seña_usd) : '',
    sena_ars: initial?.vivencial_precio_seña_ars != null ? String(initial.vivencial_precio_seña_ars) : '',
    whatsapp: initial?.vivencial_whatsapp_url ?? '',
    itinerario: initial?.vivencial_itinerario ?? [],
    incluye: initial?.incluye ?? '',
    no_incluye: initial?.no_incluye ?? '',
  }
}

// Multi-select de chips (traslado / régimen).
function CheckGroup({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="check-grid">
      {options.map(opt => {
        const on = selected.includes(opt)
        return (
          <label key={opt} className={`check-item${on ? ' checked' : ''}`}>
            <input type="checkbox" checked={on} onChange={() => onToggle(opt)} />
            {opt}
          </label>
        )
      })}
    </div>
  )
}

export default function VivencialWizard({ open, onClose, initial, onSaved }: Props) {
  const { data: categories } = useCategories()
  const { data: settings } = useAdminSettings()
  const upsert = useUpsertCourse()
  const fileRef = useRef<HTMLInputElement>(null)
  const [locDraft, setLocDraft] = useState('')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { if (open) { setForm(initialState(initial)); setStep(1); setLocDraft('') } }, [open, initial])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const toggle = (key: 'tipo_traslado' | 'regimen_alimentos', value: string) =>
    setForm(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value] }))
  const tc = settings?.tipo_cambio_usd_ars ?? 1450

  // ── Cálculo del total: base + impuestos + (base+impuestos) * pct/100 ──
  const price = useMemo(() => {
    const baseUsd = Number(form.base_usd) || 0
    const impUsd = Number(form.impuestos_usd) || 0
    const pct = Number(form.gastos_admin_pct) || 0
    const subUsd = baseUsd + impUsd
    const gastosUsd = subUsd * pct / 100
    const totalUsd = subUsd + gastosUsd
    return {
      baseUsd, impUsd, pct, gastosUsd, totalUsd,
      baseArs: baseUsd * tc, impArs: impUsd * tc, gastosArs: gastosUsd * tc, totalArs: totalUsd * tc,
    }
  }, [form.base_usd, form.impuestos_usd, form.gastos_admin_pct, tc])

  // Inputs de moneda con separador de miles: el estado guarda solo dígitos (string),
  // la vista formatea con es-AR ("243.234"). El símbolo va aparte en el prefijo.
  const displayInt = (v: string) => (v ? formatNum(Number(v)) : '')
  const onlyDigits = (raw: string) => raw.replace(/\D/g, '')

  const addLocalidad = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (!form.localidades.some(l => l.toLowerCase() === v.toLowerCase())) set('localidades', [...form.localidades, v])
    setLocDraft('')
  }

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (form.titulo.trim().length < 3) return 'El título es obligatorio.'
      if (!form.fecha_salida || !form.fecha_regreso) return 'Indicá fecha de salida y regreso.'
      if (form.fecha_regreso < form.fecha_salida) return 'La fecha de regreso no puede ser anterior a la de salida.'
      if ((Number(form.cupo_maximo) || 0) <= 0) return 'El cupo debe ser mayor a 0.'
    }
    if (s === 2 && (Number(form.base_usd) || 0) <= 0) return 'El precio base debe ser mayor a 0.'
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
      const round2 = (n: number) => Math.round(n * 100) / 100
      // Se descarta el `id` client-side (key del builder) antes de persistir el JSONB.
      const puntos = form.puntos_salida
        .filter(p => p.ciudad.trim() || p.detalle_encuentro.trim())
        .map(({ ciudad, detalle_encuentro }) => ({ ciudad, detalle_encuentro }))
      const hoteles = form.hoteles
        .filter(h => h.nombre.trim())
        .map(({ nombre, noches, link, foto_url }) => ({ nombre, noches, link, foto_url }))
      const payload: CourseWrite & { id?: string } = {
        id: initial?.id,
        titulo: form.titulo.trim(),
        slug: initial?.slug ?? slugify(form.titulo),
        tipo: 'vivencial',
        tipo_acceso: 'pago',
        category_id: form.category_id || null,
        thumbnail_url: form.thumbnail_url ?? form.fotos[0] ?? null,
        fotos: form.fotos,
        // precio_usd / precio_ars = TOTAL FINAL calculado.
        precio_usd: round2(price.totalUsd),
        precio_ars: Math.round(price.totalArs),
        incluye: form.incluye.trim() || null,
        no_incluye: form.no_incluye.trim() || null,
        vivencial_pais: form.pais || null,
        vivencial_region: form.region || null,
        vivencial_localidades: form.localidades,
        vivencial_puntos_salida: puntos,
        vivencial_hoteles: hoteles,
        vivencial_tipo_traslado: form.tipo_traslado,
        vivencial_regimen_alimentos: form.regimen_alimentos,
        // Legacy: se sigue poblando con la 1ª entrada para no romper lecturas viejas.
        vivencial_ciudad_salida: puntos[0]?.ciudad || null,
        vivencial_hotel: hoteles[0]?.nombre || null,
        vivencial_fecha_salida: form.fecha_salida || null,
        vivencial_fecha_regreso: form.fecha_regreso || null,
        vivencial_cupo_maximo: cupo,
        // On create, available seats start at max; on edit we keep the existing available count.
        vivencial_cupo_disponible: initial ? (initial.vivencial_cupo_disponible ?? cupo) : cupo,
        // Desglose persistido (base + impuestos + gastos admin).
        vivencial_precio_base_usd: round2(price.baseUsd),
        vivencial_precio_base_ars: Math.round(price.baseArs),
        vivencial_impuestos_usd: round2(price.impUsd),
        vivencial_impuestos_ars: Math.round(price.impArs),
        vivencial_gastos_admin_pct: price.pct || 0,
        vivencial_precio_seña_usd: Number(form.sena_usd) || 0,
        vivencial_precio_seña_ars: Number(form.sena_ars) || 0,
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
              <div className="wiz-step-title">Destino y logística</div>
              <div className="wiz-step-sub">Dónde es, desde dónde sale, dónde se duerme y cuándo.</div>
              <div className="field"><label className="f-label">Título del vivencial</label><input className="input" type="text" placeholder="Ej: Fam Trip: Salta y los Valles Calchaquíes" value={form.titulo} onChange={e => set('titulo', e.target.value)} /></div>
              <div className="field-row cols-3">
                <div className="field"><label className="f-label">País</label>
                  <select className="select" value={form.pais} onChange={e => set('pais', e.target.value)}>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field"><label className="f-label">Región / Provincia <span className="opt">(opcional)</span></label><input className="input" type="text" placeholder="Ej: Salta" value={form.region} onChange={e => set('region', e.target.value)} /></div>
                <div className="field"><label className="f-label">Categoría</label>
                  <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                    <option value="">Sin categoría</option>
                    {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Localidades — tags para el filtro público */}
              <div className="field">
                <label className="f-label">Localidades <span className="opt">(alimentan el filtro público)</span></label>
                <div className="tag-input">
                  {form.localidades.map(l => (
                    <span className="tag-pill pos" key={l}>
                      {l}
                      <button onClick={() => set('localidades', form.localidades.filter(x => x !== l))}>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={form.localidades.length ? 'Agregar otra…' : 'Ej: Cusco, Valle Sagrado, Machu Picchu'}
                    value={locDraft}
                    onChange={e => setLocDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLocalidad(locDraft) }
                      else if (e.key === 'Backspace' && !locDraft && form.localidades.length) set('localidades', form.localidades.slice(0, -1))
                    }}
                    onBlur={() => addLocalidad(locDraft)}
                  />
                </div>
                <div className="f-hint">Enter o coma para agregar cada localidad.</div>
              </div>

              {/* Puntos de salida — repetible */}
              <div className="field">
                <label className="f-label">Puntos de salida</label>
                <PuntosSalidaBuilder puntos={form.puntos_salida} onChange={p => set('puntos_salida', p)} />
              </div>

              <div className="field-row cols-3">
                <div className="field"><label className="f-label">Fecha de salida</label><input className="input" type="date" value={form.fecha_salida} onChange={e => set('fecha_salida', e.target.value)} /></div>
                <div className="field"><label className="f-label">Fecha de regreso</label><input className="input" type="date" value={form.fecha_regreso} onChange={e => set('fecha_regreso', e.target.value)} /></div>
                <div className="field"><label className="f-label">Cupo máximo</label><input className="input" type="number" value={form.cupo_maximo} onChange={e => set('cupo_maximo', e.target.value)} /></div>
              </div>

              {/* Hoteles — repetible con foto */}
              <div className="field">
                <label className="f-label">Hoteles / alojamiento</label>
                <HotelesBuilder hoteles={form.hoteles} onChange={h => set('hoteles', h)} courseKey={initial?.slug ?? (slugify(form.titulo) || 'nuevo')} />
              </div>

              {/* Traslado / régimen — multi-select */}
              <div className="field"><label className="f-label">Tipo de traslado <span className="opt">(alimenta el filtro público)</span></label>
                <CheckGroup options={TIPO_TRASLADO_OPTIONS} selected={form.tipo_traslado} onToggle={v => toggle('tipo_traslado', v)} />
              </div>
              <div className="field"><label className="f-label">Régimen de alimentos</label>
                <CheckGroup options={REGIMEN_ALIMENTOS_OPTIONS} selected={form.regimen_alimentos} onToggle={v => toggle('regimen_alimentos', v)} />
              </div>

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
              <div className="wiz-step-title">Precio</div>
              <div className="wiz-step-sub">Cargá base, impuestos y gastos administrativos: el total se calcula solo.</div>
              <div className="field-row cols-3">
                <div className="field"><label className="f-label">Precio base (USD)</label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.base_usd)} onChange={e => set('base_usd', onlyDigits(e.target.value))} /></div></div>
                <div className="field"><label className="f-label">Impuestos (USD) <span className="opt">(monto fijo)</span></label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.impuestos_usd)} onChange={e => set('impuestos_usd', onlyDigits(e.target.value))} /></div></div>
                <div className="field"><label className="f-label">Gastos administrativos</label><div className="input-prefix-wrap"><span className="input-prefix">%</span><input className="input" type="number" step="0.1" value={form.gastos_admin_pct} onChange={e => set('gastos_admin_pct', e.target.value)} /></div></div>
              </div>

              {/* Desglose en vivo */}
              <div className="price-breakdown">
                <div className="pb-total-lbl">Precio</div>
                <div className="pb-total">{formatUsd(price.baseUsd)}</div>
                <div className="pb-total-ars">≈ {formatArs(price.baseArs)} · TC {tc}</div>
                <div className="pb-lines">
                  <div className="pb-line"><span><span className="pb-op">+</span> Impuestos</span><span>{formatUsd(price.impUsd)}</span></div>
                  <div className="pb-line"><span><span className="pb-op">+</span> Gastos administrativos ({price.pct || 0}%)</span><span>{formatUsd(price.gastosUsd)}</span></div>
                </div>
                <div className="pb-final"><span>Total final a pagar</span><span>{formatUsd(price.totalUsd)}</span></div>
                <div className="pb-total-ars" style={{ textAlign: 'right' }}>≈ {formatArs(price.totalArs)}</div>
              </div>

              <div className="field-row cols-2" style={{ marginTop: 18 }}>
                <div className="field"><label className="f-label">Seña sugerida (USD) <span className="opt">(referencia)</span></label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.sena_usd)} onChange={e => set('sena_usd', onlyDigits(e.target.value))} /></div></div>
                <div className="field"><label className="f-label">Seña sugerida (ARS) <span className="opt">(referencia)</span></label><div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.sena_ars)} onChange={e => set('sena_ars', onlyDigits(e.target.value))} /></div></div>
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
              <div className="wiz-step-sub">Texto libre con negrita. Si dejás una sección vacía, no se muestra en la página pública.</div>
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
                    <div className="stat-mini"><div className="v">{formatUsd(price.totalUsd)}</div><div className="l">Total final{(() => { const s = [Number(form.sena_usd) > 0 ? formatUsd(Number(form.sena_usd)) : null, Number(form.sena_ars) > 0 ? formatArs(Number(form.sena_ars)) : null].filter(Boolean).join(' / '); return s ? ` · Seña ${s}` : '' })()}</div></div>
                    <div className="stat-mini"><div className="v">{form.cupo_maximo || 0}</div><div className="l">Cupo máximo</div></div>
                    <div className="stat-mini"><div className="v">{form.puntos_salida.filter(p => p.ciudad.trim()).length}</div><div className="l">Puntos de salida</div></div>
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
