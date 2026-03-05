import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal],
    templateUrl: './users.html',
    styleUrls: ['./users.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
    mostrarModalUsuario = signal(false);

    abrirModal(): void {
        this.mostrarModalUsuario.set(true);
    }

    cerrarModal(): void {
        this.mostrarModalUsuario.set(false);
    }
}
