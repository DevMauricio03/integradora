import { ChangeDetectionStrategy, Component, output, signal, inject, computed } from '@angular/core';
import { form, required, submit, FormField, SchemaPathTree, validate, maxLength } from '@angular/forms/signals';
import { ModalBase } from '../modalBase/modalBase';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [ModalBase, FormField],
  template: `
    <app-modal-base ancho="480px" (closed)="emitClose()">
      <div class="modal-content">
        <div class="header">
          <div class="icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2>Cambiar contraseña</h2>
          <p>Ingresa tu nueva contraseña para actualizarla.</p>
        </div>

        <form (submit)="onSubmit($event)">
          <div class="form-group">
            <label for="newPassword">Nueva contraseña</label>
            <div class="contenedor-password">
              <input 
                [type]="mostrarPassword() ? 'text' : 'password'" 
                id="newPassword" 
                [formField]="passwordSignalForm.newPassword"
                placeholder="Mínimo 8 caracteres"
                class="form-control"
              >
              <button type="button" class="boton-ojo" (click)="mostrarPassword.set(!mostrarPassword())">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  @if (mostrarPassword()) {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  } @else {
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  }
                </svg>
              </button>
            </div>
            @if (passwordSignalForm.newPassword().touched() && passwordSignalForm.newPassword().invalid()) {
              <span class="error-msg">{{ passwordSignalForm.newPassword().errors()[0].message }}</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar contraseña</label>
            <div class="contenedor-password">
              <input 
                [type]="mostrarConfirmar() ? 'text' : 'password'" 
                id="confirmPassword" 
                [formField]="passwordSignalForm.confirmPassword"
                placeholder="Repite tu contraseña"
                class="form-control"
              >
              <button type="button" class="boton-ojo" (click)="mostrarConfirmar.set(!mostrarConfirmar())">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  @if (mostrarConfirmar()) {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  } @else {
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  }
                </svg>
              </button>
            </div>
            @if (passwordSignalForm.confirmPassword().touched() && passwordSignalForm.confirmPassword().invalid()) {
              <span class="error-msg">{{ passwordSignalForm.confirmPassword().errors()[0].message }}</span>
            }
          </div>

          <!-- REQUISITOS PANEL -->
          <div class="requisitos-seguridad">
            <p class="titulo-requisitos">Requisitos de seguridad</p>
            <div class="lista-requisitos">
              <div class="requisito" [class.activo]="reqLength()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  @if (reqLength()) {
                    <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" />
                    <path d="M8 12L11 15L16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  } @else {
                    <circle cx="12" cy="12" r="10" stroke="#616F89" stroke-width="2" />
                  }
                </svg>
                <span>Al menos 8 caracteres</span>
              </div>
              <div class="requisito" [class.activo]="reqUppercase()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  @if (reqUppercase()) {
                    <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" />
                    <path d="M8 12L11 15L16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  } @else {
                    <circle cx="12" cy="12" r="10" stroke="#616F89" stroke-width="2" />
                  }
                </svg>
                <span>Una mayúscula</span>
              </div>
              <div class="requisito" [class.activo]="reqNumber()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  @if (reqNumber()) {
                    <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" />
                    <path d="M8 12L11 15L16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  } @else {
                    <circle cx="12" cy="12" r="10" stroke="#616F89" stroke-width="2" />
                  }
                </svg>
                <span>Un número</span>
              </div>
              <div class="requisito" [class.activo]="reqSpecial()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  @if (reqSpecial()) {
                    <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" />
                    <path d="M8 12L11 15L16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  } @else {
                    <circle cx="12" cy="12" r="10" stroke="#616F89" stroke-width="2" />
                  }
                </svg>
                <span>Un carácter especial</span>
              </div>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="alert-error">
              {{ errorMessage() }}
            </div>
          }

          <div class="actions">
            <button type="button" class="btn-cancelar" (click)="emitClose()" [disabled]="isLoading()">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" [disabled]="passwordSignalForm().invalid() || isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
                Actualizando...
              } @else {
                Actualizar contraseña
              }
            </button>
          </div>
        </form>
      </div>
    </app-modal-base>
  `,
  styles: `
    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .icon-circle {
      width: 48px;
      height: 48px;
      background: rgba(19, 91, 236, 0.1);
      color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
    }

    .header p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }

    .contenedor-password {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-control {
      width: 100%;
      height: 48px;
      padding: 0 44px 0 16px;
      border: 1.5px solid var(--border-light);
      border-radius: 12px;
      background: #F9FAFB;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 0 0 4px rgba(19, 91, 236, 0.1);
    }

    .boton-ojo {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }

    .boton-ojo:hover {
      color: var(--text-secondary);
    }

    .error-msg {
      font-size: 12px;
      color: #ef4444;
    }

    /* REQUISITOS */
    .requisitos-seguridad {
      background: #F6F6F8;
      border: 1px solid #DBDFE6;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .titulo-requisitos {
      font-size: 14px;
      font-weight: 500;
      color: #616F89;
      margin: 0;
    }

    .lista-requisitos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }

    .requisito {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #616F89;
    }

    .requisito svg {
      flex-shrink: 0;
    }

    .requisito.activo {
      color: #10B981;
      font-weight: 500;
    }

    .alert-error {
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      color: #b91c1c;
      font-size: 13px;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .btn-cancelar {
      flex: 1;
      height: 45px;
      background: white;
      border: 1.5px solid var(--border-light);
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancelar:hover {
      background: #f9fafb;
    }

    .btn-guardar {
      flex: 2;
      height: 45px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-guardar:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .btn-guardar:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordModal {
  private readonly auth = inject(AuthService);

  closed = output<void>();
  success = output<void>();

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  mostrarPassword = signal(false);
  mostrarConfirmar = signal(false);

  passwordModel = signal({
    newPassword: '',
    confirmPassword: ''
  });

  passwordSignalForm = form(this.passwordModel, (schema: SchemaPathTree<{newPassword: string, confirmPassword: string}>) => {
    required(schema.newPassword);
    maxLength(schema.newPassword, 50, { message: 'Máximo 50 caracteres' });
    validate(schema.newPassword, (ctx) => {
      const val = ctx.value();
      if (val.length < 8) return { kind: 'length', message: 'Mínimo 8 caracteres' };
      if (!/[A-Z]/.test(val)) return { kind: 'upper', message: 'Una mayúscula' };
      if (!/\d/.test(val)) return { kind: 'number', message: 'Un número' };
      if (!/[^A-Za-z\d]/.test(val)) return { kind: 'special', message: 'Un carácter especial' };
      return null;
    });

    required(schema.confirmPassword);
    validate(schema.confirmPassword, (ctx) => {
      const pass = ctx.valueOf(schema.newPassword);
      return ctx.value() === pass ? null : { kind: 'mismatch', message: 'Las contraseñas no coinciden' };
    });
  });

  // Requisitos calculados (igual que en registro)
  reqLength = computed(() => this.passwordModel().newPassword.length >= 8);
  reqUppercase = computed(() => /[A-Z]/.test(this.passwordModel().newPassword));
  reqNumber = computed(() => /\d/.test(this.passwordModel().newPassword));
  reqSpecial = computed(() => /[^A-Za-z\d]/.test(this.passwordModel().newPassword));

  emitClose() {
    this.closed.emit();
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.passwordSignalForm().pending() || this.isLoading()) return;

    submit(this.passwordSignalForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      try {
        const { error } = await this.auth.updatePassword(this.passwordModel().newPassword);
        if (error) {
          this.errorMessage.set(error.message);
        } else {
          this.success.emit();
        }
      } catch (err: any) {
        this.errorMessage.set('Ocurrió un error inesperado al actualizar la contraseña.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }
}
