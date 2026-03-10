-- Tabla de comentarios para publicaciones tipo "experiencia"
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.comentarios (
    id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    publicacion_id   uuid        NOT NULL REFERENCES public.publicaciones(id) ON DELETE CASCADE,
    autor_id         uuid        NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
    contenido        text        NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 1000),
    creado           timestamptz DEFAULT now() NOT NULL
);

-- Índice para la query principal (publicacion_id filtrado, ordenado por creado DESC)
CREATE INDEX IF NOT EXISTS comentarios_publicacion_creado_idx
    ON public.comentarios (publicacion_id, creado DESC);

-- Row Level Security
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer comentarios de publicaciones activas
CREATE POLICY "Leer comentarios" ON public.comentarios
    FOR SELECT
    USING (true);

-- Solo el propio usuario puede insertar sus comentarios
CREATE POLICY "Insertar comentario propio" ON public.comentarios
    FOR INSERT
    WITH CHECK (auth.uid() = autor_id);

-- Solo el autor puede eliminar su comentario
CREATE POLICY "Eliminar comentario propio" ON public.comentarios
    FOR DELETE
    USING (auth.uid() = autor_id);

-- Permitir que el join con perfiles funcione (necesario para el SELECT con perfiles)
GRANT SELECT ON public.comentarios TO authenticated;
GRANT INSERT ON public.comentarios TO authenticated;
GRANT DELETE ON public.comentarios TO authenticated;
