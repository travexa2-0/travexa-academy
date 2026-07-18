-- Fix: el bono de registro NO se acumula con el de referido.
-- Antes: usuario referido cobraba 20 (registro) + 50 (bono_bienvenida) = 70 créditos,
-- en dos llamadas separadas a award_points_and_credits (la de bono_bienvenida se
-- saltaba award-points / la tabla de 13 acciones — deuda técnica que arrastrábamos).
-- Ahora: si el registro es referido, el bono de registro pasa directo de 20 a 50
-- créditos (no 20+50), en una sola transacción con motivo 'registro'. El XP de
-- registro queda en 20 en ambos casos.
--
-- Para poder decidir el monto en el momento de otorgar, se mueve el lookup de
-- v_referrer ANTES del bono de registro. El resto del bloque de referido (insert en
-- academy_referrals + premio al referrer con referido_registrado) queda igual.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_meta      jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_full_name text  := NULLIF(TRIM(v_meta->>'full_name'), '');
  v_nombre    text;
  v_apellido  text;
  v_tipo      text  := NULLIF(TRIM(v_meta->>'tipo_cuenta'), '');
  v_ref_code  text  := NULLIF(TRIM(v_meta->>'referral_code'), '');
  v_referrer  uuid;
BEGIN
  v_nombre := COALESCE(
    NULLIF(TRIM(v_meta->>'nombre'), ''),
    NULLIF(TRIM(v_meta->>'given_name'), ''),
    NULLIF(TRIM(split_part(COALESCE(v_full_name, v_meta->>'name'), ' ', 1)), '')
  );

  v_apellido := COALESCE(
    NULLIF(TRIM(v_meta->>'apellido'), ''),
    NULLIF(TRIM(v_meta->>'family_name'), ''),
    NULLIF(
      TRIM(
        substring(
          COALESCE(v_full_name, v_meta->>'name')
          from position(' ' in COALESCE(v_full_name, v_meta->>'name')) + 1
        )
      ),
      ''
    )
  );

  INSERT INTO profiles (id, email, nombre, apellido)
  VALUES (NEW.id, NEW.email, v_nombre, v_apellido)
  ON CONFLICT (id) DO NOTHING;

  -- Lookup del referrer ANTES del bono de registro, para saber en este momento si
  -- es un registro referido válido (existe el código y el referrer no es el mismo
  -- usuario nuevo). Así el monto del bono de registro se puede calcular en una sola
  -- llamada, sin una transacción extra que se acumule.
  IF v_ref_code IS NOT NULL THEN
    SELECT user_id INTO v_referrer
    FROM academy_profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;

    -- Un referrer que sea el mismo usuario nuevo no cuenta como referido válido.
    IF v_referrer = NEW.id THEN
      v_referrer := NULL;
    END IF;
  END IF;

  -- Bono de registro por ALTA de cuenta (todo usuario nuevo). +20 XP siempre.
  -- Créditos: 50 si el registro es referido (absorbe al viejo bono_bienvenida,
  -- NO se suma), 20 si no. Único caso donde el XP no viene de formación.
  PERFORM award_points_and_credits(
    NEW.id,
    20,
    CASE WHEN v_referrer IS NOT NULL THEN 50 ELSE 20 END,
    'ganado',
    'registro',
    NEW.id
  );

  IF v_tipo IS NOT NULL THEN
    UPDATE academy_profiles SET tipo_cuenta = v_tipo WHERE user_id = NEW.id;
  END IF;

  -- Alta del referral + premio al referrer. El bono del usuario nuevo ya se otorgó
  -- arriba (paso registro), acá NO se le vuelve a dar nada. El NOT EXISTS protege el
  -- insert del referral y el premio al referrer contra duplicados por-fila.
  IF v_referrer IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM academy_referrals
      WHERE referrer_id = v_referrer AND referred_id = NEW.id
    ) THEN
      INSERT INTO academy_referrals (referrer_id, referred_id, estado, creditos_otorgados)
      VALUES (v_referrer, NEW.id, 'completado', TRUE);

      PERFORM award_points_and_credits(v_referrer, 0, 20, 'ganado', 'referido_registrado', NEW.id);
    END IF;
  END IF;

  -- Auto-link: si ya existe un instructor cargado con este email y sin
  -- cuenta vinculada, se linkea automáticamente (caso: instructor se
  -- registra DESPUÉS de haber sido cargado por el admin). Match case-insensitive.
  UPDATE academy_instructors
  SET user_id = NEW.id
  WHERE user_id IS NULL AND lower(trim(email)) = lower(trim(NEW.email));

  RETURN NEW;
END;
$function$;
