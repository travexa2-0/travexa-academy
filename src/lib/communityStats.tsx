import type { ReactNode } from 'react'
import { Users, BookOpen, CheckCircle2, Trophy } from 'lucide-react'
import { useFormacionStats } from '@/hooks/useFormacionStats'

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
// por debajo, la tira de comunidad se oculta ENTERA — no se muestran ceros crudos
// ni números bajos poco creíbles en una landing pública. No es un valor nuevo.
const MIN_USUARIOS = 50
const nf = new Intl.NumberFormat('es-AR')

// Indicadores de comunidad con DATOS REALES vía RPC `academy_public_formacion_stats`
// (useFormacionStats) — cuenta global de la plataforma, expuesta de forma segura a
// anon. NUNCA se hardcodean (principio de integridad de datos). Fuente ÚNICA
// compartida por Formación (/cursos) y el Home, para que ambas muestren lo mismo.
// Devuelve [] cuando el RPC no responde o no hay volumen real (usuarios < piso) →
// ambas tiras se ocultan y "surgen solas" cuando la plataforma crece.
// "Tasa de finalización" no forma parte del set (fuera de Home y Formación, Sesión 43).
export function useCommunityStats(): StatCard[] {
  const { data: stats } = useFormacionStats()
  if (!stats || stats.usuariosActivos < MIN_USUARIOS) return []
  return [
    { key: 'usuarios',     n: nf.format(stats.usuariosActivos),   label: 'Usuarios activos',   icon: <Users className="h-[19px] w-[19px]" />,        color: '#2FC4AE',       tint: 'rgba(47,196,174,.14)' },
    { key: 'iniciados',    n: nf.format(stats.cursosIniciados),   label: 'Cursos iniciados',   icon: <BookOpen className="h-[19px] w-[19px]" />,      color: 'var(--text-1)', tint: 'rgba(245,243,236,.10)' },
    { key: 'completados',  n: nf.format(stats.cursosCompletados), label: 'Cursos completados', icon: <CheckCircle2 className="h-[19px] w-[19px]" />,  color: '#4ADE80',       tint: 'rgba(74,222,128,.14)' },
    { key: 'certificados', n: nf.format(stats.certificados),      label: 'Certificados',       icon: <Trophy className="h-[19px] w-[19px]" />,        color: '#E0A24E',       tint: 'rgba(224,162,78,.15)' },
  ]
}
