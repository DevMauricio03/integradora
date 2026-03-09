-- =============================================================
--  Función RPC: get_dashboard_stats
--  Agrega en UNA sola llamada todas las estadísticas del dashboard.
--  Reemplaza 9 queries independientes por 1 llamada RPC.
--
--  Cómo aplicarla:
--  1. Abre el SQL Editor en Supabase (supabase.com → tu proyecto → SQL Editor)
--  2. Pega y ejecuta todo este bloque.
--  3. La función quedará disponible vía .rpc('get_dashboard_stats')
-- =============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now          TIMESTAMPTZ := now();
  v_curr_start   TIMESTAMPTZ := v_now - (p_days || ' days')::INTERVAL;
  v_prev_start   TIMESTAMPTZ := v_now - ((p_days * 2) || ' days')::INTERVAL;

  v_users_total   BIGINT := 0;
  v_users_curr    BIGINT := 0;
  v_users_prev    BIGINT := 0;

  v_posts_total   BIGINT := 0;
  v_posts_curr    BIGINT := 0;
  v_posts_prev    BIGINT := 0;

  v_reports_pending BIGINT := 0;
  v_reports_curr    BIGINT := 0;
  v_reports_prev    BIGINT := 0;

  v_chart_data    JSON;
  v_recent_users  JSON;
  v_quick_mod     JSON;
BEGIN
  -- ── Usuarios ──────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_users_total FROM perfiles;
  SELECT COUNT(*) INTO v_users_curr  FROM perfiles WHERE creado >= v_curr_start;
  SELECT COUNT(*) INTO v_users_prev  FROM perfiles WHERE creado >= v_prev_start AND creado < v_curr_start;

  -- ── Publicaciones ─────────────────────────────────────────────
  SELECT COUNT(*) INTO v_posts_total FROM publicaciones WHERE estado = 'activo';
  SELECT COUNT(*) INTO v_posts_curr  FROM publicaciones WHERE creado >= v_curr_start;
  SELECT COUNT(*) INTO v_posts_prev  FROM publicaciones WHERE creado >= v_prev_start AND creado < v_curr_start;

  -- ── Reportes ──────────────────────────────────────────────────
  BEGIN
    SELECT COUNT(*) INTO v_reports_pending FROM reportes WHERE estado = 'pendiente';
    SELECT COUNT(*) INTO v_reports_curr    FROM reportes WHERE creado >= v_curr_start;
    SELECT COUNT(*) INTO v_reports_prev    FROM reportes WHERE creado >= v_prev_start AND creado < v_curr_start;
  EXCEPTION WHEN undefined_table THEN
    -- La tabla reportes aún no existe → devolvemos 0
    v_reports_pending := 0; v_reports_curr := 0; v_reports_prev := 0;
  END;

  -- ── Chart data (fechas de publicaciones del período) ──────────
  SELECT json_agg(creado ORDER BY creado ASC)
  INTO v_chart_data
  FROM publicaciones
  WHERE creado >= v_curr_start;

  -- ── Usuarios recientes (5 últimos) ────────────────────────────
  SELECT json_agg(u)
  INTO v_recent_users
  FROM (
    SELECT
      p.nombre,
      p.apellidos,
      p."correoInstitucional",
      p.foto_url,
      p.creado,
      r.nombre  AS rol_nombre,
      u.acronimo AS universidad_acronimo
    FROM perfiles p
    LEFT JOIN roles       r ON r.id = p.rol_id
    LEFT JOIN universidades u ON u.id = p.universidad_id
    ORDER BY p.creado DESC
    LIMIT 5
  ) u;

  -- ── Moderación rápida (2 reportes pendientes) ─────────────────
  BEGIN
    SELECT json_agg(rep)
    INTO v_quick_mod
    FROM (
      SELECT
        r.id, r.motivo, r.descripcion, r.estado, r.creado,
        row_to_json(pub.*) AS publicaciones,
        row_to_json(inf.*) AS informante
      FROM reportes r
      LEFT JOIN publicaciones pub ON pub.id = r.publicacion_id
      LEFT JOIN perfiles      inf ON inf.id = r.reportado_por
      WHERE r.estado = 'pendiente'
      ORDER BY r.creado DESC
      LIMIT 2
    ) rep;
  EXCEPTION WHEN undefined_table THEN
    v_quick_mod := '[]'::JSON;
  END;

  -- ── Helper: calcular trend % ──────────────────────────────────
  -- trend = round(((curr - prev) / prev) * 100)
  -- Si prev = 0 → 100 si curr > 0, sino 0

  RETURN json_build_object(
    -- Usuarios
    'users_total',     v_users_total,
    'users_trend',     CASE
                         WHEN v_users_prev = 0 THEN (CASE WHEN v_users_curr > 0 THEN 100 ELSE 0 END)
                         ELSE ROUND(((v_users_curr - v_users_prev)::NUMERIC / v_users_prev) * 100)
                       END,
    -- Publicaciones
    'posts_total',     v_posts_total,
    'posts_trend',     CASE
                         WHEN v_posts_prev = 0 THEN (CASE WHEN v_posts_curr > 0 THEN 100 ELSE 0 END)
                         ELSE ROUND(((v_posts_curr - v_posts_prev)::NUMERIC / v_posts_prev) * 100)
                       END,
    -- Reportes
    'reports_pending', v_reports_pending,
    'reports_trend',   CASE
                         WHEN v_reports_prev = 0 THEN (CASE WHEN v_reports_curr > 0 THEN 100 ELSE 0 END)
                         ELSE ROUND(((v_reports_curr - v_reports_prev)::NUMERIC / v_reports_prev) * 100)
                       END,
    -- Gráfica & listas
    'chart_data',      COALESCE(v_chart_data,   '[]'::JSON),
    'recent_users',    COALESCE(v_recent_users, '[]'::JSON),
    'quick_mod',       COALESCE(v_quick_mod,    '[]'::JSON)
  );
END;
$$;

-- Permitir que el rol anónimo (y autenticado) ejecute la función
GRANT EXECUTE ON FUNCTION get_dashboard_stats(INTEGER) TO anon, authenticated;
