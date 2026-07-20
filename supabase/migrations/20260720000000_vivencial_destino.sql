-- ============================================================================
-- PROPUESTA — NO APLICADA (regla: los cambios de DB se proponen, no se aplican).
-- Vivencial: campo "Destino" (continente/zona) independiente de País.
--
-- Contexto: hasta ahora el único dato geográfico era vivencial_pais, que además
-- se usa como título principal del hero público. Hay viajes que no son de un
-- país sino de una zona/continente (ej. "Europa") y no había forma de cargarlo.
--
-- 100% ADITIVA. No borra ni modifica ninguna columna existente. Los vivenciales
-- que hoy solo tienen País cargado siguen funcionando exactamente igual:
-- vivencial_destino queda NULL y vivencial_destino_como_titulo en false (default),
-- así el hero mantiene País como título tal como estaba.
-- ============================================================================

-- ── Destino (continente/zona) ────────────────────────────────────────────────
-- Texto libre a nivel DB (sin CHECK), igual de flexible que vivencial_pais. La
-- lista de valores válidos vive en el front (DESTINOS en src/types/index.ts),
-- mismo patrón que PAISES. Ambos campos (país y destino) son opcionales y ninguno
-- es prerequisito del otro.
alter table academy_courses
  add column if not exists vivencial_destino text;

-- ── Toggle de título del hero ────────────────────────────────────────────────
-- Controla si el hero/portada del detalle público muestra Destino en vez de País
-- como título principal. Solo tiene efecto útil si vivencial_destino tiene valor;
-- si está en true pero Destino está vacío, el front cae al comportamiento actual
-- (título = País). Default false → todos los vivenciales existentes no cambian.
alter table academy_courses
  add column if not exists vivencial_destino_como_titulo boolean not null default false;

comment on column academy_courses.vivencial_destino is
  'Continente/zona del vivencial (ej. Europa). Independiente de vivencial_pais; ambos opcionales. Valores válidos definidos en el front (DESTINOS).';
comment on column academy_courses.vivencial_destino_como_titulo is
  'Si true y vivencial_destino tiene valor, el hero público muestra Destino como título principal en vez de País. Default false = comportamiento histórico (título = País).';
