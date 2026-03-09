import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
// Layer 3: Admin Services — nunca llamar al core directamente desde componentes admin
import { AdminUserService } from '../../services/adminUser.service';
import { AdminReportService } from '../../services/adminReport.service';
import { AdminPublicationService } from '../../services/adminPublication.service';

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

  private readonly userService   = inject(AdminUserService);
  private readonly reportService = inject(AdminReportService);
  private readonly pubService    = inject(AdminPublicationService);

  isProcessing = signal<boolean>(false);
  showSuspensionOptions = signal<boolean>(false);

  mostrarConfirmacion = signal<boolean>(false);
  configConfirmacion = signal<{
    titulo: string;
    mensaje: string;
    botonTexto: string;
    accion: () => Promise<void>;
  } | null>(null);

  // ── Acciones atómicas de moderación ─────────────────────────────────────

  /**
   * Descarta el reporte: cambia estado a 'descartado'.
   * El registro permanece en la BD para historial de moderación.
   * NO elimina la publicación.
   */
  async descartarReporte() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    try {
      const { error } = await this.reportService.discardReport(this.reporte.id);
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
   * Solicita confirmación y luego ejecuta soft-delete de la publicación.
   * Acción 1 (atómica): marca publicación como 'eliminado'.
   * Acción 2 (atómica): descarta el reporte como 'descartado'.
   * Cada acción falla de forma independiente.
   */
  async eliminarPublicacion() {
    this.configConfirmacion.set({
      titulo: '¿Eliminar publicación?',
      mensaje: 'La publicación quedará desactivada y no será visible. El reporte se marcará como resuelto. Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);
        try {
          // Acción 1: soft-delete de la publicación
          const { error: pubError } = await this.pubService.softDeletePost(this.reporte.publicacion_id);
          if (pubError) throw pubError;

          // Acción 2: descartar el reporte (preservar historial)
          const { error: reportError } = await this.reportService.discardReport(this.reporte.id);
          if (reportError) {
            console.warn('[ReporteModal] Publicación eliminada pero fallo al descartar reporte:', reportError);
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

  toggleSuspension() {
    this.showSuspensionOptions.update(v => !v);
  }

  /**
   * Solicita confirmación y suspende al autor de la publicación.
   * Acción 1 (atómica): suspender usuario con fecha de expiración.
   * Acción 2 (atómica): descartar el reporte ('descartado').
   * Cada acción falla de forma independiente.
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
          // Acción 1: suspender con fecha de expiración
          const { error: suspError } = await this.userService.suspendUser(this.reporte.autor_id, hours);
          if (suspError) throw suspError;

          // Acción 2: descartar el reporte (preservar historial)
          const { error: reportError } = await this.reportService.discardReport(this.reporte.id);
          if (reportError) {
            console.warn('[ReporteModal] Usuario suspendido pero fallo al descartar reporte:', reportError);
          }

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
