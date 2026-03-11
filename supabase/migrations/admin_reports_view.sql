-- ============================================================
-- Vista: admin_reports
-- Propósito: Unifica reportes de publicaciones y comentarios
--           para el panel de administración.
-- ============================================================

-- DROP VIEW IF EXISTS public.admin_reports CASCADE;

CREATE OR REPLACE VIEW public.admin_reports AS
SELECT
  -- Campos del reporte
  r.id,
  r.publicacion_id,
  r.comentario_id,
  r.tipo_reporte,
  r.reportado_por,
  r.motivo,
  r.descripcion,
  r.estado,
  r.creado,
  r.resuelto_por,
  r.resuelto_en,
  r.resolucion,

  -- Datos de la publicación (siempre, incluso para reportes de comentario)
  p.titulo          as pub_titulo,
  p.descripcion     as pub_descripcion,
  p.imagen_url      as pub_imagen_url,
  p.tipo            as pub_tipo,

  -- Datos del comentario (NULL si es reportes de publicación)
  c.contenido       as com_contenido,
  c.creado          as com_creado,

  -- Datos del autor de la publicación/comentario
  CASE
    WHEN r.tipo_reporte = 'comentario' THEN c.autor_id
    ELSE p.autor_id
  END               as autor_id,

  perfiles_autor.nombre        as autor_nombre,
  perfiles_autor.apellidos     as autor_apellidos,
  perfiles_autor.foto_url      as autor_foto_url,

  -- Datos del reportante
  r.reportado_por   as informante_id,
  perfiles_informante.nombre   as informante_nombre,
  perfiles_informante.apellidos as informante_apellidos,
  perfiles_informante.foto_url as informante_foto_url

FROM public.reportes r
LEFT JOIN public.publicaciones p ON p.id = r.publicacion_id
LEFT JOIN public.comentarios c ON c.id = r.comentario_id
LEFT JOIN public.perfiles perfiles_autor ON perfiles_autor.id = (
  CASE
    WHEN r.tipo_reporte = 'comentario' THEN c.autor_id
    ELSE p.autor_id
  END
)
LEFT JOIN public.perfiles perfiles_informante ON perfiles_informante.id = r.reportado_por;

-- ── Permisos ─────────────────────────────────────────────
GRANT SELECT ON public.admin_reports TO authenticated;
