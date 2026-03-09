import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {

  @Input() title: string = '';
  @Input() showLogout: boolean = false;
  @Output() onToggleMenu = new EventEmitter<void>();

  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  getLogoRoute(): string {
    const currentUrl = this.router.url;
    // Si estamos en auth, va a bienvenida (/)
    if (currentUrl.includes('/auth/')) {
      return '/';
    }
    // Si estamos en admin, va al dashboard
    if (currentUrl.includes('/admin/')) {
      return '/admin/dashboard';
    }
    // Si estamos dentro de la app (ya logueados), va al feed
    return '/user/feed';
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }


}
