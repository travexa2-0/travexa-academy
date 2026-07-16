import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { WhatsappShareButton } from 'react-share'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Copy, Check, Lock, Plane, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademyProfile } from '@/hooks/useProfile'
import { useProfilesRow } from '@/hooks/useProfilePage'
import { supabase } from '@/lib/supabase'
import { TIPO_VENDEDOR_OPCIONES, EXPERIENCIA_OPCIONES, GENERO_OPCIONES } from '@/lib/taxonomy'

// El tipo generado no cubre todas las columnas nuevas; seguimos el patrón del proyecto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1]
const panelVariants = {
  hidden:  { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -28 },
}

const STEP_ARIA = [
  'Paso 1 de 3: Bienvenida y datos básicos',
  'Paso 2 de 3: Tu actividad como asesor',
  'Paso 3 de 3: Tu código de referido',
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const shouldReduce = useReducedMotion()

  const { data: academyProfile } = useAcademyProfile(user?.id)
  const { data: profilesRow } = useProfilesRow(user?.id)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)

  // Step 1
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState('')

  // Step 2
  const [ciudad, setCiudad] = useState('')
  const [tipoVendedor, setTipoVendedor] = useState('')
  const [anosExperiencia, setAnosExperiencia] = useState('')
  const [destinos, setDestinos] = useState('')

  // Step 3
  const [refCode, setRefCode] = useState<string | null>(null)
  const [codeLoading, setCodeLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // ── Prefill + resume from DB (once) ──────────────────────────────
  useEffect(() => {
    if (hydrated.current) return
    if (!academyProfile || !profilesRow) return
    hydrated.current = true

    const tel = profilesRow.telefono ?? ''
    const doc = academyProfile.dni ?? ''
    const nac = academyProfile.fecha_nacimiento ?? ''
    const gen = academyProfile.genero ?? ''
    const ciu = academyProfile.ciudad ?? ''
    const tv  = academyProfile.tipo_vendedor ?? ''
    const exp = academyProfile.anos_experiencia ?? ''
    const dest = (academyProfile.destinos_principales ?? []).join(', ')

    setTelefono(tel)
    setDni(doc)
    setFechaNacimiento(nac)
    setGenero(gen)
    setCiudad(ciu)
    setTipoVendedor(tv)
    setAnosExperiencia(exp)
    setDestinos(dest)
    setRefCode(academyProfile.referral_code ?? null)

    // Resume at the first step with missing data
    if (!tel || !doc || !nac) setStep(1)
    else if (!ciu || !tv || !exp) setStep(2)
    else setStep(3)
  }, [academyProfile, profilesRow])

  // ── Ensure a referral code exists when reaching step 3 ───────────
  useEffect(() => {
    if (step !== 3 || !user) return
    let active = true
    setCodeLoading(true)
    const ensure = async () => {
      let code = refCode ?? academyProfile?.referral_code ?? null
      if (!code) {
        code = Math.random().toString(36).slice(2, 10)
        await db().from('academy_profiles').update({ referral_code: code }).eq('user_id', user.id)
        void qc.invalidateQueries({ queryKey: ['academy-profile', user.id] })
      }
      if (!active) return
      setRefCode(code)
      // Brief shimmer for polish (matches prototype), then reveal
      setTimeout(() => { if (active) setCodeLoading(false) }, 500)
    }
    void ensure()
    return () => { active = false }
  }, [step, user, refCode, academyProfile?.referral_code, qc])

  const step1Valid = telefono.trim() !== '' && dni.trim() !== '' && fechaNacimiento.trim() !== ''
  const step2Valid = ciudad.trim() !== '' && tipoVendedor.trim() !== '' && anosExperiencia.trim() !== ''

  const fillPct = useMemo(() => ((step - 1) / 2) * 100, [step])

  // ── Persistence per step ─────────────────────────────────────────
  const saveStep1 = async () => {
    if (!user) return
    setSaving(true)
    try {
      // TODO: validar formato del teléfono con libphonenumber-js
      const { error: e1 } = await db().from('profiles').update({ telefono: telefono.trim() }).eq('id', user.id)
      if (e1) throw new Error(e1.message)
      const { error: e2 } = await db().from('academy_profiles').update({
        dni: dni.trim() || null,
        fecha_nacimiento: fechaNacimiento || null,
        genero: genero || null,
      }).eq('user_id', user.id)
      if (e2) throw new Error(e2.message)
      void qc.invalidateQueries({ queryKey: ['academy-profile', user.id] })
      void qc.invalidateQueries({ queryKey: ['profiles-row', user.id] })
      setStep(2)
    } catch (err) {
      toast.error('No pudimos guardar tus datos. Intentá de nuevo.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const saveStep2 = async () => {
    if (!user) return
    setSaving(true)
    try {
      const destinosArr = destinos.split(',').map(d => d.trim()).filter(Boolean)
      const { error } = await db().from('academy_profiles').update({
        ciudad: ciudad.trim(),
        tipo_vendedor: tipoVendedor,
        anos_experiencia: anosExperiencia,
        destinos_principales: destinosArr,
      }).eq('user_id', user.id)
      if (error) throw new Error(error.message)
      void qc.invalidateQueries({ queryKey: ['academy-profile', user.id] })

      // Perfil con datos mínimos completos → +50 XP / +50 Créditos (idempotente).
      void supabase.functions.invoke('award-points', {
        body: { userId: user.id, accion: 'perfil_completado', referenciaId: user.id },
      })

      setStep(3)
    } catch (err) {
      toast.error('No pudimos guardar tu actividad. Intentá de nuevo.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const finish = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await db().from('academy_profiles')
        .update({ onboarding_completo: true })
        .eq('user_id', user.id)
      if (error) throw new Error(error.message)
      // Optimista: los gates (OnboardingGate/ProtectedRoute) leen esta query.
      // Con staleTime de 2min no se refetchea al navegar, así que done=true
      // persiste y la home no rebota a /onboarding. NO invalidamos acá a
      // propósito: forzar el refetch podía devolver done=false por lag de la
      // DB y dejaba el botón colgado en un ping-pong /onboarding ↔ home.
      qc.setQueryData(['academy-profile', user.id], (old: unknown) =>
        old && typeof old === 'object' ? { ...(old as object), onboarding_completo: true } : old)

      if (!shouldReduce) {
        void confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#4ECDB8', '#C99A3A', '#F5F3EC', '#0E6B5C'],
        })
      }
      // A la pantalla principal (home) ya logueado. Navegación directa: sin el
      // setTimeout ni el await del refetch, que dejaban el botón colgado.
      navigate('/', { replace: true })
    } catch (err) {
      toast.error('No pudimos finalizar el onboarding. Intentá de nuevo.')
      console.error(err)
      setSaving(false)
    }
  }

  const copyCode = () => {
    if (!refCode) return
    navigator.clipboard?.writeText(refCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // ── Guard anti-loop (bug mobile) ─────────────────────────────────
  // Si el onboarding ya está completo en la DB, esta pantalla no tiene nada
  // que hacer: fuera a la home. Esto hace IMPOSIBLE, sin depender de ningún
  // timing, que alguien que ya terminó vea de nuevo el formulario desde el
  // paso 1 — pasaba en mobile al volver a /onboarding por gesto "atrás" o
  // por el back/forward cache del navegador (OnboardingGate exime /onboarding
  // de su redirect, así que la única defensa correcta es esta, acá adentro).
  // Lee la misma query que escribe finish() de forma optimista, con lo cual
  // el rebote se corta apenas termina, aún antes de que la DB confirme.
  if (academyProfile?.onboarding_completo === true) {
    return <Navigate to="/" replace />
  }

  const shareUrl = refCode ? `${window.location.origin}/registro?ref=${refCode}` : window.location.origin
  const shareText = refCode
    ? `Sumate a Travexa Academy con mi código ${refCode} y arrancás con Créditos de bienvenida 🪙`
    : 'Sumate a Travexa Academy 🪙'

  return (
    <div className="ob-root">
      <style>{OB_CSS}</style>

      {/* aria-live: anuncia el paso actual */}
      <div aria-live="polite" className="ob-sr-only">{STEP_ARIA[step - 1]}</div>

      <div className="ob-shell">
        <div className="ob-brand">
          <span className="ob-brand-dot" />
          <span className="ob-brand-word">TRAVEXA</span>
          <span className="ob-brand-sep">/</span>
          <span className="ob-brand-sub">Academy</span>
        </div>

        {/* Stepper — ruta de vuelo */}
        <div className="ob-stepper">
          <div className="ob-stepper-track">
            <div className="ob-stepper-line" />
            <div className="ob-stepper-fill" style={{ width: `calc((100% - 32px) * ${fillPct / 100})` }} />
            <div
              className="ob-stepper-plane"
              style={{ left: `calc(16px + (100% - 32px) * ${fillPct / 100})` }}
            >
              <Plane />
            </div>
            {[
              { n: 1, label: 'Vos' },
              { n: 2, label: 'Tu trabajo' },
              { n: 3, label: 'Tu código' },
            ].map(node => {
              const state = node.n < step ? 'done' : node.n === step ? 'active' : 'pending'
              return (
                <div className="ob-step-node" data-state={state} key={node.n}>
                  <div className="ob-step-circle">{state === 'done' ? <Check size={14} /> : node.n}</div>
                  <div className="ob-step-label">{node.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ob-card">
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="s1"
                variants={shouldReduce ? undefined : panelVariants}
                initial="hidden" animate="visible" exit="exit"
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="ob-eyebrow">Paso 1 de 3</div>
                <h1 className="ob-title">¡Bienvenida/o a Travexa Academy!</h1>
                <p className="ob-sub">Completá tu perfil para aparecer primero en el ranking y que te reconozcamos como asesor.</p>

                <div className="ob-row-2">
                  <div className="ob-field">
                    <label htmlFor="f-tel">Teléfono / WhatsApp</label>
                    <input id="f-tel" type="tel" placeholder="+54 9 11 1234-5678"
                      value={telefono} onChange={e => setTelefono(e.target.value)} required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="f-dni">DNI</label>
                    <input id="f-dni" type="text" inputMode="numeric" placeholder="30.123.456"
                      value={dni} onChange={e => setDni(e.target.value)} required />
                  </div>
                </div>
                <div className="ob-row-2">
                  <div className="ob-field">
                    <label htmlFor="f-nac">Fecha de nacimiento</label>
                    <input id="f-nac" type="date"
                      value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="f-gen">Género</label>
                    <select id="f-gen" value={genero} onChange={e => setGenero(e.target.value)}>
                      <option value="">Elegí una opción</option>
                      {GENERO_OPCIONES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="ob-privacy-note">
                  <Lock size={13} />
                  <span>Estos datos son privados. Los usamos para personalizar tu experiencia, nunca los compartimos con operadores ni terceros.</span>
                </div>

                <div className="ob-nav">
                  <span className="ob-btn-back ob-hidden">Atrás</span>
                  <button className="ob-btn-primary" disabled={!step1Valid || saving} onClick={() => void saveStep1()}>
                    Siguiente <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="s2"
                variants={shouldReduce ? undefined : panelVariants}
                initial="hidden" animate="visible" exit="exit"
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="ob-eyebrow">Paso 2 de 3</div>
                <h1 className="ob-title">Contanos cómo trabajás</h1>
                <p className="ob-sub">Así te mostramos operadores, catálogo y contenido de Academy relevante para vos.</p>

                <div className="ob-field">
                  <label htmlFor="f-ciudad">Ciudad donde vivís</label>
                  <input id="f-ciudad" type="text" placeholder="Quilmes"
                    value={ciudad} onChange={e => setCiudad(e.target.value)} required />
                </div>
                <div className="ob-field">
                  <label htmlFor="f-tipo">Tipo de vendedor</label>
                  <select id="f-tipo" value={tipoVendedor} onChange={e => setTipoVendedor(e.target.value)} required>
                    <option value="">Elegí una opción</option>
                    {TIPO_VENDEDOR_OPCIONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="ob-field">
                  <label htmlFor="f-exp">Años de experiencia</label>
                  <select id="f-exp" value={anosExperiencia} onChange={e => setAnosExperiencia(e.target.value)} required>
                    <option value="">Elegí una opción</option>
                    {EXPERIENCIA_OPCIONES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </select>
                </div>
                <div className="ob-field">
                  <label htmlFor="f-dest">Destinos que vendés</label>
                  <input id="f-dest" type="text" placeholder="Ej: Caribe, Europa, Perú"
                    value={destinos} onChange={e => setDestinos(e.target.value)} />
                  <div className="ob-field-hint">Separados por coma. Podés cambiarlos después.</div>
                </div>

                <div className="ob-nav">
                  <button className="ob-btn-back" onClick={() => setStep(1)}>
                    <ArrowLeft size={14} /> Atrás
                  </button>
                  <button className="ob-btn-primary" disabled={!step2Valid || saving} onClick={() => void saveStep2()}>
                    Siguiente <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div
                key="s3"
                variants={shouldReduce ? undefined : panelVariants}
                initial="hidden" animate="visible" exit="exit"
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="ob-eyebrow">Paso 3 de 3</div>
                <h1 className="ob-title">Tu código de referido</h1>
                <p className="ob-sub">Compartilo con otros asesores. Cuando se registren con tu código, ambos suman Créditos.</p>

                <div className="ob-bpass">
                  <div className="ob-bpass-main">
                    <div className="ob-bpass-eyebrow"><Plane size={12} /> Pase de embarque</div>
                    <div className={`ob-bpass-code${codeLoading ? ' loading' : ''}`}>
                      {codeLoading ? 'CARGANDO' : refCode}
                    </div>
                    <div className="ob-bpass-caption">Es tuyo, único e intransferible.</div>
                  </div>
                  <div className="ob-bpass-divider" />
                  <div className="ob-bpass-stub">
                    <button className="ob-copy-btn" aria-label="Copiar código" onClick={copyCode} disabled={codeLoading}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <span className={`ob-copy-caption${copied ? ' copied' : ''}`}>{copied ? 'Copiado ✓' : 'Copiar'}</span>
                  </div>
                </div>

                <div className="ob-reward-note">
                  <Clock size={16} />
                  <span><strong>Vos ganás +20 Créditos</strong> y quien se registre con tu código arranca con <strong>+50 Créditos</strong> de bienvenida.</span>
                </div>

                <WhatsappShareButton url={shareUrl} title={shareText} separator=" — " className="ob-btn-whatsapp">
                  <WhatsAppGlyph /> Compartir por WhatsApp
                </WhatsappShareButton>

                <div className="ob-finish-wrap">
                  <button className="ob-btn-primary ob-btn-full" disabled={saving} onClick={() => void finish()}>
                    Ir al inicio <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.05c-.24.67-1.4 1.29-1.93 1.36-.53.08-1.02.31-3.44-.72-2.9-1.24-4.76-4.17-4.9-4.36-.14-.19-1.17-1.56-1.17-2.98s.73-2.11 1-2.4c.24-.27.53-.34.71-.34h.51c.16 0 .38-.03.59.45.24.55.79 1.9.86 2.04.07.14.11.31.02.5-.32.65-.65.9-.9 1.18-.14.15-.29.31-.13.6.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.29.14.46.12.63-.07.24-.27.53-.71.83-1.13.21-.29.47-.33.79-.2.32.13 2.03.96 2.38 1.13.35.17.58.26.66.4.09.16.09.9-.15 1.63Z" />
    </svg>
  )
}

const OB_CSS = `
.ob-root{
  --ob-line:rgba(245,243,236,0.08);
  --ob-line-strong:rgba(245,243,236,0.14);
  --ob-bg3:#162F3E; --ob-bg3-hover:#1B3849;
  --ob-gold-soft:rgba(201,154,58,0.10);
  --ob-ease:cubic-bezier(0.23,1,0.32,1);
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:32px 20px 48px; position:relative; overflow-x:hidden;
  background:var(--bg); color:var(--text-1); font-family:var(--font-body);
}
.ob-root::before{
  content:''; position:fixed; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 640px 420px at 12% -6%, rgba(78,205,184,0.14), transparent 60%),
    radial-gradient(ellipse 560px 420px at 100% 100%, rgba(201,154,58,0.08), transparent 55%);
}
.ob-sr-only{position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0;}
.ob-shell{position:relative; z-index:1; width:100%; max-width:460px; display:flex; flex-direction:column; gap:26px;}

.ob-brand{display:flex; align-items:center; gap:9px;}
.ob-brand-dot{width:7px; height:7px; border-radius:50%; background:var(--gold); box-shadow:0 0 0 4px rgba(201,154,58,0.16);}
.ob-brand-word{font-family:var(--font-display); font-weight:700; font-size:15px; letter-spacing:0.02em;}
.ob-brand-sep{color:var(--text-3); font-size:13px;}
.ob-brand-sub{font-family:var(--font-mono); font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--primary-l);}

.ob-stepper{position:relative; padding:0 6px;}
.ob-stepper-track{position:relative; display:flex; justify-content:space-between; align-items:center;}
.ob-stepper-line{
  position:absolute; top:16px; left:16px; right:16px; height:1px;
  background-image:linear-gradient(90deg, var(--ob-line-strong) 0, var(--ob-line-strong) 6px, transparent 6px, transparent 12px);
  background-size:12px 1px;
}
.ob-stepper-fill{position:absolute; top:16px; left:16px; height:1px; background:var(--primary-l); transition:width .5s var(--ob-ease);}
.ob-stepper-plane{position:absolute; top:16px; width:15px; height:15px; transform:translate(-50%,-50%) rotate(90deg); color:var(--gold); transition:left .5s var(--ob-ease); z-index:2;}
.ob-stepper-plane svg{width:100%; height:100%;}
.ob-step-node{position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:8px;}
.ob-step-circle{
  width:32px; height:32px; border-radius:50%; background:var(--bg-2, #0F2C3B);
  border:1px solid var(--ob-line-strong); display:flex; align-items:center; justify-content:center;
  font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--text-3);
  transition:all .35s var(--ob-ease);
}
.ob-step-node[data-state="active"] .ob-step-circle{background:var(--primary); border-color:var(--primary); color:var(--text-1); box-shadow:0 0 0 4px rgba(14,107,92,0.22);}
.ob-step-node[data-state="done"] .ob-step-circle{background:var(--bg-2, #0F2C3B); border-color:var(--primary-l); color:var(--primary-l);}
.ob-step-label{font-family:var(--font-mono); font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:var(--text-3); text-align:center; max-width:76px; line-height:1.3; transition:color .3s;}
.ob-step-node[data-state="active"] .ob-step-label{color:var(--text-1);}

.ob-card{
  background:var(--bg-2, #0F2C3B); border:1px solid var(--ob-line); border-radius:20px;
  padding:30px 26px 26px; box-shadow:0 2px 4px rgba(0,0,0,0.12), 0 24px 48px -20px rgba(0,0,0,0.5);
  position:relative; overflow:hidden;
}

.ob-eyebrow{font-family:var(--font-mono); font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--primary-l);}
.ob-title{font-family:var(--font-display); font-weight:700; font-size:1.5rem; line-height:1.25; margin-top:8px; letter-spacing:-0.01em;}
.ob-sub{margin-top:8px; font-size:0.93rem; color:var(--text-2); line-height:1.55; max-width:36ch;}

.ob-field{margin-top:18px;}
.ob-field label{display:block; font-size:0.82rem; font-weight:500; color:var(--text-2); margin-bottom:7px; letter-spacing:0.01em;}
.ob-field input, .ob-field select{
  width:100%; padding:13px 14px; background:var(--ob-bg3); border:1px solid var(--ob-line-strong);
  border-radius:10px; color:var(--text-1); font-size:0.94rem; font-family:var(--font-body);
  transition:border-color .2s, background .2s;
}
.ob-field select{
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238FA3AB' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 14px center; padding-right:34px;
}
.ob-field input::placeholder{color:var(--text-3);}
.ob-field input:focus, .ob-field select:focus{border-color:var(--primary-l); background:var(--ob-bg3-hover); outline:none;}
.ob-field-hint{margin-top:6px; font-size:0.76rem; color:var(--text-3);}
.ob-row-2{display:grid; grid-template-columns:1fr 1fr; gap:12px;}

.ob-privacy-note{margin-top:16px; display:flex; gap:8px; align-items:flex-start; font-size:0.78rem; color:var(--text-3); line-height:1.5;}
.ob-privacy-note svg{flex-shrink:0; margin-top:2px;}

.ob-nav{display:flex; align-items:center; justify-content:space-between; margin-top:28px; gap:12px;}
.ob-btn-back{font-size:0.88rem; font-weight:600; color:var(--text-3); padding:10px 6px; display:flex; align-items:center; gap:6px; transition:color .2s; background:none; border:none; cursor:pointer;}
.ob-btn-back:hover{color:var(--text-1);}
.ob-btn-back.ob-hidden{visibility:hidden;}

.ob-btn-primary{
  background:var(--primary); color:var(--text-1); font-weight:600; font-size:0.92rem;
  padding:14px 24px; border-radius:12px; display:flex; align-items:center; gap:8px; border:none; cursor:pointer;
  transition:transform .15s var(--ob-ease), background .2s, box-shadow .2s; box-shadow:0 8px 20px -8px rgba(14,107,92,0.55);
  font-family:var(--font-body);
}
.ob-btn-primary:hover:not(:disabled){background:#0c5b4e;}
.ob-btn-primary:active:not(:disabled){transform:scale(0.97);}
.ob-btn-primary:disabled{opacity:0.38; cursor:not-allowed; box-shadow:none;}
.ob-btn-full{width:100%; justify-content:center;}

.ob-bpass{margin-top:22px; display:flex; background:var(--ob-bg3); border-radius:16px; border:1px dashed rgba(201,154,58,0.35); overflow:hidden;}
.ob-bpass-main{flex:1; padding:20px 18px; min-width:0;}
.ob-bpass-eyebrow{font-family:var(--font-mono); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--gold); display:flex; align-items:center; gap:6px;}
.ob-bpass-code{font-family:var(--font-mono); font-weight:600; font-size:1.28rem; letter-spacing:0.04em; color:var(--text-1); margin-top:10px; word-break:break-all; position:relative;}
.ob-bpass-code.loading{color:transparent;}
.ob-bpass-code.loading::before{
  content:''; position:absolute; inset:2px 0; border-radius:6px;
  background:linear-gradient(90deg, var(--ob-bg3-hover) 25%, rgba(255,255,255,0.08) 50%, var(--ob-bg3-hover) 75%);
  background-size:200% 100%; animation:ob-shimmer 1.1s ease-in-out infinite;
}
@keyframes ob-shimmer{0%{background-position:200% 0;} 100%{background-position:-200% 0;}}
.ob-bpass-caption{margin-top:8px; font-size:0.76rem; color:var(--text-3);}
.ob-bpass-divider{position:relative; width:0; border-left:1px dashed rgba(245,243,236,0.18);}
.ob-bpass-divider::before, .ob-bpass-divider::after{content:''; position:absolute; left:50%; width:16px; height:16px; background:var(--bg); border-radius:50%; transform:translateX(-50%);}
.ob-bpass-divider::before{top:-8px;}
.ob-bpass-divider::after{bottom:-8px;}
.ob-bpass-stub{flex:0 0 92px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:14px 8px;}
.ob-copy-btn{width:38px; height:38px; border-radius:50%; background:var(--bg-2, #0F2C3B); border:1px solid var(--ob-line-strong); display:flex; align-items:center; justify-content:center; color:var(--text-2); cursor:pointer; transition:background .2s, border-color .2s, transform .15s var(--ob-ease), color .2s;}
.ob-copy-btn:hover:not(:disabled){border-color:var(--primary-l); color:var(--primary-l);}
.ob-copy-btn:active:not(:disabled){transform:scale(0.94);}
.ob-copy-btn:disabled{opacity:0.5; cursor:not-allowed;}
.ob-copy-caption{font-size:0.7rem; color:var(--text-3); text-align:center; letter-spacing:0.02em;}
.ob-copy-caption.copied{color:var(--primary-l);}

.ob-reward-note{margin-top:14px; background:var(--ob-gold-soft); border-left:3px solid var(--gold); border-radius:10px; padding:13px 15px; font-size:0.85rem; color:var(--text-2); line-height:1.5; display:flex; gap:10px; align-items:flex-start;}
.ob-reward-note svg{flex-shrink:0; margin-top:1px; color:var(--gold);}
.ob-reward-note strong{color:var(--text-1); font-weight:600;}

.ob-btn-whatsapp{margin-top:14px; width:100%; background:transparent; border:1px solid var(--ob-line-strong) !important; border-radius:12px; padding:13px 18px; display:flex; align-items:center; justify-content:center; gap:9px; font-weight:600; font-size:0.9rem; color:var(--text-1); cursor:pointer; transition:border-color .2s, background .2s; font-family:var(--font-body);}
.ob-btn-whatsapp:hover{border-color:#25D366 !important; background:rgba(37,211,102,0.06);}
.ob-btn-whatsapp svg{color:#25D366;}

.ob-finish-wrap{margin-top:20px;}

@media (max-width:420px){
  .ob-step-label{display:none;}
  .ob-row-2{grid-template-columns:1fr;}
  .ob-bpass{flex-direction:column;}
  .ob-bpass-divider{width:auto; height:0; border-left:none; border-top:1px dashed rgba(245,243,236,0.18); margin:0 18px;}
  .ob-bpass-stub{flex-direction:row; padding:12px 18px;}
}
`
