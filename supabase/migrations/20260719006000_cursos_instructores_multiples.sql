-- Sesión 36 — Instructores múltiples en cursos (paridad con vivenciales).
--
-- Hoy los cursos ('en_vivo'/'grabado'/'ebook') soportan un solo instructor (instructor_id
-- uuid single); los vivenciales soportan varios (vivencial_instructor_ids uuid[]). Se agrega
-- instructor_ids uuid[] a cursos, reusando el mismo patrón.
--
-- Estrategia elegida (con Nico): instructor_ids = fuente de verdad (lista ordenada).
-- instructor_id NO se dropea: queda como "instructor principal", espejo de instructor_ids[0],
-- para no romper el embed instructor:academy_instructors(*), los conteos por instructor ni el
-- detalle público con datos viejos. El CourseWizard mantiene ambos en sync al guardar.
--
-- Ya aplicada en producción vía MCP (con autorización de Nico); este archivo la deja trazada.
-- Idempotente.

-- 1. Columna array nueva.
alter table public.academy_courses
  add column if not exists instructor_ids uuid[];

-- 2. Backfill: los cursos con instructor_id arrancan con ese id como único elemento del array.
update public.academy_courses
   set instructor_ids = array[instructor_id]
 where instructor_id is not null
   and (instructor_ids is null or instructor_ids = '{}');

-- 3. RLS: la policy "Instructor ve sus propios cursos" tiene que reconocer al instructor
-- tanto en instructor_id (single) como en instructor_ids (array). Para NO reintroducir la
-- recursión de la migración anterior (20260719005000), no se consulta academy_instructors
-- dentro de la policy: se usa una función SECURITY DEFINER que resuelve auth.uid() → su
-- instructor_id directo, sin evaluar RLS de otra tabla.
create or replace function public.mi_instructor_id()
returns uuid
language sql stable security definer set search_path to 'public'
as $$ select id from public.academy_instructors where user_id = auth.uid() limit 1; $$;

drop policy if exists "Instructor ve sus propios cursos" on public.academy_courses;
create policy "Instructor ve sus propios cursos"
  on public.academy_courses for select to public
  using (
    public.mi_instructor_id() is not null
    and (
      academy_courses.instructor_id = public.mi_instructor_id()
      or public.mi_instructor_id() = any(academy_courses.instructor_ids)
    )
  );
