-- Sesión 35 — La página pública del vivencial muestra los instructores asignados
-- (vivencial_instructor_ids). La policy "Instructores públicos" solo deja leer
-- activo=true, así que un instructor asignado pero luego desactivado no se leería.
-- Regla del producto: la asignación manda (se muestra igual; la limpieza es del
-- backoffice). Esta policy aditiva expone SOLO a los instructores efectivamente
-- asignados a un vivencial publicado y no archivado, incluso si están inactivos.
-- Los admins ya leen todos vía "Admin lee instructores" (cubre el preview de borradores).
-- Ya aplicada en producción vía MCP; este archivo la deja trazada.
create policy "Instructores asignados a vivencial visibles"
on public.academy_instructors for select to public
using (
  exists (
    select 1 from public.academy_courses c
    where c.tipo = 'vivencial'
      and c.publicado = true
      and c.archivado = false
      and academy_instructors.id = any(c.vivencial_instructor_ids)
  )
);
