import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-avisos-legales',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="680px" [mostrarCerrar]="true" (close)="cerrar()">

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

        <p class="aviso-intro">
          En <strong class="marca">Tuunka</strong>, valoramos la privacidad de nuestra comunidad universitaria.
          Este documento detalla de manera transparente cómo recopilamos, utilizamos y
          protegemos su información personal para mejorar la comunicación y los
          servicios dentro del campus.
        </p>

        <!-- 1. Datos que recopilamos -->
        <div class="aviso-seccion">
          <div class="seccion-header">
            <span class="numero-seccion">1</span>
            <h3>Datos que recopilamos</h3>
          </div>
          <p>
            Recopilamos información estrictamente necesaria para validar su identidad
            académica y facilitar la interacción en la plataforma:
          </p>
          <ul>
            <li><strong>Identificación:</strong> Nombre completo y foto de perfil.</li>
            <li><strong>Académicos:</strong> Correo institucional (.edu) y matrícula.</li>
            <li><strong>Uso:</strong> Registros de actividad para mejorar su experiencia.</li>
          </ul>
        </div>

        <!-- 2. Uso de la información -->
        <div class="aviso-seccion">
          <div class="seccion-header">
            <span class="numero-seccion">2</span>
            <h3>Uso de la información</h3>
          </div>
          <p>
            La información se utiliza exclusivamente para fines académicos y de comunicación
            interna:
          </p>
          <ul>
            <li>Verificación de pertenencia a la comunidad universitaria.</li>
            <li>Facilitar comunicación entre estudiantes y administrativos.</li>
            <li>Notificaciones sobre eventos y servicios del campus.</li>
          </ul>
        </div>

        <!-- 3. Protección de datos -->
        <div class="aviso-seccion">
          <div class="seccion-header">
            <span class="numero-seccion">3</span>
            <h3>Protección de datos</h3>
          </div>
          <p>
            Implementamos medidas de seguridad técnicas y administrativas para proteger sus
            datos. Utilizamos encriptación SSL y servidores seguros con acceso restringido para
            prevenir accesos no autorizados.
          </p>
        </div>

        <!-- 4. Derechos ARCO -->
        <div class="aviso-seccion">
          <div class="seccion-header">
            <span class="numero-seccion">4</span>
            <h3>Derechos ARCO</h3>
          </div>
          <p>
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al
            tratamiento de su información. Puede ejercer estos derechos enviando una solicitud
            a nuestro contacto oficial.
          </p>
        </div>

      </div>

      <!-- CONTACTO -->
      <div class="aviso-contacto">
        <div class="contacto-texto">
          <strong>¿Tienes dudas sobre tu privacidad?</strong>
          <span>Nuestro equipo está listo para ayudarte en cualquier momento.</span>
        </div>
        <a class="contacto-btn" href="mailto:privacidad&#64;tuunka.com">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 4H20V20H4V4Z" stroke="white" stroke-width="2"/>
            <path d="M4 4L12 13L20 4" stroke="white" stroke-width="2"/>
          </svg>
          privacidad&#64;tuunka.com
        </a>
      </div>

      <!-- FOOTER -->
      <div class="aviso-footer">
        <span class="footer-copy">© 2026 Tuunka. Todos los derechos reservados.</span>
        <div class="footer-links">
          <span class="footer-link">Términos de Servicio</span>
          <span class="footer-link">Soporte</span>
        </div>
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
