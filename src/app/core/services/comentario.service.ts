import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';

export interface Comentario {
    id: string;
    contenido: string;
    creado: string;
    autor_id: string;
    perfiles: {
        nombre: string;
        apellidos: string | null;
        foto_url: string | null;
    } | null;
}

/** Número de comentarios por página. */
export const COMENTARIO_PAGE_SIZE = 15;

/**
 * Layer 1 – Servicio especializado: Comentarios.
 * Responsabilidad única: tabla `comentarios`.
 * Cada método ejecuta UNA sola query hacia UN solo recurso.
 */
@Injectable({ providedIn: 'root' })
export class ComentarioService {
    private readonly db  = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    /**
     * Obtener comentarios paginados de una publicación.
     *
     * Orden: más reciente primero (creado DESC).
     * limit=15, offset=n → permite carga en bloques de 15.
     */
    async getComentarios(
        publicacionId: string,
        limit: number,
        offset: number,
    ): Promise<{ data: Comentario[] | null; error: any }> {
        const { data, error } = await this.db
            .from('comentarios')
            .select(`
                id,
                contenido,
                creado,
                autor_id,
                perfiles (
                    nombre,
                    apellidos,
                    foto_url
                )
            `)
            .eq('publicacion_id', publicacionId)
            .order('creado', { ascending: false })
            .range(offset, offset + limit - 1);

        return { data: data as unknown as Comentario[] | null, error };
    }

    /**
     * Publicar un comentario nuevo.
     * Devuelve el comentario recién creado (con datos de perfil) para
     * mostrarlo inmediatamente sin recargar la lista.
     */
    async crearComentario(
        publicacionId: string,
        contenido: string,
    ): Promise<{ data: Comentario | null; error: any }> {
        const user = await this.auth.getCachedUser();
        if (!user) return { data: null, error: new Error('Usuario no autenticado') };

        const { data, error } = await this.db
            .from('comentarios')
            .insert({
                publicacion_id: publicacionId,
                autor_id: user.id,
                contenido: contenido.trim(),
            })
            .select(`
                id,
                contenido,
                creado,
                autor_id,
                perfiles (
                    nombre,
                    apellidos,
                    foto_url
                )
            `)
            .single();

        return { data: data as unknown as Comentario | null, error };
    }

    /**
     * Eliminar un comentario propio.
     * El RLS garantiza que solo el autor puede borrar su comentario.
     */
    async deleteComentario(
        comentarioId: string,
    ): Promise<{ error: any }> {
        const { error } = await this.db
            .from('comentarios')
            .delete()
            .eq('id', comentarioId);

        return { error };
    }
}
