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

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const path = `${userId}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('academy-media')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return null

  const { data } = supabase.storage.from('academy-media').getPublicUrl(path)
  // Cache buster: el path es fijo, sin ?t el browser sirve la imagen vieja
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  // Guardar en profiles.avatar_url (tabla compartida con Travexa Core)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)

  return publicUrl
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
