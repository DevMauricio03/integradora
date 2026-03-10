import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';

export interface Comentario {
  id: string;
  publicacion_id: string;
  autor_id: string;
  contenido: string;
  creado: string;
  perfiles?: {
    nombre: string;
    apellidos: string;
    foto_url: string | null;
  };
}

/**
 * Layer 1 – Servicio especializado: Comentarios.
 * Responsabilidad única: tabla `comentarios`.
 * Carga paginada con limit/offset para optimizar rendimiento.
 */
@Injectable({ providedIn: 'root' })
export class ComentarioService {
  private readonly db = inject(SupabaseClientService).client;
  private readonly auth = inject(AuthService);

  private readonly PAGE_SIZE = 10;

  /**
   * Obtener comentarios de una publicación con paginación.
   * Retorna los más recientes primero.
   */
  async getComentarios(
    publicacionId: string,
    page: number = 0
  ): Promise<{ data: Comentario[] | null; error: any; hasMore: boolean }> {
    const from = page * this.PAGE_SIZE;
    const to = from + this.PAGE_SIZE - 1;

    const { data, error } = await this.db
      .from('comentarios')
      .select(`
        id,
        publicacion_id,
        autor_id,
        contenido,
        creado,
        perfiles (
          nombre,
          apellidos,
          foto_url
        )
      `)
      .eq('publicacion_id', publicacionId)
      .order('creado', { ascending: false })
      .range(from, to);

    const hasMore = !error && !!data && data.length >= this.PAGE_SIZE;
    return { data: data as unknown as Comentario[], error, hasMore };
  }

  /**
   * Crear un nuevo comentario.
   */
  async crearComentario(
    publicacionId: string,
    contenido: string
  ): Promise<{ data: Comentario | null; error: any }> {
    const user = await this.auth.getCachedUser();
    if (!user) return { data: null, error: new Error('Usuario no autenticado') };

    const { data, error } = await this.db
      .from('comentarios')
      .insert({
        publicacion_id: publicacionId,
        autor_id: user.id,
        contenido: contenido.trim()
      })
      .select(`
        id,
        publicacion_id,
        autor_id,
        contenido,
        creado,
        perfiles (
          nombre,
          apellidos,
          foto_url
        )
      `)
      .single();

    return { data: data as unknown as Comentario, error };
  }
}
