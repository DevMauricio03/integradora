-- =============================================================
--  GRANT para la vista feed_posts
--  Sin este GRANT, PostgREST devuelve 404 al hacer
--  db.from('feed_posts').select(...)
--
--  Causa: las VIEWs en Supabase/PostgreSQL no heredan los permisos
--  de SELECT automáticamente para los roles anon/authenticated.
--  La tabla subyacente puede tener RLS/GRANTs correctos, pero la
--  VIEW necesita permiso propio.
-- =============================================================

GRANT SELECT ON feed_posts TO anon, authenticated;
