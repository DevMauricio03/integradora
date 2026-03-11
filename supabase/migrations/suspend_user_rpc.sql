-- ============================================================
-- Moderation System
-- Schema: public.perfiles (estado, fecha_suspension)
--         public.publicaciones (autor_id, estado)
--         public.reportes (publicacion_id, reportado_por, resuelto_por, resuelto_en, resolucion)
--         public.comentarios (autor_id, publicacion_id)
-- ============================================================


-- ── 1. is_user_suspended(uid) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_user_suspended(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      estado = 'suspendido'
      AND fecha_suspension > now()
    ),
    false
  )
  FROM public.perfiles
  WHERE id = uid;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO authenticated;


-- ── 2. apply_user_suspension(target_user_id, duration) ────────────────
-- Core suspension logic. No auth check.
-- Called only by functions that have already validated permissions.

CREATE OR REPLACE FUNCTION public.apply_user_suspension(
  target_user_id uuid,
  duration       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end timestamptz;
BEGIN
  CASE duration
    WHEN '1_day'     THEN v_end := now() + interval '1 day';
    WHEN '7_days'    THEN v_end := now() + interval '7 days';
    WHEN '30_days'   THEN v_end := now() + interval '30 days';
    WHEN 'permanent' THEN v_end := '9999-12-31'::timestamptz;
    ELSE
      RAISE EXCEPTION 'Invalid duration: %. Use 1_day, 7_days, 30_days or permanent.', duration;
  END CASE;

  UPDATE public.perfiles
  SET  estado           = 'suspendido',
       fecha_suspension = v_end
  WHERE id = target_user_id;
END;
$$;


-- ── 3. suspend_user(target_user_id, duration) ─────────────────────────
-- Admin user-management page entry point.

CREATE OR REPLACE FUNCTION public.suspend_user(
  target_user_id uuid,
  duration       text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_admin() THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado: se requiere rol admin');
  END IF;

  IF auth.uid() = target_user_id THEN
    RETURN json_build_object('success', false, 'error', 'No puedes suspenderte a ti mismo');
  END IF;

  PERFORM apply_user_suspension(target_user_id, duration);

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.suspend_user(uuid, text) TO authenticated;


-- ── 4. unsuspend_user(target_user) ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unsuspend_user(target_user uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT es_admin() THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado: se requiere rol admin');
  END IF;

  UPDATE public.perfiles
  SET  estado           = 'activo',
       fecha_suspension = NULL
  WHERE id = target_user;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unsuspend_user(uuid) TO authenticated;


-- ── 5. moderar_reporte(p_reporte_id, p_accion, p_horas) ───────────────
-- Report moderation workflow.
-- To suspend the post author the function follows:
--   reportes.publicacion_id → publicaciones.autor_id → perfiles.id
--
-- p_accion values (existing frontend contract):
--   'descartar'           → mark report resolved, no content action
--   'eliminar_publicacion'→ set publicacion.estado = 'eliminado'
--   'eliminar_comentario' → delete comentario from the database
--   'suspender_usuario'   → suspend post author via apply_user_suspension()
--
-- p_horas → duration mapping:
--   null / > 720 h → permanent
--   ≤ 24 h         → 1_day
--   ≤ 168 h        → 7_days
--   ≤ 720 h        → 30_days

CREATE OR REPLACE FUNCTION public.moderar_reporte(
  p_reporte_id uuid,
  p_accion     text,
  p_horas      integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pub_id   uuid;
  v_autor_id uuid;
  v_duration text;
BEGIN
  IF NOT es_admin() THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;

  -- Resolve post and its author from the pending report.
  -- Reports are linked to posts, not directly to users.
  SELECT rep.publicacion_id, pub.autor_id
  INTO   v_pub_id, v_autor_id
  FROM   public.reportes      rep
  JOIN   public.publicaciones pub ON pub.id = rep.publicacion_id
  WHERE  rep.id     = p_reporte_id
    AND  rep.estado = 'pendiente';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Reporte no encontrado o ya procesado'
    );
  END IF;

  CASE p_accion
    WHEN 'descartar' THEN
      NULL;

    WHEN 'eliminar_publicacion' THEN
      UPDATE public.publicaciones
      SET estado = 'eliminado'
      WHERE id = v_pub_id;

    WHEN 'eliminar_comentario' THEN
      -- Delete the comment (reported comment case only)
      DELETE FROM public.comentarios
      WHERE id = (SELECT comentario_id FROM public.reportes WHERE id = p_reporte_id);

    WHEN 'suspender_usuario' THEN
      v_duration := CASE
        WHEN p_horas IS NULL OR p_horas > 720 THEN 'permanent'
        WHEN p_horas <= 24                    THEN '1_day'
        WHEN p_horas <= 168                   THEN '7_days'
        ELSE                                       '30_days'
      END;
      PERFORM apply_user_suspension(v_autor_id, v_duration);

    ELSE
      RETURN json_build_object(
        'success', false,
        'error',   format('Acción inválida: %s', p_accion)
      );
  END CASE;

  UPDATE public.reportes
  SET  estado       = 'resuelto',
       resuelto_por = auth.uid(),
       resuelto_en  = now()
  WHERE id = p_reporte_id;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderar_reporte(uuid, text, integer) TO authenticated;


-- ── 6. RLS policies ────────────────────────────────────────────────────

-- publicaciones: create
DROP POLICY IF EXISTS "Usuarios activos pueden publicar" ON public.publicaciones;
CREATE POLICY "Usuarios activos pueden publicar"
  ON public.publicaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = autor_id
    AND NOT is_user_suspended(auth.uid())
  );

-- publicaciones: update
DROP POLICY IF EXISTS "Usuarios activos pueden editar sus publicaciones" ON public.publicaciones;
CREATE POLICY "Usuarios activos pueden editar sus publicaciones"
  ON public.publicaciones FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = autor_id
    AND NOT is_user_suspended(auth.uid())
  );

-- comentarios: create
DROP POLICY IF EXISTS "Usuarios activos pueden comentar" ON public.comentarios;
CREATE POLICY "Usuarios activos pueden comentar"
  ON public.comentarios FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = autor_id
    AND NOT is_user_suspended(auth.uid())
  );

-- reportes: create
DROP POLICY IF EXISTS "Usuarios activos pueden crear reportes" ON public.reportes;
CREATE POLICY "Usuarios activos pueden crear reportes"
  ON public.reportes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reportado_por
    AND NOT is_user_suspended(auth.uid())
  );


-- ── 7. Schema cache reload ─────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
