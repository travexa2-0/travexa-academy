-- Sesión 36 — Fix recursión infinita de RLS entre academy_courses y academy_instructors.
--
-- Síntoma: /admin/cursos, /admin/vivenciales y /admin/instructores mostraban 0
-- resultados pese a tener datos. Cualquier SELECT a esas dos tablas para un usuario
-- autenticado (admin o instructor) fallaba con:
--   ERROR 42P17: infinite recursion detected in policy for relation "academy_courses"
--
-- Causa: ciclo entre dos policies.
--   - academy_courses  · "Instructor ve sus propios cursos"         → select de academy_instructors
--   - academy_instructors · "Instructores asignados a vivencial visibles" → select de academy_courses
-- (la segunda se agregó en Sesión 35, 20260719003000, y cerró el ciclo A→B→A).
--
-- Fix: cortar un lado del ciclo. El EXISTS sobre academy_courses pasa a una función
-- SECURITY DEFINER, que corre con los permisos del owner y NO re-evalúa policies →
-- no hay recursión. Mismo resultado funcional que la policy original.

create or replace function public.instructor_en_vivencial_publicado(_instructor_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.academy_courses c
    where c.tipo = 'vivencial'
      and c.publicado = true
      and c.archivado = false
      and _instructor_id = any(c.vivencial_instructor_ids)
  );
$$;

drop policy if exists "Instructores asignados a vivencial visibles" on public.academy_instructors;
create policy "Instructores asignados a vivencial visibles"
  on public.academy_instructors for select to public
  using ( public.instructor_en_vivencial_publicado(id) );
