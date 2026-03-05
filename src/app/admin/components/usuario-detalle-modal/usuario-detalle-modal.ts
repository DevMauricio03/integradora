import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
    selector: 'app-usuario-detalle-modal',
    standalone: true,
    imports: [ModalBase, StatusBadge, IconComponent],
    templateUrl: './usuario-detalle-modal.html',
    styleUrls: ['./usuario-detalle-modal.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDetalleModal {
    @Output() close = new EventEmitter<void>();
}
