-- ============================================================
-- Políticas RLS completas: publicaciones + reportes
-- ============================================================
--
-- CONTEXTO:
--   Las funciones moderar_reporte, get_dashboard_stats y todas
--   las RPCs de suspensión son SECURITY DEFINER, por lo que
--   ignoran estas políticas. Solo afectan a llamadas directas
--   desde el cliente (TS/Angular a través de Supabase PostgREST).
--
-- ROLES:
--   anon          → visitante sin sesión
--   authenticated → cualquier usuario con sesión activa
--   es_admin()    → función helper que verifica rol admin en perfiles
--
-- POLÍTICAS YA EXISTENTES (no se tocan):
--   publicaciones: INSERT  "Usuarios activos pueden publicar"
--   publicaciones: UPDATE  "Usuarios activos pueden editar sus publicaciones"
--   reportes:      INSERT  "Usuarios activos pueden crear reportes"
-- ============================================================


-- ── 0. Helper es_admin() ────────────────────────────────────
-- Comprueba si el usuario actual tiene rol con nombre 'admin'.
-- SECURITY DEFINER para poder leer perfiles sin loops de RLS.
-- Se usa CREATE OR REPLACE por si ya existe en la base de datos.

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.perfiles p
    JOIN   public.roles    r ON r.id = p.rol_id
    WHERE  p.id         = auth.uid()
      AND  lower(r.nombre) LIKE '%admin%'
  );
$$;

GRANT EXECUTE ON FUNCTION public.es_admin() TO authenticated;


-- ── 1. Habilitar RLS ────────────────────────────────────────
-- Idempotente: si ya estaba habilitado no produce error.

ALTER TABLE public.publicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TABLA: publicaciones
-- ============================================================

-- ── SELECT ──────────────────────────────────────────────────

-- Anónimo: solo publicaciones activas
-- (cubre visitas sin sesión y acceso a la vista feed_posts)
DROP POLICY IF EXISTS "Anon ve publicaciones activas" ON public.publicaciones;
CREATE POLICY "Anon ve publicaciones activas"
  ON public.publicaciones FOR SELECT
  TO anon
  USING (estado = 'activo');

-- Usuario autenticado: activas + sus propias pendientes
-- Esto permite que getOwnPendingPosts() y el feed mixto funcionen
DROP POLICY IF EXISTS "Usuarios ven activas y propias pendientes" ON public.publicaciones;
CREATE POLICY "Usuarios ven activas y propias pendientes"
  ON public.publicaciones FOR SELECT
  TO authenticated
  USING (
    estado = 'activo'
    OR (estado = 'pendiente' AND autor_id = auth.uid())
  );

-- Admin: acceso total (necesario para el panel de administración)
-- Se combina con la política anterior con OR automático de PostgreSQL
DROP POLICY IF EXISTS "Admin ve todas las publicaciones" ON public.publicaciones;
CREATE POLICY "Admin ve todas las publicaciones"
  ON public.publicaciones FOR SELECT
  TO authenticated
  USING (es_admin());

-- ── UPDATE (admin) ───────────────────────────────────────────
-- La política existente cubre al autor editando sus propios posts.
-- Esta cubre a un admin cambiando estado (aprobar / eliminar).

DROP POLICY IF EXISTS "Admin puede actualizar publicaciones" ON public.publicaciones;
CREATE POLICY "Admin puede actualizar publicaciones"
  ON public.publicaciones FOR UPDATE
  TO authenticated
  USING (es_admin());

-- ── DELETE (admin, solo emergencias) ────────────────────────
-- deletePost() en publication.service.ts está marcado como emergencia.
-- Los borrados normales van por softDelete (UPDATE estado='eliminado').

DROP POLICY IF EXISTS "Admin puede eliminar publicaciones" ON public.publicaciones;
CREATE POLICY "Admin puede eliminar publicaciones"
  ON public.publicaciones FOR DELETE
  TO authenticated
  USING (es_admin());


-- ============================================================
-- TABLA: reportes
-- ============================================================

-- ── SELECT ──────────────────────────────────────────────────

-- Usuario autenticado: solo sus propios reportes
-- (permite mostrar al usuario el historial de lo que reportó)
DROP POLICY IF EXISTS "Usuarios ven sus propios reportes" ON public.reportes;
CREATE POLICY "Usuarios ven sus propios reportes"
  ON public.reportes FOR SELECT
  TO authenticated
  USING (reportado_por = auth.uid());

-- Admin: todos los reportes
-- (necesario para admin_reports VIEW, listas y conteos del panel)
DROP POLICY IF EXISTS "Admin ve todos los reportes" ON public.reportes;
CREATE POLICY "Admin ve todos los reportes"
  ON public.reportes FOR SELECT
  TO authenticated
  USING (es_admin());

-- ── UPDATE (admin) ───────────────────────────────────────────
-- Cubre updateReportStatus() y discardReport() que llaman
-- .update() directo a la tabla desde el panel de administración.
-- (moderar_reporte RPC no necesita esto porque es SECURITY DEFINER)

DROP POLICY IF EXISTS "Admin puede actualizar reportes" ON public.reportes;
CREATE POLICY "Admin puede actualizar reportes"
  ON public.reportes FOR UPDATE
  TO authenticated
  USING (es_admin());

-- ── DELETE (admin, solo emergencias) ────────────────────────
-- deleteReport() está marcado como "solo casos extremos".

DROP POLICY IF EXISTS "Admin puede eliminar reportes" ON public.reportes;
CREATE POLICY "Admin puede eliminar reportes"
  ON public.reportes FOR DELETE
  TO authenticated
  USING (es_admin());


-- ── 2. Permisos sobre la vista admin_reports ────────────────
-- La vista es SECURITY INVOKER (por defecto), así que las
-- políticas SELECT de "Admin ve todos los reportes" ya son
-- suficientes. Solo necesitamos el GRANT de lectura.

GRANT SELECT ON public.reportes TO authenticated;


-- ── 3. Reload del schema cache de PostgREST ─────────────────

NOTIFY pgrst, 'reload schema';
