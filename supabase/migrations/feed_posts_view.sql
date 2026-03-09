-- =============================================================
--  Vista: feed_posts
--  Combina publicaciones activas y anuncios activos en un solo
--  recurso de lectura para el feed del frontend.
--
--  Ventajas vs. 2 queries separadas:
--   - Una sola roundtrip a la BD para construir el feed.
--   - JOIN con perfiles ya resuelto en la BD (no en el frontend).
--   - El frontend ya no necesita combinar ni ordenar dos arrays.
--
--  Cómo aplicarla:
--  1. Abre el SQL Editor en Supabase.
--  2. Pega y ejecuta este bloque completo.
--  3. La vista queda disponible como tabla virtual.
-- =============================================================

CREATE OR REPLACE VIEW feed_posts AS

-- ── Publicaciones activas con JOIN a perfiles ─────────────────
SELECT
  p.id::text                                        AS id,
  p.titulo                                          AS titulo,
  p.descripcion                                     AS descripcion,
  p.tipo                                            AS tipo,
  p.creado                                          AS creado,
  p.imagen_url                                      AS imagen_url,
  p.imagenes_url                                    AS imagenes_url,
  COALESCE(p.categoria, 'General')                  AS categoria,
  p.detalles                                        AS detalles,
  p.estado                                          AS estado,
  p.autor_id::text                                  AS autor_id,
  perf.nombre                                       AS autor_nombre,
  perf.apellidos                                    AS autor_apellidos,
  perf.foto_url                                     AS autor_foto_url,
  perf.carrera_id::text                             AS autor_carrera_id,
  COALESCE(rol.nombre, 'Miembro')                   AS autor_rol,
  'publicacion'                                     AS fuente
FROM publicaciones p
LEFT JOIN perfiles perf ON perf.id = p.autor_id
LEFT JOIN roles    rol  ON rol.id  = perf.rol_id
WHERE p.estado = 'activo'

UNION ALL

-- ── Anuncios activos (se tratan como posts de tipo Aviso Oficial) ──
SELECT
  ('anuncio-' || a.id::text)                        AS id,
  a.titulo                                          AS titulo,
  a.descripcion                                     AS descripcion,
  'Aviso Oficial'                                   AS tipo,
  a.creado                                          AS creado,
  a.imagen_url                                      AS imagen_url,
  NULL::text[]                                      AS imagenes_url,
  COALESCE(NULLIF(a.ciudad, 'Todas'), 'General')    AS categoria,
  jsonb_build_object(
    'contacto_url', a.contacto_url,
    'fecha_inicio',  a.fecha_inicio,
    'fecha_fin',     a.fecha_fin
  )                                                 AS detalles,
  a.estado                                          AS estado,
  'admin_tuunka'                                    AS autor_id,
  'Tuunka'                                          AS autor_nombre,
  NULL::text                                        AS autor_apellidos,
  NULL::text                                        AS autor_foto_url,
  NULL::text                                        AS autor_carrera_id,
  'Administrador'                                   AS autor_rol,
  'anuncio'                                         AS fuente
FROM anuncios a
WHERE a.estado = 'activo';

-- ── Comentario: RLS ───────────────────────────────────────────
-- Las vistas en Supabase heredan el RLS de las tablas subyacentes
-- con SECURITY INVOKER (comportamiento por defecto).
-- Si el RLS está habilitado en `publicaciones` o `anuncios`,
-- los policies se aplican automáticamente sobre esta vista.


-- =============================================================
--  OPCIONAL: MATERIALIZED VIEW para alto volumen de posts
--  (descomentar si el proyecto crece y las queries se vuelven lentas)
-- =============================================================
/*
CREATE MATERIALIZED VIEW feed_posts_cache AS
  -- (mismo SELECT que arriba)
  ...
WITH DATA;

-- Índice para acelerar la ordenación por fecha
CREATE INDEX idx_feed_posts_cache_creado ON feed_posts_cache (creado DESC);

-- Refrescar la vista materializada (llamar tras cada INSERT/UPDATE relevante)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY feed_posts_cache;

-- Automatizar el refresh con un trigger (opcional avanzado):
-- CREATE OR REPLACE FUNCTION refresh_feed_posts_cache()
-- RETURNS TRIGGER LANGUAGE plpgsql AS $$
-- BEGIN
--   REFRESH MATERIALIZED VIEW CONCURRENTLY feed_posts_cache;
--   RETURN NULL;
-- END;
-- $$;
--
-- CREATE TRIGGER trg_refresh_feed
-- AFTER INSERT OR UPDATE OR DELETE ON publicaciones
-- FOR EACH STATEMENT EXECUTE FUNCTION refresh_feed_posts_cache();
*/
