import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  @Input() title: string = '';
  @Input() showLogout: boolean = false;



  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  getLogoRoute(): string {
    const currentUrl = this.router.url;
    // Si estamos en cualquier página de auth, va a bienvenida (/)
    if (currentUrl.includes('/auth/')) {
      return '/';
    }
    // Si estamos dentro de la app (ya logueados), va al feed
    return '/user/feed';
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }


}
