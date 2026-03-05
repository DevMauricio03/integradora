import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, IconComponent],
  templateUrl: './adminLayout.html',
  styleUrls: ['./adminLayout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private router = inject(Router);

  getTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Inicio';
    if (url.includes('/users')) return 'Usuarios';
    if (url.includes('/publications')) return 'Publicaciones';
    if (url.includes('/reports')) return 'Reportes';
    return 'Admin';
  }
}

