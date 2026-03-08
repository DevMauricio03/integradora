import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { form, required, email, pattern, submit, FormField, SchemaPathTree } from '@angular/forms/signals';
import { IconComponent } from "../../../shared/components/icon/icon.component";

/**
 * Modelo para el formulario de recuperación.
 */
interface RecoverFormModel {
  email: string;
}

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [RouterLink, Navbar, FormField, IconComponent],
  templateUrl: './recuperarContrasena.html',
  styleUrl: './recuperarContrasena.css'
})
export class RecuperarContrasena {
  enviado = signal(false);

  /** Modelado de datos reactivo con Signals */
  recoverModel = signal<RecoverFormModel>({
    email: ''
  });

  /** Esquema de formulario con validaciones Signal Forms */
  recoverForm = form(this.recoverModel, (schema: SchemaPathTree<RecoverFormModel>) => {
    required(schema.email, { message: 'El correo es obligatorio' });
    email(schema.email, { message: 'Formato de correo inválido' });
    // Filtro estricto institucional .edu
    pattern(schema.email, /^[^\s@]+@[^\s@]+\.edu(\.[a-z]+)?$/i, { message: 'Usa un correo institucional (.edu)' });
  });

  cargando = signal(false);
  emailEnviado = signal(false);
  errorEnvio = signal('');

  constructor(private supabaseService: SupabaseService, private readonly router: Router) { }
  /**
   * Procesa el envío del enlace de recuperación.
   */
  async onEnviar(event: Event) {
    event.preventDefault();

    if (this.recoverForm().pending()) return;

    this.errorEnvio.set('');
    this.emailEnviado.set(false);

    /** 'submit' asegura que el formulario sea válido antes de disparar la acción */
    submit(this.recoverForm, async () => {
      this.cargando.set(true);

      try {
        const { email } = this.recoverModel();
        const { error } = await this.supabaseService.resetPassword(email);

        if (error) {
          const msg = error.message?.toLowerCase() ?? '';
          if (msg.includes('rate limit')) {
            this.errorEnvio.set('Demasiados intentos. Espera unos minutos.');
          } else {
            // No revelamos si el correo existe por seguridad, marcamos éxito
            this.emailEnviado.set(true);
          }
        } else {
          this.emailEnviado.set(true);
        }
      } catch {
        this.errorEnvio.set('Ocurrió un error inesperado.');
      } finally {
        this.cargando.set(false);
      }
    });
  }

  volver() {
    if (this.enviado()) {
      this.enviado.set(false);
    } else {
      this.router.navigate(['/auth/bienvenida']);
    }
  }
}
