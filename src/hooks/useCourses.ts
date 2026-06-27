import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Course, Category, Instructor } from '@/types'

type CourseRow = Omit<Course, 'category' | 'instructor'> & {
  category: Category | null
  instructor: Instructor | null
}

async function fetchCourses(categoryId?: string): Promise<Course[]> {
  let query = supabase
    .from('academy_courses')
    .select(`
      *,
      category:academy_categories(*),
      instructor:academy_instructors(*)
    `)
    .eq('publicado', true)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as CourseRow[]) as Course[]
}

async function fetchCourseBySlug(slug: string): Promise<Course & { modules: import('@/types').Module[] }> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select(`
      *,
      category:academy_categories(*),
      instructor:academy_instructors(*),
      modules:academy_modules(
        *,
        lessons:academy_lessons(* )
      )
    `)
    .eq('slug', slug)
    .eq('publicado', true)
    .single()

  if (error) throw new Error(error.message)
  return data as Course & { modules: import('@/types').Module[] }
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('academy_categories')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Category[]
}

export function useCourses(categoryId?: string) {
  return useQuery({
    queryKey: ['courses', categoryId ?? 'all'],
    queryFn: () => fetchCourses(categoryId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCourseDetail(slug: string) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: () => fetchCourseBySlug(slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  })
}
