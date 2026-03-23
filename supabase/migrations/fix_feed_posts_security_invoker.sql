-- ============================================================
-- FIX: Cambiar feed_posts de SECURITY DEFINER a SECURITY INVOKER
-- ============================================================
--
-- PROBLEMA DETECTADO:
--   La vista public.feed_posts está definida con SECURITY DEFINER
--   (o sin configuración explícita), lo que ejecuta queries con
--   permisos del creador/admin en lugar del usuario.
--
-- RIESGO:
--   - Bypass de RLS policies de las tablas subyacentes
--   - Usuarios podrían ver datos que no deberían
--
-- SOLUCIÓN:
--   1. Recrear la vista con SECURITY INVOKER
--   2. Asegurar que tabla 'anuncios' tenga políticas RLS compatibles
--
-- ============================================================

-- PASO 0: Asegurar que tabla 'anuncios' tenga RLS correctamente configurado
-- (la tabla 'publicaciones' ya tiene RLS desde rls_complete_policies.sql)

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

-- Política SELECT para anuncios: todos los usuarios autenticados pueden ver anuncios activos
-- (los anuncios son contenido oficial de Tuunka, deben ser visibles para todos)

DROP POLICY IF EXISTS "Usuarios pueden ver anuncios activos" ON public.anuncios;
CREATE POLICY "Usuarios pueden ver anuncios activos"
  ON public.anuncios FOR SELECT
  TO authenticated
  USING (estado = 'activo');

-- Admin puede ver todos los anuncios (para gestión en panel admin)
DROP POLICY IF EXISTS "Admin puede ver todos los anuncios" ON public.anuncios;
CREATE POLICY "Admin puede ver todos los anuncios"
  ON public.anuncios FOR SELECT
  TO authenticated
  USING (es_admin());

-- Grant necesario
GRANT SELECT ON public.anuncios TO authenticated;

-- PASO 1: Eliminar la vista existente
-- PASO 2: Recrear la vista con SECURITY INVOKER explícito
CREATE OR REPLACE VIEW public.feed_posts
WITH (security_invoker = true)  -- ✅ Ejecuta con permisos del usuario
AS

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

-- PASO 3: Re-aplicar permisos
GRANT SELECT ON public.feed_posts TO authenticated;

-- PASO 4: Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
