import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
// Layer 3: Admin Services — nunca llamar al core directamente desde componentes admin
import { AdminReportService } from '../../services/adminReport.service';

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
      const { error } = await this.reportService.moderarReporte(this.reporte.id, 'descartar');
      if (error) throw error;
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
        try {
          const { error } = await this.reportService.moderarReporte(
            this.reporte.id,
            'eliminar_publicacion',
          );
          if (error) throw error;
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
          const { error } = await this.reportService.moderarReporte(
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
