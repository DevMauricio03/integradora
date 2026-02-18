import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="440px" [mostrarCerrar]="false" (close)="emitClose()">

      <div class="success-container">

        <!-- Ícono check -->
        <div class="success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--primary)" stroke-width="2"/>
            <path d="M8 12L11 15L16 9" stroke="var(--primary)" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2>¡Cuenta creada!</h2>

        <p>
          Haz creado tu cuenta con éxito, inicia sesión
          para conectarte con tu comunidad universitaria
        </p>

        <div class="divider"></div>

        <button class="btn-primario" (click)="emitConfirm()">
          Inicia sesión
        </button>

      </div>

    </app-modal-base>
  `,
  styles: `
    .success-container {
      padding: 40px 32px 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .success-icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      background: rgba(19, 91, 236, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-container h2 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .success-container p {
      font-size: 14px;
      line-height: 23px;
      color: var(--text-secondary);
      margin: 0;
      max-width: 340px;
    }

    .divider {
      width: 100%;
      height: 1px;
      background: var(--border-light);
    }

    .btn-primario {
      width: 100%;
      height: 45px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'Lexend', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      box-shadow:
        0px 10px 15px -3px rgba(19, 91, 236, 0.25),
        0px 4px 6px -4px rgba(19, 91, 236, 0.25);
    }

    .btn-primario:hover {
      background: var(--primary-hover);
    }

    @media (max-width: 480px) {
      .success-container {
        padding: 32px 20px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessModal {

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  emitClose() {
    this.close.emit();
  }

  emitConfirm() {
    this.confirm.emit();
  }
}
