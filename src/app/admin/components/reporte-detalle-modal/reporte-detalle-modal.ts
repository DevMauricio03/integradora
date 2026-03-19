import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Layer 3: Admin Services — nunca llamar al core directamente desde componentes admin
import { AdminReportService } from '../../services/adminReport.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-reporte-detalle-modal',
  standalone: true,
  imports: [ModalBase, IconComponent, CommonModule, SuccessModal, FormsModule],
  templateUrl: './reporte-detalle-modal.html',
  styleUrls: ['./reporte-detalle-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteDetalleModal {
  @Input() reporte: any;
  @Output() closed = new EventEmitter<void>();
  @Output() actionExecuted = new EventEmitter<void>();

  private readonly reportService = inject(AdminReportService);
  private readonly notificationService = inject(NotificationService);

  isProcessing = signal<boolean>(false);
  showSuspensionOptions = signal<boolean>(false);

  // ── Modales de eliminación ─────────────────────────────────────────
  mostrarModalMotivo = signal<boolean>(false);
  motivoEliminacion = signal<string>('');
  tipoEliminacionEnCurso = signal<'publicacion' | 'comentario' | null>(null);

  mostrarConfirmacion = signal<boolean>(false);
  configConfirmacion = signal<{
    titulo: string;
    mensaje: string;
    botonTexto: string;
    accion: () => Promise<void>;
  } | null>(null);

  // ── Método para pedir motivo ANTES de eliminar ────────────────────────
  /**
   * Abre modal para que el admin escriba el motivo de eliminación.
   * Después abre el modal de confirmación.
   */
  private askForDeletionReason(type: 'publicacion' | 'comentario') {
    // Pre-llenar con motivo del reporte si existe
    this.motivoEliminacion.set(this.reporte?.motivo || '');
    this.tipoEliminacionEnCurso.set(type);
    this.mostrarModalMotivo.set(true);
  }

  /**
   * Confirma el motivo y abre modal de eliminación.
   */
  confirmarMotivo() {
    if (!this.motivoEliminacion().trim()) {
      alert('Por favor, escriba el motivo de eliminación');
      return;
    }

    const type = this.tipoEliminacionEnCurso();
    if (!type) return;

    this.mostrarModalMotivo.set(false);

    // Actualizar reporte con motivo personalizado
    if (this.reporte) {
      this.reporte.motivo = this.motivoEliminacion();
    }

    // Abrir modal de confirmación
    this.openDeleteConfirm(type);
  }

  /**
   * Cancela la entrada de motivo.
   */
  cancelarMotivo() {
    this.mostrarModalMotivo.set(false);
    this.motivoEliminacion.set('');
    this.tipoEliminacionEnCurso.set(null);
  }

  // ── Método genérico para ambas eliminaciones ────────────────────────
  /**
   * Abre modal de confirmación para eliminar publicación o comentario.
   * Maneja ambos casos de forma genérica para evitar duplicación.
   */
  private openDeleteConfirm(type: 'publicacion' | 'comentario') {
    const config = type === 'publicacion' ? {
      titulo: '¿Eliminar publicación?',
      mensaje: 'La publicación quedará desactivada y no será visible. Todos los reportes pendientes de esta publicación se marcarán como resueltos. Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
    } : {
      titulo: '¿Eliminar comentario?',
      mensaje: 'El comentario será eliminado de la base de datos. No será visible para otros usuarios. Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
    };

    this.configConfirmacion.set({
      ...config,
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);

        const autorId = this.reporte?.autor_id;
        const informanteId = this.reporte?.reportado_por;

        try {
          const accionModeracion = type === 'publicacion' ? 'eliminar_publicacion' : 'eliminar_comentario';
          const { error } = await this.reportService.moderarReporte(
            this.reporte.id,
            accionModeracion as 'eliminar_publicacion' | 'eliminar_comentario',
          );
          if (error) throw error;

          // ── Notificar al autor ────────────────────────────────────
          if (autorId) {
            try {
              const notificationType = type === 'publicacion' ? 'post_eliminado' : 'comentario_eliminado';
              const notificationMsg = type === 'publicacion'
                ? `Tu publicación fue eliminada por moderación. Motivo: ${this.reporte.motivo}`
                : `Uno de tus comentarios fue eliminado por moderación. Motivo: ${this.reporte.motivo}`;

              await this.notificationService.createNotificacion({
                user_id: autorId,
                tipo: notificationType as 'post_eliminado' | 'comentario_eliminado',
                mensaje: notificationMsg,
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al autor:', notifError);
            }
          }

          // ── Notificar al informante ────────────────────────────────
          if (informanteId && informanteId !== autorId) {
            try {
              const accionTexto = type === 'publicacion' ? 'publicación eliminada' : 'comentario eliminado';
              await this.notificationService.createNotificacion({
                user_id: informanteId,
                tipo: 'reporte_resuelto',
                mensaje: `Tu reporte fue revisado por moderación. Acción tomada: ${accionTexto}. Motivo: ${this.reporte.motivo}`,
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al informante:', notifError);
            }
          }

          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error(`[ReporteModal] Error al eliminar ${type}:`, err);
          alert(`Error al eliminar ${type === 'publicacion' ? 'publicación' : 'comentario'}`);
        } finally {
          this.isProcessing.set(false);
        }
      }
    });

    this.mostrarConfirmacion.set(true);
  }

  // ── Alias para compatibilidad backward ────────────────────────────────

  // ── Acciones de moderación ────────────────────────────────────────────────

  /**
   * Descarta el reporte: estado='descartado', resolucion='sin_infraccion'.
   * La RPC valida admin + que el reporte esté pendiente.
   */
  async descartarReporte() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    try {
      // Obtener el ID del informante ANTES de ejecutar la acción
      const informanteId = this.reporte?.reportado_por;

      const { error } = await this.reportService.moderarReporte(this.reporte.id, 'descartar');
      if (error) throw error;

      // Notificar al informante que su reporte fue revisado
      if (informanteId) {
        try {
          await this.notificationService.createNotificacion({
            user_id: informanteId,
            tipo: 'reporte_revision',
            mensaje: 'Tu reporte fue revisado. No se detectó una infracción.',
            leido: false
          });
        } catch (notifError) {
          console.error('Error enviando notificación de reporte revisado:', notifError);
        }
      }

      this.actionExecuted.emit();
      this.closed.emit();
    } catch (err) {
      console.error('[ReporteModal] descartarReporte error:', err);
      alert('Error al descartar el reporte');
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Elimina una publicación (abre modal para escribir motivo primero).
   */
  async eliminarPublicacion() {
    this.askForDeletionReason('publicacion');
  }

  /**
   * Elimina un comentario (abre modal para escribir motivo primero).
   */
  async eliminarComentario() {
    this.askForDeletionReason('comentario');
  }

  toggleSuspension() {
    this.showSuspensionOptions.update(v => !v);
  }

  /**
   * Solicita confirmación y ejecuta el RPC moderar_reporte('suspender_usuario').
   * El RPC en una sola transacción:
   *   1. Suspende al autor con fecha de expiración.
   *   2. Resuelve TODOS los reportes pendientes del autor.
   */
  async suspenderUsuario(periodo: '1d' | '1w' | '1m' | 'perm') {
    const duraciones: Record<string, { hours: number | null; label: string }> = {
      '1d':  { hours: 24,   label: '1 día' },
      '1w':  { hours: 168,  label: '1 semana' },
      '1m':  { hours: 720,  label: '1 mes' },
      'perm':{ hours: null, label: 'largo plazo' },
    };
    const { hours, label } = duraciones[periodo];

    this.configConfirmacion.set({
      titulo: '¿Suspender usuario?',
      mensaje: `¿Suspender a este usuario por ${label}? No podrá acceder a su cuenta durante este periodo.`,
      botonTexto: 'Sí, suspender',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);
        try {
          const { data, error } = await this.reportService.moderarReporte(
            this.reporte.id,
            'suspender_usuario',
            hours,
          );
          if (error) throw error;
          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error('[ReporteModal] suspenderUsuario error:', err);
          alert('Error al suspender al usuario');
        } finally {
          this.isProcessing.set(false);
        }
      }
    });
    this.mostrarConfirmacion.set(true);
  }
}
