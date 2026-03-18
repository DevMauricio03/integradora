import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" [attr.aria-live]="'polite'">
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast-' + toast.type"
          [class.clickable]="toast.action"
          (click)="handleToastClick(toast)"
          [@slideIn]
        >
          <span class="toast-message">{{ toast.message }}</span>
          <button
            class="toast-close"
            (click)="handleCloseClick($event, toast.id)"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
      font-size: 14px;
      font-weight: 500;
      min-width: 280px;
      transition: all 0.2s;
    }

    .toast.clickable {
      cursor: pointer;
    }

    .toast.clickable:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .toast.toast-success {
      background-color: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .toast.toast-error {
      background-color: #fee2e2;
      color: #7f1d1d;
      border-left: 4px solid #ef4444;
    }

    .toast.toast-warning {
      background-color: #fef3c7;
      color: #92400e;
      border-left: 4px solid #f59e0b;
    }

    .toast.toast-info {
      background-color: #dbeafe;
      color: #0c2d6b;
      border-left: 4px solid #3b82f6;
    }

    .toast-message {
      flex: 1;
      word-break: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      margin-left: 12px;
      opacity: 0.6;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .toast-container {
        top: 12px;
        right: 12px;
        left: 12px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  /**
   * Manejar clic en el toast. Si tiene acción, ejecutarla y cerrar.
   */
  handleToastClick(toast: Toast): void {
    if (toast.action) {
      toast.action();
      this.dismiss(toast.id);
    }
  }

  /**
   * Manejar clic en el botón de cerrar.
   * Detener propagación para evitar ejecutar la acción del toast.
   */
  handleCloseClick(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.dismiss(id);
  }

  /**
   * Remover un toast específico por ID.
   */
  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
