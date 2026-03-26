import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AdminReportsStoreService } from '../../../core/services/admin-reports-store.service';
import { ConfirmModal } from '../../../shared/components/confirmModal/confirmModal';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, IconComponent, ConfirmModal],
  templateUrl: './adminLayout.html',
  styleUrls: ['./adminLayout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly adminReportsStore = inject(AdminReportsStoreService);

  readonly showLogoutConfirm = signal(false);

  ngOnInit() {
    // Initialize Realtime for admin module
    this.adminReportsStore.initRealtime();
  }

  openLogoutConfirm() {
    this.showLogoutConfirm.set(true);
  }

  closeLogoutConfirm() {
    this.showLogoutConfirm.set(false);
  }

  async logout() {
    this.showLogoutConfirm.set(false);
    await this.supabaseService.signOut();
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
