import { Component, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { SupabaseService } from '../../../core/services/supabase.service';
import { form, required, submit, FormField, SchemaPathTree, validate, maxLength } from '@angular/forms/signals';

/**
 * Modelo para el formulario de actualización de contraseña.
 */
interface NewPasswordModel {
  password: string;
  confirmarPassword: string;
}

@Component({
  selector: 'app-nueva-password',
  standalone: true,
  imports: [Navbar, ModalBase, FormField],
  templateUrl: './nuevaPassword.html',
  styleUrls: ['./nuevaPassword.css']
})
export class NuevaPassword implements OnInit {

  /** Estado reactivo del modelo con signals */
  passwordModel = signal<NewPasswordModel>({
    password: '',
    confirmarPassword: ''
  });

  /** Esquema de validación Signal Forms */
  passwordForm = form(this.passwordModel, (schema: SchemaPathTree<NewPasswordModel>) => {
    // Password: Requisitos de seguridad obligatorios
    required(schema.password, { message: 'La contraseña es obligatoria' });
    maxLength(schema.password, 50, { message: 'Máximo 50 caracteres' });
    validate(schema.password, (ctx) => {
      const val = ctx.value();
      if (val.length < 8) return { kind: 'length', message: 'Mínimo 8 caracteres' };
      if (!/[A-Z]/.test(val)) return { kind: 'upper', message: 'Al menos una mayúscula' };
      if (!/[0-9]/.test(val)) return { kind: 'number', message: 'Al menos un número' };
      if (!/[^A-Za-z0-9]/.test(val)) return { kind: 'special', message: 'Un carácter especial' };
      return null;
    });

    // Confirmación: Debe ser igual al campo password
    required(schema.confirmarPassword, { message: 'Debes confirmar la contraseña' });
    validate(schema.confirmarPassword, (ctx) => {
      const pass = ctx.valueOf(schema.password);
      return ctx.value() === pass ? null : { kind: 'mismatch', message: 'Las contraseñas no coinciden' };
    });
  });

  /** Requisitos calculados para la UI */
  reqLength = computed(() => this.passwordModel().password.length >= 8);
  reqUppercase = computed(() => /[A-Z]/.test(this.passwordModel().password));
  reqNumber = computed(() => /[0-9]/.test(this.passwordModel().password));
  reqSpecial = computed(() => /[^A-Za-z0-9]/.test(this.passwordModel().password));
  seguridadNivel = computed(() => {
    let nivel = 0;
    if (this.reqLength()) nivel++;
    if (this.reqUppercase()) nivel++;
    if (this.reqNumber()) nivel++;
    if (this.reqSpecial()) nivel++;
    return nivel;
  });

  mostrarExito = signal(false);
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  mostrarPassword = signal(false);
  mostrarConfirmar = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    // Verificamos si hay una sesión activa para permitir cambiar el password
    const { data } = await this.supabaseService.getSession();
    if (!data.session) {
      this.router.navigate(['/auth/inicio-sesion']);
    }
  }

  /**
   * Procesa la actualización de la contraseña en Supabase.
   */
  async actualizarPassword(event: Event) {
    event.preventDefault();

    if (this.passwordForm().pending() || this.cargando()) return;

    this.errorMensaje.set(null);

    /** 'submit' garantiza que el esquema de validación se cumpla */
    submit(this.passwordForm, async () => {
      this.cargando.set(true);

      try {
        const { password } = this.passwordModel();
        const { error } = await this.supabaseService.updatePassword(password);

        if (error) {
          this.errorMensaje.set('Ocurrió un error al actualizar la contraseña.');
          return;
        }

        this.mostrarExito.set(true);
      } catch (err) {
        this.errorMensaje.set('Ocurrió un error inesperado.');
      } finally {
        this.cargando.set(false);
      }
    });
  }

  /**
   * Cierra sesión y redirige al inicio.
   */
  async irLogin() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }
}
