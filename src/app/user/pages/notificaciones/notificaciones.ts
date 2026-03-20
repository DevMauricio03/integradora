import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStoreService } from '../../../core/services/notification-store.service';
import { Notificacion } from '../../../core/models/supabase.models';
import { ModalVerMotivo } from './modal-ver-motivo';
import { ConfirmDeleteModal } from './confirm-delete-modal';
import { formatTimeAgo } from '../../../shared/utils/date.util';
import { APP_COLORS } from '../../../shared/constants/colors.constants';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, ModalVerMotivo, ConfirmDeleteModal],
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

  // ── Modal para ver motivo de eliminación ────────────────────────
  mostrarModalMotivo = signal<boolean>(false);
  motivoMostrado = signal<string>('');
  tipoEliminacion = signal<'post' | 'comentario'>('post');

  // ── Modal de confirmación para eliminar ──────────────────────────
  confirmDeleteOpen = signal<boolean>(false);
  notificationToDelete = signal<string | null>(null);
  isDeleteAll = signal<boolean>(false);

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
      'post_aceptado': APP_COLORS.PRIMARY,      // Azul predeterminado del proyecto
      'post_aprobado': APP_COLORS.PRIMARY,      // Azul predeterminado del proyecto - alias
      'post_rechazado': APP_COLORS.ERROR_RED,   // Rojo
      'comentario_eliminado': APP_COLORS.WARNING_ORANGE,  // Naranja
      'post_eliminado': APP_COLORS.ERROR_RED,   // Rojo
      'usuario_suspendido': APP_COLORS.ALERT_AMBER,  // Ámbar
      'admin_action': APP_COLORS.PRIMARY,       // Azul predeterminado del proyecto
    };
    return colorMap[tipo] || '#6b7280';
  }

  /**
   * Obtener etiqueta legible para el tipo.
   */
  getTypeLabel(tipo: string): string {
    const typeMap: Record<string, string> = {
      'post_aceptado': 'Publicación Aceptada',
      'post_aprobado': 'Publicación Aprobada',
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
   * Reutiliza la lógica centralizada de date.util.ts para consistencia en toda la app.
   */
  formatDate(dateStr: string): string {
    return formatTimeAgo(dateStr);
  }

  /**
   * Extraer el motivo/acción del mensaje de notificación.
   * Soporta múltiples formatos:
   * - "Motivo: ${motivo}"
   * - "Acción tomada: ${accion}"
   * - "Razón: ${razon}"
   *
   * IMPORTANTE: Busca PRIMERO "Motivo:" porque es la razón del admin,
   * y luego "Acción tomada:" como fallback.
   */
  private extractMotivo(mensaje: string): string {
    // DEBUG: Log el mensaje completo
    console.log('[Notificaciones] Mensaje completo:', mensaje);

    // Patrones a buscar en orden de preferencia
    // "Motivo:" es lo que escribió el admin, es más importante
    const patrones = ['Motivo:', 'Acción tomada:', 'Razón:'];

    for (const patron of patrones) {
      const index = mensaje.indexOf(patron);
      if (index !== -1) {
        const valor = mensaje.substring(index + patron.length).trim();
        console.log(`[Notificaciones] Patrón encontrado "${patron}":`, valor);

        if (valor) {
          return valor;
        } else {
          console.warn(
            `[Notificaciones] Patrón "${patron}" encontrado pero valor está vacío`,
            mensaje
          );
          return 'Motivo no disponible';
        }
      }
    }

    // Si ningún patrón fue encontrado
    console.warn('[Notificaciones] Ningún patrón encontrado en mensaje:', mensaje);
    return 'Motivo no disponible';
  }

  /**
   * Determinar si la notificación es de eliminación y puede mostrar el motivo.
   */
  isEliminacionNotificacion(tipo: string): boolean {
    return tipo === 'post_eliminado' || tipo === 'comentario_eliminado';
  }

  /**
   * Determinar si la notificación puede mostrar detalles en modal.
   * Incluye: eliminaciones, rechazos, reportes resueltos, etc.
   */
  puedeVerDetalles(tipo: string): boolean {
    const tiposConDetalles = [
      'post_eliminado',
      'comentario_eliminado',
      'post_rechazado',
      'reporte_resuelto',
      'reporte_revision'
    ];
    return tiposConDetalles.includes(tipo);
  }

  /**
   * Mostrar el modal con detalles de la notificación.
   * Marca la notificación como leída.
   * Para notificaciones con motivo (eliminación, rechazo), extrae y muestra.
   */
  async abrirDetalleNotificacion(notif: Notificacion): Promise<void> {
    if (!this.puedeVerDetalles(notif.tipo)) {
      return;
    }

    // Marcar como leída antes de mostrar el modal
    if (!notif.leido) {
      await this.notificationStore.markAsRead(notif.id).catch(err =>
        console.error('[Notificaciones] Error al marcar como leído:', err)
      );
    }

    // Extraer motivo si existe
    const motivo = this.extractMotivo(notif.mensaje);
    this.motivoMostrado.set(motivo);

    // Determinar tipo para el badge del modal
    if (notif.tipo === 'post_eliminado') {
      this.tipoEliminacion.set('post');
    } else if (notif.tipo === 'comentario_eliminado') {
      this.tipoEliminacion.set('comentario');
    } else {
      // Para otros tipos, mostrar como "otro"
      this.tipoEliminacion.set('post'); // fallback visual
    }

    this.mostrarModalMotivo.set(true);
  }

  /**
   * Abre el modal de confirmación para eliminar una notificación individual.
   */
  openDeleteConfirm(notifId: string, event: Event): void {
    event.stopPropagation();
    this.notificationToDelete.set(notifId);
    this.isDeleteAll.set(false);
    this.confirmDeleteOpen.set(true);
  }

  /**
   * Abre el modal de confirmación para eliminar todas las notificaciones.
   */
  openDeleteAllConfirm(): void {
    this.notificationToDelete.set(null);
    this.isDeleteAll.set(true);
    this.confirmDeleteOpen.set(true);
  }

  /**
   * Cierra el modal de confirmación.
   */
  closeDeleteConfirm(): void {
    this.confirmDeleteOpen.set(false);
    this.notificationToDelete.set(null);
    this.isDeleteAll.set(false);
  }

  /**
   * Ejecuta la eliminación después de confirmación.
   */
  async confirmDelete(): Promise<void> {
    if (this.isDeleteAll()) {
      await this.notificationStore.clearAll().catch(err =>
        console.error('[Notificaciones] Error al limpiar todas:', err)
      );
    } else {
      const notifId = this.notificationToDelete();
      if (notifId) {
        await this.notificationStore.deleteNotification(notifId).catch(err =>
          console.error('[Notificaciones] Error al eliminar notificación:', err)
        );
      }
    }

    this.closeDeleteConfirm();
  }

  /**
   * Cerrar el modal de motivo.
   */
  cerrarModalMotivo(): void {
    this.mostrarModalMotivo.set(false);
    this.motivoMostrado.set('');
  }
}

