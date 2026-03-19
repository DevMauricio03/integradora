import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
// Layer 3: Admin Services — nunca llamar al core directamente desde componentes admin
import { AdminReportService } from '../../services/adminReport.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-reporte-detalle-modal',
  standalone: true,
  imports: [ModalBase, IconComponent, CommonModule, SuccessModal],
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

  mostrarConfirmacion = signal<boolean>(false);
  configConfirmacion = signal<{
    titulo: string;
    mensaje: string;
    botonTexto: string;
    accion: () => Promise<void>;
  } | null>(null);

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
   * Solicita confirmación y ejecuta el RPC moderar_reporte('eliminar_publicacion').
   * El RPC en una sola transacción:
   *   1. Soft-delete de la publicación (estado = 'eliminado').
   *   2. Resuelve TODOS los reportes pendientes de esa publicación.
   */
  async eliminarPublicacion() {
    this.configConfirmacion.set({
      titulo: '¿Eliminar publicación?',
      mensaje: 'La publicación quedará desactivada y no será visible. Todos los reportes pendientes de esta publicación se marcarán como resueltos. Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);

        // Obtener IDs del autor e informante ANTES de ejecutar la acción
        const autorId = this.reporte?.autor_id;
        const informanteId = this.reporte?.reportado_por;

        try {
          const { error } = await this.reportService.moderarReporte(
            this.reporte.id,
            'eliminar_publicacion',
          );
          if (error) throw error;

          // Enviar notificación al autor de la publicación
          if (autorId) {
            try {
              await this.notificationService.createNotificacion({
                user_id: autorId,
                tipo: 'post_eliminado',
                mensaje: `Tu publicación fue eliminada por moderación. Motivo: ${this.reporte.motivo}`,
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al autor:', notifError);
            }
          }

          // Enviar notificación al informante (solo si es diferente usuario)
          if (informanteId && informanteId !== autorId) {
            try {
              await this.notificationService.createNotificacion({
                user_id: informanteId,
                tipo: 'reporte_resuelto',
                mensaje: 'Tu reporte fue revisado por moderación. Acción tomada: publicación eliminada.',
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al informante:', notifError);
            }
          }

          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error('[ReporteModal] eliminarPublicacion error:', err);
          alert('Error al eliminar la publicación');
        } finally {
          this.isProcessing.set(false);
        }
      }
    });
    this.mostrarConfirmacion.set(true);
  }

  /**
   * Solicita confirmación y ejecuta el RPC moderar_reporte('eliminar_comentario').
   * El RPC en una sola transacción:
   *   1. Elimina el comentario de la base de datos.
   *   2. Resuelve el reporte como procesado.
   */
  async eliminarComentario() {
    this.configConfirmacion.set({
      titulo: '¿Eliminar comentario?',
      mensaje: 'El comentario será eliminado de la base de datos. No será visible para otros usuarios. Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);

        // Obtener IDs del autor e informante ANTES de ejecutar la acción
        const autorId = this.reporte?.autor_id;
        const informanteId = this.reporte?.reportado_por;

        try {
          const { error } = await this.reportService.moderarReporte(
            this.reporte.id,
            'eliminar_comentario',
          );
          if (error) throw error;

          // Enviar notificación al autor del comentario
          if (autorId) {
            try {
              await this.notificationService.createNotificacion({
                user_id: autorId,
                tipo: 'comentario_eliminado',
                mensaje: `Uno de tus comentarios fue eliminado por moderación. Motivo: ${this.reporte.motivo}`,
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al autor:', notifError);
            }
          }

          // Enviar notificación al informante (solo si es diferente usuario)
          if (informanteId && informanteId !== autorId) {
            try {
              await this.notificationService.createNotificacion({
                user_id: informanteId,
                tipo: 'reporte_resuelto',
                mensaje: 'Tu reporte fue revisado por moderación. Acción tomada: comentario eliminado.',
                leido: false
              });
            } catch (notifError) {
              console.error('Error enviando notificación al informante:', notifError);
            }
          }

          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error('[ReporteModal] eliminarComentario error:', err);
          alert('Error al eliminar el comentario');
        } finally {
          this.isProcessing.set(false);
        }
      }
    });
    this.mostrarConfirmacion.set(true);
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
