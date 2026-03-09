import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';

/**
 * Layer 1 – Servicio especializado: Vista feed_posts con paginación.
 *
 * Consume la VIEW `feed_posts` de Supabase usando range() para paginación.
 */
export interface FeedPost {
    id: string;
    titulo: string;
    descripcion: string;
    tipo: string;
    creado: string;
    imagen_url: string | null;
    imagenes_url: string[] | null;
    categoria: string;
    detalles: any;
    estado: string;
    autor_id: string;
    autor_nombre: string;
    autor_apellidos: string | null;
    autor_foto_url: string | null;
    autor_carrera_id: string | null;
    autor_rol: string;
    fuente: 'publicacion' | 'anuncio';
}

/** Tamaño de página del feed */
export const FEED_PAGE_SIZE = 5;

@Injectable({ providedIn: 'root' })
export class FeedViewService {
    private readonly db = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    /**
     * Obtener el feed paginado desde la VIEW feed_posts.
     *
     * @param page  Número de página (0-indexed)
     * @param limit Tamaño de página (default = FEED_PAGE_SIZE)
     *
     * Cálculo del rango:
     *   from = page * limit
     *   to   = from + limit - 1
     *
     * Si Supabase devuelve menos registros que `limit`, significa que
     * no hay más páginas (el store debe marcar hasMore = false).
     */
    async getFeedPosts(
        page: number = 0,
        limit: number = FEED_PAGE_SIZE
    ): Promise<{ data: FeedPost[] | null; error: any }> {
        const from = page * limit;
        const to = from + limit - 1;

        const { data, error } = await this.db
            .from('feed_posts')
            .select('*')
            .order('creado', { ascending: false })
            .range(from, to);

        return { data: data as FeedPost[] || [], error };
    }

    /**
     * Obtener publicaciones pendientes del usuario autenticado.
     * Se mezclan en el store para que el autor vea sus posts antes
     * de que sean aprobados. Solo se llama una vez (no se pagina).
     */
    async getOwnPendingPosts(): Promise<{ data: any[] | null; error: any }> {
        const user = await this.auth.getCachedUser();
        if (!user) return { data: [], error: null };

        const { data, error } = await this.db
            .from('publicaciones')
            .select(`
                id, titulo, descripcion, tipo, creado,
                imagen_url, imagenes_url, categoria, detalles, estado, autor_id,
                perfiles ( nombre, apellidos, foto_url, carrera_id, roles ( nombre ) )
            `)
            .eq('autor_id', user.id)
            .eq('estado', 'pendiente')
            .order('creado', { ascending: false });

        return { data: data as any[] || [], error };
    }
}
