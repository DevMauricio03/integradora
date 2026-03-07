import { SchemaPathTree } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-terminos-condiciones',
  standalone: true,
  imports: [ModalBase],
  template: `
    <app-modal-base ancho="680px" [mostrarCerrar]="true" (closed)="cerrar()">

      <!-- HEADER -->
      <div class="aviso-header">
        <h2 class="aviso-titulo">Términos y Condiciones</h2>
        <div class="aviso-fecha">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--text-muted)" stroke-width="2"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Última actualización: Febrero 2026</span>
        </div>
      </div>

      <!-- BODY SCROLLABLE -->
      <div class="aviso-body">

        <p class="aviso-intro" style="text-align: justify;">
          Al acceder, registrarse o utilizar la plataforma, el usuario acepta cumplir con los presentes Términos y Condiciones.
        </p>
        <p class="aviso-intro" style="text-align: justify;">
          Si el usuario no está de acuerdo, deberá abstenerse de utilizar el servicio.
        </p>

        <!-- 1. Identidad y domicilio del responsable -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">1</span>
            <h3>Identificación del Servicio</h3>
          </div>
          <p>
            <strong class="marca">Tuunka</strong> es una plataforma digital destinada a centralizar la comunicación dentro de comunidades universitarias, permitiendo la publicación de avisos, eventos, productos, servicios, experiencias empresariales y anuncios comerciales.
          </p>
        </div>

        <!-- 2. REGISTRO DE USUARIOS -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">2</span>
            <h3>Registro de Usuarios</h3>
          </div>
          <p>Para utilizar determinadas funciones es necesario crear una cuenta.</p>
          <p>El usuario declara que:</p>
          <ul>
            <li>La información proporcionada es veraz.</li>
            <li>Es responsable de la confidencialidad de su cuenta.</li>
            <li>Notificará cualquier uso no autorizado.</li>
          </ul>
          <p>Tuunka puede suspender cuentas con información falsa.</p>
        </div>

        <!-- 3. USO DE LA PLATAFORMA -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">3</span>
            <h3>Uso de la Plataforma</h3>
          </div>
          <p>El usuario se compromete a utilizar la plataforma únicamente para fines lícitos y conforme a estos términos.</p>
          <p>Está prohibido publicar contenido que:</p>
          <ul>
            <li>Sea ilegal, ofensivo o discriminatorio.</li>
            <li>Vulnera derechos de terceros.</li>
            <li>Contenga información falsa o engañosa.</li>
            <li>Promueva actividades ilícitas.</li>
            <li>Infrinja propiedad intelectual.</li>
            <li>Incluya spam o publicidad no autorizada.</li>
          </ul>
        </div>

        <!-- 4. CONTENIDO GENERADO POR USUARIOS -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">4</span>
            <h3>Contenido Generado por Usuarios</h3>
          </div>
          <p>El usuario es el único responsable del contenido que publique.</p>
          <p>Tuunka no garantiza la veracidad de las publicaciones ni se responsabiliza por interacciones entre usuarios.</p>
          <p>Tuunka se reserva el derecho de eliminar contenido que viole estas condiciones.</p>
        </div>

        <!-- 5. EXPERIENCIAS EMPRESARIALES -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">5</span>
            <h3>Experiencias Empresariales</h3>
          </div>
          <p>Las experiencias publicadas representan opiniones personales de los usuarios.</p>
          <p>Tuunka no valida ni certifica dichas experiencias.</p>
        </div>

        <!-- 6. ANUNCIOS Y PUBLICACIONES DESTACADAS -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">6</span>
            <h3>Anuncios y Publicaciones Destacadas</h3>
          </div>
          <p>La plataforma puede ofrecer servicios de promoción pagada.</p>
          <p>Los pagos realizados son procesados por terceros (por ejemplo Stripe).</p>
          <p>Tuunka no es responsable por fallas externas del sistema de pago.</p>
        </div>

        <!-- 7. PROPIEDAD INTELECTUAL -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">7</span>
            <h3>Propiedad Intelectual</h3>
          </div>
          <p>El diseño, software, logotipos y contenido propio de Tuunka están protegidos por derechos de propiedad intelectual.</p>
          <p>El usuario conserva la propiedad del contenido que publique, pero concede a Tuunka una licencia para mostrarlo dentro de la plataforma.</p>
        </div>

        <!-- 8. MODERACIÓN Y SUSPENSIÓN DE CUENTAS -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">8</span>
            <h3>Moderación y Suspensión de Cuentas</h3>
          </div>
          <p>Tuunka puede:</p>
          <ul>
            <li>Eliminar contenido.</li>
            <li>Suspender cuentas.</li>
            <li>Limitar funciones.</li>
          </ul>
          <p>Cuando detecte incumplimiento de estos términos.</p>
        </div>

        <!-- 9. LIMITACIÓN DE RESPONSABILIDAD -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">9</span>
            <h3>Limitación de Responsabilidad</h3>
          </div>
          <p>Tuunka no será responsable por:</p>
          <ul>
            <li>Daños derivados del uso de la plataforma.</li>
            <li>Interacciones entre usuarios.</li>
            <li>Información publicada por terceros.</li>
            <li>Fallas técnicas externas.</li>
            <li>Pérdida de datos por causas fuera de control razonable.</li>
          </ul>
        </div>

        <!-- 10. DISPONIBILIDAD DEL SERVICIO -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">10</span>
            <h3>Disponibilidad del Servicio</h3>
          </div>
          <p>El servicio puede modificarse, suspenderse o actualizarse en cualquier momento sin previo aviso.</p>
        </div>

        <!-- 11. PROTECCIÓN DE DATOS PERSONALES -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">11</span>
            <h3>Protección de Datos Personales</h3>
          </div>
          <p>El tratamiento de datos personales se regula conforme al Aviso de Privacidad de Tuunka.</p>
        </div>

        <!-- 12. MODIFICACIONES A LOS TÉRMINOS -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">12</span>
            <h3>Modificaciones a los Términos</h3>
          </div>
          <p>Tuunka puede modificar estos términos en cualquier momento.</p>
          <p>El uso continuado de la plataforma implica aceptación de los cambios.</p>
        </div>

        <!-- 13. LEGISLACIÓN APLICABLE -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">13</span>
            <h3>Legislación Aplicable</h3>
          </div>
          <p>Estos términos se rigen por la legislación vigente en los Estados Unidos Mexicanos.</p>
        </div>

        <!-- 14. CONTACTO -->
        <div class="aviso-seccion" style="text-align: justify;">
          <div class="seccion-header">
            <span class="numero-seccion">14</span>
            <h3>Contacto</h3>
          </div>
          <p>Para cualquier duda o solicitud:</p>
          <p><strong>hola&#64;tuunka.com</strong></p>
        </div>
      </div>

      <!-- CONTACTO -->
      <div class="aviso-contacto">
        <div class="contacto-texto">
          <strong>¿Tienes dudas sobre los terminos y condiciones?</strong>
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
export class TerminosCondiciones {

  @Output() closed = new EventEmitter<void>();

  cerrar() {
    this.closed.emit();
  }
}
