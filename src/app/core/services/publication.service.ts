import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';
import { Post } from '../models/supabase.models';

/**
 * Layer 1 – Servicio especializado: Publicaciones.
 * Responsabilidad única: tabla `publicaciones`.
 * Cada método ejecuta UNA sola query hacia UN solo recurso.
 *
 * Optimizaciones:
 * - Usa AuthService.getCachedUser() en lugar de auth.getUser() directo.
 * - SELECT explícito: no usa '*', solo los campos realmente necesarios.
 */
@Injectable({ providedIn: 'root' })
export class PublicationService {
    private readonly db = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    /** Obtener publicaciones activas (y pendientes propias si hay sesión) */
    async getPosts(): Promise<{ data: Post[] | null; error: any }> {
        // getCachedUser() → sin red en llamadas posteriores
        const user = await this.auth.getCachedUser();

        let query = this.db
            .from('publicaciones')
            .select(`
        id,
        titulo,
        descripcion,
        tipo,
        creado,
        autor_id,
        imagen_url,
        imagenes_url,
        categoria,
        detalles,
        estado,
        perfiles (
          nombre,
          apellidos,
          foto_url,
          carrera_id,
          roles ( nombre )
        )
      `);

        if (user) {
            query = query.or(`estado.eq.activo,and(estado.eq.pendiente,autor_id.eq.${user.id})`);
        } else {
            query = query.eq('estado', 'activo');
        }

        const { data, error } = await query.order('creado', { ascending: false });
        return { data: data as unknown as Post[], error };
    }

    /** Crear una publicación nueva */
    async createPost(post: Omit<Post, 'autor_id' | 'estado'> & {
        type: string; title: string; description: string;
        image?: string; images?: string[]; category?: string;
        startDate?: string; endDate?: string; modality?: string;
        location?: string; cost?: string; subtype?: string;
        price?: number; priceUnit?: string; contactMethod?: string;
        phoneNumber?: string; productStatus?: string; availability?: string;
        serviceType?: string; availableHours?: string; company?: string;
        area?: string; period?: string; recommendation?: string;
    }) {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        const detalles: any = {};
        if (post.type === 'evento') {
            detalles.startDate = post.startDate; detalles.endDate = post.endDate;
            detalles.modality = post.modality; detalles.location = post.location;
            detalles.cost = post.cost;
        } else if (post.type === 'oferta') {
            detalles.subtype = post.subtype; detalles.price = post.price;
            detalles.priceUnit = post.priceUnit; detalles.contactMethod = post.contactMethod;
            detalles.phoneNumber = post.phoneNumber;
            if (post.subtype === 'producto') {
                detalles.productStatus = post.productStatus; detalles.availability = post.availability;
            } else {
                detalles.serviceType = post.serviceType; detalles.availableHours = post.availableHours;
            }
        } else if (post.type === 'experiencia') {
            detalles.company = post.company; detalles.area = post.area;
            detalles.period = post.period; detalles.recommendation = post.recommendation;
        }

        const { data, error } = await this.db
            .from('publicaciones')
            .insert({
                titulo: post.title,
                descripcion: post.description,
                tipo: post.type,
                autor_id: user.id,
                estado: 'pendiente',
                imagen_url: (post.images && post.images.length > 0) ? post.images[0] : (post.image || null),
                imagenes_url: (post.images && post.images.length > 0) ? post.images : null,
                categoria: post.category,
                detalles
            })
            .select(`
        id, titulo, descripcion, tipo, creado, autor_id, imagen_url,
        imagenes_url, categoria, detalles, estado,
        perfiles ( nombre, apellidos, foto_url, carrera_id, roles ( nombre ) )
      `)
            .single();

        return { data, error };
    }

    /** Obtener publicaciones más recientes de un usuario (para perfil) */
    async getUserRecentPosts(userId: string, limit: number = 2) {
        const { data, error } = await this.db
            .from('publicaciones')
            .select('titulo, tipo, creado')
            .eq('autor_id', userId)
            .order('creado', { ascending: false })
            .limit(limit);
        return { data, error };
    }

    /** Contar publicaciones activas (admin dashboard) */
    async getActivePostsCount() {
        const { count, error } = await this.db
            .from('publicaciones')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'activo');
        return { count: count || 0, error };
    }

    /** Obtener fechas de publicaciones para gráfica (admin dashboard) */
    async getPostsForChart(days: number = 30) {
        const startDate = new Date(Date.now() - days * 86400000).toISOString();
        const { data, error } = await this.db
            .from('publicaciones')
            .select('creado')
            .gte('creado', startDate)
            .order('creado', { ascending: true });
        return { data: data || [], error };
    }

    /** Actualizar estado de una publicación (admin) */
    async updatePostStatus(id: string, status: string) {
        const { data, error } = await this.db
            .from('publicaciones')
            .update({ estado: status })
            .eq('id', id);
        return { data, error };
    }

    /** Obtener todas las publicaciones con filtros (admin – join pesado justificado aquí) */
    async getPublications(filters?: { type?: string; status?: string; search?: string }) {
        let query = this.db
            .from('publicaciones')
            .select(`
        id, titulo, descripcion, tipo, creado, estado, imagen_url,
        imagenes_url, categoria, detalles, autor_id,
        perfiles (
          id, nombre, apellidos, foto_url, correoInstitucional,
          creado, estado,
          roles ( nombre ),
          carrera ( nombre ),
          universidades ( acronimo )
        )
      `)
            .order('creado', { ascending: false });

        if (filters?.type && filters.type !== 'Todos') {
            const typeMap: Record<string, string> = {
                producto: 'oferta', empresarial: 'experiencia', evento: 'evento'
            };
            const key = filters.type.toLowerCase();
            const dbType = Object.keys(typeMap).find(k => key.includes(k));
            if (dbType) query = query.eq('tipo', typeMap[dbType]);
        }

        if (filters?.status && filters.status !== 'Todos') {
            query = query.eq('estado', filters.status.toLowerCase());
        }

        if (filters?.search) {
            query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        return { data: data as (Post & { perfiles: any })[] | null, error };
    }
}
