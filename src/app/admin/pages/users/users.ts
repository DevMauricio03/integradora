import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ModalAgregarUsuario } from '../../components/modal-agregar-usuario/modal-agregar-usuario';
import { CommonModule } from '@angular/common';
import { AdminUsersStoreService } from '../../../core/services/admin-users-store.service';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal, ModalAgregarUsuario, CommonModule],
    templateUrl: './users.html',
    styleUrls: ['./users.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
    readonly store = inject(AdminUsersStoreService);

    usuarioSeleccionado = signal<any>(null);
    mostrarModalUsuario = signal(false);
    mostrarModalAgregar = signal(false);

    ngOnInit() {
        this.store.loadUsers();
    }

    agregarUsuarioLocal(newUser?: any) {
        this.store.refresh();
    }

    onSearchInput(event: Event) { this.store.setSearchTerm((event.target as HTMLInputElement).value); }
    onSearchKeyup(event: KeyboardEvent) { if (event.key === 'Enter') this.store.refresh(); }
    onFilterChange(event: Event) { this.store.setFilter((event.target as HTMLSelectElement).value); }

    abrirModal(user: any) { this.usuarioSeleccionado.set(user); this.mostrarModalUsuario.set(true); }
    cerrarModal() { this.mostrarModalUsuario.set(false); this.usuarioSeleccionado.set(null); }
}
