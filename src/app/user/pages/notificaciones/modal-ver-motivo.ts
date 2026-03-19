import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-modal-ver-motivo',
  standalone: true,
  imports: [CommonModule, ModalBase, IconComponent],
  template: `
    <app-modal-base ancho="500px" [mostrarCerrar]="true" (closed)="onClose()">
      <div class="modal-ver-motivo-content">
        <div class="modal-header">
          <div class="icon-wrapper">
            <app-icon name="info" [size]="24"></app-icon>
          </div>
          <h2>{{ titulo }}</h2>
        </div>

        <div class="modal-type">
          <span class="badge" [ngClass]="'badge-' + tipo">
            {{ tipo === 'post' ? 'Publicación eliminada' : 'Comentario eliminado' }}
          </span>
        </div>

        <div class="modal-body">
          <div class="motivo-box">
            <p class="motivo-label">Motivo de eliminación</p>
            <div class="motivo-text">
              {{ motivo }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-close" (click)="onClose()">
            Entendido
          </button>
        </div>
      </div>
    </app-modal-base>
  `,
  styles: [`
    .modal-ver-motivo-content {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .modal-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .modal-type {
      display: flex;
      justify-content: center;
    }

    .badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-post {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .badge-comentario {
      background: rgba(249, 115, 22, 0.1);
      color: #ea580c;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .motivo-box {
      background: var(--bg-light);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .motivo-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .motivo-text {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-main);
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      padding-top: 16px;
      border-top: 1px solid var(--border-light);
    }

    .btn-close {
      padding: 12px 32px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: var(--primary-hover);
      box-shadow: 0px 4px 12px rgba(19, 91, 236, 0.25);
    }

    @media (max-width: 480px) {
      .modal-ver-motivo-content {
        padding: 24px;
        gap: 16px;
      }

      .motivo-box {
        padding: 16px;
      }

      .btn-close {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalVerMotivo {
  @Input() titulo: string = 'Motivo de eliminación';
  @Input() motivo: string = '';
  @Input() tipo: 'post' | 'comentario' = 'post';
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }
}
