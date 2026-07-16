-- Bloques 2 y 3 — Racha de 30 días + bono de registro.
-- Aplicada en producción vía MCP el 2026-07-16 (registro reproducible en el repo).

-- Bloque 2: ancla de la ventana de racha, separada de ultimo_acceso_leccion (que
-- es la última actividad). Con un solo campo no se puede distinguir "cruzó una
-- ventana de 30 días" de "hubo un gap > 30 días"; se necesitan ambos.
alter table public.academy_profiles
  add column if not exists streak_window_start timestamptz;

-- Bloque 3: bono de bienvenida por ALTA de cuenta (registro) para todo usuario
-- nuevo, agregado al trigger existente handle_new_user (corre una vez por usuario,
-- idempotente). Además se alinea referido_registrado a la tabla nueva (0 XP / 20
-- créditos). El resto del trigger queda igual.
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

  -- Bono de bienvenida por registro (todo usuario nuevo). +20 XP / +20 Créditos.
  -- Único caso donde el XP no viene de formación: es un bono a propósito.
  PERFORM award_points_and_credits(NEW.id, 20, 20, 'ganado', 'registro', NEW.id);

  IF v_tipo IS NOT NULL THEN
    UPDATE academy_profiles SET tipo_cuenta = v_tipo WHERE user_id = NEW.id;
  END IF;

  IF v_ref_code IS NOT NULL THEN
    SELECT user_id INTO v_referrer
    FROM academy_profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;

    IF v_referrer IS NOT NULL AND v_referrer <> NEW.id THEN
      IF NOT EXISTS (
        SELECT 1 FROM academy_referrals
        WHERE referrer_id = v_referrer AND referred_id = NEW.id
      ) THEN
        INSERT INTO academy_referrals (referrer_id, referred_id, estado, creditos_otorgados)
        VALUES (v_referrer, NEW.id, 'completado', TRUE);

        PERFORM award_points_and_credits(v_referrer, 0, 20, 'ganado', 'referido_registrado', NEW.id);
        PERFORM award_points_and_credits(NEW.id, 0, 50, 'ganado', 'bono_bienvenida', NULL);
      END IF;
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
