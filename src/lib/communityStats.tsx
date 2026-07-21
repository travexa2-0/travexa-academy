import type { ReactNode } from 'react'
import { Users, BookOpen, CheckCircle2, Trophy } from 'lucide-react'
import { useFormacionStats, type FormacionStats } from '@/hooks/useFormacionStats'

// Definición de una tarjeta de indicador (card + ícono + número + label), con
// link opcional. Formato visual compartido por la tira de Formación (/cursos) y
// la del Home (StatCardItem).
export interface StatCard {
  key: string
  n: string
  label: string
  icon: ReactNode
  color: string
  tint: string
  to?: string // si está presente, la card es un link
}

// Piso de volumen recuperado del código original real (`MIN_USUARIOS`, Sesión 25):
// por debajo, la tira de comunidad del HOME se oculta ENTERA. En Formación (/cursos)
// el piso NO aplica (Sesión 43b, decisión de Nico): ahí se muestra siempre el dato
// real, incluso 0. No es un valor nuevo.
const MIN_USUARIOS = 50
const nf = new Intl.NumberFormat('es-AR')

// Mapeo de los 4 indicadores reales de comunidad → cards, con DATOS REALES del RPC
// `academy_public_formacion_stats` (useFormacionStats). NUNCA se hardcodean (principio
// de integridad). Se usa tal cual en Formación (sin piso) y detrás del gate en el Home.
// "Tasa de finalización" no forma parte del set (fuera de Home y Formación, Sesión 43).
export function buildCommunityStats(stats: FormacionStats): StatCard[] {
  return [
    { key: 'usuarios',     n: nf.format(stats.usuariosActivos),   label: 'Usuarios activos',   icon: <Users className="h-[19px] w-[19px]" />,        color: '#2FC4AE',       tint: 'rgba(47,196,174,.14)' },
    { key: 'iniciados',    n: nf.format(stats.cursosIniciados),   label: 'Cursos iniciados',   icon: <BookOpen className="h-[19px] w-[19px]" />,      color: 'var(--text-1)', tint: 'rgba(245,243,236,.10)' },
    { key: 'completados',  n: nf.format(stats.cursosCompletados), label: 'Cursos completados', icon: <CheckCircle2 className="h-[19px] w-[19px]" />,  color: '#4ADE80',       tint: 'rgba(74,222,128,.14)' },
    { key: 'certificados', n: nf.format(stats.certificados),      label: 'Certificados',       icon: <Trophy className="h-[19px] w-[19px]" />,        color: '#E0A24E',       tint: 'rgba(224,162,78,.15)' },
  ]
}

// HOME: indicadores de comunidad detrás del piso de volumen. Devuelve [] cuando el
// RPC no responde o no hay volumen (usuarios < piso) → la tira del Home se oculta y
// "surge sola" cuando la plataforma crece. En Formación se usa `useFormacionStats` +
// `buildCommunityStats` directo, sin este gate.
export function useCommunityStats(): StatCard[] {
  const { data: stats } = useFormacionStats()
  if (!stats || stats.usuariosActivos < MIN_USUARIOS) return []
  return buildCommunityStats(stats)
}
