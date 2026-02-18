import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="440px" [mostrarCerrar]="false">

      <div class="contenido-exito">

        <!-- Ícono check -->
        <div class="circulo-check">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#135BEC"/>
            <path d="M15 25l6 6 12-13" stroke="#FFFFFF" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2>¡Cuenta creada!</h2>

        <p class="mensaje">
          Tu cuenta ha sido creada con éxito. Revisa tu correo institucional
          para verificar tu cuenta y luego inicia sesión.
        </p>

        <button class="btn-iniciar" (click)="irLogin()">
          Inicia sesión
        </button>

      </div>

    </app-modal-base>
  `,
  styles: `
    .contenido-exito {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 0 8px;
    }

    .circulo-check {
      margin-bottom: 24px;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 26px;
      font-weight: 700;
      color: #1E293B;
    }

    .mensaje {
      margin: 0 0 32px;
      font-size: 15px;
      line-height: 24px;
      color: #64748B;
      max-width: 340px;
    }

    .btn-iniciar {
      width: 100%;
      max-width: 320px;
      height: 48px;
      background: #135BEC;
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      font-family: 'Lexend', sans-serif;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-iniciar:hover {
      background: #0F4FD4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessModal {

  @Output() irAlLogin = new EventEmitter<void>();

  irLogin() {
    this.irAlLogin.emit();
  }
}
