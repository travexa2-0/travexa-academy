-- Sesión 34 — Instructores por vivencial.
-- Array de IDs de academy_instructors asignados a un vivencial, en orden de display.
-- Se usa una columna array nueva (no el instructor_id single, que es el de cursos):
-- un vivencial puede tener varios instructores. null o vacío = sin instructores.
-- Ya aplicada en producción vía MCP (con autorización de Nico); este archivo la deja
-- trazada en el repo. Idempotente.
alter table public.academy_courses
  add column if not exists vivencial_instructor_ids uuid[];
