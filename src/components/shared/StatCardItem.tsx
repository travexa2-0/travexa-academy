import { Link } from 'react-router-dom'
import type { StatCard } from '@/lib/communityStats'

// Una tarjeta de indicador con el estilo de la tira de Formación (card + ícono de
// color + número + label). Si el stat tiene `to`, se envuelve en un <Link> con un
// leve hover; si no, es un <div> informativo. Reutilizado por Formación (/cursos) y
// el Home para que ambas tiras se vean idénticas (Sesión 43).
//
// Layout (fix de alineación, Sesión 43b): ícono y número van en una MISMA fila
// (comparten eje vertical) y el label va debajo; el contenido está top-aligned y la
// card estira a la altura del grid (`h-full`). Así todas las cards quedan con el
// ícono, el número y el label en el mismo eje sin importar el largo del label ni si
// wrapea a 2 líneas (ej. "Cursos completados" vs "Certificados"), en grids de 4 u 8.
export default function StatCardItem({ stat }: { stat: StatCard }) {
  const inner = (
    <div
      className="flex flex-col gap-[10px] rounded-2xl border px-[18px] py-[16px] h-full"
      style={{ background: 'var(--card)', borderColor: 'var(--line)', backdropFilter: 'blur(6px)' }}
    >
      <div className="flex items-center gap-[12px]">
        <div
          className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: stat.tint, color: stat.color }}
        >
          {stat.icon}
        </div>
        <span
          className="font-display font-bold"
          style={{ fontSize: '1.9rem', lineHeight: 1, color: stat.color, letterSpacing: '-.02em' }}
        >
          {stat.n}
        </span>
      </div>
      <span
        className="leading-snug"
        style={{ fontSize: 12, color: 'var(--text-3)', letterSpacing: '.01em' }}
      >
        {stat.label}
      </span>
    </div>
  )

  if (stat.to) {
    return (
      <Link
        to={stat.to}
        className="block transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[3px]"
      >
        {inner}
      </Link>
    )
  }
  return inner
}
