import { ChangeDetectionStrategy, Component, signal, inject, OnInit, computed } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { AdminPublicationService } from '../../services/adminPublication.service';
import { CommonModule } from '@angular/common';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';

@Component({
    selector: 'app-admin-publications',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal, CommonModule, ModalBase, PostCardComponent],
    templateUrl: './publications.html',
    styleUrls: ['./publications.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPublications implements OnInit {
    private readonly publicationService = inject(AdminPublicationService);

    publications = signal<any[]>([]);
    isLoading = signal(false);
    mostrarModalUsuario = signal(false);
    usuarioSeleccionado = signal<any>(null);
    mostrarModalPublicacion = signal(false);
    publicacionSeleccionada = signal<any>(null);

    // Filtros
    selectedType = signal('Todos');
    selectedStatus = signal('Todos');
    searchTerm = signal('');

    // Listas de opciones
    types = ['Todos', 'Producto', 'Exp. Empresarial', 'Evento', 'Aviso'];
    statuses = ['Todos', 'Activo', 'Suspendido', 'Pendiente'];

    filteredPublications = computed(() => {
        let items = this.publications();

        const type = this.selectedType();
        if (type !== 'Todos') {
            items = items.filter(p => this.mapTypeToLabel(p.tipo) === type);
        }

        const status = this.selectedStatus();
        if (status !== 'Todos') {
            items = items.filter(p => p.estado.toLowerCase() === status.toLowerCase());
        }

        const search = this.searchTerm().toLowerCase();
        if (search) {
            items = items.filter(p =>
                p.titulo.toLowerCase().includes(search) ||
                p.descripcion.toLowerCase().includes(search) ||
                `${p.perfiles?.nombre} ${p.perfiles?.apellidos}`.toLowerCase().includes(search)
            );
        }

        return items;
    });

    ngOnInit() {
        this.loadPublications();
    }

    async loadPublications() {
        this.isLoading.set(true);
        const { data, error } = await this.publicationService.getPublications();
        if (error) {
            console.error('Error loading publications:', error);
        } else {
            this.publications.set(data || []);
        }
        this.isLoading.set(false);
    }

    async approvePublication(id: string) {
        const { error } = await this.publicationService.updatePublicationStatus(id, 'activo');
        if (!error) {
            this.loadPublications(); // Recargar para reflejar cambio
        }
    }

    async rejectPublication(id: string) {
        const { error } = await this.publicationService.updatePublicationStatus(id, 'suspendido');
        if (!error) {
            this.loadPublications();
        }
    }

    onSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    setType(type: string) {
        this.selectedType.set(type);
    }

    toggleType() {
        const current = this.selectedType();
        const nextIndex = (this.types.indexOf(current) + 1) % this.types.length;
        this.setType(this.types[nextIndex]);
    }

    setStatus(status: string) {
        this.selectedStatus.set(status);
    }

    toggleStatus() {
        const current = this.selectedStatus();
        const nextIndex = (this.statuses.indexOf(current) + 1) % this.statuses.length;
        this.setStatus(this.statuses[nextIndex]);
    }

    abrirModal(usuario: any): void {
        this.usuarioSeleccionado.set(usuario);
        this.mostrarModalUsuario.set(true);
    }

    cerrarModal(): void {
        this.mostrarModalUsuario.set(false);
        this.usuarioSeleccionado.set(null);
    }

    abrirPreview(pub: any): void {
        // Mapear los datos de la publicación al formato que espera app-post-card
        const postFormatted = {
            author: `${pub.perfiles?.nombre || ''} ${pub.perfiles?.apellidos || ''}`,
            role: pub.perfiles?.roles?.nombre || 'Miembro',
            time: this.formatTime(pub.creado),
            title: pub.titulo,
            description: pub.descripcion,
            type: pub.tipo,
            category: pub.categoria || 'General',
            image: pub.imagen_url,
            images: pub.imagenes_url || [],
            avatar: pub.perfiles?.foto_url,
            details: pub.detalles,
            status: pub.estado
        };
        this.publicacionSeleccionada.set(postFormatted);
        this.mostrarModalPublicacion.set(true);
    }

    cerrarPreview(): void {
        this.mostrarModalPublicacion.set(false);
        this.publicacionSeleccionada.set(null);
    }

    // Helpers
    mapTypeToLabel(type: string): string {
        switch (type.toLowerCase()) {
            case 'oferta': return 'Producto';
            case 'experiencia': return 'Exp. Empresarial';
            case 'evento': return 'Evento';
            default: return 'Aviso';
        }
    }

    getTypeIcon(type: string): IconName {
        switch (type.toLowerCase()) {
            case 'oferta': return 'shopping-bag';
            case 'experiencia': return 'briefcase';
            case 'evento': return 'calendar';
            default: return 'megaphone';
        }
    }

    getTypeClass(type: string): string {
        switch (type.toLowerCase()) {
            case 'oferta': return 'product';
            case 'experiencia': return 'exp-emp';
            case 'evento': return 'event';
            default: return 'aviso';
        }
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    }

    formatTime(dateStr: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }

    getStatusType(status: string): 'active' | 'pending' | 'suspended' | 'spam' | 'group' {
        switch (status.toLowerCase()) {
            case 'activo': return 'active';
            case 'suspendido': return 'suspended';
            case 'pendiente': return 'pending';
            default: return 'pending';
        }
    }

    getStatusText(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

