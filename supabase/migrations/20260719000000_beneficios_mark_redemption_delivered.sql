-- Admin marca un canje tipo 'otro' como entregado (estado 'activo' -> 'usado').
-- SECURITY DEFINER con chequeo is_academy_admin(): la tabla sigue cerrada a
-- updates del cliente común; solo esta transición acotada está permitida.
CREATE OR REPLACE FUNCTION public.mark_redemption_delivered(p_redemption_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_academy_admin() THEN
    RAISE EXCEPTION 'NO_AUTORIZADO';
  END IF;
  UPDATE academy_credit_redemptions
  SET estado = 'usado', usado_at = now()
  WHERE id = p_redemption_id AND tipo = 'otro' AND estado = 'activo';
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_redemption_delivered(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_redemption_delivered(uuid) TO authenticated;
