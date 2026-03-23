import { Injectable, inject, signal, computed } from '@angular/core';
import { NotificationService } from './notification.service';
import { AuthStoreService } from './auth-store.service';
import { Notificacion } from '../models/supabase.models';

/**
 * Layer 2 – Store: Notificaciones del usuario autenticado.
 *
 * Gestiona estado global de notificaciones usando Angular Signals.
 * Reutiliza el patrón de caché + Promise Guards de AuthStoreService.
 *
 * Responsabilidades:
 * - Cachear notificaciones
 * - Mantener contador de no leídas
 * - Permitir marcar como leído
 * - Invalidar caché cuando sea necesario
 */
@Injectable({ providedIn: 'root' })
export class NotificationStoreService {
  private readonly notificationService = inject(NotificationService);
  private readonly authStore = inject(AuthStoreService);

  // ── Estado privado ────────────────────────────────────────────
  private readonly _notificaciones = signal<Notificacion[]>([]);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);

  // ── Promise Guard (deduplicación) ─────────────────────────────
  private _loadPromise: Promise<void> | null = null;

  // ── Computed signals ──────────────────────────────────────────
  public readonly notificaciones = this._notificaciones.asReadonly();
  public readonly unreadCount = this._unreadCount.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  public readonly hasNotifications = computed(() => this._unreadCount() > 0);

  /**
   * Cargar notificaciones del usuario actual con deduplicación.
   * Si ya hay una carga en vuelo, reutiliza esa Promise.
   */
  async loadNotificaciones(): Promise<void> {
    if (this._isLoading()) return;
    if (this._loadPromise) return this._loadPromise;

    const perfil = await this.authStore.getPerfilActual();
    if (!perfil) return;

    this._isLoading.set(true);

    this._loadPromise = (async () => {
      try {
        const [notifResult, countResult] = await Promise.all([
          this.notificationService.getNotificaciones(perfil.id),
          this.notificationService.getUnreadCount(perfil.id),
        ]);

        if (notifResult.data) {
          this._notificaciones.set(notifResult.data);
        }

        if (countResult.count !== null) {
          this._unreadCount.set(countResult.count);
        }
      } catch (err) {
        console.error('[NotificationStore] Error al cargar notificaciones:', err);
      }
    })().finally(() => {
      this._loadPromise = null;
      this._isLoading.set(false);
    });

    return this._loadPromise;
  }

  /**
   * Marcar una notificación como leída.
   * Actualiza el estado local inmediatamente (optimistic).
   */
  async markAsRead(notificationId: string): Promise<void> {
    // Optimistic update
    this._notificaciones.update(prev =>
      prev.map(n => n.id === notificationId ? { ...n, leido: true } : n)
    );

    // Decrementar contador
    if (this._unreadCount() > 0) {
      this._unreadCount.update(count => count - 1);
    }

    // Actualizar en BD
    const { error } = await this.notificationService.markAsRead(notificationId);
    if (error) {
      console.error('[NotificationStore] Error al marcar como leído:', error);
      // Si falla, recargar desde BD
      await this.loadNotificaciones();
    }
  }

  /**
   * Invalidar caché (llamar cuando cambia el usuario o después de logout).
   */
  invalidate(): void {
    this._notificaciones.set([]);
    this._unreadCount.set(0);
    this._loadPromise = null;
  }
}
