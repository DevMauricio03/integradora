import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { Anuncio } from '../models/supabase.models';

/**
 * Layer 1 – Servicio especializado: Anuncios oficiales.
 * Responsabilidad única: tabla `anuncios`.
 */
@Injectable({ providedIn: 'root' })
export class AnuncioService {
    private readonly db = inject(SupabaseClientService).client;

    /** Obtener anuncios activos */
    async getAnuncios(): Promise<{ data: Anuncio[] | null; error: any }> {
        const { data, error } = await this.db
            .from('anuncios')
            .select('id, titulo, descripcion, imagen_url, ciudad, contacto_url, fecha_inicio, fecha_fin, creado, estado')
            .eq('estado', 'activo')
            .order('creado', { ascending: false });
        return { data: data as Anuncio[], error };
    }

    /** Crear un nuevo anuncio oficial (admin) */
    async crearAnuncio(datos: {
        titulo: string; descripcion: string; imagen_url?: string;
        contacto_url?: string; ciudad?: string;
        fecha_inicio?: string; fecha_fin?: string;
    }) {
        const { data, error } = await this.db
            .from('anuncios')
            .insert({
                titulo: datos.titulo,
                descripcion: datos.descripcion,
                imagen_url: datos.imagen_url,
                contacto_url: datos.contacto_url,
                ciudad: datos.ciudad,
                estado: 'activo',
                activo: true,
                fecha_inicio: datos.fecha_inicio,
                fecha_fin: datos.fecha_fin,
                creado: new Date().toISOString()
            });
        return { data, error };
    }
}
