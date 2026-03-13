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
            .select('*, roles(nombre), universidades(nombre, acronimo), carrera(nombre, id)')
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
        creado?: string;
        estado?: string;
    }) {
        const { data, error } = await this.db.from('perfiles').insert(perfil);
        return { data: data as unknown as Perfil[] | null, error };
    }

    /** Actualizar datos del perfil del usuario autenticado */
    async updatePerfil(datos: {
        nombre?: string;
        apellidos?: string;
        anioGraduacion?: string;
        carreraId?: string | null;
    }) {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        const cambios: Record<string, unknown> = {
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            anio_graduacion: datos.anioGraduacion ? Number(datos.anioGraduacion) : null,
            actualizado: new Date().toISOString(),
        };

        if (datos.carreraId !== undefined) {
            cambios['carrera_id'] = datos.carreraId || null;
        }

        const { error } = await this.db
            .from('perfiles')
            .update(cambios)
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
     * Suspender usuario via secure RPC (SECURITY DEFINER).
     * Validates admin role server-side; prevents self-suspension.
     *
     * @param userId   Target user UUID
     * @param duration '1_day' | '7_days' | '30_days' | 'permanent'
     */
    async suspendUserRpc(userId: string, duration: '1_day' | '7_days' | '30_days' | 'permanent') {
        const { data, error } = await this.db.rpc('suspend_user', {
            target_user_id: userId,
            duration
        });
        if (error) return { error };
        const result = data as { success: boolean; error?: string };
        if (!result.success) return { error: { message: result.error ?? 'Error al suspender usuario' } };
        return { error: null };
    }

    /**
     * Reactivar usuario via secure RPC (SECURITY DEFINER).
     * Validates admin role server-side.
     */
    async unsuspendUserRpc(userId: string) {
        const { data, error } = await this.db.rpc('unsuspend_user', {
            target_user: userId
        });
        if (error) return { error };
        const result = data as { success: boolean; error?: string };
        if (!result.success) return { error: { message: result.error ?? 'Error al reactivar usuario' } };
        return { error: null };
    }

    /** Obtener todos los usuarios (admin) */
    async getAllUsers(params?: { page?: number; pageSize?: number; filter?: string; searchTerm?: string }) {
        let query = this.db
            .from('perfiles')
            .select('id, nombre, apellidos, correoInstitucional, foto_url, creado, estado, fecha_suspension, roles(nombre), universidades(acronimo)', { count: 'exact' })
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

    /**
     * Solicitar copia de datos personales.
     * En una fase real, esto dispararía una función edge de Supabase o un trigger.
     */
    async solicitarDescargaDatos(): Promise<{ success: boolean; error?: string }> {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Simulación: registramos la solicitud o disparamos un proceso
        // console.log('Simulación: Solicitud de descarga enviada para:', user.email);
        
        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true };
    }

    /** 
     * Iniciar proceso de eliminación de cuenta.
     * Realiza un borrado lógico o físico dependiendo de la política del backend.
     */
    async solicitarEliminacionCuenta(): Promise<{ success: boolean; error?: string }> {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        // En Supabase, borrar el registro de auth.users borra en cascada si está configurado.
        // Opcionalmente se puede llamar a un RPC especializado.
        const { error } = await this.db.from('perfiles').delete().eq('id', user.id);
        
        if (error) {
            console.error('[ProfileService] solicitarEliminacionCuenta:', error);
            return { success: false, error: error.message };
        }

        // Importante: El usuario debe quedar deslogueado tras esto.
        return { success: true };
    }
}
