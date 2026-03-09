
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-avisos-legales',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="680px" [mostrarCerrar]="true" (closed)="cerrar()">

      <!-- HEADER -->
      <div class="aviso-header">
        <h2 class="aviso-titulo">Aviso de Privacidad</h2>
        <div class="aviso-fecha">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--text-muted)" stroke-width="2"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Última actualización: Enero 2026</span>
        </div>
      </div>

      <!-- BODY SCROLLABLE -->
      <div class="aviso-body">

        <p class="aviso-intro" style="text-align: justify;">
          En <strong class="marca">Tuunka</strong>, valoramos la privacidad de nuestra comunidad universitaria.
          Este documento detalla de manera transparente cómo recopilamos, utilizamos y protegemos su información personal para mejorar la comunicación y los servicios dentro del campus.
        </p>

        <p class="aviso-intro" style="text-align: justify;">En cumplimiento con lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), se emite el presente Aviso de Privacidad para informar a los usuarios sobre el tratamiento de sus datos personales.</p>

        <!-- 1. Identidad y domicilio del responsable -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">1</span>
            <h3>Identidad y domicilio del responsable</h3>
          </div>
          <p>
            <strong class="marca">Tuunka</strong> es una plataforma digital desarrollada con fines académicos y comunitarios, responsable del uso y protección de los datos personales que los usuarios proporcionen al registrarse y utilizar el sistema.
          </p>
          <p>
            Para cualquier asunto relacionado con este aviso de privacidad, el usuario podrá contactar al equipo responsable a través del correo electrónico:
          </p>
          <p>
             <i><strong>hola@tuunka.com</strong></i>
          </p>
        </div>

        <!-- 2. Datos personales que se recaban -->
        <div class="aviso-seccion" style="text-align: justify;" >
          <div class="seccion-header">
            <span class="numero-seccion">2</span>
            <h3>Datos personales que se recaban</h3>
          </div>
          <p>
            Los datos personales que Tuunka podrá recabar de forma directa son:
          </p>
          <ul>
            <li>Nombre completo del usuario</li>
            <li>Correo electrónico institucional</li>
            <li>Contraseña</li>
            <li>Universidad a la que pertenece</li>
            <li>Carrera a la que pertenece</li>
            <li>Información relacionada con el uso de la plataforma (publicaciones, eventos, reportes)</li>
          </ul>

          <p>
            <strong>Tuunka no recaba ni almacena datos bancarios ni información financiera sensible.</strong>
          </p>
        </div>

        <!-- 3. Finalidades del tratamiento de los datos personales -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">3</span>
            <h3>Finalidades del tratamiento de los datos personales</h3>
          </div>
          <p>Los datos personales recabados serán utilizados para las siguientes finalidades:</p>
          <p><strong>Finalidades primarias</strong></p>
          <ul>
            <li>Registrar y autenticar a los usuarios dentro de la plataforma</li>
            <li>Permitir la interacción entre miembros de la misma comunidad universitaria</li>
            <li>Gestionar publicaciones, eventos, avisos, productos y servicios</li>
            <li>Mantener la seguridad y funcionamiento adecuado del sistema</li>
            <li>Atender reportes y solicitudes de los usuarios</li>
          </ul>
          <p><strong>Finalidades secundarias</strong></p>
          <ul>
            <li>Generar estadísticas de uso para la mejora de la plataforma</li>
          </ul>
          <p>En caso de no estar de acuerdo con las finalidades secundarias, el usuario podrá manifestarlo mediante los medios de contacto indicados.</p>
        </div>

        <!-- 4. Transferencia de datos personales -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">4</span>
            <h3>Transferencia de datos personales</h3>
          </div>
          <p>
            Tuunka <strong>no comparte, vende ni transfiere</strong> los datos personales de los usuarios a terceros sin su consentimiento, salvo en los casos previstos por la ley.
          </p>
          <p>
            En el caso de servicios de pago, estos se realizarán a través de <strong>plataformas externas certificadas</strong>, las cuales son responsables del tratamiento de la información financiera conforme a sus propios avisos de privacidad.
          </p>
        </div>

        <!-- 5. Medidas de seguridad -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">5</span>
            <h3>Medidas de seguridad</h3>
          </div>
          <p>
            Tuunka implementa medidas de seguridad administrativas y técnicas para proteger los datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado, tales como:
          </p>
          <ul>
            <li>Control de acceso por roles</li>
            <li>Autenticación segura</li>
            <li>Restricción de acceso a información sensible</li>
          </ul>
        </div>

        <!-- 6. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">6</span>
            <h3>Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h3>
          </div>
          <p>El usuario tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Rectificarlos en caso de ser inexactos</li>
            <li>Cancelarlos cuando considere que no son necesarios</li>
            <li>Oponerse a su tratamiento para fines específicos</li>
          </ul>
          <p>
            Para ejercer estos derechos, el usuario deberá enviar una solicitud al correo electrónico indicado, señalando su nombre, comunidad y el derecho que desea ejercer.
          </p>
        </div>

        <!-- 7. Consentimiento -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">7</span>
            <h3>Consentimiento</h3>
          </div>
          <p>
            Al registrarse y utilizar la plataforma Tuunka, el usuario <strong>manifiesta su consentimiento expreso</strong> para el tratamiento de sus datos personales conforme a los términos del presente Aviso de Privacidad.
          </p>
        </div>

        <!-- 8. Cambios al aviso de privacidad -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">8</span>
            <h3>Cambios al aviso de privacidad</h3>
          </div>
          <p>
            Tuunka se reserva el derecho de realizar modificaciones o actualizaciones al presente aviso de privacidad. Cualquier cambio será notificado a través de la plataforma.
          </p>
        </div>
      </div>

      <!-- CONTACTO -->
      <div class="aviso-contacto">
        <div class="contacto-texto">
          <strong>¿Tienes dudas sobre tu privacidad?</strong>
          <span>Nuestro equipo está listo para ayudarte en cualquier momento.</span>
        </div>
        <a class="contacto-btn" href="mailto:hola&#64;tuunka.com">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 4H20V20H4V4Z" stroke="white" stroke-width="2"/>
            <path d="M4 4L12 13L20 4" stroke="white" stroke-width="2"/>
          </svg>
          hola&#64;tuunka.com
        </a>
      </div>

      <!-- FOOTER -->
      <div class="aviso-footer">
        <span class="footer-copy">© 2026 Tuunka. Todos los derechos reservados.</span>
      </div>

    </app-modal-base>
  `,
  styles: `
    /* HEADER */
    .aviso-header {
      margin-bottom: 24px;
    }

    .aviso-titulo {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }

    .aviso-fecha {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
    }

    /* BODY */
    .aviso-body {
      max-height: 55vh;
      overflow-y: auto;
      padding-right: 8px;
    }

    .aviso-body::-webkit-scrollbar {
      width: 5px;
    }

    .aviso-body::-webkit-scrollbar-thumb {
      background: var(--border-light);
      border-radius: 3px;
    }

    .aviso-intro {
      font-size: 14px;
      line-height: 24px;
      color: var(--text-secondary);
      margin: 0 0 28px;
    }

    .marca {
      color: var(--primary);
      font-weight: 600;
    }

    /* SECCIONES */
    .aviso-seccion {
      margin-bottom: 24px;
    }

    .seccion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .numero-seccion {
      width: 28px;
      height: 28px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .seccion-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main);
    }

    .aviso-seccion p {
      font-size: 14px;
      line-height: 22px;
      color: var(--text-secondary);
      margin: 0 0 10px;
    }

    .aviso-seccion ul {
      margin: 0;
      padding-left: 20px;
    }

    .aviso-seccion ul li {
      font-size: 14px;
      line-height: 24px;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    /* CONTACTO */
    .aviso-contacto {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--card-bg);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 20px 24px;
      margin-top: 28px;
      gap: 16px;
    }

    .contacto-texto {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .contacto-texto strong {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }

    .contacto-texto span {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .contacto-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Lexend', sans-serif;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
    }

    .contacto-btn:hover {
      background: var(--primary-hover);
    }

    /* FOOTER */
    .aviso-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-light);
    }

    .footer-copy {
      font-size: 12px;
      color: var(--text-muted);
    }

    .footer-links {
      display: flex;
      gap: 20px;
    }

    .footer-link {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary);
      cursor: pointer;
    }

    .footer-link:hover {
      text-decoration: underline;
    }

    /* RESPONSIVE */
    @media (max-width: 580px) {
      .aviso-contacto {
        flex-direction: column;
        text-align: center;
      }

      .aviso-footer {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
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
