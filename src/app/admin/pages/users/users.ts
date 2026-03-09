import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { ModalAgregarUsuario } from '../../components/modal-agregar-usuario/modal-agregar-usuario';
import { CommonModule } from '@angular/common';
import { AdminUserService } from '../../services/adminUser.service';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal, ModalAgregarUsuario, CommonModule],
    templateUrl: './users.html',
    styleUrls: ['./users.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
    // Layer 3: AdminUserService (ya no accede directamente a SupabaseService)
    private readonly userService = inject(AdminUserService);

    usuarios = signal<any[]>([]);
    universidades = signal<any[]>([]);
    isLoading = signal<boolean>(true);
    searchTerm = signal<string>('');
    usuarioSeleccionado = signal<any>(null);
    mostrarModalUsuario = signal(false);
    mostrarModalAgregar = signal(false);

    selectedRol = signal<string>('');
    selectedStatus = signal<string>('');
    selectedUniversidad = signal<string>('');

    filteredUsuarios = computed(() => {
        let list = this.usuarios();
        if (this.selectedRol()) list = list.filter(u => u.roles?.nombre?.toLowerCase() === this.selectedRol());
        if (this.selectedStatus()) list = list.filter(u => (u.estado || 'activo') === this.selectedStatus());
        if (this.selectedUniversidad()) list = list.filter(u => u.universidades?.acronimo === this.selectedUniversidad());
        return list;
    });

    ngOnInit() {
        // Carga paralela de universidades y usuarios
        Promise.all([this.cargarUniversidades(), this.cargarUsuarios()]);
    }

    async cargarUniversidades() {
        const { data } = await this.userService.getUniversidades();
        if (data) this.universidades.set(data);
    }

    async cargarUsuarios() {
        this.isLoading.set(true);
        const { data } = await this.userService.getAllUsers(this.searchTerm());
        this.usuarios.set(data || []);
        this.isLoading.set(false);
    }

    agregarUsuarioLocal(newUser?: any) {
        if (newUser) {
            this.usuarios.update(list => [newUser, ...list]);
        } else {
            this.cargarUsuarios();
        }
    }

    onSearchInput(event: Event) { this.searchTerm.set((event.target as HTMLInputElement).value); }
    onSearchKeyup(event: KeyboardEvent) { if (event.key === 'Enter') this.cargarUsuarios(); }
    onRolChange(event: Event) { this.selectedRol.set((event.target as HTMLSelectElement).value); }
    onStatusChange(event: Event) { this.selectedStatus.set((event.target as HTMLSelectElement).value); }
    onUniChange(event: Event) { this.selectedUniversidad.set((event.target as HTMLSelectElement).value); }

    abrirModal(user: any) { this.usuarioSeleccionado.set(user); this.mostrarModalUsuario.set(true); }
    cerrarModal() { this.mostrarModalUsuario.set(false); this.usuarioSeleccionado.set(null); }
}
