import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client.service';
import { environment } from '../../../environments/environment';

/**
 * Layer 1 – Servicio especializado: Autenticación.
 * Responsabilidad única: auth (signIn, signUp, signOut, sesión, password).
 *
 * getCachedUser() cachea el usuario en memoria y deduplica llamadas concurrentes.
 * Todos los servicios que necesiten el userId deben usarlo en lugar de
 * llamar a db.auth.getUser() directamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly db = inject(SupabaseClientService).client;

    // ── Caché del usuario autenticado ────────────────────────────
    private _cachedUser: User | null = null;
    private _userPromise: Promise<User | null> | null = null;

    /**
     * Devuelve el usuario autenticado actual con caché en memoria.
     * - Primera llamada: dispara `auth.getUser()` y guarda el resultado.
     * - Llamadas concurrentes: reutilizan la misma Promise en vuelo.
     * - Llamadas posteriores: devuelven el valor cacheado sin red.
     * Llamar a clearUserCache() al hacer signOut.
     */
    async getCachedUser(): Promise<User | null> {
        if (this._cachedUser) return this._cachedUser;

        if (this._userPromise) return this._userPromise;

        this._userPromise = this.db.auth.getUser().then(({ data: { user } }) => {
            this._cachedUser = user;
            this._userPromise = null;
            return user;
        }).catch(err => {
            this._userPromise = null;
            throw err;
        });

        return this._userPromise;
    }

    /** Limpiar caché del usuario (llamar al hacer signOut o cambio de sesión) */
    clearUserCache() {
        this._cachedUser = null;
        this._userPromise = null;
    }

    // ── Auth standard ─────────────────────────────────────────────

    /** Registrar nuevo usuario en auth */
    signUp(email: string, password: string) {
        return this.db.auth.signUp({ email, password });
    }

    /** Iniciar sesión */
    async signIn(email: string, password: string) {
        const result = await this.db.auth.signInWithPassword({ email, password });
        // Refrescar caché tras login exitoso
        if (result.data.user) {
            this._cachedUser = result.data.user;
        }
        return result;
    }

    /** Cerrar sesión (limpia la caché) */
    async signOut() {
        this.clearUserCache();
        return this.db.auth.signOut();
    }

    /** Obtener sesión actual */
    getSession() {
        return this.db.auth.getSession();
    }

    /**
     * @deprecated Usa getCachedUser() para obtener el usuario con caché.
     * Conservado para compatibilidad con código externo que aún no fue migrado.
     */
    getUser() {
        return this.db.auth.getUser();
    }

    /** Enviar email de recuperación de contraseña */
    resetPassword(email: string) {
        const appBaseUrl = environment.appBaseUrl || window.location.origin;

        return this.db.auth.resetPasswordForEmail(email, {
            redirectTo: `${appBaseUrl}${environment.passwordRecoveryPath}`
        });
    }

    /** Actualizar contraseña del usuario actual */
    updatePassword(newPassword: string) {
        return this.db.auth.updateUser({ password: newPassword });
    }

    /** Suscribirse a cambios de estado de autenticación */
    onAuthStateChange(callback: (event: any, session: any) => void) {
        return this.db.auth.onAuthStateChange(callback);
    }
}
