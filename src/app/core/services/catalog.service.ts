import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { Universidad, Carrera, Rol } from '../models/supabase.models';

/**
 * Layer 1 – Servicio especializado: Catálogos.
 * Responsabilidad única: datos de referencia (universidades, carreras, roles).
 * Estos datos cambian muy raramente → se cachean en memoria por sesión.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
    private readonly db = inject(SupabaseClientService).client;

    private _universidades: Universidad[] | null = null;
    private _carreras: Carrera[] | null = null;
    private _roles: Rol[] | null = null;

    /** Obtener lista de universidades (cacheada en memoria) */
    async getUniversidades(): Promise<{ data: Universidad[] | null; error: any }> {
        if (this._universidades) return { data: this._universidades, error: null };

        const { data, error } = await this.db
            .from('universidades')
            .select('id, nombre, acronimo')
            .order('nombre');

        if (!error && data) this._universidades = data as unknown as Universidad[];
        return { data: data as unknown as Universidad[], error };
    }

    /** Obtener lista de carreras (cacheada en memoria) */
    async getCarreras(): Promise<{ data: Carrera[] | null; error: any }> {
        if (this._carreras) return { data: this._carreras, error: null };

        const { data, error } = await this.db
            .from('carrera')
            .select('id, nombre')
            .order('nombre');

        if (!error && data) this._carreras = data as unknown as Carrera[];
        return { data: data as unknown as Carrera[], error };
    }

    /** Obtener lista de roles (cacheada en memoria) */
    async getRoles(): Promise<{ data: Rol[] | null; error: any }> {
        if (this._roles) return { data: this._roles, error: null };

        const { data, error } = await this.db
            .from('roles')
            .select('id, nombre')
            .order('nombre');

        if (!error && data) this._roles = data as unknown as Rol[];
        return { data: data as unknown as Rol[], error };
    }

    /** Obtener un rol por su nombre */
    async getRolByNombre(nombre: string): Promise<{ data: Partial<Rol> | null; error: any }> {
        const { data, error } = await this.db
            .from('roles')
            .select('id')
            .eq('nombre', nombre)
            .single();
        return { data: data as unknown as Partial<Rol>, error };
    }

    /** Contar usuarios (para trend comparativo) */
    async getUsersCount() {
        const { count, error } = await this.db
            .from('perfiles')
            .select('*', { count: 'exact', head: true });
        return { count: count || 0, error };
    }

    /** Helper para calcular trend de una tabla */
    async getTableTrend(table: string, days: number = 30): Promise<number> {
        const now = new Date();
        const currentStart = new Date(now.getTime() - days * 86400000).toISOString();
        const previousStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();

        const { count: currentCount, error } = await this.db
            .from(table)
            .select('*', { count: 'exact', head: true })
            .gte('creado', currentStart);

        if (error?.code === '42P01') return 0;

        const { count: previousCount } = await this.db
            .from(table)
            .select('*', { count: 'exact', head: true })
            .gte('creado', previousStart)
            .lt('creado', currentStart);

        const curr = currentCount || 0;
        const prev = previousCount || 0;
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    }

    /** Forzar limpiar caché (ej. tras cambiar datos de catálogos) */
    clearCache() {
        this._universidades = null;
        this._carreras = null;
        this._roles = null;
    }
}
