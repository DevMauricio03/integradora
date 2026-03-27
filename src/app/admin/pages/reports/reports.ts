import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ReporteDetalleModal } from '../../components/reporte-detalle-modal/reporte-detalle-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { AdminReportService } from '../../services/adminReport.service';
import { AdminReportsStoreService } from '../../../core/services/admin-reports-store.service';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, IconComponent, StatusBadge, UsuarioDetalleModal, ReporteDetalleModal, SuccessModal],
    templateUrl: './reports.html',
    styleUrls: ['./reports.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReports implements OnInit {
    private readonly reportService = inject(AdminReportService);
    readonly store = inject(AdminReportsStoreService);

    mostrarModalUsuario = signal(false);
    mostrarModalReporte = signal(false);
    reporteSeleccionado = signal<any>(null);
    usuarioSeleccionado = signal<any>(null);

    showSuccessAction = signal(false);
    successMessage = signal('');

    ngOnInit() {
        this.store.setFilter('pendiente'); // Default a pendiente para reportes
    }

    abrirModalUsuario(usuario: any) { this.usuarioSeleccionado.set(usuario); this.mostrarModalUsuario.set(true); }
    cerrarModalUsuario() { this.mostrarModalUsuario.set(false); this.usuarioSeleccionado.set(null); }
    abrirModalReporte(reporte: any) { this.reporteSeleccionado.set(reporte); this.mostrarModalReporte.set(true); }
    cerrarModalReporte() { this.mostrarModalReporte.set(false); this.reporteSeleccionado.set(null); }

    handleActionExecuted() {
        this.cerrarModalReporte();
        this.successMessage.set('La acción se ha completado. El reporte ha sido procesado correctamente.');
        this.showSuccessAction.set(true);

        // Recargar desde el store
        setTimeout(() => this.store.refresh(), 1500);
    }

    mapTypeToLabel(type: string | null | undefined): string {
        switch ((type || '').toLowerCase()) {
            case 'oferta': return 'Aviso';
            case 'evento': return 'Evento';
            case 'experiencia': return 'Experiencia';
            default: return 'Aviso';
        }
    }

    onSearch(event: Event) { this.store.setSearchTerm((event.target as HTMLInputElement).value); }
    onFilterChange(event: Event) { this.store.setFilter((event.target as HTMLSelectElement).value); }
}
