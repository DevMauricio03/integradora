-- ============================================================
-- FIX: Habilitar RLS en tabla notificaciones + Fix DELETE policy
-- ============================================================
--
-- PROBLEMA DETECTADO:
--   1. La tabla public.notificaciones tiene políticas RLS definidas
--      pero RLS NO está habilitado en la tabla.
--   2. La política DELETE actual solo permite admin, pero el frontend
--      permite a usuarios normales borrar sus propias notificaciones.
--
-- SOLUCIÓN:
--   1. Habilitar RLS para que las políticas existentes se apliquen.
--   2. Actualizar política DELETE para que usuarios puedan borrar
--      sus propias notificaciones O admin pueda borrar cualquiera.
--
-- ============================================================

-- 1. Habilitar RLS en la tabla notificaciones
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- 2. Drop políticas DELETE existentes (puede haber varias versiones)
DROP POLICY IF EXISTS "Admin puede eliminar notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias notificaciones" ON public.notificaciones;

-- 3. Crear política DELETE más flexible
CREATE POLICY "Usuarios pueden eliminar sus propias notificaciones"
  ON public.notificaciones FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()  -- Usuario puede borrar las suyas
    OR es_admin()         -- O es admin (puede borrar cualquiera)
  );

-- 4. Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
