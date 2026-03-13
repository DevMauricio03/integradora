import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ChangePasswordModal } from '../../../shared/components/changePasswordModal/changePasswordModal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { ConfirmModal } from '../../../shared/components/confirmModal/confirmModal';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [ChangePasswordModal, SuccessModal, ConfirmModal],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Configuracion {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  // Estados de modales
  showChangePassword = signal(false);
  showSuccessDownload = signal(false);
  showConfirmDelete = signal(false);
  showSuccessDelete = signal(false);
  showSuccessPassword = signal(false);

  // Estados de carga
  isDownloading = signal(false);

  // 1. Solicitar descarga de datos
  async solicitarDescarga() {
    if (this.isDownloading()) return;
    
    this.isDownloading.set(true);
    try {
      const { success } = await this.profileService.solicitarDescargaDatos();
      if (success) {
        this.showSuccessDownload.set(true);
      }
    } catch (error) {
      console.error('Error al solicitar descarga:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  // 2. Cambiar contraseña
  abrirCambiarPassword() {
    this.showChangePassword.set(true);
  }

  onPasswordChanged() {
    this.showChangePassword.set(false);
    this.showSuccessPassword.set(true);
  }

  // 3. Cerrar sesión
  async cerrarSesion() {
    await this.authService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }

  // 4. Eliminar cuenta
  abrirConfirmacionEliminar() {
    this.showConfirmDelete.set(true);
  }

  async eliminarCuenta() {
    this.showConfirmDelete.set(false);
    try {
      const { success } = await this.profileService.solicitarEliminacionCuenta();
      if (success) {
        this.showSuccessDelete.set(true);
      }
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
    }
  }

  async finalizarEliminacion() {
    await this.authService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }
}
