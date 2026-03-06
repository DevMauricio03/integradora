import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';

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

  readonly supabase = inject(SupabaseService);
  isProcessing = signal<boolean>(false);
  showSuspensionOptions = signal<boolean>(false);

  // Estado para confirmación personalizada
  mostrarConfirmacion = signal<boolean>(false);
  configConfirmacion = signal<{
    titulo: string;
    mensaje: string;
    botonTexto: string;
    accion: () => Promise<void>;
  } | null>(null);

  async descartarReporte() {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);

    try {
      const { data, error } = await this.supabase.deleteReport(this.reporte.id);

      if (error) throw error;

      // Si la base de datos no arrojó error pero NO devolvió nada eliminado, RLS lo bloqueó.
      if (!data || data.length === 0) {
        alert('ADVERTENCIA: Tu cuenta no tiene permisos RLS configurados en Supabase para ELIMINAR (DELETE) reportes. El registro sigue en la base de datos.');
      }

      this.actionExecuted.emit();
      this.closed.emit();
    } catch (err) {
      console.error(err);
      alert('Error al descartar el reporte');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async eliminarPublicacion() {
    this.configConfirmacion.set({
      titulo: '¿Eliminar publicación?',
      mensaje: '¿Estás seguro de eliminar esta publicación definitivamente? Esta acción no se puede deshacer.',
      botonTexto: 'Sí, eliminar',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);

        try {
          const { error: postError } = await this.supabase.client
            .from('publicaciones')
            .delete()
            .eq('id', this.reporte.publicacion_id);

          if (postError) throw postError;

          const { data, error: reportError } = await this.supabase.deleteReport(this.reporte.id);
          if (reportError) throw reportError;

          // Verificación RLS
          if (!data || data.length === 0) {
            alert('ADVERTENCIA: La publicación fue eliminada, pero no tienes permisos RLS para eliminar el reporte. Configura tus políticas en Supabase para permitir DELETE en "reportes".');
          }

          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error(err);
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

  async suspenderUsuario(periodo: '1d' | '1w' | '1m' | 'perm') {
    let label = '1 día';
    let hours: number | null = 24;
    if (periodo === '1w') { hours = 168; label = '1 semana'; }
    if (periodo === '1m') { hours = 720; label = '1 mes'; }
    if (periodo === 'perm') { hours = null; label = 'forma permanente'; }

    this.configConfirmacion.set({
      titulo: '¿Suspender usuario?',
      mensaje: `¿Estás seguro de suspender a este usuario por ${label}? El usuario no podrá acceder a su cuenta durante este periodo.`,
      botonTexto: 'Sí, suspender',
      accion: async () => {
        if (this.isProcessing()) return;
        this.isProcessing.set(true);
        this.mostrarConfirmacion.set(false);

        try {
          const { error: suspError } = await this.supabase.suspendUser(this.reporte.autor_id, hours);
          if (suspError) throw suspError;

          const { data, error: reportError } = await this.supabase.deleteReport(this.reporte.id);
          if (reportError) throw reportError;

          // Verificación RLS
          if (!data || data.length === 0) {
            alert('ADVERTENCIA: El usuario fue suspendido, pero los permisos RLS (Supabase) están bloqueando la eliminación del reporte. Activa el DELETE para admins en tu base de datos.');
          }

          this.actionExecuted.emit();
          this.closed.emit();
        } catch (err) {
          console.error(err);
          alert('Error al suspender al usuario');
        } finally {
          this.isProcessing.set(false);
        }
      }
    });
    this.mostrarConfirmacion.set(true);
  }
}
