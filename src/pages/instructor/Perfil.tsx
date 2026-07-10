import { useEffect, useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useUpdateInstructorProfile, uploadInstructorAvatar } from '@/hooks/instructor/useInstructorProfile'
import type { InstructorRedes } from '@/types'

interface FormState {
  bio: string
  especialidad: string
  avatar_url: string | null
  instagram: string
  tiktok: string
  web: string
  whatsapp: string
}

export default function InstructorPerfil() {
  const { user } = useAuth()
  const { instructor, isLoading } = useInstructorSelf()
  const update = useUpdateInstructorProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState<FormState>({
    bio: '', especialidad: '', avatar_url: null,
    instagram: '', tiktok: '', web: '', whatsapp: '',
  })

  useEffect(() => {
    if (!instructor) return
    const redes = instructor.redes ?? {}
    setForm({
      bio: instructor.bio ?? '',
      especialidad: instructor.especialidad ?? '',
      avatar_url: instructor.avatar_url,
      instagram: redes.instagram ?? '',
      tiktok: redes.tiktok ?? '',
      web: redes.web ?? '',
      whatsapp: redes.whatsapp ?? '',
    })
  }, [instructor])

  if (isLoading || !instructor || !user) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  const onAvatar = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadInstructorAvatar(user.id, file)
      setForm(f => ({ ...f, avatar_url: url }))
      toast.success('Foto subida. Acordate de guardar.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const guardar = () => {
    // Solo se mandan las claves con valor, igual que en el form del admin.
    const redes: InstructorRedes = {}
    if (form.instagram.trim()) redes.instagram = form.instagram.trim()
    if (form.tiktok.trim()) redes.tiktok = form.tiktok.trim()
    if (form.web.trim()) redes.web = form.web.trim()
    if (form.whatsapp.trim()) redes.whatsapp = form.whatsapp.trim()

    update.mutate(
      {
        instructorId: instructor.id,
        bio: form.bio.trim() || null,
        especialidad: form.especialidad.trim() || null,
        avatar_url: form.avatar_url,
        redes,
      },
      {
        onSuccess: () => toast.success('Perfil actualizado'),
        onError: e => toast.error(e instanceof Error ? e.message : 'Error al guardar'),
      },
    )
  }

  const initials = instructor.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Cuenta</div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-sub">Así te ven los alumnos en la ficha de tus cursos.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row-flex" style={{ gap: 16 }}>
          <div
            className="tbl-avatar"
            style={{
              width: 72, height: 72, fontSize: 20, flexShrink: 0,
              ...(form.avatar_url ? { backgroundImage: `url('${form.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
            }}
          >
            {!form.avatar_url && initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{instructor.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 10 }}>
              Tu nombre y tu revenue share los administra Travexa.
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Cambiar foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => { void onAvatar(e.target.files?.[0]); e.target.value = '' }}
            />
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="field">
          <label className="f-label" htmlFor="especialidad">Especialidad</label>
          <input
            id="especialidad"
            className="input"
            type="text"
            placeholder="Ej. Operatoria turística, ventas corporativas…"
            value={form.especialidad}
            onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
          />
        </div>

        <div className="field">
          <label className="f-label" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="textarea"
            rows={5}
            placeholder="Contales a los alumnos quién sos y por qué te van a querer escuchar."
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          />
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 12 }}>Redes</h3>
        <div className="field-row">
          <div className="field">
            <label className="f-label" htmlFor="instagram">Instagram</label>
            <input id="instagram" className="input" type="text" placeholder="@usuario" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
          </div>
          <div className="field">
            <label className="f-label" htmlFor="tiktok">TikTok</label>
            <input id="tiktok" className="input" type="text" placeholder="@usuario" value={form.tiktok} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label className="f-label" htmlFor="web">Web</label>
            <input id="web" className="input" type="url" placeholder="https://…" value={form.web} onChange={e => setForm(f => ({ ...f, web: e.target.value }))} />
          </div>
          <div className="field">
            <label className="f-label" htmlFor="whatsapp">WhatsApp</label>
            <input id="whatsapp" className="input" type="text" placeholder="+54 9 11 …" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={guardar} disabled={update.isPending}>
        {update.isPending ? <Loader2 className="animate-spin" /> : null} Guardar cambios
      </button>
    </div>
  )
}
