import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [FormsModule, RouterLink, Navbar],
  templateUrl: './recuperarContrasena.html',
  styleUrl: './recuperarContrasena.css'
})
export class RecuperarContrasena {

  email = '';
  cargando = false;
  emailEnviado = false;
  errorEnvio = '';

  constructor(private supabaseService: SupabaseService) {}

  get emailValido(): boolean {
    return /^[^\s@]+@utvco\.edu\.mx$/i.test(this.email);
  }

  // Limpiar error al escribir
  onInputChange() {
    if (this.errorEnvio) {
      this.errorEnvio = '';
    }
    if (this.emailEnviado) {
      this.emailEnviado = false;
    }
  }

  async onEnviar() {
    if (!this.emailValido || this.cargando) return;

    this.cargando = true;
    this.errorEnvio = '';
    this.emailEnviado = false;

    try {
      const { error } = await this.supabaseService.resetPassword(this.email);

      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('rate limit') || msg.includes('too many')) {
          this.errorEnvio = 'Demasiados intentos. Espera unos minutos.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          this.errorEnvio = 'Error de conexión. Verifica tu internet.';
        } else {
          // No revelar si el correo existe o no (seguridad)
          this.emailEnviado = true;
        }
      } else {
        this.emailEnviado = true;
      }
    } catch {
      this.errorEnvio = 'Ocurrió un error inesperado. Intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }
}
