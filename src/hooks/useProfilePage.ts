import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, PointsTransaction, RankingRow } from '@/types'

// El tipo generado Database no incluye varias columnas/tablas nuevas (reviews, pool,
// creditos, etc.). Seguimos el patrón establecido en el proyecto: castear el cliente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

// ── profiles (tabla hub — nombre/apellido/email/telefono/avatar) ──────

async function fetchProfilesRow(userId: string): Promise<Profile | null> {
  const { data } = await db()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return (data ?? null) as Profile | null
}

export function useProfilesRow(userId: string | undefined) {
  return useQuery({
    queryKey: ['profiles-row', userId],
    queryFn:  () => fetchProfilesRow(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

// ── Wishlist con datos del curso ──────────────────────────────────────

export interface WishlistItem {
  id: string
  course_id: string
  course: {
    id: string
    titulo: string
    slug: string
    thumbnail_url: string | null
    precio_ars: number | null
    tipo_acceso: string
    tipo: string
    category?: { nombre: string | null } | null
  } | null
}

async function fetchWishlistFull(userId: string): Promise<WishlistItem[]> {
  const { data } = await db()
    .from('academy_wishlists')
    .select(`
      id, course_id,
      course:academy_courses(
        id, titulo, slug, thumbnail_url, precio_ars, tipo_acceso, tipo,
        category:academy_categories(nombre)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as WishlistItem[]
}

export function useWishlistFull(userId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist-full', userId],
    queryFn:  () => fetchWishlistFull(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

export function useRemoveWishlist(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      await db().from('academy_wishlists').delete().eq('user_id', userId!).eq('course_id', courseId)
    },
    onMutate: async (courseId: string) => {
      await qc.cancelQueries({ queryKey: ['wishlist-full', userId] })
      const prev = qc.getQueryData<WishlistItem[]>(['wishlist-full', userId]) ?? []
      qc.setQueryData<WishlistItem[]>(['wishlist-full', userId], prev.filter(w => w.course_id !== courseId))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wishlist-full', userId], ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['wishlist-full', userId] })
      void qc.invalidateQueries({ queryKey: ['wishlist', userId] })
    },
  })
}

// ── Movimientos de puntos (XP + Créditos, con pool) ───────────────────

async function fetchPointsTransactions(userId: string): Promise<PointsTransaction[]> {
  const { data } = await db()
    .from('academy_points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as PointsTransaction[]
}

export function usePointsTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ['points-tx', userId],
    queryFn:  () => fetchPointsTransactions(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

// ── Ranking global (RPC SECURITY DEFINER — solo nombre + puntos) ───────

async function fetchRanking(): Promise<RankingRow[]> {
  const { data } = await db().rpc('get_academy_ranking')
  return (data ?? []) as RankingRow[]
}

export function useRanking(enabled = true) {
  return useQuery({
    queryKey: ['ranking'],
    queryFn:  fetchRanking,
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

// ── Reseñas ya publicadas por el usuario (para ocultar el form) ───────

async function fetchReviewedCourseIds(userId: string): Promise<string[]> {
  const { data } = await db()
    .from('academy_reviews')
    .select('course_id')
    .eq('user_id', userId)
  return ((data ?? []) as Array<{ course_id: string }>).map(r => r.course_id)
}

export function useReviewedCourseIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-reviews', userId],
    queryFn:  () => fetchReviewedCourseIds(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

export function useSubmitReview(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, rating, comentario }: { courseId: string; rating: number; comentario: string }) => {
      const { error } = await db().from('academy_reviews').insert({
        user_id:    userId!,
        course_id:  courseId,
        rating,
        comentario,
        publicado:  true,
      })
      if (error) throw new Error(error.message as string)
      // Puntos por reseña publicada — vía la edge function award-points (fuente
      // única de verdad; idempotente por (motivo, referencia_id)).
      await supabase.functions.invoke('award-points', {
        body: { userId: userId!, accion: 'resena_publicada', referenciaId: courseId },
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-reviews', userId] })
      void qc.invalidateQueries({ queryKey: ['academy-profile', userId] })
      void qc.invalidateQueries({ queryKey: ['points-tx', userId] })
    },
  })
}

// ── Guardar "Tus datos" ───────────────────────────────────────────────

export interface DatosUpdate {
  telefono: string | null
  fecha_nacimiento: string | null
  genero: string | null
  ciudad: string | null
  tipo_vendedor: string | null
  anos_experiencia: string | null
  destinos_principales: string[]
}

export function useUpdateDatos(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (d: DatosUpdate) => {
      const { error: e1 } = await db().from('profiles')
        .update({ telefono: d.telefono })
        .eq('id', userId!)
      if (e1) throw new Error(e1.message as string)

      const { error: e2 } = await db().from('academy_profiles')
        .update({
          fecha_nacimiento:     d.fecha_nacimiento,
          genero:               d.genero,
          ciudad:               d.ciudad,
          tipo_vendedor:        d.tipo_vendedor,
          anos_experiencia:     d.anos_experiencia,
          destinos_principales: d.destinos_principales,
        })
        .eq('user_id', userId!)
      if (e2) throw new Error(e2.message as string)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academy-profile', userId] })
      void qc.invalidateQueries({ queryKey: ['profiles-row', userId] })
    },
  })
}

// ── Subir certificado externo (storage + fila mínima) ─────────────────

export function useUploadCertificate(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const ext  = file.name.split('.').pop() ?? 'pdf'
      const path = `${userId}/certificates/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('academy-media')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (upErr) throw new Error(upErr.message)

      // La tabla no tiene columna de título/URL: guardamos una fila mínima
      // (numero + emitido_at se autogeneran). El archivo queda en storage.
      const { error: insErr } = await db().from('academy_certificates').insert({ user_id: userId! })
      if (insErr) throw new Error(insErr.message as string)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates', userId] }),
  })
}
