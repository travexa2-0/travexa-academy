-- Aceptación de bases y condiciones en el canje. Ya aplicada en producción.
-- Versionado para paridad del repo (no re-ejecuta nada relevante).

-- Registro (legal) de cuándo el usuario aceptó las bases al canjear.
ALTER TABLE public.academy_credit_redemptions
  ADD COLUMN IF NOT EXISTS terminos_aceptados_at timestamptz;

-- redeem_benefit: 4° parámetro p_acepta_terminos. Si el beneficio tiene `terminos`
-- no vacío y no se acepta, rechaza con TERMINOS_NO_ACEPTADOS sin descontar nada;
-- si se acepta, guarda terminos_aceptados_at = now() en la redemption.
CREATE OR REPLACE FUNCTION public.redeem_benefit(p_user_id uuid, p_benefit_id uuid, p_cantidad_chances integer DEFAULT 1, p_acepta_terminos boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_benefit academy_benefits%ROWTYPE;
  v_chances INTEGER;
  v_costo INTEGER;
  v_saldo INTEGER;
  v_redemption_id UUID;
  v_enrollment_id UUID := NULL;
  v_estado TEXT;
  v_usado_at TIMESTAMPTZ := NULL;
  v_desc_tipo TEXT := NULL;
  v_slug TEXT := NULL;
  v_curso_titulo TEXT := NULL;
  v_cupo_incremento INTEGER;
  v_terminos_at TIMESTAMPTZ := NULL;
BEGIN
  SELECT * INTO v_benefit FROM academy_benefits WHERE id = p_benefit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BENEFICIO_INEXISTENTE'; END IF;

  IF NOT v_benefit.publicado OR v_benefit.archivado THEN RAISE EXCEPTION 'BENEFICIO_NO_DISPONIBLE'; END IF;
  IF v_benefit.fecha_inicio IS NOT NULL AND v_benefit.fecha_inicio > now() THEN RAISE EXCEPTION 'BENEFICIO_NO_VIGENTE'; END IF;
  IF v_benefit.fecha_vencimiento IS NOT NULL AND v_benefit.fecha_vencimiento <= now() THEN RAISE EXCEPTION 'BENEFICIO_VENCIDO'; END IF;
  IF v_benefit.tipo = 'sorteo_vivencial' AND v_benefit.sorteo_realizado_at IS NOT NULL THEN RAISE EXCEPTION 'SORTEO_YA_REALIZADO'; END IF;

  -- Exigir aceptación explícita cuando el beneficio tiene bases y condiciones cargadas
  IF v_benefit.terminos IS NOT NULL AND length(trim(v_benefit.terminos)) > 0 THEN
    IF NOT COALESCE(p_acepta_terminos, false) THEN
      RAISE EXCEPTION 'TERMINOS_NO_ACEPTADOS';
    END IF;
    v_terminos_at := now();
  END IF;

  IF v_benefit.tipo = 'sorteo_vivencial' THEN
    v_chances := GREATEST(COALESCE(p_cantidad_chances, 1), 1);
  ELSE
    v_chances := 1;
  END IF;

  v_cupo_incremento := CASE WHEN v_benefit.tipo = 'sorteo_vivencial' THEN v_chances ELSE 1 END;
  IF v_benefit.cupo_maximo IS NOT NULL
     AND v_benefit.cupo_usado + v_cupo_incremento > v_benefit.cupo_maximo THEN
    RAISE EXCEPTION 'CUPO_AGOTADO';
  END IF;

  IF v_benefit.tipo <> 'sorteo_vivencial' AND EXISTS (
    SELECT 1 FROM academy_credit_redemptions
    WHERE user_id = p_user_id AND benefit_id = p_benefit_id
  ) THEN
    RAISE EXCEPTION 'YA_CANJEADO';
  END IF;

  IF v_benefit.course_id IS NOT NULL AND v_benefit.tipo IN ('curso_gratis','descuento_pct','descuento_fijo') THEN
    IF EXISTS (
      SELECT 1 FROM academy_enrollments
      WHERE user_id = p_user_id AND course_id = v_benefit.course_id AND activo = true
    ) THEN
      RAISE EXCEPTION 'CURSO_YA_ADQUIRIDO';
    END IF;
  END IF;

  v_costo := v_benefit.costo_creditos * v_chances;
  SELECT creditos INTO v_saldo FROM academy_profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PERFIL_INEXISTENTE'; END IF;
  IF v_saldo < v_costo THEN RAISE EXCEPTION 'SALDO_INSUFICIENTE'; END IF;

  IF v_benefit.tipo = 'descuento_pct' THEN v_desc_tipo := 'pct';
  ELSIF v_benefit.tipo = 'descuento_fijo' THEN v_desc_tipo := 'fijo';
  END IF;
  IF v_benefit.tipo = 'curso_gratis' THEN
    v_estado := 'usado'; v_usado_at := now();
  ELSE
    v_estado := 'activo';
  END IF;

  INSERT INTO academy_credit_redemptions
    (user_id, tipo, creditos_consumidos, benefit_id, course_id, cantidad_chances,
     descuento_tipo, descuento_valor, estado, usado_at, descripcion, terminos_aceptados_at)
  VALUES
    (p_user_id, v_benefit.tipo, v_costo, v_benefit.id, v_benefit.course_id,
     CASE WHEN v_benefit.tipo = 'sorteo_vivencial' THEN v_chances ELSE NULL END,
     v_desc_tipo, v_benefit.descuento_valor, v_estado, v_usado_at, v_benefit.titulo, v_terminos_at)
  RETURNING id INTO v_redemption_id;

  INSERT INTO academy_points_transactions (user_id, puntos, tipo, motivo, referencia_id, pool)
  VALUES (p_user_id, -v_costo, 'canjeado', 'Canje: ' || v_benefit.titulo, v_redemption_id, 'creditos');
  UPDATE academy_profiles SET creditos = creditos - v_costo, updated_at = now()
  WHERE user_id = p_user_id;

  IF v_benefit.tipo = 'curso_gratis' THEN
    INSERT INTO academy_enrollments (user_id, course_id, tipo_acceso, activo)
    VALUES (p_user_id, v_benefit.course_id, 'canje_creditos', true)
    RETURNING id INTO v_enrollment_id;
    UPDATE academy_credit_redemptions SET enrollment_id = v_enrollment_id WHERE id = v_redemption_id;
  END IF;

  UPDATE academy_benefits
  SET cupo_usado = cupo_usado + v_cupo_incremento, updated_at = now()
  WHERE id = v_benefit.id;

  IF v_benefit.course_id IS NOT NULL THEN
    SELECT slug, titulo INTO v_slug, v_curso_titulo FROM academy_courses WHERE id = v_benefit.course_id;
  END IF;
  INSERT INTO academy_notifications (user_id, tipo, titulo, mensaje, url)
  VALUES (
    p_user_id,
    'canje_beneficio',
    CASE
      WHEN v_benefit.tipo = 'curso_gratis' THEN '¡Canjeaste un curso!'
      WHEN v_benefit.tipo = 'sorteo_vivencial' THEN '¡Estás participando del sorteo!'
      ELSE 'Canje realizado'
    END,
    CASE
      WHEN v_benefit.tipo = 'curso_gratis' THEN 'Ya tenés acceso a ' || COALESCE(v_curso_titulo, v_benefit.titulo) || '.'
      WHEN v_benefit.tipo = 'sorteo_vivencial' THEN 'Canjeaste ' || v_chances || ' chance(s) en "' || v_benefit.titulo || '".'
      WHEN v_benefit.tipo IN ('descuento_pct','descuento_fijo') THEN 'Tu descuento en "' || COALESCE(v_curso_titulo, v_benefit.titulo) || '" se aplica automáticamente cuando compres el curso.'
      ELSE 'Canjeaste "' || v_benefit.titulo || '". Nos vamos a contactar con vos.'
    END,
    CASE WHEN v_benefit.tipo = 'curso_gratis' AND v_slug IS NOT NULL THEN '/cursos/' || v_slug ELSE '/perfil' END
  );

  RETURN jsonb_build_object(
    'redemption_id', v_redemption_id,
    'estado', v_estado,
    'enrollment_id', v_enrollment_id,
    'creditos_gastados', v_costo,
    'saldo_nuevo', v_saldo - v_costo
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_benefit(uuid, uuid, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_benefit(uuid, uuid, integer, boolean) TO service_role;
