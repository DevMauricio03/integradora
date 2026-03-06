import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
    selector: 'app-suspension-modal',
    standalone: true,
    imports: [ModalBase],
    template: `
    <app-modal-base ancho="440px" [mostrarCerrar]="false" (closed)="emitClose()">

      <div class="suspension-container">

        <!-- Ícono alerta -->
        <div class="suspension-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 9V14" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 18H12.01" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55299 18.6452 1.55197 18.9939C1.55095 19.3427 1.64134 19.6858 1.81406 19.9893C1.98678 20.2928 2.23512 20.5457 2.53406 20.7226C2.833 20.8995 3.17147 20.9938 3.516 20.9953H20.484C20.8285 20.9938 21.167 20.8995 21.4659 20.7226C21.7649 20.5457 22.0132 20.2928 22.1859 19.9893C22.3587 19.6858 22.4491 19.3427 22.448 18.9939C22.447 18.6452 22.3546 18.3024 22.18 18L13.71 3.86C13.5388 3.57144 13.2974 3.33298 13.0076 3.16616C12.7177 2.99933 12.3881 2.91016 12.05 2.90625C11.7119 2.91016 11.3823 2.99933 11.0924 3.16616C10.8026 3.33298 10.5612 3.57144 10.39 3.86H10.29Z" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2>Cuenta Suspendida</h2>

        <div class="message-box">
          <p>
            Tu acceso a Tuunka ha sido restringido temporalmente por incumplir con las normas de la comunidad.
          </p>
          <div class="time-info">
            <span class="label">Tiempo restante:</span>
            <span class="value">{{ tiempoRestante }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <button class="btn-suspension" (click)="emitConfirm()">
          Entendido
        </button>

      </div>

    </app-modal-base>
  `,
    styles: `
    .suspension-container {
      padding: 40px 32px 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .suspension-icon {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: rgba(239, 68, 68, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .suspension-container h2 {
      font-size: 24px;
      font-weight: 800;
      color: #1F2937;
      margin: 0;
    }

    .message-box {
      background: #F9FAFB;
      padding: 20px;
      border-radius: 16px;
      width: 100%;
    }

    .suspension-container p {
      font-size: 14px;
      line-height: 1.6;
      color: #4B5563;
      margin: 0 0 16px 0;
    }

    .time-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
    }

    .time-info .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9CA3AF;
      font-weight: 600;
    }

    .time-info .value {
      font-size: 18px;
      font-weight: 700;
      color: #EF4444;
    }

    .divider {
      width: 100%;
      height: 1px;
      background: #E5E7EB;
    }

    .btn-suspension {
      width: 100%;
      height: 48px;
      background: #1F2937;
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'Lexend', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-suspension:hover {
      background: #000;
      transform: translateY(-1px);
    }

    @media (max-width: 480px) {
      .suspension-container {
        padding: 32px 20px;
      }
    }
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspensionModal {
    @Input() tiempoRestante: string = 'Indefinido';
    confirm = output<void>();

    emitConfirm() {
        this.confirm.emit();
    }

    emitClose() {
        this.confirm.emit();
    }
}
