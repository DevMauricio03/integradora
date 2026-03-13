import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="440px" [mostrarCerrar]="true" (closed)="emitClose()">
      <div class="confirm-container">
        <div class="confirm-icon" [class.danger]="esPeligroso">
          @if (esPeligroso) {
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          } @else {
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          }
        </div>

        <div class="content">
          <h2>{{ titulo }}</h2>
          <p>{{ mensaje }}</p>
        </div>

        <div class="actions">
          <button class="btn-cancelar" (click)="emitClose()">
            {{ botonCancelar }}
          </button>
          <button 
            [class]="esPeligroso ? 'btn-danger' : 'btn-primario'" 
            (click)="emitConfirm()"
          >
            {{ botonConfirmar }}
          </button>
        </div>
      </div>
    </app-modal-base>
  `,
  styles: `
    .confirm-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
    }

    .confirm-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(19, 91, 236, 0.1);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-icon.danger {
      background: #fef2f2;
      color: #ef4444;
    }

    .content h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
    }

    .content p {
      margin: 8px 0 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-secondary);
    }

    .actions {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 8px;
    }

    .btn-cancelar {
      flex: 1;
      height: 45px;
      background: white;
      border: 1.5px solid var(--border-light);
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancelar:hover {
      background: #f9fafb;
    }

    .btn-primario, .btn-danger {
      flex: 1;
      height: 45px;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primario {
      background: var(--primary);
    }

    .btn-primario:hover {
      background: var(--primary-hover);
    }

    .btn-danger {
      background: #ef4444;
    }

    .btn-danger:hover {
      background: #dc2626;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModal {
  @Input() titulo: string = '¿Confirmar acción?';
  @Input() mensaje: string = 'Esta acción no se puede deshacer.';
  @Input() botonConfirmar: string = 'Confirmar';
  @Input() botonCancelar: string = 'Cancelar';
  @Input() esPeligroso: boolean = false;

  closed = output<void>();
  confirm = output<void>();

  emitClose() {
    this.closed.emit();
  }

  emitConfirm() {
    this.confirm.emit();
  }
}
