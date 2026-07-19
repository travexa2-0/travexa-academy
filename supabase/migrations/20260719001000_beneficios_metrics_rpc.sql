-- Métricas de beneficios agregadas del lado server (admin-only). Evita depender
-- de policies de SELECT del cliente sobre points_transactions/profiles.
CREATE OR REPLACE FUNCTION public.academy_benefits_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v jsonb;
BEGIN
  IF NOT is_academy_admin() THEN RAISE EXCEPTION 'NO_AUTORIZADO'; END IF;
  SELECT jsonb_build_object(
    'creditos_circulacion', COALESCE((SELECT SUM(creditos) FROM academy_profiles), 0),
    'creditos_canjeados',  COALESCE((SELECT ABS(SUM(puntos)) FROM academy_points_transactions WHERE pool='creditos' AND tipo='canjeado'), 0),
    'creditos_vencidos',   COALESCE((SELECT ABS(SUM(puntos)) FROM academy_points_transactions WHERE pool='creditos' AND tipo='vencido'), 0),
    'canjes_totales',      COALESCE((SELECT COUNT(*) FROM academy_credit_redemptions), 0),
    'canjes_por_tipo', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('tipo', tipo, 'count', c) ORDER BY c DESC)
      FROM (SELECT tipo, COUNT(*) c FROM academy_credit_redemptions GROUP BY tipo) t
    ), '[]'::jsonb),
    'top_beneficios', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('titulo', COALESCE(bnf.titulo, 'Beneficio'), 'count', t.cnt) ORDER BY t.cnt DESC)
      FROM (SELECT benefit_id, COUNT(*) cnt FROM academy_credit_redemptions WHERE benefit_id IS NOT NULL GROUP BY benefit_id ORDER BY cnt DESC LIMIT 5) t
      LEFT JOIN academy_benefits bnf ON bnf.id = t.benefit_id
    ), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END;
$function$;

REVOKE ALL ON FUNCTION public.academy_benefits_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academy_benefits_metrics() TO authenticated;
