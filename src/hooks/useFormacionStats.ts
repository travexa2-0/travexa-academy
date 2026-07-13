import { useQuery } from '@tanstack/react-query'
import { supabaseWrite } from '@/lib/supabase'

// Métricas reales de Formación (usuarios activos, cursos iniciados/completados,
// certificados emitidos, tasa de finalización %). NUNCA se hardcodean: salen de
// un agregado real de la base. Como `academy_profiles`/`academy_enrollments`/
// `academy_certificates` están protegidas por RLS por-usuario (un anon o un
// alumno solo ve SUS filas), un count client-side devolvería el conteo del
// propio viewer, no el total de la plataforma → sería engañoso. La única forma
// correcta de exponer totales globales es un RPC `SECURITY DEFINER` que cuente
// sobre todas las filas sin filtrar por viewer.
//
// Ese RPC (`academy_public_formacion_stats`) está APLICADO en producción y con
// GRANT a anon/authenticated (misma fuente que el Centro de control admin, pero
// expuesta de forma segura para la landing pública). Las métricas de cursos
// excluyen vivenciales. Si el RPC fallara o no hubiera volumen, el hook devuelve
// null → la tira se oculta (nunca muestra números inventados ni ceros crudos).
export interface FormacionStats {
  usuariosActivos: number
  cursosIniciados: number
  cursosCompletados: number
  certificados: number
  tasaFinalizacion: number
}

interface StatsRow {
  usuarios_activos: number | null
  cursos_iniciados: number | null
  cursos_completados: number | null
  certificados: number | null
  tasa_finalizacion: number | string | null
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
    cursosIniciados: Number(row.cursos_iniciados ?? 0),
    cursosCompletados: Number(row.cursos_completados ?? 0),
    certificados: Number(row.certificados ?? 0),
    tasaFinalizacion: Number(row.tasa_finalizacion ?? 0),
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
