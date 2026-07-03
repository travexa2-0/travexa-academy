-- Backoffice admin RLS: helper function + admin policies + harden public courses policy.
-- Applied to fvrwtqhkskbaixqbxami (Academy). See CLAUDE_Academy_Actualizado.md — Backoffice.

-- 1. Admin check helper. SECURITY DEFINER so it can read profiles regardless of RLS
--    (avoids recursion when used inside policies on profiles itself).
create or replace function public.is_academy_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and es_admin = true
  );
$$;

revoke all on function public.is_academy_admin() from public;
grant execute on function public.is_academy_admin() to authenticated;

-- 2. Harden public catalog policy: archived courses must never be public.
drop policy if exists "Cursos publicados son públicos" on public.academy_courses;
create policy "Cursos publicados son públicos"
  on public.academy_courses for select to public
  using (publicado = true and archivado = false);

-- 3. Admin full access on catalog content tables (SELECT admin is additive/OR).

-- academy_courses
create policy "Admin lee todos los cursos"       on public.academy_courses for select using (public.is_academy_admin());
create policy "Admin inserta cursos"             on public.academy_courses for insert with check (public.is_academy_admin());
create policy "Admin actualiza cursos"           on public.academy_courses for update using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Admin borra cursos"               on public.academy_courses for delete using (public.is_academy_admin());

-- academy_modules
create policy "Admin lee modulos"                on public.academy_modules for select using (public.is_academy_admin());
create policy "Admin inserta modulos"            on public.academy_modules for insert with check (public.is_academy_admin());
create policy "Admin actualiza modulos"          on public.academy_modules for update using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Admin borra modulos"              on public.academy_modules for delete using (public.is_academy_admin());

-- academy_lessons
create policy "Admin lee lecciones"              on public.academy_lessons for select using (public.is_academy_admin());
create policy "Admin inserta lecciones"          on public.academy_lessons for insert with check (public.is_academy_admin());
create policy "Admin actualiza lecciones"        on public.academy_lessons for update using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Admin borra lecciones"            on public.academy_lessons for delete using (public.is_academy_admin());

-- academy_instructors
create policy "Admin lee instructores"           on public.academy_instructors for select using (public.is_academy_admin());
create policy "Admin inserta instructores"       on public.academy_instructors for insert with check (public.is_academy_admin());
create policy "Admin actualiza instructores"     on public.academy_instructors for update using (public.is_academy_admin()) with check (public.is_academy_admin());
create policy "Admin borra instructores"         on public.academy_instructors for delete using (public.is_academy_admin());

-- academy_categories (alta rápida desde el drawer)
create policy "Admin inserta categorias"         on public.academy_categories for insert with check (public.is_academy_admin());
create policy "Admin actualiza categorias"       on public.academy_categories for update using (public.is_academy_admin()) with check (public.is_academy_admin());

-- 4. Enrollments: ver inscriptos, cargar inscripción manual, ajustar seña/saldo.
create policy "Admin lee inscripciones"          on public.academy_enrollments for select using (public.is_academy_admin());
create policy "Admin inserta inscripciones"      on public.academy_enrollments for insert with check (public.is_academy_admin());
create policy "Admin actualiza inscripciones"    on public.academy_enrollments for update using (public.is_academy_admin()) with check (public.is_academy_admin());

-- 5. Read-only admin access for métricas.
create policy "Admin lee pagos"                  on public.academy_payments for select using (public.is_academy_admin());
create policy "Admin lee profiles"               on public.profiles for select using (public.is_academy_admin());
create policy "Admin lee academy_profiles"       on public.academy_profiles for select using (public.is_academy_admin());
create policy "Admin lee progreso"               on public.academy_lesson_progress for select using (public.is_academy_admin());
create policy "Admin lee reviews"                on public.academy_reviews for select using (public.is_academy_admin());
