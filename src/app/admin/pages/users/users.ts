import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal, CommonModule],
    templateUrl: './users.html',
    styleUrls: ['./users.css'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class AdminUsers implements OnInit {
    private supabase = inject(SupabaseService);

    usuarios = signal<any[]>([]);
    universidades = signal<any[]>([]);
    isLoading = signal<boolean>(true);
    searchTerm = signal<string>('');
    usuarioSeleccionado = signal<any>(null);
    mostrarModalUsuario = signal(false);

    // Estados de filtros
    selectedRol = signal<string>('');
    selectedStatus = signal<string>('');
    selectedUniversidad = signal<string>('');

    // Array computado basandome en todos los filtros
    filteredUsuarios = computed(() => {
        let list = this.usuarios();

        if (this.selectedRol()) {
            list = list.filter(u => u.roles?.nombre?.toLowerCase() === this.selectedRol());
        }

        if (this.selectedStatus()) {
            // Actualmente todas las cuentas en BD son "activos"
            if (this.selectedStatus() === 'activo') list = list;
            else list = [];
        }

        if (this.selectedUniversidad()) {
            list = list.filter(u => u.universidades?.acronimo === this.selectedUniversidad());
        }

        return list;
    });

    async ngOnInit() {
        await this.cargarUniversidades();
        await this.cargarUsuarios();
    }

    async cargarUniversidades() {
        const { data } = await this.supabase.getUniversidades();
        if (data) this.universidades.set(data);
    }

    async cargarUsuarios() {
        this.isLoading.set(true);
        const { data } = await this.supabase.getAllUsers(this.searchTerm());
        this.usuarios.set(data || []);
        this.isLoading.set(false);
    }

    onSearchInput(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchTerm.set(input.value);
    }

    onSearchKeyup(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.cargarUsuarios();
        }
    }

    onRolChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedRol.set(select.value);
    }

    onStatusChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedStatus.set(select.value);
    }

    onUniChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedUniversidad.set(select.value);
    }

    abrirModal(user: any): void {
        this.usuarioSeleccionado.set(user);
        this.mostrarModalUsuario.set(true);
    }

    cerrarModal(): void {
        this.mostrarModalUsuario.set(false);
        this.usuarioSeleccionado.set(null);
    }
}
