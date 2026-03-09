import { Injectable, inject, signal } from '@angular/core';
import { ProfileService } from './profile.service';
import { Perfil } from '../models/supabase.models';

/**
 * Layer 2 – Store: Perfil del usuario autenticado.
 * Cachea el perfil para evitar múltiples llamadas a `auth.getUser()`.
 * Exponer invalidatePerfil() cuando el perfil se actualiza.
 */
@Injectable({ providedIn: 'root' })
export class AuthStoreService {
    private readonly profileService = inject(ProfileService);

    private readonly _perfil = signal<Perfil | null>(null);
    private readonly _isLoading = signal<boolean>(false);
    private _loadingPromise: Promise<Perfil | null> | null = null;

    /** Perfil del usuario actual (readonly signal) */
    public readonly perfil = this._perfil.asReadonly();
    /** Estado de carga */
    public readonly isLoading = this._isLoading.asReadonly();

    /**
     * Obtener el perfil actual con deduplicación.
     * Si ya hay un perfil en caché lo devuelve inmediatamente.
     * Si ya hay una petición en vuelo, espera la misma (no lanza una segunda).
     */
    async getPerfilActual(): Promise<Perfil | null> {
        // Cache hit
        if (this._perfil()) return this._perfil();

        // Deduplicación: si ya hay una petición en vuelo, la reutilizamos
        if (this._loadingPromise) return this._loadingPromise;

        this._isLoading.set(true);
        this._loadingPromise = this.profileService.getPerfilActual().then(perfil => {
            this._perfil.set(perfil);
            this._isLoading.set(false);
            this._loadingPromise = null;
            return perfil;
        }).catch(err => {
            this._isLoading.set(false);
            this._loadingPromise = null;
            throw err;
        });

        return this._loadingPromise;
    }

    /**
     * Invalidar caché del perfil (llamar tras editar perfil o cambiar de sesión).
     */
    invalidatePerfil() {
        this._perfil.set(null);
        this._loadingPromise = null;
    }

    /**
     * Pre-cargar el perfil (útil en el guard de auth o layout).
     */
    async preload() {
        await this.getPerfilActual();
    }

    /**
     * Verificar suspensión usando el perfil cacheado.
     */
    async verifySuspension(): Promise<{ isSuspended: boolean; remains?: string }> {
        const perfil = await this.getPerfilActual();
        if (perfil?.estado !== 'suspendido') return { isSuspended: false };

        if (perfil.fecha_suspension) {
            const now = new Date();
            const suspensionEnd = new Date(perfil.fecha_suspension);

            if (now > suspensionEnd) {
                // Suspensión expirada → reactivar
                await this.profileService.updateUserStatus(perfil.id, 'activo');
                this.invalidatePerfil();
                return { isSuspended: false };
            }

            const diffMs = suspensionEnd.getTime() - now.getTime();
            const hours = Math.floor(diffMs / 3600000);
            const days = Math.floor(hours / 24);
            return { isSuspended: true, remains: days > 0 ? `${days} días` : `${hours} horas` };
        }

        return { isSuspended: true, remains: 'indefinido' };
    }
}
