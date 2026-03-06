import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-base',
  standalone: true,
  template: `
    <div class="overlay" (click)="closed.emit()">
      <div
        class="modal"
        [style.max-width]="ancho"
        (click)="$event.stopPropagation()"
      >
        @if (mostrarCerrar) {
          <button class="btn-cerrar" (click)="closed.emit()">✕</button>
        }
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeOverlay 0.2s ease-out;
    }

    .modal {
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      background: #FFFFFF;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      position: relative;
      animation: fadeIn 0.25s ease-out;
      font-family: 'Lexend', sans-serif;
    }

    .modal::-webkit-scrollbar {
      width: 6px;
    }

    .modal::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 3px;
    }

    .btn-cerrar {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 32px;
      height: 32px;
      border: none;
      background: #F3F4F6;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      color: #6B7280;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .btn-cerrar:hover {
      background: #E5E7EB;
      color: #1E293B;
    }

    @keyframes fadeOverlay {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 580px) {
      .modal {
        padding: 28px 24px;
        border-radius: 20px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalBase {

  // Ancho máximo del modal (por defecto 600px)
  @Input() ancho: string = '600px';

  // Mostrar botón de cerrar (por defecto sí)
  @Input() mostrarCerrar: boolean = true;

  // Evento de cierre
  @Output() closed = new EventEmitter<void>();
}
