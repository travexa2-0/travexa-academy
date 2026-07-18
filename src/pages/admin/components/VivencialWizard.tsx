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
import {
  PAISES, TIPO_TRASLADO_OPTIONS, REGIMEN_ALIMENTOS_OPTIONS, TIPO_DESTINO_OPTIONS,
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
  tipo_destino: string
  puntos_salida: VivencialPuntoSalida[]
  fecha_salida: string
  fecha_regreso: string
  cupo_maximo: string
  hoteles: VivencialHotel[]
  tipo_traslado: string[]
  regimen_alimentos: string[]
  thumbnail_url: string | null
  fotos: string[]
  // Desglose de precio: USD y ARS se cargan a mano, cada uno independiente
  // (nadie deriva del otro con tipo de cambio). El % de gastos aplica a ambos.
  base_usd: string
  base_ars: string
  impuestos_usd: string
  impuestos_ars: string
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

// Tags por posición del array `fotos` — solo visuales, comunican dónde se usa cada
// una en la página pública. Foto 1 → portada/hero, 2 → fondo de "Qué incluye +
// Alojamiento", 3 → fondo de "Reservá tu lugar". Fotos 4+ no llevan tag (galería).
const FOTO_POS_TAGS = ['PORTADA', 'EXPERIENCIA', 'RESERVA'] as const

function initialState(initial?: Course | null): FormState {
  return {
    titulo: initial?.titulo ?? '',
    pais: initial?.vivencial_pais ?? 'Argentina',
    region: initial?.vivencial_region ?? '',
    localidades: initial?.vivencial_localidades ?? [],
    category_id: initial?.category_id ?? '',
    tipo_destino: initial?.vivencial_tipo_destino ?? '',
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
    base_ars: initial?.vivencial_precio_base_ars != null ? String(initial.vivencial_precio_base_ars) : '',
    impuestos_usd: initial?.vivencial_impuestos_usd != null ? String(initial.vivencial_impuestos_usd) : '',
    impuestos_ars: initial?.vivencial_impuestos_ars != null ? String(initial.vivencial_impuestos_ars) : '',
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

type PriceCalc = {
  pct: number
  baseUsd: number; impUsd: number; gastosUsd: number; totalUsd: number
  baseArs: number; impArs: number; gastosArs: number; totalArs: number
}

// Desglose en vivo, ambas monedas independientes. Reusado en el paso Precio y en
// la preview de Revisión para que muestren exactamente lo mismo.
function PriceBreakdown({ p }: { p: PriceCalc }) {
  return (
    <div className="price-breakdown">
      <div className="pb-total-lbl">Precio base</div>
      <div className="pb-total">{formatUsd(p.baseUsd)}</div>
      <div className="pb-total-ars">{formatArs(p.baseArs)}</div>
      <div className="pb-lines">
        <div className="pb-line"><span><span className="pb-op">+</span> Impuestos</span><span>{formatUsd(p.impUsd)} · {formatArs(p.impArs)}</span></div>
        <div className="pb-line"><span><span className="pb-op">+</span> Gastos administrativos ({p.pct || 0}%)</span><span>{formatUsd(p.gastosUsd)} · {formatArs(p.gastosArs)}</span></div>
      </div>
      <div className="pb-final"><span>Total final a pagar</span><span>{formatUsd(p.totalUsd)}</span></div>
      <div className="pb-total-ars" style={{ textAlign: 'right' }}>{formatArs(p.totalArs)}</div>
    </div>
  )
}

export default function VivencialWizard({ open, onClose, initial, onSaved }: Props) {
  const { data: categories } = useCategories()
  const upsert = useUpsertCourse()
  const fileRef = useRef<HTMLInputElement>(null)
  const [locDraft, setLocDraft] = useState('')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  // Snapshot serializado del estado original, para detectar cambios sin guardar (dirty).
  const originalRef = useRef('')
  // El formulario solo se re-inicializa en la transición cerrado→abierto, nunca en cada
  // render: así ningún dato cargado (fotos incluidas) se pierde al navegar entre pasos ni
  // cuando el padre re-renderiza con una nueva referencia de `initial`.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      const init = initialState(initial)
      setForm(init)
      originalRef.current = JSON.stringify(init)
      setStep(1)
      setLocDraft('')
      setConfirmCancel(false)
    }
    wasOpen.current = open
  }, [open, initial])

  const dirty = useMemo(() => JSON.stringify(form) !== originalRef.current, [form])
  // Cerrar pidiendo confirmación solo si hay cambios sin guardar.
  const requestClose = () => { if (dirty) setConfirmCancel(true); else onClose() }
  const discardAndClose = () => { setConfirmCancel(false); onClose() }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const toggle = (key: 'tipo_traslado' | 'regimen_alimentos', value: string) =>
    setForm(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value] }))
  // ── Total por moneda, cada una desde su propio desglose (no hay conversión) ──
  // total = base + impuestos + (base + impuestos) * pct/100
  const price = useMemo<PriceCalc>(() => {
    const pct = Number(form.gastos_admin_pct) || 0
    const leg = (base: number, imp: number) => {
      const sub = base + imp
      const gastos = sub * pct / 100
      return { base, imp, gastos, total: sub + gastos }
    }
    const usd = leg(Number(form.base_usd) || 0, Number(form.impuestos_usd) || 0)
    const ars = leg(Number(form.base_ars) || 0, Number(form.impuestos_ars) || 0)
    return {
      pct,
      baseUsd: usd.base, impUsd: usd.imp, gastosUsd: usd.gastos, totalUsd: usd.total,
      baseArs: ars.base, impArs: ars.imp, gastosArs: ars.gastos, totalArs: ars.total,
    }
  }, [form.base_usd, form.impuestos_usd, form.base_ars, form.impuestos_ars, form.gastos_admin_pct])

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
    // El precio base se puede cargar en USD, en ARS o en ambas; alcanza con una.
    if (s === 2 && (Number(form.base_usd) || 0) <= 0 && (Number(form.base_ars) || 0) <= 0) return 'Cargá el precio base en al menos una moneda (USD o ARS).'
    return null
  }
  const next = () => { const err = validateStep(step); if (err) { toast.error(err); return } setStep(s => Math.min(STEPS.length, s + 1)) }
  const prev = () => setStep(s => Math.max(1, s - 1))

  // Un paso del stepper es clickeable si TODOS los demás pasos (menos el destino)
  // están completos — justamente se puede estar saltando ahí para completarlo.
  const canJumpTo = (target: number) => STEPS.every((_, i) => i + 1 === target || validateStep(i + 1) === null)

  const onPickFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadMedia(slugify(form.titulo) || 'nuevo', file, 'gallery')
      // La primera foto queda como portada (thumbnail) si aún no hay ninguna.
      setForm(f => ({ ...f, fotos: [...f.fotos, url], thumbnail_url: f.thumbnail_url ?? url }))
      toast.success('Foto subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  // Quita una foto de la galería; si era la portada, promueve la primera restante.
  const removeFoto = (url: string) => setForm(f => {
    const fotos = f.fotos.filter(x => x !== url)
    return { ...f, fotos, thumbnail_url: f.thumbnail_url === url ? (fotos[0] ?? null) : f.thumbnail_url }
  })

  // keepOpen=true → guardado incremental: persiste y rebasea el baseline de cambios
  // sin cerrar el wizard (botón "Guardar cambios"). Sin opción → guarda y cierra.
  const finish = async ({ keepOpen = false }: { keepOpen?: boolean } = {}) => {
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
        // Atmósfera de color de la página pública. Si queda vacío, el público usa 'playa'.
        vivencial_tipo_destino: (form.tipo_destino || null) as CourseWrite['vivencial_tipo_destino'],
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
      if (keepOpen) originalRef.current = JSON.stringify(form) // rebasea el baseline: ya no hay cambios pendientes
      else onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <Overlay open={open} onClose={requestClose}>
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <h2>{initial ? 'Editar vivencial' : 'Nuevo vivencial'}</h2>
            <div className="sub">Se guarda como borrador. Nadie lo ve hasta que vos lo publiques.</div>
          </div>
          <button className="modal-close" onClick={requestClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>

        <div className="route-stepper">
          {STEPS.map((label, i) => {
            const n = i + 1
            const jumpable = n !== step && canJumpTo(n)
            return (
              <div key={label} style={{ display: 'contents' }}>
                <div className={`rs-step${n === step ? ' current' : ''}${n < step ? ' done' : ''}${jumpable ? ' clickable' : ''}`} onClick={jumpable ? () => setStep(n) : undefined}><div className="rs-node">{n}</div><div className="rs-label">{label}</div></div>
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
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">País</label>
                  <select className="select" value={form.pais} onChange={e => set('pais', e.target.value)}>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field"><label className="f-label">Región / Provincia <span className="opt">(opcional)</span></label><input className="input" type="text" placeholder="Ej: Salta" value={form.region} onChange={e => set('region', e.target.value)} /></div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Categoría</label>
                  <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                    <option value="">Sin categoría</option>
                    {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="field"><label className="f-label">Tipo de destino</label>
                  <select className="select" value={form.tipo_destino} onChange={e => set('tipo_destino', e.target.value)}>
                    <option value="">Sin definir (playa)</option>
                    {TIPO_DESTINO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="f-hint">Define la atmósfera de color de la página pública.</div>
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
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = '' }} />
                {form.fotos.length > 0 && (
                  <div className="gallery-grid">
                    {form.fotos.map((url, i) => (
                      <div className="gallery-thumb" key={url}>
                        <img src={url} alt={`Foto ${i + 1}`} loading="lazy" />
                        {FOTO_POS_TAGS[i] && <span className="gallery-cover-badge">{FOTO_POS_TAGS[i]}</span>}
                        <button type="button" className="gallery-thumb-remove" title="Quitar foto" onClick={() => removeFoto(url)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="upload-zone" onClick={() => { if (!uploading) fileRef.current?.click() }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  <div className="u-title">{uploading ? 'Subiendo…' : form.fotos.length ? 'Agregar más fotos' : 'Subir galería'}</div>
                  <div className="u-sub">La 1ª es la portada · la 2ª el fondo de Qué incluye · la 3ª el fondo de Reserva · {form.fotos.length} cargadas</div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wiz-step-panel active">
              <div className="wiz-step-title">Precio</div>
              <div className="wiz-step-sub">Cargá base e impuestos en cada moneda (USD y ARS son independientes, ninguna se convierte de la otra) y el % de gastos: el total se calcula solo en las dos.</div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Precio base (USD)</label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.base_usd)} onChange={e => set('base_usd', onlyDigits(e.target.value))} /></div></div>
                <div className="field"><label className="f-label">Precio base (ARS)</label><div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.base_ars)} onChange={e => set('base_ars', onlyDigits(e.target.value))} /></div></div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Impuestos (USD) <span className="opt">(monto fijo)</span></label><div className="input-prefix-wrap"><span className="input-prefix">US$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.impuestos_usd)} onChange={e => set('impuestos_usd', onlyDigits(e.target.value))} /></div></div>
                <div className="field"><label className="f-label">Impuestos (ARS) <span className="opt">(monto fijo)</span></label><div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="text" inputMode="numeric" value={displayInt(form.impuestos_ars)} onChange={e => set('impuestos_ars', onlyDigits(e.target.value))} /></div></div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label className="f-label">Gastos administrativos</label><div className="input-prefix-wrap"><span className="input-prefix">%</span><input className="input" type="number" step="0.1" value={form.gastos_admin_pct} onChange={e => set('gastos_admin_pct', e.target.value)} /></div></div>
                <div className="field" />
              </div>

              {/* Desglose en vivo — ambas monedas, independientes */}
              <PriceBreakdown p={price} />

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
              <ItineraryBuilder days={form.itinerario} onChange={d => set('itinerario', d)} courseKey={initial?.slug ?? (slugify(form.titulo) || 'nuevo')} />
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
                  <div className="stat-mini-grid" style={{ marginBottom: 14 }}>
                    <div className="stat-mini"><div className="v">{formatArs(price.totalArs)}</div><div className="l">Total final (ARS){(() => { const s = Number(form.sena_ars) > 0 ? formatArs(Number(form.sena_ars)) : null; return s ? ` · Seña ${s}` : '' })()}</div></div>
                    <div className="stat-mini"><div className="v">{form.cupo_maximo || 0}</div><div className="l">Cupo máximo</div></div>
                    <div className="stat-mini"><div className="v">{form.puntos_salida.filter(p => p.ciudad.trim()).length}</div><div className="l">Puntos de salida</div></div>
                  </div>
                  <PriceBreakdown p={price} />
                </div>
              </div>

              {/* Resumen del contenido nuevo que alimenta la página pública. */}
              <div className="stat-mini-grid" style={{ marginTop: 14 }}>
                <div className="stat-mini">
                  <div className="v">{TIPO_DESTINO_OPTIONS.find(t => t.value === form.tipo_destino)?.label ?? 'Playa'}</div>
                  <div className="l">Tipo de destino{form.tipo_destino ? '' : ' (por defecto)'}</div>
                </div>
                <div className="stat-mini">
                  <div className="v">{form.fotos.length}</div>
                  <div className="l">
                    {form.fotos.length
                      ? `Fotos · ${FOTO_POS_TAGS.slice(0, form.fotos.length).join(', ')}${form.fotos.length > FOTO_POS_TAGS.length ? ` +${form.fotos.length - FOTO_POS_TAGS.length} galería` : ''}`
                      : 'Fotos del destino'}
                  </div>
                </div>
                <div className="stat-mini">
                  {(() => {
                    const conFoto = form.itinerario
                      .map((d, i) => (d.foto_url ? i + 1 : null))
                      .filter((n): n is number => n != null)
                    return (
                      <>
                        <div className="v">{conFoto.length}/{form.itinerario.length}</div>
                        <div className="l">{conFoto.length ? `Días con foto: ${conFoto.join(', ')}` : 'Días con foto'}</div>
                      </>
                    )
                  })()}
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
          {/* Cancelar (destructivo) al extremo izquierdo; navegación de pasos agrupada a la derecha. */}
          <button className="btn btn-destructive" onClick={requestClose}>Cancelar</button>
          <div style={{ display: 'flex', gap: 10 }}>
            {initial && step < STEPS.length && (
              <button className="btn btn-secondary" onClick={() => finish({ keepOpen: true })} disabled={saving || !dirty} title={dirty ? 'Guardar los cambios ya hechos' : 'No hay cambios sin guardar'}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
            <button className="btn btn-ghost" onClick={prev} style={{ visibility: step === 1 ? 'hidden' : 'visible' }}>← Atrás</button>
            {step < STEPS.length
              ? <button className="btn btn-primary" onClick={next}>Siguiente<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg></button>
              : <button className="btn btn-primary" onClick={() => finish()} disabled={saving || (!!initial && !dirty)}>{saving ? 'Guardando…' : (initial ? 'Guardar cambios' : 'Guardar borrador')}</button>}
          </div>
        </div>

        {confirmCancel && (
          <div className="wiz-confirm-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setConfirmCancel(false) }}>
            <div className="wiz-confirm-card" role="dialog" aria-modal="true">
              <h3>¿Seguro que querés cancelar?</h3>
              <p>Se perderán los cambios no guardados de este vivencial.</p>
              <div className="wiz-confirm-actions">
                <button className="btn btn-secondary" onClick={() => setConfirmCancel(false)}>Volver al editor</button>
                <button className="btn btn-destructive" onClick={discardAndClose}>Sí, descartar cambios</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  )
}
