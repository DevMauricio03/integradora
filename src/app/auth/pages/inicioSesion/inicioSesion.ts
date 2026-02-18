import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [FormsModule, Navbar, RouterLink],
  templateUrl: './inicioSesion.html',
  styleUrl: './inicioSesion.css',
})
export class InicioSesion {

  email = '';
  password = '';
  mostrarPassword = false;
  loading = false;
  errorMensaje = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email.trim() || !this.password.trim()) return;

    this.loading = true;
    this.errorMensaje = '';

    const { error } = await this.supabaseService.signIn(this.email, this.password);

    this.loading = false;

    if (error) {
      this.errorMensaje = 'Credenciales incorrectas';
      return;
    }

    this.router.navigate(['/user/feed']);
  }
}
