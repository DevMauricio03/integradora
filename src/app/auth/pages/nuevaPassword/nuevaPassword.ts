import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-nueva-password',
  standalone: true,
  imports: [FormsModule, Navbar, RouterLink, ModalBase],
  templateUrl: './nuevaPassword.html',
  styleUrls: ['./nuevaPassword.css']
})
export class NuevaPassword implements OnInit {

  password = '';
  confirmarPassword = '';
  mostrarExito = false;
  cargando = false;
  error: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data } = await this.supabaseService.getSession();

    if (!data.session) {
      this.router.navigate(['/auth/inicio-sesion']);
    }
  }

  get passwordsCoinciden(): boolean {
    return this.password === this.confirmarPassword;
  }

  get formularioValido(): boolean {
    return this.password.length >= 8 && this.passwordsCoinciden;
  }

  async actualizarPassword() {
    this.cargando = true;
    this.error = null;

    const { error } = await this.supabaseService.updatePassword(this.password);

    this.cargando = false;

    if (error) {
      this.error = 'Ocurrió un error al actualizar la contraseña.';
      return;
    }

    this.mostrarExito = true;
  }

  async irLogin() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }
}
