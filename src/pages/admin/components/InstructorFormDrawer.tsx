import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { uploadMedia, slugify } from '@/hooks/admin/useAdminCourses'
import { useUpsertInstructor, findProfileByEmail, type InstructorInput } from '@/hooks/admin/useAdminInstructorsFull'
import type { Instructor } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Instructor | null
}

interface FormState {
  nombre: string
  especialidad: string
  bio: string
  avatar_url: string | null
  whatsapp: string
  instagram: string
  tiktok: string
  web: string
  revenue_share_pct: string
  email: string
  telefono: string
  activo: boolean
  user_id: string | null
  linkEmail: string
}

function initialState(initial?: Instructor | null): FormState {
  const redes = initial?.redes ?? {}
  return {
    nombre: initial?.nombre ?? '',
    especialidad: initial?.especialidad ?? '',
    bio: initial?.bio ?? '',
    avatar_url: initial?.avatar_url ?? null,
    whatsapp: redes.whatsapp ?? '',
    instagram: redes.instagram ?? '',
    tiktok: redes.tiktok ?? '',
    web: redes.web ?? '',
    revenue_share_pct: initial?.revenue_share_pct != null ? String(initial.revenue_share_pct) : '0',
    email: initial?.email ?? '',
    telefono: initial?.telefono ?? '',
    activo: initial?.activo ?? true,
    user_id: initial?.user_id ?? null,
    linkEmail: '',
  }
}

export default function InstructorFormDrawer({ open, onClose, initial }: Props) {
  const upsert = useUpsertInstructor()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [uploading, setUploading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setForm(initialState(initial)) }, [open, initial])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const onPickFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await uploadMedia(`instructor-${slugify(form.nombre) || 'nuevo'}`, file, 'thumbnail')
      set('avatar_url', url)
      toast.success('Avatar subido')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  const linkUser = async () => {
    setLinking(true)
    try {
      const p = await findProfileByEmail(form.linkEmail)
      if (!p) { toast.error('No hay ningún usuario con ese email.'); return }
      set('user_id', p.id)
      toast.success(`Vinculado a ${[p.nombre, p.apellido].filter(Boolean).join(' ') || form.linkEmail}`)
    } catch (e) { toast.error((e as Error).message) }
    finally { setLinking(false) }
  }

  const save = async () => {
    if (form.nombre.trim().length < 2) { toast.error('El nombre es obligatorio.'); return }
    const redes: Record<string, string> = {}
    if (form.whatsapp.trim()) redes.whatsapp = form.whatsapp.trim()
    if (form.instagram.trim()) redes.instagram = form.instagram.trim()
    if (form.tiktok.trim()) redes.tiktok = form.tiktok.trim()
    if (form.web.trim()) redes.web = form.web.trim()

    const payload: InstructorInput = {
      id: initial?.id,
      nombre: form.nombre.trim(),
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url,
      especialidad: form.especialidad.trim() || null,
      redes,
      revenue_share_pct: Number(form.revenue_share_pct) || 0,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      activo: form.activo,
      user_id: form.user_id,
    }
    setSaving(true)
    try {
      await upsert.mutateAsync(payload)
      toast.success(initial ? 'Instructor actualizado' : 'Instructor creado')
      onClose()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-narrow" style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <div><h2 style={{ fontSize: '1.05rem' }}>{initial ? 'Editar instructor' : 'Nuevo instructor'}</h2><div className="sub">Puede tener cuenta en la plataforma o ser un aliado externo.</div></div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="modal-body">
          <div className="field-row cols-2">
            <div className="field">
              <label className="f-label">Avatar</label>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f) }} />
              <div className="upload-zone" onClick={() => fileRef.current?.click()} style={form.avatar_url ? { backgroundImage: `url('${form.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 110 } : { minHeight: 110 }}>
                {!form.avatar_url && <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                  <div className="u-title">{uploading ? 'Subiendo…' : 'Subir foto'}</div>
                </>}
              </div>
            </div>
            <div className="field">
              <label className="f-label">Nombre</label>
              <input className="input" type="text" placeholder="Nombre y apellido" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              <label className="f-label" style={{ marginTop: 12 }}>Especialidad</label>
              <input className="input" type="text" placeholder="Ej: Cruceros, Marketing de agencias" value={form.especialidad} onChange={e => set('especialidad', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="f-label">Bio</label>
            <textarea className="textarea" style={{ minHeight: 60 }} placeholder="Breve reseña que se muestra en el sitio público" value={form.bio} onChange={e => set('bio', e.target.value)} />
          </div>
          <div className="field-row cols-2">
            <div className="field"><label className="f-label">Email</label><input className="input" type="email" placeholder="contacto@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="field"><label className="f-label">Teléfono</label><input className="input" type="text" placeholder="+54 9 11…" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
          </div>
          <div className="field-row cols-2">
            <div className="field"><label className="f-label">WhatsApp</label><input className="input" type="text" placeholder="+54 9 11… o wa.me/…" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></div>
            <div className="field"><label className="f-label">Instagram</label><input className="input" type="text" placeholder="@usuario o URL" value={form.instagram} onChange={e => set('instagram', e.target.value)} /></div>
          </div>
          <div className="field-row cols-2">
            <div className="field"><label className="f-label">TikTok</label><input className="input" type="text" placeholder="@usuario o URL" value={form.tiktok} onChange={e => set('tiktok', e.target.value)} /></div>
            <div className="field"><label className="f-label">Web</label><input className="input" type="text" placeholder="https://" value={form.web} onChange={e => set('web', e.target.value)} /></div>
          </div>
          <div className="field-row cols-2">
            <div className="field">
              <label className="f-label">Revenue share (%)</label>
              <div className="input-prefix-wrap"><span className="input-prefix">%</span><input className="input" type="number" value={form.revenue_share_pct} onChange={e => set('revenue_share_pct', e.target.value)} /></div>
              <div className="f-hint">Porcentaje del bruto que le corresponde por cada venta de sus cursos.</div>
            </div>
            <div className="field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--line)', margin: 0 }}>
                <div><label className="f-label" style={{ margin: 0 }}>Activo</label><div className="f-hint" style={{ marginTop: 2 }}>Si está inactivo se oculta del catálogo público</div></div>
                <span className="switch"><input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} /><span className="track" /><span className="thumb" /></span>
              </div>
            </div>
          </div>
          <div className="field" style={{ padding: 14, border: '1px dashed var(--line-strong)', borderRadius: 12 }}>
            <label className="f-label">Vincular a un usuario <span className="opt">— opcional</span></label>
            {form.user_id ? (
              <div className="row-flex" style={{ fontSize: 12.6, color: 'var(--teal-deep)' }}>
                <span>✓ Vinculado a una cuenta de la plataforma</span>
                <button className="btn btn-ghost btn-sm" onClick={() => set('user_id', null)}>Desvincular</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="email" placeholder="Email del usuario en Academy" value={form.linkEmail} onChange={e => set('linkEmail', e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={linkUser} disabled={linking || !form.linkEmail.trim()}>{linking ? 'Buscando…' : 'Vincular'}</button>
              </div>
            )}
            <div className="f-hint">Para instructores que además tienen cuenta de alumno/vendedor. Si no, dejalo sin vincular.</div>
          </div>
        </div>
        <div className="modal-foot">
          <span />
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : (initial ? 'Guardar cambios' : 'Crear instructor')}</button>
        </div>
      </div>
    </Overlay>
  )
}
