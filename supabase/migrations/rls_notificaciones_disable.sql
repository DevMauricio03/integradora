-- ============================================================
-- Script ALTERNATIVO: Deshabilitar RLS en notificaciones
-- ============================================================
--
-- Úsalo si la política RLS sigue dando error 403.
-- Esto permite acceso sin restricciones (menos seguro para producción,
-- pero útil para desarrollo/testing).
--
-- EN PRODUCCIÓN: Usa en su lugar el script rls_notificaciones.sql
-- ============================================================

ALTER TABLE public.notificaciones DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
