import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ReporteDetalleModal } from '../../components/reporte-detalle-modal/reporte-detalle-modal';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SuccessModal } from '../../../shared/components/successModal/successModal';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, IconComponent, UsuarioDetalleModal, ReporteDetalleModal, SuccessModal],
    templateUrl: './reports.html',
    styleUrls: ['./reports.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReports implements OnInit {
    private readonly supabase = inject(SupabaseService);

    reportes = signal<any[]>([]);
    isLoading = signal(true);

    mostrarModalUsuario = signal(false);
    mostrarModalReporte = signal(false);
    reporteSeleccionado = signal<any>(null);
    usuarioSeleccionado = signal<any>(null);

    // Filtros
    filtroEstado = signal<string>('pendiente');
    searchTerm = signal<string>('');

    filteredReportes = computed(() => {
        let items = this.reportes();

        // Filtrar por estado
        if (this.filtroEstado() === 'resuelto') {
            // "Resueltos" incluye tanto los aceptados como los rechazados/descartados
            items = items.filter(r => r.estado === 'resuelto' || r.estado === 'rechazado');
        } else if (this.filtroEstado() !== 'todos') {
            items = items.filter(r => r.estado === this.filtroEstado());
        }

        // Filtrar por término de búsqueda
        const search = this.searchTerm().toLowerCase();
        if (search) {
            items = items.filter(r =>
                r.id.toLowerCase().includes(search) ||
                r.motivo.toLowerCase().includes(search) ||
                r.autor?.nombre?.toLowerCase().includes(search) ||
                r.informante?.nombre?.toLowerCase().includes(search)
            );
        }

        return items;
    });

    showSuccessAction = signal(false);
    successMessage = signal('');

    ngOnInit() {
        this.cargarReportes();
    }

    async cargarReportes() {
        this.isLoading.set(true);
        try {
            const { data, error } = await this.supabase.getReportsList();
            if (error) throw error;
            this.reportes.set(data || []);
        } catch (err) {
            console.error('Error al cargar reportes:', err);
        } finally {
            this.isLoading.set(false);
        }
    }

    abrirModalUsuario(usuario: any): void {
        this.usuarioSeleccionado.set(usuario);
        this.mostrarModalUsuario.set(true);
    }

    cerrarModalUsuario(): void {
        this.mostrarModalUsuario.set(false);
        this.usuarioSeleccionado.set(null);
    }

    abrirModalReporte(reporte: any): void {
        this.reporteSeleccionado.set(reporte);
        this.mostrarModalReporte.set(true);
    }

    cerrarModalReporte(): void {
        this.mostrarModalReporte.set(false);
        this.reporteSeleccionado.set(null);
    }

    handleActionExecuted() {
        const idActualizado = this.reporteSeleccionado()?.id;

        // 1. Cerramos el modal inmediatamente para evitar interacciones extra
        this.cerrarModalReporte();

        if (idActualizado) {
            // 2. Eliminación visual inmediata del tablero
            this.reportes.update(items => items.filter(r => r.id !== idActualizado));
        }

        // 3. Mostramos mensaje de confirmación
        this.successMessage.set('La acción se ha completado. El reporte ha sido procesado correctamente.');
        this.showSuccessAction.set(true);

        // 4. Recarga de seguridad con un retraso mayor para dar tiempo a Supabase
        setTimeout(() => {
            this.cargarReportes();
        }, 1500);
    }

    onSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    setFiltroEstado(estado: string) {
        this.filtroEstado.set(estado);
    }
}
