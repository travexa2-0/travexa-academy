-- ============================================================================
-- PROPUESTA — NO APLICADA (regla: los cambios de DB se proponen, no se aplican).
--
-- Vivenciales v3 — RESERVA AUTOMÁTICA DESDE LA PLATAFORMA (reemplaza el cierre
-- de venta por WhatsApp de §7). El usuario reserva solo desde Travexa; el dinero
-- SIGUE siendo transferencia/depósito bancario coordinado por Yesica (mismo ledger
-- academy_vivencial_payments). Lo que se automatiza es la RESERVA + la comunicación
-- de datos bancarios, no el cobro (Mercado Pago sigue sin usarse en vivenciales).
--
-- ⚠️ DECISIÓN DE NEGOCIO A CONFIRMAR por Yesica/Nico antes de dar por cerrado.
--
-- 100% ADITIVA. No borra ni modifica columnas existentes.
-- Depende de que exista `academy_reserve_vivencial_spot` (ya en producción).
-- ============================================================================

-- ── 1) Número de reserva legible ────────────────────────────────────────────
-- Formato: VIV-{año}-{consecutivo de 5 dígitos}, ej. VIV-2026-00001.
-- Secuencia global (no reinicia por año): el año en el prefijo es informativo y
-- el consecutivo garantiza unicidad. Se asigna por trigger a TODA inscripción de
-- un curso tipo 'vivencial' (cubre la reserva self-service, el alta manual de
-- Yesica y el RPC de fallback, sin importar el camino de inserción).
create sequence if not exists academy_reserva_seq;

alter table academy_enrollments
  add column if not exists numero_reserva text;

-- Unicidad (permite múltiples NULL para inscripciones de cursos no-vivenciales).
create unique index if not exists uq_academy_enrollments_numero_reserva
  on academy_enrollments (numero_reserva)
  where numero_reserva is not null;

-- Punto de salida/embarque que eligió el viajero al reservar (texto legible,
-- ej. "Buenos Aires — Terminal 2, mostrador Aerolíneas, 3hs antes"). Se toma de
-- vivencial_puntos_salida del curso al momento de reservar. Nullable.
alter table academy_enrollments
  add column if not exists punto_salida_elegido text;

-- ── 2) Trigger de asignación de numero_reserva ──────────────────────────────
create or replace function public.academy_assign_numero_reserva()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.numero_reserva is null
     and exists (select 1 from academy_courses
                 where id = new.course_id and tipo = 'vivencial') then
    new.numero_reserva :=
      'VIV-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('academy_reserva_seq')::text, 5, '0');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_academy_assign_numero_reserva on academy_enrollments;
create trigger trg_academy_assign_numero_reserva
  before insert on academy_enrollments
  for each row execute function public.academy_assign_numero_reserva();

-- ── 3) RPC de reserva self-service ──────────────────────────────────────────
-- Igual que academy_reserve_vivencial_spot pero además persiste el punto de
-- salida elegido por el viajero. numero_reserva lo pone el trigger anterior.
-- Idempotente: si ya hay enrollment activo, lo devuelve tal cual.
create or replace function public.academy_reserve_vivencial_self(
  p_course_id uuid,
  p_punto_salida text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_enrollment_id uuid;
  v_cupo integer;
  v_precio_total numeric;
  v_fecha_salida date;
  v_dias_limite integer;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select id into v_enrollment_id
  from academy_enrollments
  where user_id = v_user_id and course_id = p_course_id and activo = true
  limit 1;

  if v_enrollment_id is not null then
    -- Ya reservó: completa el punto de salida si venía vacío, no re-descuenta cupo.
    update academy_enrollments
    set punto_salida_elegido = coalesce(punto_salida_elegido, p_punto_salida),
        updated_at = now()
    where id = v_enrollment_id;
    return v_enrollment_id;
  end if;

  select vivencial_cupo_disponible, precio_ars, vivencial_fecha_salida
  into v_cupo, v_precio_total, v_fecha_salida
  from academy_courses
  where id = p_course_id and tipo = 'vivencial' and publicado = true and archivado = false
  for update;

  if v_cupo is null then
    raise exception 'Vivencial no encontrado o no disponible';
  end if;

  if v_cupo <= 0 then
    raise exception 'Sin cupo disponible';
  end if;

  select coalesce((value #>> '{}')::integer, 7) into v_dias_limite
  from academy_settings where key = 'dias_limite_pago_vivencial';

  insert into academy_enrollments
    (user_id, course_id, tipo_acceso, activo, monto_total_ars, fecha_limite_pago, punto_salida_elegido)
  values (
    v_user_id, p_course_id, 'pago', true, v_precio_total,
    case when v_fecha_salida is not null then v_fecha_salida - coalesce(v_dias_limite, 7) else null end,
    p_punto_salida
  )
  on conflict (user_id, course_id) do update
  set activo = true,
      monto_total_ars = coalesce(academy_enrollments.monto_total_ars, excluded.monto_total_ars),
      fecha_limite_pago = coalesce(academy_enrollments.fecha_limite_pago, excluded.fecha_limite_pago),
      punto_salida_elegido = coalesce(academy_enrollments.punto_salida_elegido, excluded.punto_salida_elegido),
      updated_at = now()
  returning id into v_enrollment_id;

  update academy_courses
  set vivencial_cupo_disponible = vivencial_cupo_disponible - 1
  where id = p_course_id;

  return v_enrollment_id;
end;
$function$;

-- ── 4) Campos del formulario "Informar transferencia" (perfil del viajero) ──
-- La tabla academy_vivencial_payments ya existe (ledger). `tipo` distingue
-- seña/saldo; estos campos nuevos capturan los DATOS del depósito/transferencia
-- que hoy Yesica pedía por chat. Todos nullable (compat. con filas viejas y con
-- los pagos que carga Yesica desde el backoffice).
alter table academy_vivencial_payments
  add column if not exists metodo             text,  -- 'deposito' | 'transferencia'
  add column if not exists depositante_nombre text,
  add column if not exists depositante_dni    text,
  add column if not exists cupon_numero       text,  -- N° de cupón / comprobante
  add column if not exists cuenta_destino      text; -- alias/banco de la cuenta elegida

-- ── 5) DNI del cliente (dato de perfil, capturado en onboarding) ────────────
-- Confirmado (Sesión 20): el DNI NO va como columna suelta en el pago ni en el
-- vivencial. Es un dato de perfil del asesor: se pide en el onboarding y se lee
-- desde academy_profiles en el backoffice y en la liquidación PDF (reemplaza el
-- "—" actual). Nullable para no romper perfiles ya creados.
alter table academy_profiles
  add column if not exists dni text;

-- ============================================================================
-- DECISIONES DE DISEÑO — CONFIRMADAS POR NICO/YESICA (Sesión 20):
--
-- 1) numero_reserva: secuencia GLOBAL con año informativo en el prefijo
--    (VIV-2026-00001). No reinicia el consecutivo cada año. Si querés reinicio
--    anual real, se resuelve con una tabla de contador por año en vez de secuencia.
--
-- 2) El trigger asigna numero_reserva a TODA inscripción de vivencial (incluida
--    el alta manual de Yesica), no solo a la self-service. Así el número existe
--    siempre, venga del camino que venga.
--
-- 3) travexa_datos_transferencia (setting ya existente): CONFIRMADO que alcanza
--    con UNA sola cuenta {cbu, alias, banco, titular}. No se agrega soporte de
--    array. (El código igual tolera un array si algún día se carga, sin costo.)
--
-- 4) DNI del cliente: se captura en el onboarding hacia academy_profiles.dni y se
--    lee desde ahí (backoffice + PDF). Ver sección 5.
-- ============================================================================
