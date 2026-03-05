import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reporte-detalle-modal',
  standalone: true,
  imports: [ModalBase, StatusBadge, IconComponent],
  templateUrl: './reporte-detalle-modal.html',
  styleUrls: ['./reporte-detalle-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteDetalleModal {
  @Output() close = new EventEmitter<void>();
}
