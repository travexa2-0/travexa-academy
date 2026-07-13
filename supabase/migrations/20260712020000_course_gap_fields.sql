-- Gap analysis de Cursos: campos estructurados que faltaban para el detalle público
-- (para quién es / no es para, qué vas a lograr, certificación, y detalle por clase).
-- 100% aditiva y nullable — no toca datos existentes.
--
-- REGLA #12: esta migración es una PROPUESTA. La aplica Nico, no Claude Code.
-- Hasta que se aplique, el wizard de cursos falla al guardar (escribe estas columnas).

alter table public.academy_courses
  add column if not exists para_quien    text,
  add column if not exists no_es_para    text,
  add column if not exists objetivos     text,
  add column if not exists certificacion text;

alter table public.academy_lessons
  add column if not exists descripcion   text;

comment on column public.academy_courses.para_quien   is 'Audiencia objetivo (texto libre, un ítem por línea, **negrita**).';
comment on column public.academy_courses.no_es_para   is 'Para quién NO es el curso (texto libre, un ítem por línea).';
comment on column public.academy_courses.objetivos    is '"Qué vas a lograr" — resultados de aprendizaje (texto libre). Reemplaza el fake de títulos de lección.';
comment on column public.academy_courses.certificacion is 'Mecanismo de certificación del curso (quiz / simulación en vivo con scorecard / trabajo integrador).';
comment on column public.academy_lessons.descripcion  is 'Detalle de la clase (Objetivo / Contenidos / Caso práctico / Te llevás), texto libre.';
