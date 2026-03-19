-- ============================================================
-- Políticas RLS para tabla: notificaciones (LIMPIEZA COMPLETA)
-- ============================================================
--
-- CONTEXTO:
--   La tabla notificaciones se usa para:
--   1. Mostrar notificaciones al usuario en su panel
--   2. Servicios admin crean notificaciones cuando aprueban/rechazan/eliminar publicaciones
--   3. NotificationStoreService se suscribe via Realtime
--
-- REQUERIMIENTOS:
--   - Usuario puede leer/actualizar solo sus propias notificaciones
--   - Cualquier usuario autenticado puede crear notificaciones para otros
--   - Solo admin puede eliminar (para limpieza)
--
-- ============================================================

-- ── 0. Primero desabilitar RLS para limpiar todas las políticas ──
ALTER TABLE public.notificaciones DISABLE ROW LEVEL SECURITY;

-- ── 1. Drop de todas las políticas existentes ────────────────────

DROP POLICY IF EXISTS "Usuarios ven sus propias notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Admin puede eliminar notificaciones" ON public.notificaciones;

-- ── 2. Habilitar RLS nuevamente ──────────────────────────────────

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- ── 3. Políticas SELECT ─────────────────────────────────────────
-- Usuario autenticado: solo sus propias notificaciones

CREATE POLICY "Usuarios ven sus propias notificaciones"
  ON public.notificaciones FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── 4. Políticas INSERT ─────────────────────────────────────────
-- PERMISIVO: Cualquier usuario autenticado puede insertar
-- (necesario para que admin y servicios creen notificaciones)

CREATE POLICY "Usuarios autenticados pueden crear notificaciones"
  ON public.notificaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── 5. Políticas UPDATE ─────────────────────────────────────────
-- Usuario autenticado: puede actualizar solo sus propias notificaciones
-- (para marcar como leído)

CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones"
  ON public.notificaciones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 6. Políticas DELETE ─────────────────────────────────────────
-- Solo admin puede eliminar (para limpieza de la BD)

CREATE POLICY "Admin puede eliminar notificaciones"
  ON public.notificaciones FOR DELETE
  TO authenticated
  USING (public.es_admin());

-- ── 7. Grants ───────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON public.notificaciones TO authenticated;

-- ── 8. Reload del schema cache de PostgREST ────────────────────

NOTIFY pgrst, 'reload schema';
