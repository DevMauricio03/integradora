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

    /** Suspender usuario con fecha de fin calculada */
    async suspendUser(userId: string, hours: number | null) {
        const fechaSuspension = hours === null
            ? '2099-12-31T23:59:59Z'
            : new Date(Date.now() + hours * 3600000).toISOString();

        return await this.db
            .from('perfiles')
            .update({ estado: 'suspendido', fecha_suspension: fechaSuspension })
            .eq('id', userId);
    }

    /** Verificar si la suspensión del usuario sigue vigente */
    async verifySuspension(): Promise<{ isSuspended: boolean; remains?: string }> {
        const perfil = await this.getPerfilActual();
        if (perfil?.estado !== 'suspendido') return { isSuspended: false };

        if (perfil.fecha_suspension) {
            const now = new Date();
            const suspensionEnd = new Date(perfil.fecha_suspension);

            if (now > suspensionEnd) {
                await this.updateUserStatus(perfil.id, 'activo');
                return { isSuspended: false };
            }

            const diffMs = suspensionEnd.getTime() - now.getTime();
            const hours = Math.floor(diffMs / 3600000);
            const days = Math.floor(hours / 24);
            return { isSuspended: true, remains: days > 0 ? `${days} días` : `${hours} horas` };
        }

        return { isSuspended: true, remains: 'indefinido' };
    }

    /** Obtener todos los usuarios (admin) */
    async getAllUsers(searchTerm?: string): Promise<{ data: Perfil[], error: any }> {
        let query = this.db
            .from('perfiles')
            .select('id, nombre, apellidos, correoInstitucional, foto_url, creado, estado, roles(nombre), universidades(acronimo)')
            .order('creado', { ascending: false });

        if (searchTerm) {
            query = query.or(`nombre.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,correoInstitucional.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        return { data: (data as unknown as Perfil[]) || [], error };
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
