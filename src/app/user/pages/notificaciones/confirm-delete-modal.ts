import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, ModalBase],
  template: `
    <app-modal-base ancho="450px" [mostrarCerrar]="false" (closed)="onCancel()">
      <div class="confirm-modal-content">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="onCancel()">
            Cancelar
          </button>
          <button class="btn-confirm" (click)="onConfirm()">
            Eliminar
          </button>
        </div>
      </div>
    </app-modal-base>
  `,
  styles: [`
    .confirm-modal-content {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .modal-header {
      text-align: center;
    }

    .modal-header h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 12px 0;
    }

    .modal-header p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 10px 24px;
      background: #f3f4f6;
      color: var(--text-main);
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-confirm {
      padding: 10px 24px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-confirm:hover {
      background: #dc2626;
      box-shadow: 0px 2px 8px rgba(239, 68, 68, 0.3);
    }

    .btn-confirm:active {
      transform: scale(0.98);
    }

    @media (max-width: 480px) {
      .modal-footer {
        gap: 8px;
      }

      .btn-cancel,
      .btn-confirm {
        flex: 1;
        padding: 10px 16px;
        font-size: 13px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModal {
  @Input() title: string = 'Confirmar eliminación';
  @Input() message: string = '¿Estás seguro?';
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.close.emit();
  }
}
