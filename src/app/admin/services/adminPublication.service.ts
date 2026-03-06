import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { Post } from '../../core/models/supabase.models';

@Injectable({
    providedIn: 'root'
})
export class AdminPublicationService {
    private readonly supabase = inject(SupabaseService).client;

    async getPublications(filters?: { type?: string, status?: string, search?: string }) {
        let query = this.supabase
            .from('publicaciones')
            .select(`
        *,
        perfiles (
          id,
          nombre,
          apellidos,
          foto_url,
          correoInstitucional,
          creado,
          estado,
          roles (nombre),
          carrera (nombre),
          universidades (acronimo)
        )
      `)
            .order('creado', { ascending: false });

        if (filters?.type && filters.type !== 'Todos') {
            // Mapping common labels to DB values if necessary
            const dbType = this.mapLabelToType(filters.type);
            if (dbType) {
                query = query.eq('tipo', dbType);
            }
        }

        if (filters?.status && filters.status !== 'Todos') {
            const dbStatus = filters.status.toLowerCase();
            query = query.eq('estado', dbStatus);
        }

        if (filters?.search) {
            query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        return { data: data as (Post & { perfiles: any })[] | null, error };
    }

    async updatePublicationStatus(id: string, status: string) {
        const { data, error } = await this.supabase
            .from('publicaciones')
            .update({ estado: status })
            .eq('id', id);
        return { data, error };
    }

    private mapLabelToType(label: string): string | null {
        const l = label.toLowerCase();
        if (l.includes('producto')) return 'oferta';
        if (l.includes('empresarial')) return 'experiencia';
        if (l.includes('evento')) return 'evento';
        return null;
    }
}
