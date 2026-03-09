import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ReporteDetalleModal } from '../../components/reporte-detalle-modal/reporte-detalle-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { AdminReportService } from '../../services/adminReport.service';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, IconComponent, UsuarioDetalleModal, ReporteDetalleModal, SuccessModal],
    templateUrl: './reports.html',
    styleUrls: ['./reports.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReports implements OnInit {
    // Layer 3: AdminReportService (ya no accede directamente a SupabaseService)
    private readonly reportService = inject(AdminReportService);

    reportes = signal<any[]>([]);
    isLoading = signal(true);

    mostrarModalUsuario = signal(false);
    mostrarModalReporte = signal(false);
    reporteSeleccionado = signal<any>(null);
    usuarioSeleccionado = signal<any>(null);

    filtroEstado = signal<string>('pendiente');
    searchTerm = signal<string>('');

    filteredReportes = computed(() => {
        let items = this.reportes();

        if (this.filtroEstado() === 'resuelto') {
            items = items.filter(r => r.estado === 'resuelto' || r.estado === 'rechazado');
        } else if (this.filtroEstado() !== 'todos') {
            items = items.filter(r => r.estado === this.filtroEstado());
        }

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
            const { data, error } = await this.reportService.getReportsList();
            if (error) throw error;
            this.reportes.set(data || []);
        } catch (err) {
            console.error('Error al cargar reportes:', err);
        } finally {
            this.isLoading.set(false);
        }
    }

    abrirModalUsuario(usuario: any) { this.usuarioSeleccionado.set(usuario); this.mostrarModalUsuario.set(true); }
    cerrarModalUsuario() { this.mostrarModalUsuario.set(false); this.usuarioSeleccionado.set(null); }
    abrirModalReporte(reporte: any) { this.reporteSeleccionado.set(reporte); this.mostrarModalReporte.set(true); }
    cerrarModalReporte() { this.mostrarModalReporte.set(false); this.reporteSeleccionado.set(null); }

    handleActionExecuted() {
        const idActualizado = this.reporteSeleccionado()?.id;
        this.cerrarModalReporte();

        if (idActualizado) {
            this.reportes.update(items => items.filter(r => r.id !== idActualizado));
        }

        this.successMessage.set('La acción se ha completado. El reporte ha sido procesado correctamente.');
        this.showSuccessAction.set(true);

        setTimeout(() => this.cargarReportes(), 1500);
    }

    onSearch(event: Event) { this.searchTerm.set((event.target as HTMLInputElement).value); }
    setFiltroEstado(estado: string) { this.filtroEstado.set(estado); }
}
