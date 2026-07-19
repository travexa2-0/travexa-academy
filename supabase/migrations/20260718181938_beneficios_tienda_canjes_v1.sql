-- Beneficios / Tienda de canjes por créditos — v1 (schema)
-- Ya aplicada en producción. Este archivo versiona el estado real en el repo.
-- Idempotente: no re-ejecuta cambios, solo garantiza paridad.

-- ── academy_benefits: columnas nuevas ────────────────────────────────
ALTER TABLE public.academy_benefits
  ADD COLUMN IF NOT EXISTS origen              text NOT NULL DEFAULT 'standalone',
  ADD COLUMN IF NOT EXISTS destacado           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sorteo_realizado_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminos            text;

DO $$ BEGIN
  ALTER TABLE public.academy_benefits
    ADD CONSTRAINT academy_benefits_origen_check CHECK (origen = ANY (ARRAY['standalone','curso']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Una sola fila activa por (curso, tipo) para beneficios originados en un curso.
CREATE UNIQUE INDEX IF NOT EXISTS uq_benefit_curso_activo
  ON public.academy_benefits (course_id, tipo)
  WHERE origen = 'curso' AND archivado = false;

-- ── academy_credit_redemptions: columnas nuevas ──────────────────────
ALTER TABLE public.academy_credit_redemptions
  ADD COLUMN IF NOT EXISTS course_id            uuid REFERENCES public.academy_courses(id),
  ADD COLUMN IF NOT EXISTS cantidad_chances     integer,
  ADD COLUMN IF NOT EXISTS descuento_tipo       text,
  ADD COLUMN IF NOT EXISTS descuento_valor      numeric,
  ADD COLUMN IF NOT EXISTS estado               text NOT NULL DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS usado_at             timestamptz,
  ADD COLUMN IF NOT EXISTS enrollment_id        uuid REFERENCES public.academy_enrollments(id),
  ADD COLUMN IF NOT EXISTS mp_external_reference text;

DO $$ BEGIN
  ALTER TABLE public.academy_credit_redemptions
    ADD CONSTRAINT academy_credit_redemptions_cantidad_chances_check CHECK (cantidad_chances IS NULL OR cantidad_chances > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.academy_credit_redemptions
    ADD CONSTRAINT academy_credit_redemptions_descuento_tipo_check CHECK (descuento_tipo IS NULL OR descuento_tipo = ANY (ARRAY['pct','fijo']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.academy_credit_redemptions
    ADD CONSTRAINT academy_credit_redemptions_estado_check CHECK (estado = ANY (ARRAY['activo','usado','ganador','no_ganador']));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Un canje por usuario por beneficio (excepto sorteos, que admiten varias chances).
CREATE UNIQUE INDEX IF NOT EXISTS uq_redemption_unica
  ON public.academy_credit_redemptions (user_id, benefit_id)
  WHERE tipo <> 'sorteo_vivencial' AND benefit_id IS NOT NULL;

-- Búsqueda rápida del descuento activo aplicable en el checkout de un curso.
CREATE INDEX IF NOT EXISTS idx_redemption_descuento_activo
  ON public.academy_credit_redemptions (user_id, course_id)
  WHERE estado = 'activo';

-- ── academy_payment_attempts: link al canje que da el descuento ───────
ALTER TABLE public.academy_payment_attempts
  ADD COLUMN IF NOT EXISTS redemption_id uuid REFERENCES public.academy_credit_redemptions(id);

-- ── academy_enrollments.tipo_acceso: agrega 'canje_creditos' ──────────
ALTER TABLE public.academy_enrollments DROP CONSTRAINT IF EXISTS academy_enrollments_tipo_acceso_check;
ALTER TABLE public.academy_enrollments
  ADD CONSTRAINT academy_enrollments_tipo_acceso_check
  CHECK (tipo_acceso = ANY (ARRAY['pago','suscripcion','gratuito','regalo','b2b','canje_creditos']));

-- ── RLS ──────────────────────────────────────────────────────────────
-- academy_benefits: SELECT público de vigentes; admin todo.
ALTER TABLE public.academy_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Beneficios públicos vigentes" ON public.academy_benefits;
CREATE POLICY "Beneficios públicos vigentes" ON public.academy_benefits FOR SELECT USING (
  publicado = true AND archivado = false
  AND (fecha_inicio IS NULL OR fecha_inicio <= now())
  AND (fecha_vencimiento IS NULL OR fecha_vencimiento > now())
  AND (cupo_maximo IS NULL OR cupo_usado < cupo_maximo)
);
DROP POLICY IF EXISTS "Admin lee beneficios" ON public.academy_benefits;
CREATE POLICY "Admin lee beneficios" ON public.academy_benefits FOR SELECT USING (is_academy_admin());
DROP POLICY IF EXISTS "Admin inserta beneficios" ON public.academy_benefits;
CREATE POLICY "Admin inserta beneficios" ON public.academy_benefits FOR INSERT WITH CHECK (is_academy_admin());
DROP POLICY IF EXISTS "Admin actualiza beneficios" ON public.academy_benefits;
CREATE POLICY "Admin actualiza beneficios" ON public.academy_benefits FOR UPDATE USING (is_academy_admin()) WITH CHECK (is_academy_admin());
DROP POLICY IF EXISTS "Admin borra beneficios" ON public.academy_benefits;
CREATE POLICY "Admin borra beneficios" ON public.academy_benefits FOR DELETE USING (is_academy_admin());

-- academy_credit_redemptions: usuario ve las propias; admin ve todo.
-- INSERT/UPDATE solo por backend (service_role) — sin políticas para el cliente.
ALTER TABLE public.academy_credit_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own redemptions" ON public.academy_credit_redemptions;
CREATE POLICY "Users see own redemptions" ON public.academy_credit_redemptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin lee redemptions" ON public.academy_credit_redemptions;
CREATE POLICY "Admin lee redemptions" ON public.academy_credit_redemptions FOR SELECT USING (is_academy_admin());
