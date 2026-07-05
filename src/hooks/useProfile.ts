import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AcademyProfile, Badge, UserBadge, Certificate, Referral } from '@/types'

// ── Academy profile ──────────────────────────────────────────────

async function fetchAcademyProfile(userId: string): Promise<AcademyProfile | null> {
  const { data } = await supabase
    .from('academy_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as AcademyProfile | null
}

async function updateAcademyProfile(userId: string, updates: Partial<AcademyProfile>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('academy_profiles').update(updates).eq('user_id', userId)
}

export function useAcademyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['academy-profile', userId],
    queryFn:  () => fetchAcademyProfile(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: Partial<AcademyProfile>) => updateAcademyProfile(userId!, updates),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['academy-profile', userId] }),
  })
}

// ── Avatar upload ────────────────────────────────────────────────

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Validación cliente antes de subir (además del bucket): tipo + tamaño.
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_TYPES.includes(file.type)) return 'Formato no válido. Usá JPG, PNG, WEBP o GIF.'
  if (file.size > AVATAR_MAX_BYTES) return 'La imagen supera los 5 MB. Elegí una más liviana.'
  return null
}

// Sube el recorte (blob JPEG) a academy-media/{user_id}/avatar-{ts}.jpg.
// El path DEBE empezar con {user_id}/ porque las policies de update/delete exigen
// foldername(name)[1] = auth.uid(). Después limpia avatares viejos de la carpeta
// (solo archivos avatar-*/avatar.jpg — nunca toca la subcarpeta certificates/).
async function uploadAvatarBlob(userId: string, blob: Blob): Promise<string> {
  const path = `${userId}/avatar-${Date.now()}.jpg`
  const newName = path.split('/').pop()!

  const { error: uploadError } = await supabase.storage
    .from('academy-media')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('academy-media').getPublicUrl(path)
  const publicUrl = data.publicUrl

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (supabase as any)
    .from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
  if (updErr) throw new Error(updErr.message)

  // Limpieza de huérfanos: borra avatares anteriores, preserva todo lo demás.
  const { data: files } = await supabase.storage.from('academy-media').list(userId, { limit: 100 })
  const stale = (files ?? [])
    .filter(f => /^avatar[-.]/.test(f.name) && f.name !== newName)
    .map(f => `${userId}/${f.name}`)
  if (stale.length) await supabase.storage.from('academy-media').remove(stale)

  return publicUrl
}

export function useUploadAvatar(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blob: Blob) => uploadAvatarBlob(userId!, blob),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles-row', userId] })
      void qc.invalidateQueries({ queryKey: ['academy-profile', userId] })
    },
  })
}

// ── Badges ───────────────────────────────────────────────────────

async function fetchAllBadges(): Promise<Badge[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('academy_badges').select('*').eq('activo', true)
  return (data ?? []) as Badge[]
}

async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('academy_user_badges')
    .select('*, badge:academy_badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  return (data ?? []) as UserBadge[]
}

export function useBadges(userId: string | undefined) {
  const allBadges  = useQuery({ queryKey: ['badges-all'], queryFn: fetchAllBadges, staleTime: 1000 * 60 * 10 })
  const userBadges = useQuery({
    queryKey: ['user-badges', userId],
    queryFn:  () => fetchUserBadges(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
  const earnedIds = new Set((userBadges.data ?? []).map(b => b.badge_id))
  return {
    all:       allBadges.data ?? [],
    earned:    userBadges.data ?? [],
    earnedIds,
    isLoading: allBadges.isLoading || userBadges.isLoading,
  }
}

// ── Certificates ─────────────────────────────────────────────────

async function fetchCertificates(userId: string): Promise<Certificate[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('academy_certificates')
    .select('*, course:academy_courses(titulo, thumbnail_url, slug)')
    .eq('user_id', userId)
    .order('emitido_at', { ascending: false })
  return (data ?? []) as Certificate[]
}

export function useCertificates(userId: string | undefined) {
  return useQuery({
    queryKey: ['certificates', userId],
    queryFn:  () => fetchCertificates(userId!),
    staleTime: 1000 * 60 * 5,
    enabled:  !!userId,
  })
}

// ── Referrals ────────────────────────────────────────────────────

async function fetchReferrals(userId: string): Promise<Referral[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('academy_referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Referral[]
}

export function useReferrals(userId: string | undefined) {
  return useQuery({
    queryKey: ['referrals', userId],
    queryFn:  () => fetchReferrals(userId!),
    staleTime: 1000 * 60 * 5,
    enabled:  !!userId,
  })
}

// ── Points transactions ───────────────────────────────────────────

async function fetchPoints(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('academy_points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as Array<{ puntos: number; motivo: string; tipo: string; created_at: string }>
}

export function usePointsHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['points', userId],
    queryFn:  () => fetchPoints(userId!),
    staleTime: 1000 * 60 * 5,
    enabled:  !!userId,
  })
}
