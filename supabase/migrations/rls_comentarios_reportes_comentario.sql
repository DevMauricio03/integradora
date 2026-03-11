-- ============================================================
-- Fase: Comentarios con moderación y auto-eliminación
-- ============================================================
--
-- 1. Extiende `reportes` para soportar reportes de comentarios.
-- 2. Habilita RLS en `comentarios`.
-- 3. Agrega políticas SELECT y DELETE para comentarios.
--
-- Las políticas INSERT ("Usuarios activos pueden comentar")
-- ya existen en suspend_user_rpc.sql — no se duplican.
-- ============================================================


-- ── 1. Ampliar la tabla reportes ────────────────────────────
-- comentario_id: FK nullable al comentario reportado.
-- tipo_reporte: discriminador 'publicacion' | 'comentario'.

ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS comentario_id  uuid
    REFERENCES public.comentarios(id) ON DELETE SET NULL;

ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS tipo_reporte   text
    DEFAULT 'publicacion'
    CHECK (tipo_reporte IN ('publicacion', 'comentario'));


-- ── 2. Habilitar RLS en comentarios ─────────────────────────

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;


-- ── 3. Políticas SELECT para comentarios ────────────────────
-- Cualquier visitante (anon / auth) puede leer comentarios
-- de publicaciones activas. No hay datos sensibles en ellos.

DROP POLICY IF EXISTS "Todos pueden leer comentarios" ON public.comentarios;
CREATE POLICY "Todos pueden leer comentarios"
  ON public.comentarios FOR SELECT
  TO anon, authenticated
  USING (true);


-- ── 4. DELETE: el autor elimina sus propios comentarios ─────

DROP POLICY IF EXISTS "Autores pueden eliminar sus comentarios" ON public.comentarios;
CREATE POLICY "Autores pueden eliminar sus comentarios"
  ON public.comentarios FOR DELETE
  TO authenticated
  USING (
    auth.uid() = autor_id
    AND NOT is_user_suspended(auth.uid())
  );


-- ── 5. DELETE: admin puede eliminar cualquier comentario ────

DROP POLICY IF EXISTS "Admin puede eliminar comentarios" ON public.comentarios;
CREATE POLICY "Admin puede eliminar comentarios"
  ON public.comentarios FOR DELETE
  TO authenticated
  USING (es_admin());


-- ── 6. Reload del schema cache ───────────────────────────────

NOTIFY pgrst, 'reload schema';
