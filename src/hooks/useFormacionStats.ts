import { useQuery } from '@tanstack/react-query'
import { supabaseWrite } from '@/lib/supabase'

// Métricas ilustrativas de Formación (usuarios activos, cursos completados,
// certificados emitidos). NUNCA se hardcodean: salen de un agregado real de la
// base. Como `academy_profiles`/`academy_enrollments`/`academy_certificates`
// están protegidas por RLS por-usuario (un anon o un alumno solo ve SUS filas),
// un count client-side devolvería el conteo del propio viewer, no el total de la
// plataforma → sería engañoso. La única forma correcta de exponer totales
// globales es un RPC `SECURITY DEFINER` que cuente sobre todas las filas sin
// filtrar por viewer.
//
// Ese RPC (`academy_public_formacion_stats`) está PROPUESTO, sin aplicar (regla
// "los cambios de DB se proponen, no se aplican"). Hasta que Nico lo aplique,
// la llamada falla → el hook devuelve null → la tira se oculta (nunca muestra
// los números inventados de la referencia ni un cero crudo).
export interface FormacionStats {
  usuariosActivos: number
  cursosCompletados: number
  certificados: number
}

interface StatsRow {
  usuarios_activos: number | null
  cursos_completados: number | null
  certificados: number | null
}

async function fetchFormacionStats(): Promise<FormacionStats | null> {
  // El RPC puede no existir todavía (propuesto, sin aplicar): si falla, se oculta.
  // Se usa `supabaseWrite` (escape hatch tipado del proyecto) porque el tipo
  // generado de la DB tiene `Functions: Record<string, never>` — igual que el
  // resto de las llamadas rpc del código.
  const { data, error } = await supabaseWrite.rpc('academy_public_formacion_stats')
  if (error || !data) return null
  const row = (Array.isArray(data) ? data[0] : data) as StatsRow | undefined
  if (!row) return null
  return {
    usuariosActivos: Number(row.usuarios_activos ?? 0),
    cursosCompletados: Number(row.cursos_completados ?? 0),
    certificados: Number(row.certificados ?? 0),
  }
}

export function useFormacionStats() {
  return useQuery({
    queryKey: ['formacion-stats'],
    queryFn: fetchFormacionStats,
    // Sin reintentos: si el RPC no está aplicado, no tiene sentido reintentar.
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
