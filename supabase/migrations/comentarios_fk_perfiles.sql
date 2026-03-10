-- Migración: Corregir FK de comentarios.autor_id para compatibilidad con PostgREST
-- Contexto: el FK original apunta a auth.users(id), que está en el esquema auth
-- (fuera del alcance de PostgREST). Al apuntarlo a public.perfiles(id) se
-- habilita el embedding automático perfiles(...) en las queries del cliente.
--
-- Nota: public.perfiles.id = auth.users.id, por lo que la integridad referencial
-- se mantiene. El CASCADE queda garantizado: auth.users → perfiles → comentarios.

ALTER TABLE public.comentarios
    DROP CONSTRAINT IF EXISTS comentarios_autor_id_fkey,
    ADD  CONSTRAINT comentarios_autor_id_fkey
         FOREIGN KEY (autor_id)
         REFERENCES public.perfiles(id)
         ON DELETE CASCADE;
