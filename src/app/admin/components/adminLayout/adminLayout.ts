import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, IconComponent],
  templateUrl: './adminLayout.html',
  styleUrls: ['./adminLayout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/auth/bienvenida']);
  }

  getTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Inicio';
    if (url.includes('/users')) return 'Usuarios';
    if (url.includes('/publications')) return 'Publicaciones';
    if (url.includes('/reports')) return 'Reportes';
    return 'Admin';
  }
}

