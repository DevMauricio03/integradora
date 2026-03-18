import { Injectable } from '@angular/core';

/**
 * Servicio para manejar notificaciones del navegador (Browser Notification API).
 *
 * Responsabilidades:
 * - Solicitar permiso de notificaciones (solo una vez)
 * - Mostrar notificaciones del navegador
 * - Verificar permiso actual
 *
 * Documentación:
 * https://developer.mozilla.org/en-US/docs/Web/API/Notification_API
 */
@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {
  private permissionAsked = false;

  /**
   * Verificar si el navegador soporta Notification API
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Solicitar permiso para mostrar notificaciones.
   * Solo se solicita una vez por sesión.
   */
  async requestPermission(): Promise<NotificationPermission | null> {
    if (!this.isSupported()) {
      console.warn('[BrowserNotification] Notification API no soportada');
      return null;
    }

    // Si ya preguntamos, no volver a preguntar
    if (this.permissionAsked) {
      return Notification.permission;
    }

    // Si el permiso ya está definido (granted o denied), no preguntar
    if (Notification.permission !== 'default') {
      this.permissionAsked = true;
      return Notification.permission;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionAsked = true;
      return permission;
    } catch (err) {
      console.error('[BrowserNotification] Error solicitando permiso:', err);
      this.permissionAsked = true;
      return null;
    }
  }

  /**
   * Verificar permiso actual
   */
  getPermission(): NotificationPermission | null {
    if (!this.isSupported()) return null;
    return Notification.permission;
  }

  /**
   * Mostrar notificación del navegador
   * Solo si el permiso está granted
   */
  show(options: {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
  }): Notification | null {
    if (!this.isSupported()) {
      console.warn('[BrowserNotification] Notification API no soportada');
      return null;
    }

    if (Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || 'icons/tuunka_logo.svg',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });

      return notification;
    } catch (err) {
      console.error('[BrowserNotification] Error mostrando notificación:', err);
      return null;
    }
  }
}
