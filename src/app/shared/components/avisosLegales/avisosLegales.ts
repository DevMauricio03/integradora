import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-avisos-legales',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="620px" (close)="cerrar()">

      <div class="modal-header">
        <div class="icono-aviso">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
              stroke="#135BEC" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01"
              stroke="#135BEC" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2>Aviso de Privacidad</h2>
        <p class="actualizacion">Última actualización: Enero 2026</p>
      </div>

      <div class="modal-body">

        <p class="intro">
          En <strong>Tuunka</strong>, valoramos y protegemos la privacidad de nuestra
          comunidad universitaria. Este aviso describe cómo recopilamos, usamos y
          resguardamos tu información personal al registrarte y utilizar la plataforma.
        </p>

        <div class="seccion">
          <h3>1. Datos que recopilamos</h3>
          <ul>
            <li><strong>Identificación:</strong> Nombre completo y foto de perfil.</li>
            <li><strong>Académicos:</strong> Correo institucional (.edu), universidad y carrera.</li>
            <li><strong>Cuenta:</strong> Contraseña (almacenada de forma cifrada).</li>
            <li><strong>Uso:</strong> Registros de actividad dentro de la plataforma.</li>
          </ul>
        </div>

        <div class="seccion">
          <h3>2. Uso de la información</h3>
          <p>Tu información se utiliza exclusivamente para:</p>
          <ul>
            <li>Crear y administrar tu cuenta universitaria.</li>
            <li>Verificar tu identidad como miembro de una institución educativa.</li>
            <li>Personalizar tu experiencia dentro de la plataforma.</li>
            <li>Enviarte notificaciones relevantes a tu actividad académica.</li>
          </ul>
        </div>

        <div class="seccion">
          <h3>3. Protección de datos</h3>
          <p>
            Implementamos medidas de seguridad técnicas y administrativas para proteger
            tu información contra acceso no autorizado, pérdida o alteración. Tus datos
            se almacenan en servidores seguros con cifrado en tránsito y en reposo.
          </p>
        </div>

        <div class="seccion">
          <h3>4. Compartición de datos</h3>
          <p>
            <strong>No vendemos ni compartimos</strong> tu información personal con terceros
            con fines comerciales. Solo se comparte información cuando es estrictamente
            necesario para el funcionamiento del servicio o por requerimiento legal.
          </p>
        </div>

        <div class="seccion">
          <h3>5. Derechos ARCO</h3>
          <p>
            Tienes derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>,
            <strong>Cancelar</strong> u <strong>Oponerte</strong> al tratamiento de
            tus datos personales. Para ejercer estos derechos, contacta a nuestro
            equipo de soporte desde la sección de ayuda.
          </p>
        </div>

        <div class="seccion">
          <h3>6. Términos de Servicio</h3>
          <p>Al crear tu cuenta en Tuunka, aceptas:</p>
          <ul>
            <li>Utilizar la plataforma con fines académicos y de comunidad.</li>
            <li>No publicar contenido ofensivo, ilegal o que viole derechos de terceros.</li>
            <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>Respetar las normas de convivencia de la comunidad universitaria.</li>
          </ul>
        </div>

      </div>

      <div class="modal-footer">
        <p>Al registrarte, confirmas haber leído y aceptado este aviso.</p>
        <span class="copyright">© 2026 Tuunka. Todos los derechos reservados.</span>
      </div>

    </app-modal-base>
  `,
  styles: `
    .modal-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .icono-aviso {
      width: 48px;
      height: 48px;
      background: rgba(19, 91, 236, 0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    h2 {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 700;
      color: #1E293B;
    }

    .actualizacion {
      font-size: 13px;
      color: #9CA3AF;
      margin: 0;
    }

    .modal-body {
      font-size: 14px;
      line-height: 22px;
      color: #475569;
    }

    .intro {
      margin: 0 0 20px;
    }

    .seccion {
      margin-top: 20px;
    }

    .seccion h3 {
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 8px;
    }

    .seccion p {
      margin: 0 0 8px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
    }

    ul li {
      margin-bottom: 6px;
    }

    .modal-footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
    }

    .modal-footer p {
      font-size: 13px;
      color: #6B7280;
      margin: 0 0 8px;
    }

    .copyright {
      font-size: 12px;
      color: #9CA3AF;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisosLegales {

  @Output() closed = new EventEmitter<void>();

  cerrar() {
    this.closed.emit();
  }
}
