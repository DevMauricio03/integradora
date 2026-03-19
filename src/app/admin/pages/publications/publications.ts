import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { UsuarioDetalleModal } from '../../components/usuario-detalle-modal/usuario-detalle-modal';
import { AdminPublicationService } from '../../services/adminPublication.service';
import { AdminPublicationsStoreService } from '../../../core/services/admin-publications-store.service';
import { CommonModule } from '@angular/common';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin-publications',
    standalone: true,
    imports: [StatusBadge, IconComponent, UsuarioDetalleModal, CommonModule, ModalBase, PostCardComponent, FormsModule],
    templateUrl: './publications.html',
    styleUrls: ['./publications.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPublications implements OnInit {
    private readonly publicationService = inject(AdminPublicationService);
    private readonly notificationService = inject(NotificationService);
    readonly store = inject(AdminPublicationsStoreService);

    mostrarModalUsuario = signal(false);
    usuarioSeleccionado = signal<any>(null);
    mostrarModalPublicacion = signal(false);
    publicacionSeleccionada = signal<any>(null);
    mostrarConfirmacionRechazo = signal(false);
    motivoRechazo = signal<string>('');

    ngOnInit() {
        this.store.loadPublications();
    }

    async approvePublication(id: string) {
        const { error } = await this.publicationService.updatePublicationStatus(id, 'activo');
        if (!error) {
            // Obtener datos de la publicación para notificar al autor
            const publication = this.store.items().find(p => p.id === id);
            if (publication?.autor_id) {
                try {
                    await this.notificationService.createNotificacion({
                        user_id: publication.autor_id,
                        tipo: 'post_aprobado',
                        mensaje: 'Tu publicación ha sido aprobada y ahora es visible para otros usuarios.',
                        leido: false
                    });
                } catch (notifError) {
                    console.error('Error enviando notificación de aprobación:', notifError);
                }
            }
            this.store.refresh();
        }
    }

    async rejectPublication(id: string) {
        // Mostrar modal para solicitar motivo
        const publication = this.store.items().find(p => p.id === id);
        if (publication) {
            this.publicacionSeleccionada.set(publication);
            this.motivoRechazo.set('');
            this.mostrarConfirmacionRechazo.set(true);
        }
    }

    async confirmarRechazoPublicacion() {
        const publication = this.publicacionSeleccionada();
        if (!publication) return;

        const motivo = this.motivoRechazo().trim();
        if (!motivo) {
            alert('Por favor, ingresa el motivo del rechazo');
            return;
        }

        // Guardar el autor_id ANTES de cambiar estado
        const autorId = publication.autor_id;

        // Cambiar a 'eliminado' en lugar de 'suspendido'
        const { error } = await this.publicationService.updatePublicationStatus(publication.id, 'eliminado');
        if (!error) {
            // Enviar notificación al autor con el motivo
            if (autorId) {
                try {
                    await this.notificationService.createNotificacion({
                        user_id: autorId,
                        tipo: 'post_rechazado',
                        mensaje: `Tu publicación fue rechazada por el equipo de moderación. Motivo: ${motivo}`,
                        leido: false
                    });
                } catch (notifError) {
                    console.error('Error enviando notificación de rechazo:', notifError);
                }
            }
            this.mostrarConfirmacionRechazo.set(false);
            this.publicacionSeleccionada.set(null);
            this.motivoRechazo.set('');
            this.store.refresh();
        }
    }

    cancelarRechazoPublicacion() {
        this.mostrarConfirmacionRechazo.set(false);
        this.publicacionSeleccionada.set(null);
        this.motivoRechazo.set('');
    }

    onMotivoBorderFocus(event: FocusEvent) {
        const target = event.target as HTMLTextAreaElement;
        if (target) target.style.borderColor = 'var(--primary)';
    }

    onMotivoBorderBlur(event: FocusEvent) {
        const target = event.target as HTMLTextAreaElement;
        if (target) target.style.borderColor = 'var(--border-light)';
    }

    onButtonHoverEnter(event: MouseEvent) {
        const target = event.target as HTMLButtonElement;
        if (target) target.style.opacity = '0.9';
    }

    onButtonHoverLeave(event: MouseEvent) {
        const target = event.target as HTMLButtonElement;
        if (target) target.style.opacity = '1';
    }

    onSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        this.store.setSearchTerm(target.value);
    }

    onTypeChange(event: Event) { this.store.setTypeFilter((event.target as HTMLSelectElement).value); }
    onStatusChange(event: Event) { this.store.setStatusFilter((event.target as HTMLSelectElement).value); }

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

