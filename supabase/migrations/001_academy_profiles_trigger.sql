-- Trigger: profiles INSERT → crear academy_profile con defaults
-- Correr en: https://supabase.com/dashboard/project/fvrwtqhkskbaixqbxami/sql

CREATE OR REPLACE FUNCTION public.create_academy_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.academy_profiles (
    id,
    user_id,
    plan_name,
    subscription_status,
    tipo_cuenta,
    travexa_b2b_member,
    puntos,
    nivel,
    onboarding_completo
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'free',
    'free',
    'asesor',
    FALSE,
    0,
    1,
    FALSE
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_academy_profile_on_signup();
