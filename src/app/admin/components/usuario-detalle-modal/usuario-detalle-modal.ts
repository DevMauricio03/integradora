import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-usuario-detalle-modal',
    standalone: true,
    imports: [ModalBase, StatusBadge, IconComponent, CommonModule],
    templateUrl: './usuario-detalle-modal.html',
    styleUrls: ['./usuario-detalle-modal.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDetalleModal {
    @Input() usuario: any;
    @Output() close = new EventEmitter<void>();

    formatDate(dateStr: string): string {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}
