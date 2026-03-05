import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ReporteDetalleModal } from '../../components/reporte-detalle-modal/reporte-detalle-modal';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [IconComponent, UsuarioDetalleModal, ReporteDetalleModal],
    templateUrl: './reports.html',
    styleUrls: ['./reports.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReports {
    mostrarModalUsuario = signal(false);
    mostrarModalReporte = signal(false);

    abrirModal(): void {
        this.mostrarModalUsuario.set(true);
    }

    cerrarModal(): void {
        this.mostrarModalUsuario.set(false);
    }

    abrirModalReporte(): void {
        this.mostrarModalReporte.set(true);
    }

    cerrarModalReporte(): void {
        this.mostrarModalReporte.set(false);
    }
}
