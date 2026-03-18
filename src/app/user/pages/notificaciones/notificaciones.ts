import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStoreService } from '../../../core/services/notification-store.service';
import { Notificacion } from '../../../core/models/supabase.models';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notificaciones implements OnInit {
  private readonly notificationStore = inject(NotificationStoreService);

  // ── Signals expuestas ─────────────────────────────────────────
  readonly notificaciones = this.notificationStore.notificaciones;
  readonly isLoading = this.notificationStore.isLoading;
  readonly hasNotifications = this.notificationStore.hasNotifications;
  readonly hasAnyNotifications = this.notificationStore.hasAnyNotifications;  // NUEVO: Para mostrar panel aunque esté vacío

  ngOnInit() {
    // Cargar notificaciones si aún no estén cargadas
    this.notificationStore.loadNotificaciones().catch(err =>
      console.error('[NotificacionesPage] Error cargando:', err)
    );
  }

  /**
   * Marcar una notificación como leída.
   */
  async markAsRead(notif: Notificacion): Promise<void> {
    if (!notif.leido) {
      await this.notificationStore.markAsRead(notif.id);
    }
  }

  /**
   * Obtener icono según el tipo de notificación.
   */
  getIconForType(tipo: string): string {
    const iconMap: Record<string, string> = {
      'post_aceptado': 'check-circle',
      'post_rechazado': 'x-circle',
      'comentario_eliminado': 'trash',
      'post_eliminado': 'alert-circle',
      'usuario_suspendido': 'lock',
      'admin_action': 'shield',
    };
    return iconMap[tipo] || 'bell';
  }

  /**
   * Obtener color según el tipo de notificación.
   */
  getColorForType(tipo: string): string {
    const colorMap: Record<string, string> = {
      'post_aceptado': '#10b981',     // Verde
      'post_rechazado': '#ef4444',    // Rojo
      'comentario_eliminado': '#f97316',  // Naranja
      'post_eliminado': '#ef4444',    // Rojo
      'usuario_suspendido': '#f59e0b', // Ámbar
      'admin_action': '#3b82f6',      // Azul
    };
    return colorMap[tipo] || '#6b7280';
  }

  /**
   * Obtener etiqueta legible para el tipo.
   */
  getTypeLabel(tipo: string): string {
    const typeMap: Record<string, string> = {
      'post_aceptado': 'Publicación Aceptada',
      'post_rechazado': 'Publicación Rechazada',
      'comentario_eliminado': 'Comentario Eliminado',
      'post_eliminado': 'Publicación Eliminada',
      'usuario_suspendido': 'Cuenta Suspendida',
      'admin_action': 'Acción Administrativa',
    };
    return typeMap[tipo] || tipo.replace(/_/g, ' ');
  }

  /**
   * Formatear fecha relativa.
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-MX');
  }
}

