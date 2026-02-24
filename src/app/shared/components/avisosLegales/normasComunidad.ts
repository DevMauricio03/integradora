import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-normas-comunidad',
  standalone: true,
  imports: [ModalBase, IconComponent],
  template: `
    <app-modal-base (close)="close.emit()" ancho="540px">
      
      <div class="header-normas">
        <div class="logo-normas">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="#2563EB"/>
            </svg>
        </div>
        <h2>Normas de la Comunidad</h2>
      </div>

      <p class="intro-normas">
        Para mantener un entorno seguro y académico en Tuunka, todos los miembros deben seguir estas directrices:
      </p>

      <div class="lista-normas">
        
        <div class="item-norma">
          <div class="icon-wrapper">
             <app-icon name="users" [size]="20"></app-icon>
          </div>
          <div class="text-norma">
            <strong>Respeto mutuo</strong>
            <span>Fomentamos la cordialidad y prohibimos cualquier forma de acoso o discriminación.</span>
          </div>
        </div>

        <div class="item-norma">
          <div class="icon-wrapper">
             <app-icon name="shield" [size]="20"></app-icon>
          </div>
          <div class="text-norma">
            <strong>Información verídica</strong>
            <span>Asegúrate de que tus publicaciones y perfiles contengan datos reales y actualizados.</span>
          </div>
        </div>

        <div class="item-norma">
          <div class="icon-wrapper">
             <app-icon name="graduation" [size]="20"></app-icon>
          </div>
          <div class="text-norma">
            <strong>Uso institucional</strong>
            <span>La plataforma es para fines académicos y de apoyo a la comunidad universitaria.</span>
          </div>
        </div>

        <div class="item-norma">
          <div class="icon-wrapper">
             <app-icon name="ban" [size]="20"></app-icon>
          </div>
          <div class="text-norma">
            <strong>Prohibición de spam</strong>
            <span>No permitimos publicidad excesiva, contenido repetitivo o fraudulento.</span>
          </div>
        </div>

      </div>

      <div class="footer-normas">
        <button class="btn-entendido" (click)="close.emit()">
          Entendido
        </button>
      </div>

    </app-modal-base>
  `,
  styles: [`
    .header-normas {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .header-normas h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      font-family: 'Lexend', sans-serif;
    }

    .logo-normas {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .intro-normas {
      font-size: 14px;
      color: #6B7280;
      line-height: 1.5;
      margin-bottom: 32px;
      font-family: 'Lexend', sans-serif;
    }

    .lista-normas {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-bottom: 40px;
    }

    .item-norma {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .icon-wrapper {
      width: 44px;
      height: 44px;
      background: #EFF6FF;
      color: #2563EB;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .text-norma {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .text-norma strong {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      font-family: 'Lexend', sans-serif;
    }

    .text-norma span {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.4;
      font-family: 'Lexend', sans-serif;
    }

    .footer-normas {
      display: flex;
      justify-content: flex-end;
    }

    .btn-entendido {
      background: #2563EB;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-entendido:hover {
      background: #1D4ED8;
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormasComunidad {
  @Output() close = new EventEmitter<void>();
}
