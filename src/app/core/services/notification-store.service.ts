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
   * ✅ FASE 3: Inicializar Realtime de forma EXPLÍCITA e INDEPENDIENTE
   *
   * Este método debe llamarse automáticamente cuando el usuario se autentica.
   * NO depender de loadNotificaciones() para evitar circular dependencies.
   *
   * Llamar desde: AuthService.signIn() o un guard
   */
  public initRealtime(userId: string): void {
    console.log('[NotificationStore] 🔐 initRealtime() - iniciando para userId:', userId);

    // Si ya hay un canal activo, no reinicializar
    if (this._realtimeInitialized && this._realtimeChannel) {
      console.log('[NotificationStore] ℹ️ Realtime ya activo, saltando init');
      return;
    }

    // Limpiar cualquier suscripción anterior
    this._unsubscribeFromRealtime();

    // Crear nueva suscripción
    this._subscribeToRealtime(userId);
  }

  /**
   * Cargar notificaciones del usuario actual con deduplicación.
   * Si ya hay una carga en vuelo, reutiliza esa Promise.
   *
   * También solicita permiso de notificaciones del navegador (una sola vez).
   * Muestra notificaciones push del navegador para nuevas notificaciones.
   *
   * ⚠️ IMPORTANTE: Realtime se inicializa de forma INDEPENDIENTE en initRealtime()
   * Este método NO inicia Realtime para evitar dependencias circulares.
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
              icon: 'icons/tuunka_logo.png',
              badge: 'icons/tuunka_logo.png',
              tag: `notif-${notif.id}`, // Evita duplicados
            });
          });
        }

        if (countResult.count !== null) {
          this._unreadCount.set(countResult.count);
        }

        // ✅ Realtime se inicializa de forma INDEPENDIENTE en initRealtime()
        // NO se inicializa aquí para evitar duplicaciones y permitir proper cleanup en logout
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
   * Agrega notificaciones nuevas al estado, actualiza el contador y muestra toasts + push.
   *
   * Mejoras implementadas:
   * - DEDUPLICACIÓN: Verifica que no exista notificación con mismo ID
   * - DOUBLE NOTIFICATION: Muestra SIEMPRE push del navegador
   * - CONTEXT-AWARE TOAST: Si pestaña visible, toast muestra el CONTENIDO real
   * - BATCHING: Agrupa múltiples toasts en período corto (pero CON contenido)
   *
   * FLUJO MEJORADO:
   * 1. Notificación llega → Deduplicar
   * 2. Actualizar state (signals)
   * 3. Mostrar PUSH NOTIFICATION siempre (si permiso granted)
   * 4. Si pestaña visible → Mostrar toast CON CONTENIDO + navegación
   *    Si pestaña oculta → Mostrar solo push (evita doble notificación)
   */
  private _subscribeToRealtime(userId: string): void {
    try {
      console.log('[NotificationStore] 🔌 Intentando conectar a Realtime para user:', userId);

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
            console.log('[NotificationStore] 📨 EVENTO REALTIME RECIBIDO:', payload);
            const newNotificacion = payload.new as Notificacion;

            // ── DEDUPLICACIÓN ─────────────────────────────────────
            if (this._notificaciones().some(n => n.id === newNotificacion.id)) {
              console.log('[NotificationStore] ⚠️ Notificación duplicada ignorada');
              return;
            }

            console.log('[NotificationStore] ✨ Agregando notificación:', newNotificacion);

            // Agregar notificación al inicio de la lista
            this._notificaciones.update(prev => [newNotificacion, ...prev]);

            // Incrementar contador de no leídas si la notificación no está leída
            if (!newNotificacion.leido) {
              this._unreadCount.update(count => count + 1);
            }

            // ── Obtener contenido descriptivo de la notificación ──
            const title = this.getTitleForType(newNotificacion.tipo);

            // ── DOCUMENT VISIBILITY CHECK (PATRÓN ESTÁNDAR) ────────
            if (document.visibilityState === 'visible') {
              // ✅ Usuario DENTRO de la app → SOLO toast
              this.toastService.show(
                `${title} - ${newNotificacion.mensaje}`,
                'info',
                5000,
                () => this.router.navigate(['/user/notificaciones'])
              );
            } else {
              // ✅ Usuario FUERA de la app → SOLO push notification
              if (Notification.permission === 'granted') {
                this.browserNotifService.show({
                  title: title,
                  body: newNotificacion.mensaje,
                  icon: 'icons/tuunka_logo.png',
                  tag: this.buildNotificationTag(newNotificacion),
                  requireInteraction: true
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('[NotificationStore] 🔔 Estado Realtime:', status);

          if (status === 'SUBSCRIBED') {
            this._realtimeInitialized = true;
            console.log('[NotificationStore] ✅ CONECTADO a Realtime exitosamente');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[NotificationStore] ❌ ERROR - Verifica que Realtime esté HABILITADO en Supabase para tabla "notificaciones"');
          } else if (status === 'TIMED_OUT') {
            console.error('[NotificationStore] ⏱️ TIMEOUT en conexión');
          } else if (status === 'CLOSED') {
            console.warn('[NotificationStore] 🔌 Canal cerrado');
          }
        });
    } catch (err) {
      console.error('[NotificationStore] 💥 Error al suscribirse a Realtime:', err);
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
   * Construir tag para push notifications con agrupación inteligente.
   *
   * Estrategia de tagging (ahora con campos de contexto reales):
   * - Si tiene post_id → tag incluye el ID del post
   * - Si tiene comentario_id → tag incluye el ID del comentario
   * - Si no tiene contexto → tag solo con tipo
   *
   * Resultado:
   * ✅ Notificaciones sobre el MISMO post se agrupan
   * ✅ Notificaciones sobre posts DISTINTOS se mantienen separadas
   * ✅ SIN hacks con substring de mensaje
   * ✅ Preciso y confiable
   *
   * Ejemplo:
   * - 3 comentarios eliminados del post_id "xyz" → tag: "notif-comentario_eliminado-post-xyz"
   * - comentario eliminado del post_id "abc" → tag: "notif-comentario_eliminado-post-abc"
   * - usuario suspendido (sin contexto) → tag: "notif-usuario_suspendido"
   */
  private buildNotificationTag(notif: Notificacion): string {
    const baseTag = `notif-${notif.tipo}`;

    // Prioridad: usar campos de contexto real en lugar de hacks
    if (notif.post_id) {
      return `${baseTag}-post-${notif.post_id}`;
    }

    if (notif.comentario_id) {
      return `${baseTag}-comentario-${notif.comentario_id}`;
    }

    // Fallback: solo tipo (para notificaciones sin contexto específico)
    return baseTag;
  }

  /**
   * Obtener título legible para tipo de notificación
   */
  private getTitleForType(tipo: string): string {
    const titleMap: Record<string, string> = {
      'post_aceptado': '✅ Publicación Aceptada',
      'post_aprobado': '✅ Publicación Aprobada',
      'post_rechazado': '❌ Publicación Rechazada',
      'comentario_eliminado': '🗑️ Comentario Eliminado',
      'post_eliminado': '🗑️ Publicación Eliminada',
      'usuario_suspendido': '🔒 Cuenta Suspendida',
      'admin_action': '⚙️ Acción Administrativa',
      'reporte_resuelto': '✅ Reporte Resuelto',
      'reporte_revision': 'ℹ️ Reporte Revisado',
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
   * Eliminar una notificación individual.
   * Actualiza el estado local inmediatamente (optimistic).
   */
  async deleteNotification(notificationId: string): Promise<void> {
    // Single-pass update: find and remove in one iteration
    let notif: Notificacion | undefined;
    this._notificaciones.update(prev => {
      notif = prev.find(n => n.id === notificationId);
      return prev.filter(n => n.id !== notificationId);
    });

    // Decrementar contador si estaba sin leer
    if (notif && !notif.leido && this._unreadCount() > 0) {
      this._unreadCount.update(count => count - 1);
    }

    // Eliminar en BD
    const { error } = await this.notificationService.deleteNotification(notificationId);
    if (error) {
      console.error('[NotificationStore] Error al eliminar notificación:', error);
      // Si falla, recargar desde BD
      await this.loadNotificaciones();
    }
  }

  /**
   * Eliminar todas las notificaciones del usuario actual.
   * Actualiza el estado local inmediatamente (optimistic).
   */
  async clearAll(): Promise<void> {
    const perfil = await this.authStore.getPerfilActual();
    if (!perfil) return;

    // Optimistic update: limpiar lista
    this._notificaciones.set([]);
    this._unreadCount.set(0);

    // Eliminar en BD
    const { error } = await this.notificationService.deleteAllNotifications(perfil.id);
    if (error) {
      console.error('[NotificationStore] Error al limpiar todas las notificaciones:', error);
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

