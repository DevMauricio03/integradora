import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';
import { Perfil } from '../models/supabase.models';

/**
 * Layer 1 – Servicio especializado: Perfiles de usuario.
 * Responsabilidad única: tabla `perfiles`.
 * No mezcla auth con consultas a la BD; usa AuthService para obtener el userId.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly db = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    /** Obtener perfil por ID de usuario */
    async getPerfilById(userId: string): Promise<Perfil | null> {
        const { data, error } = await this.db
            .from('perfiles')
            .select('*, roles(nombre)')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[ProfileService] getPerfilById:', error);
            return null;
        }
        return data as unknown as Perfil;
    }

    /** Obtener perfil del usuario actualmente autenticado */
    async getPerfilActual(): Promise<Perfil | null> {
        const user = await this.auth.getCachedUser();
        if (!user) return null;
        return this.getPerfilById(user.id);
    }

    /** Crear perfil nuevo en tabla perfiles (post-registro) */
    async createProfile(perfil: {
        id: string;
        nombre: string;
        apellidos: string;
        correoInstitucional: string;
        rol_id?: string;
        universidad_id?: string;
        carrera_id?: string | null;
        foto_url?: string | null;
        foto_perfil?: string | null;
        creado?: string;
        estado?: string;
    }) {
        const { data, error } = await this.db.from('perfiles').insert(perfil);
        return { data: data as unknown as Perfil[] | null, error };
    }

    /** Actualizar datos del perfil del usuario autenticado */
    async updatePerfil(datos: Partial<Perfil> & { rol_id: string }) {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { error } = await this.db
            .from('perfiles')
            .update({
                nombre: datos.nombre,
                apellidos: datos.apellidos,
                rol_id: datos.rol_id,
                actualizado: new Date()
            })
            .eq('id', user.id);

        if (error) throw error;
        return true;
    }

    /** Verificar si ya existe un perfil con ese correo institucional */
    async checkIfUserExists(email: string) {
        const { data, error } = await this.db
            .from('perfiles')
            .select('id')
            .eq('correoInstitucional', email)
            .maybeSingle();
        return { exists: !!data, error };
    }

    /** Actualizar estado de usuario (activo / suspendido) */
    async updateUserStatus(userId: string, nuevoEstado: string) {
        const { data, error } = await this.db
            .from('perfiles')
            .update({ estado: nuevoEstado })
            .eq('id', userId);
        return { data, error };
    }

    /**
     * Suspender usuario con fecha de fin calculada.
     * hours = null → suspensión de larga duración (año 2099).
     * La lógica de reactivación es: si fecha_suspension < now() → activo.
     * NUNCA usar updateUserStatus('suspendido') directamente; siempre pasar por aquí.
     */
    async suspendUser(userId: string, hours: number | null) {
        // null → largo plazo (no permanente semánticamente; expira en 2099)
        const fechaSuspension = hours === null
            ? new Date('2099-12-31T23:59:59Z').toISOString()
            : new Date(Date.now() + hours * 3600000).toISOString();

        return await this.db
            .from('perfiles')
            .update({ estado: 'suspendido', fecha_suspension: fechaSuspension })
            .eq('id', userId);
    }

    /**
     * Reactivar usuario: limpia fecha_suspension y restablece estado = 'activo'.
     * Usar SIEMPRE este método en lugar de updateUserStatus('activo').
     */
    async unsuspendUser(userId: string) {
        return await this.db
            .from('perfiles')
            .update({ estado: 'activo', fecha_suspension: null })
            .eq('id', userId);
    }

    /**
     * Verifica si la suspensión del usuario activo sigue vigente.
     * Lógica: si fecha_suspension < now() → reactivar automáticamente.
     * Si fecha_suspension es null con estado = 'suspendido' → dato inconsistente
     * (suspensión legacy sin fecha). Se auto-sana reactivando la cuenta.
     */
    async verifySuspension(): Promise<{ isSuspended: boolean; remains?: string }> {
        const perfil = await this.getPerfilActual();
        if (perfil?.estado !== 'suspendido') return { isSuspended: false };

        // Dato inconsistente: suspendido sin fecha → auto-sanar
        if (!perfil.fecha_suspension) {
            await this.unsuspendUser(perfil.id);
            return { isSuspended: false };
        }

        const now = new Date();
        const suspensionEnd = new Date(perfil.fecha_suspension);

        if (now > suspensionEnd) {
            // Suspensión expirada → reactivar y limpiar fecha
            await this.unsuspendUser(perfil.id);
            return { isSuspended: false };
        }

        const diffMs = suspensionEnd.getTime() - now.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(hours / 24);
        return { isSuspended: true, remains: days > 0 ? `${days} días` : `${hours} horas` };
    }

    /** Obtener todos los usuarios (admin) */
    async getAllUsers(params?: { page?: number; pageSize?: number; filter?: string; searchTerm?: string }) {
        let query = this.db
            .from('perfiles')
            .select('id, nombre, apellidos, correoInstitucional, foto_url, creado, estado, roles(nombre), universidades(acronimo)', { count: 'exact' })
            .order('creado', { ascending: false });

        if (params?.filter) {
            const f = params.filter.toLowerCase();
            if (f.includes('activo')) query = query.eq('estado', 'activo');
            else if (f.includes('pendiente')) query = query.eq('estado', 'pendiente');
            else if (f.includes('suspendido')) query = query.eq('estado', 'suspendido');
        }

        if (params?.searchTerm) {
            const term = params.searchTerm;
            query = query.or(`nombre.ilike.%${term}%,apellidos.ilike.%${term}%,correoInstitucional.ilike.%${term}%`);
        }

        if (params?.page !== undefined && params?.pageSize !== undefined) {
            const from = params.page * params.pageSize;
            const to = from + params.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, count, error } = await query;
        return { data: (data as unknown as Perfil[]) || [], count: count || 0, error };
    }

    /** Obtener usuarios más recientes (admin dashboard) */
    async getRecentUsers(limit: number = 5) {
        const { data, error } = await this.db
            .from('perfiles')
            .select('nombre, apellidos, correoInstitucional, foto_url, creado, roles(nombre), universidades(acronimo)')
            .order('creado', { ascending: false })
            .limit(limit);
        return { data, error };
    }

    /** Actualizar rol de usuario */
    async updateUserRole(userId: string, roleId: string) {
        const { data, error } = await this.db
            .from('perfiles')
            .update({ rol_id: roleId })
            .eq('id', userId);
        return { data, error };
    }
}
