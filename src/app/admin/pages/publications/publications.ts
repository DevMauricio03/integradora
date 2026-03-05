import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';

@Component({
    selector: 'app-admin-publications',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal],
    templateUrl: './publications.html',
    styleUrls: ['./publications.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPublications {
    mostrarModalUsuario = signal(false);

    abrirModal(): void {
        this.mostrarModalUsuario.set(true);
    }

    cerrarModal(): void {
        this.mostrarModalUsuario.set(false);
    }
}

