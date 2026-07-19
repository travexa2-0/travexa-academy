-- Beneficios — sorteo (draw_benefit_winner) + vencimiento de créditos (expire_credits_run)
-- Ya aplicadas en producción. Versionado para paridad del repo.
-- SECURITY DEFINER + EXECUTE solo para service_role.

CREATE OR REPLACE FUNCTION public.draw_benefit_winner(p_benefit_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_benefit academy_benefits%ROWTYPE;
  v_total_chances BIGINT;
  v_pick BIGINT;
  v_winner_user UUID;
  v_winner_redemption UUID;
BEGIN
  SELECT * INTO v_benefit FROM academy_benefits WHERE id = p_benefit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'BENEFICIO_INEXISTENTE'; END IF;
  IF v_benefit.tipo <> 'sorteo_vivencial' THEN RAISE EXCEPTION 'NO_ES_SORTEO'; END IF;
  IF v_benefit.sorteo_realizado_at IS NOT NULL THEN RAISE EXCEPTION 'SORTEO_YA_REALIZADO'; END IF;

  SELECT COALESCE(SUM(cantidad_chances), 0) INTO v_total_chances
  FROM academy_credit_redemptions
  WHERE benefit_id = p_benefit_id AND estado = 'activo';
  IF v_total_chances = 0 THEN RAISE EXCEPTION 'SIN_PARTICIPANTES'; END IF;

  -- Selección uniforme sobre el total de chances (ponderado por suma acumulada)
  v_pick := floor(random() * v_total_chances)::BIGINT + 1;
  SELECT user_id, id INTO v_winner_user, v_winner_redemption
  FROM (
    SELECT id, user_id,
           SUM(cantidad_chances) OVER (ORDER BY created_at, id) AS acumulado
    FROM academy_credit_redemptions
    WHERE benefit_id = p_benefit_id AND estado = 'activo'
  ) t
  WHERE t.acumulado >= v_pick
  ORDER BY t.acumulado
  LIMIT 1;

  -- Resultado: ganador (todas sus participaciones) / no ganadores
  UPDATE academy_credit_redemptions
  SET estado = CASE WHEN user_id = v_winner_user THEN 'ganador' ELSE 'no_ganador' END,
      usado_at = now()
  WHERE benefit_id = p_benefit_id AND estado = 'activo';

  UPDATE academy_benefits
  SET ganador_user_id = v_winner_user,
      ganador_anunciado_at = now(),
      sorteo_realizado_at = now(),
      publicado = false,
      updated_at = now()
  WHERE id = p_benefit_id;

  -- Notificaciones
  INSERT INTO academy_notifications (user_id, tipo, titulo, mensaje, url)
  SELECT DISTINCT r.user_id,
         'sorteo_resultado',
         CASE WHEN r.user_id = v_winner_user THEN '🏆 ¡Ganaste el sorteo!' ELSE 'Sorteo realizado' END,
         CASE WHEN r.user_id = v_winner_user
              THEN '¡Ganaste "' || v_benefit.titulo || '"! Nos vamos a contactar con vos.'
              ELSE '"' || v_benefit.titulo || '" ya tiene ganador. ¡Gracias por participar!' END,
         '/perfil'
  FROM academy_credit_redemptions r
  WHERE r.benefit_id = p_benefit_id AND r.estado IN ('ganador','no_ganador');

  RETURN jsonb_build_object(
    'ganador_user_id', v_winner_user,
    'total_chances', v_total_chances
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.expire_credits_run()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_afectados INTEGER := 0;
  v_total_vencido BIGINT := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.user_id,
           GREATEST(0,
             COALESCE(SUM(t.puntos) FILTER (WHERE t.puntos > 0 AND t.created_at < now() - interval '1 year'), 0)
             - COALESCE(ABS(SUM(t.puntos) FILTER (WHERE t.puntos < 0)), 0)
           ) AS a_vencer
    FROM academy_points_transactions t
    WHERE t.pool = 'creditos' AND t.user_id IS NOT NULL
    GROUP BY t.user_id
    HAVING GREATEST(0,
             COALESCE(SUM(t.puntos) FILTER (WHERE t.puntos > 0 AND t.created_at < now() - interval '1 year'), 0)
             - COALESCE(ABS(SUM(t.puntos) FILTER (WHERE t.puntos < 0)), 0)
           ) > 0
  LOOP
    INSERT INTO academy_points_transactions (user_id, puntos, tipo, motivo, pool)
    VALUES (r.user_id, -r.a_vencer, 'vencido', 'Créditos vencidos (1 año)', 'creditos');

    UPDATE academy_profiles
    SET creditos = GREATEST(0, creditos - r.a_vencer), updated_at = now()
    WHERE user_id = r.user_id;

    v_afectados := v_afectados + 1;
    v_total_vencido := v_total_vencido + r.a_vencer;
  END LOOP;

  RETURN jsonb_build_object('usuarios_afectados', v_afectados, 'creditos_vencidos', v_total_vencido);
END;
$function$;

REVOKE ALL ON FUNCTION public.draw_benefit_winner(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_benefit_winner(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.expire_credits_run() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_credits_run() TO service_role;
