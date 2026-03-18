import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { BrowserNotificationService } from './browser-notification.service';
import { ToastService } from './toast.service';
import { AuthStoreService } from './auth-store.service';
import { SupabaseClientService } from './supabase-client.service';
import { Notificacion } from '../models/supabase.models';
import { RealtimeChannel } from '@supabase/supabase-js';

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
 * - Solicitar permisos de notificaciones del navegador
 * - Mostrar notificaciones push
 * - NUEVO: Suscribirse a actualizaciones en tiempo real con Supabase Realtime
 * - NUEVO: Mostrar toasts cuando llega una notificación nueva
 */
@Injectable({ providedIn: 'root' })
export class NotificationStoreService {
  private readonly notificationService = inject(NotificationService);
  private readonly browserNotifService = inject(BrowserNotificationService);
  private readonly toastService = inject(ToastService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);  // NUEVO: Para navegación en toasts
  private readonly supabaseClient = inject(SupabaseClientService).client;
  private readonly destroyRef = inject(DestroyRef);

  // ── Estado privado ────────────────────────────────────────────
  private readonly _notificaciones = signal<Notificacion[]>([]);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);

  // ── Promise Guard (deduplicación) ─────────────────────────────
  private _loadPromise: Promise<void> | null = null;

  // ── Realtime Channel ──────────────────────────────────────────
  private _realtimeChannel: RealtimeChannel | null = null;
  private _realtimeInitialized = false;

  // ── Computed signals ──────────────────────────────────────────
  public readonly notificaciones = this._notificaciones.asReadonly();
  public readonly unreadCount = this._unreadCount.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  public readonly hasNotifications = computed(() => this._unreadCount() > 0);
  public readonly hasAnyNotifications = computed(() => this._notificaciones().length > 0);  // Usa length en lugar de signal separado

  constructor() {
    // Cleanup automático cuando se destruye el servicio
    this.destroyRef.onDestroy(() => {
      this._unsubscribeFromRealtime();
    });
  }

  /**
   * Cargar notificaciones del usuario actual con deduplicación.
   * Si ya hay una carga en vuelo, reutiliza esa Promise.
   *
   * También solicita permiso de notificaciones del navegador (una sola vez).
   * Muestra notificaciones push del navegador para nuevas notificaciones.
   *
   * NUEVO: Inicia suscripción Realtime para actualizaciones en tiempo real.
   */
  async loadNotificaciones(): Promise<void> {
    if (this._isLoading()) return;
    if (this._loadPromise) return this._loadPromise;

    const perfil = await this.authStore.getPerfilActual();
    if (!perfil) return;

    this._isLoading.set(true);

    this._loadPromise = (async () => {
      try {
        // ── Solicitar permiso de notificaciones (una sola vez) ───
        await this.browserNotifService.requestPermission().catch(err =>
          console.warn('[NotificationStore] Error solicitando permiso:', err)
        );

        const [notifResult, countResult] = await Promise.all([
          this.notificationService.getNotificaciones(perfil.id),
          this.notificationService.getUnreadCount(perfil.id),
        ]);

        if (notifResult.data) {
          // Obtener notificaciones antes (si es que hay)
          const notifAntes = this._notificaciones();

          // Actualizar estado
          this._notificaciones.set(notifResult.data);

          // Buscar notificaciones nuevas sin leer
          const nuevas = notifResult.data.filter(n =>
            !n.leido && !notifAntes.find(nb => nb.id === n.id)
          );

          // Mostrar notificación del navegador para cada una nueva
          nuevas.forEach(notif => {
            this.browserNotifService.show({
              title: this.getTitleForType(notif.tipo),
              body: notif.mensaje,
              icon: 'icons/tuunka_logo.svg',
              badge: 'icons/tuunka_logo.svg',
              tag: `notif-${notif.id}`, // Evita duplicados
            });
          });
        }

        if (countResult.count !== null) {
          this._unreadCount.set(countResult.count);
        }

        // ── NUEVO: Iniciar suscripción Realtime ───────────────
        if (!this._realtimeInitialized) {
          this._subscribeToRealtime(perfil.id);
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
   * NUEVO: Suscribirse a cambios en tiempo real de la tabla notificaciones.
   * Escucha inserts donde user_id = usuario actual.
   * Agrega notificaciones nuevas al estado, actualiza el contador y muestra toasts.
   *
   * Mejoras implementadas:
   * - DEDUPLICACIÓN: Verifica que no exista notificación con mismo ID
   * - DOCUMENT VISIBILITY: Si pestaña visible → toast, si oculta → push
   * - BATCHING: Agrupa múltiples toasts en período corto
   */
  private _subscribeToRealtime(userId: string): void {
    try {
      this._realtimeChannel = this.supabaseClient
        .channel(`notificaciones:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificaciones',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotificacion = payload.new as Notificacion;

            // ── FASE 5: DEDUPLICACIÓN ────────────────────────────
            // Verificar que no exista already en la lista
            if (this._notificaciones().some(n => n.id === newNotificacion.id)) {
              console.log('[NotificationStore] Notificación duplicada ignorada:', newNotificacion.id);
              return;
            }

            // Agregar notificación al inicio de la lista
            this._notificaciones.update(prev => [newNotificacion, ...prev]);

            // Incrementar contador de no leídas si la notificación no está leída
            if (!newNotificacion.leido) {
              this._unreadCount.update(count => count + 1);
            }

            // ── FASE 3: DOCUMENT VISIBILITY CHECK ─────────────────
            // Si pestaña está visible → mostrar toast
            // Si pestaña está oculta → mostrar push del navegador
            if (document.visibilityState === 'visible') {
              // Pestaña visible → mostrar toast (con batching para evitar spam)
              // NUEVO: Pasar acción para navegar al panel de notificaciones
              this.toastService.showBatched(() =>
                this.router.navigate(['/user/notificaciones'])
              );
            } else {
              // Pestaña oculta → mostrar push notification solamente
              this.browserNotifService.show({
                title: this.getTitleForType(newNotificacion.tipo),
                body: newNotificacion.mensaje,
                icon: 'icons/tuunka_logo.svg',
                badge: 'icons/tuunka_logo.svg',
                tag: `notif-${newNotificacion.id}`,
              });
            }

            console.log('[NotificationStore] Nueva notificación recibida (Realtime):', newNotificacion);
          }
        )
        .subscribe((status) => {
          console.log('[NotificationStore] Realtime channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[NotificationStore] Conectado a actualizaciones en tiempo real');
            this._realtimeInitialized = true;
          }
        });
    } catch (err) {
      console.error('[NotificationStore] Error al suscribirse a Realtime:', err);
    }
  }

  /**
   * NUEVO: Desuscribirse del canal Realtime.
   */
  private _unsubscribeFromRealtime(): void {
    if (this._realtimeChannel) {
      this.supabaseClient.removeChannel(this._realtimeChannel);
      this._realtimeChannel = null;
      console.log('[NotificationStore] Desuscrito de Realtime');
    }
  }

  /**
   * Obtener título legible para tipo de notificación
   */
  private getTitleForType(tipo: string): string {
    const titleMap: Record<string, string> = {
      'post_aceptado': '✅ Publicación Aceptada',
      'post_rechazado': '❌ Publicación Rechazada',
      'comentario_eliminado': '🗑️ Comentario Eliminado',
      'post_eliminado': '🗑️ Publicación Eliminada',
      'usuario_suspendido': '🔒 Cuenta Suspendida',
      'admin_action': '⚙️ Acción Administrativa',
    };
    return titleMap[tipo] || 'Nueva Notificación';
  }

  /**
   * Marcar una notificación como leída.
   * Actualiza el estado local inmediatamente (optimistic).
   * Muestra notificación push del navegador si está habilitada.
   */
  async markAsRead(notificationId: string): Promise<void> {
    // Obtener la notificación antes de actualizar
    const notif = this._notificaciones().find(n => n.id === notificationId);

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
   * También desuscribe del canal Realtime.
   */
  invalidate(): void {
    this._notificaciones.set([]);
    this._unreadCount.set(0);
    this._loadPromise = null;
    this._realtimeInitialized = false;
    this._unsubscribeFromRealtime();
  }
}

