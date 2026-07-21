import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import Header from '@/components/layout/Header'
import WhatsAppFloat from '@/components/shared/WhatsAppFloat'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useInstructors, type PublicInstructor } from '@/hooks/useInstructors'
import { avatarGradient, initialsFrom } from '@/lib/avatar'

// ── Instructor card ───────────────────────────────────────────────
// Retrato vertical grande a todo el ancho de la card → placa BLANCA con
// nombre + especialidad (contraste fuerte contra el fondo oscuro) → bio a
// 4 líneas (line-clamp) con botón de avión para expandir/colapsar el resto.
// El avión arranca HORIZONTAL (cerrado) y rota a apuntar HACIA ABAJO al abrir
// (mismo patrón que un chevron que rota), con transición suave.
function InstructorCard({ ins, delay }: { ins: PublicInstructor; delay: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.article
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay }}
    >
      {/* ── Foto: rectángulo vertical (retrato) a todo el ancho de la card ── */}
      <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
        {ins.avatar_url ? (
          <img
            src={ins.avatar_url}
            alt={ins.nombre}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          // Sin foto → placeholder de iniciales (NUNCA una foto de stock).
          <div
            className="absolute inset-0 flex items-center justify-center font-display font-bold"
            style={{ background: avatarGradient(ins.id), color: 'var(--text-1)', fontSize: 'clamp(3rem, 9vw, 5.5rem)' }}
            aria-hidden
          >
            {initialsFrom(ins.nombre, null, ins.nombre)}
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      {/* position:relative + z-index → la placa blanca (elemento en flujo) queda
          POR ENCIMA de la foto (que es position:absolute y, si no, la taparía). */}
      <div className="flex flex-col p-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* Placa BLANCA: nombre + especialidad, superpuesta sobre la base de la foto */}
        <div
          className="rounded-2xl"
          style={{ background: '#FFFFFF', padding: '16px 18px', marginTop: -44, boxShadow: '0 10px 30px rgba(0,0,0,.28)' }}
        >
          <h3 className="font-display font-bold" style={{ fontSize: '1.35rem', color: '#0A1E29', lineHeight: 1.15, letterSpacing: '-.01em' }}>
            {ins.nombre}
          </h3>
          {ins.especialidad && (
            <p className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '.06em', color: 'var(--primary)', marginTop: 7, fontWeight: 600 }}>
              {ins.especialidad}
            </p>
          )}
        </div>

        {/* Bio: 4 líneas (clamp) cerrada, texto completo abierta */}
        {ins.bio && (
          <>
            <p
              style={{
                fontSize: '.9rem', color: 'var(--text-3)', marginTop: 16, lineHeight: 1.6,
                ...(open
                  ? {}
                  : { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
              }}
            >
              {ins.bio}
            </p>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-2 font-mono uppercase self-start"
              style={{
                marginTop: 14, fontSize: 10.5, letterSpacing: '.08em', color: 'var(--neon)',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0',
              }}
            >
              {open ? 'Ver menos' : 'Leer bio completa'}
              <Plane
                className="h-[15px] w-[15px]"
                style={{
                  // Cerrado: 45° → nariz horizontal (a la derecha).
                  // Abierto: 135° → nariz hacia abajo. Transición suave.
                  transform: `rotate(${open ? 135 : 45}deg)`,
                  transition: 'transform .35s cubic-bezier(.23,1,.32,1)',
                }}
              />
            </button>
          </>
        )}
      </div>
    </motion.article>
  )
}

// ── Página /instructores ──────────────────────────────────────────
export default function Instructores() {
  const { data: instructors = [], isLoading } = useInstructors()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      {/* ── HERO (dark navy, mismo lenguaje que /cursos y /vivencial) ── */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: `
            radial-gradient(ellipse 1100px 620px at 22% 0%, rgba(0,229,200,.16), transparent 62%),
            radial-gradient(ellipse 700px 460px at 100% 10%, rgba(14,107,92,.22), transparent 58%),
            linear-gradient(180deg, #0D2A38 0%, var(--bg) 46%, #0D2230 100%)
          `,
          overflow: 'hidden',
          padding: '96px 0 56px',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .6,
            backgroundImage: 'linear-gradient(rgba(245,243,236,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(245,243,236,.06) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 1000px 560px at 18% 0%, black, transparent 72%)',
          }}
        />
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />

        <div className="w-full max-w-[1200px] mx-auto px-[22px]" style={{ position: 'relative', zIndex: 1 }}>
          <motion.p
            className="font-mono uppercase flex items-center gap-2"
            style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--neon)', marginBottom: 20 }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 0 4px var(--neon-dim)', display: 'inline-block' }} />
            Travexa Academy · Instructores
          </motion.p>

          <motion.h1
            className="font-display font-bold"
            style={{ fontSize: 'clamp(2rem,6.5vw,4.6rem)', lineHeight: 1.03, letterSpacing: '-.025em' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.22 }}
          >
            <span style={{ color: 'var(--text-1)', display: 'block' }}>No enseña cualquiera.</span>
            <span style={{ color: 'var(--neon)', textShadow: '0 0 48px var(--neon-glow)', display: 'block' }}>Enseña quien ya lo hizo.</span>
          </motion.h1>

          <motion.p
            style={{ maxWidth: 640, marginTop: 22, fontSize: 'clamp(.95rem,1.8vw,1.1rem)', color: 'var(--text-3)', lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.42 }}
          >
            Cada instructor tiene trayectoria comprobable en el rubro y una especialidad distinta — desde psicología aplicada a la venta hasta liderazgo, IA y marketing turístico. No es un cuerpo docente genérico: es un equipo diverso de profesionales que hoy están operando en el turismo real.
          </motion.p>
        </div>
      </section>

      {/* ── EQUIPO DOCENTE ── */}
      <main className="w-full max-w-[1200px] mx-auto px-[22px]" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <h2 className="font-display font-bold" style={{ fontSize: '1.5rem', color: 'var(--text-1)' }}>Equipo docente</h2>
        <p style={{ fontSize: '.9rem', color: 'var(--text-3)', marginTop: 6 }}>
          Referentes que forman a la red de asesores de Travexa.
        </p>

        <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2" style={{ marginTop: 24 }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : instructors.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 text-center rounded-2xl border"
              style={{ gridColumn: '1/-1', padding: '56px 24px', borderColor: 'var(--line)', borderStyle: 'dashed', background: 'var(--card)' }}
            >
              <h3 className="font-display font-bold" style={{ fontSize: '1.05rem', color: 'var(--text-2)' }}>Estamos sumando al equipo docente</h3>
              <p style={{ fontSize: '.86rem', color: 'var(--text-3)' }}>Muy pronto vas a conocer a quienes dictan la formación.</p>
            </div>
          ) : (
            instructors.map((ins, i) => <InstructorCard key={ins.id} ins={ins} delay={i * 0.06} />)
          )}
        </div>

        {/* ── Testimonio (estado vacío diseñado — sin texto de usuario falso) ── */}
        {/* Placeholder explícito: cuando exista una reseña real de un alumno sobre
            un instructor puntual, reemplaza este bloque. No se muestra un nombre
            ni una cita inventada (integridad de datos). */}
        <div
          className="rounded-2xl border flex flex-col items-center text-center gap-2"
          style={{ marginTop: 40, padding: '40px 24px', borderColor: 'var(--line)', borderStyle: 'dashed', background: 'transparent' }}
        >
          <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--text-3)' }}>Testimonios</span>
          <p style={{ fontSize: '.92rem', color: 'var(--text-3)', maxWidth: 460, lineHeight: 1.6 }}>
            Espacio para testimonio de alumno sobre un instructor puntual — pendiente de completar.
          </p>
        </div>
      </main>

      <WhatsAppFloat />
    </div>
  )
}
