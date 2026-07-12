-- ============================================================================
-- PROPUESTA — NO APLICADA (regla: los cambios de DB se proponen, no se aplican).
-- Vivenciales v2: país/localidades, puntos de salida y hoteles múltiples,
-- desglose de precio (base + impuestos + gastos admin) y filtros públicos
-- (tipo de traslado, régimen de alimentos).
--
-- 100% ADITIVA. No borra ni modifica ninguna columna existente.
-- Las columnas viejas vivencial_ciudad_salida y vivencial_hotel quedan en la
-- tabla (deprecadas, por si tienen datos) — el wizard deja de usarlas como
-- fuente primaria pero las sigue poblando con la 1ª entrada para compatibilidad.
-- ============================================================================

-- ── Ubicación ───────────────────────────────────────────────────────────────
-- vivencial_pais YA EXISTE (text) — se deja el ADD IF NOT EXISTS por idempotencia,
-- pero en la práctica es no-op. Se reutiliza tal cual.
alter table academy_courses
  add column if not exists vivencial_pais text;

-- Localidades del destino: alimentan el filtro público "por localidad".
alter table academy_courses
  add column if not exists vivencial_localidades text[] default '{}'::text[];

-- ── Salida y alojamiento (múltiples) ────────────────────────────────────────
-- Puntos de salida: array de { ciudad, detalle_encuentro }.
-- detalle_encuentro es texto libre y cubre A LA VEZ el punto de embarque y las
-- instrucciones de encuentro (ej: "Terminal 2, mostrador Aerolíneas Argentinas,
-- 3hs antes del vuelo"). Absorbe el concepto de "punto de encuentro": no hay
-- campo separado. Reemplaza en el uso a vivencial_ciudad_salida (deprecada).
alter table academy_courses
  add column if not exists vivencial_puntos_salida jsonb default '[]'::jsonb;

-- Hoteles: array de { nombre, noches, link, foto_url }.
-- Reemplaza en el uso a vivencial_hotel (deprecada, no se borra).
alter table academy_courses
  add column if not exists vivencial_hoteles jsonb default '[]'::jsonb;

-- ── Precio: desglose ────────────────────────────────────────────────────────
-- Total final = base + impuestos + (base + impuestos) * gastos_admin_pct / 100.
-- El wizard calcula el total al guardar y lo persiste en precio_usd / precio_ars
-- (que pasan a representar el TOTAL FINAL). No hace falta trigger de DB.
alter table academy_courses
  add column if not exists vivencial_precio_base_usd  numeric,
  add column if not exists vivencial_precio_base_ars  numeric,
  add column if not exists vivencial_impuestos_usd    numeric,  -- monto fijo
  add column if not exists vivencial_impuestos_ars    numeric,  -- monto fijo
  add column if not exists vivencial_gastos_admin_pct numeric;  -- porcentaje, ej. 2.5

-- ── Filtros públicos ────────────────────────────────────────────────────────
-- Tipo de traslado: Bus | Aéreo | Navegación | Crucero.
alter table academy_courses
  add column if not exists vivencial_tipo_traslado text[] default '{}'::text[];

-- Régimen de alimentos: Desayuno | Almuerzo | Merienda | Cena |
--                       Media Pensión | Pensión Completa | All Inclusive.
alter table academy_courses
  add column if not exists vivencial_regimen_alimentos text[] default '{}'::text[];

-- ── Índices GIN para los filtros por array ──────────────────────────────────
create index if not exists idx_academy_courses_vivencial_localidades
  on academy_courses using gin (vivencial_localidades);

create index if not exists idx_academy_courses_vivencial_tipo_traslado
  on academy_courses using gin (vivencial_tipo_traslado);

-- ============================================================================
-- DECISIONES DE DISEÑO — CONFIRMADAS POR NICO (Sesión 20):
--
-- 1) "Punto de encuentro": NO es columna separada. Se resuelve con el texto libre
--    de cada `detalle_encuentro` dentro de vivencial_puntos_salida (renombrado
--    desde `punto_embarque` para reflejar que cubre embarque + encuentro). La
--    columna legacy vivencial_punto_encuentro queda intacta, deprecada.
--
-- 2) "Incluye / No incluye": se REUTILIZAN las columnas academy_courses.incluye y
--    .no_incluye (ya son text y ya se usan como texto enriquecido). NO se crean
--    vivencial_incluye_texto / vivencial_no_incluye_texto — serían un duplicado.
-- ============================================================================
