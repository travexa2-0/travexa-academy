-- Bloque 1 — Pagos de curso sin estado "pendiente".
-- Aplicada en producción vía MCP el 2026-07-16 (este archivo deja el registro
-- reproducible en el repo).

-- 1) Tabla de INTENTOS de pago. Un checkout de curso abandonado ya no deja una
--    fila "pendiente" en academy_payments; como mucho queda acá el intento, para
--    métricas. El INSERT lo hace create-course-payment con service_role.
create table if not exists public.academy_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.academy_courses(id),
  metodo_pago text not null check (metodo_pago in ('transferencia','tarjeta')),
  mp_preference_id text,
  created_at timestamptz not null default now()
);

alter table public.academy_payment_attempts enable row level security;

create policy "Admin lee intentos de pago"
  on public.academy_payment_attempts for select
  using (is_academy_admin());

-- 2) academy_payments ahora solo admite estados FINALES (sin 'pendiente'). Se
--    aplica DESPUÉS de deployar el código que ya no escribe 'pendiente'.
alter table public.academy_payments drop constraint academy_payments_estado_check;
alter table public.academy_payments
  add constraint academy_payments_estado_check
  check (estado in ('aprobado','rechazado','cancelado','reembolsado'));

-- 3) El default de la columna era 'pendiente', que ahora viola el propio CHECK.
--    Se elimina: un pago debe fijar su estado final explícito, no hay default sensato.
alter table public.academy_payments alter column estado drop default;
