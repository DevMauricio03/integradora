import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  standalone: true
})
export class Navbar {
  @Input() title: string = '';
  @Input() showLogout: boolean = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/auth/inicio-sesion']);
  }
}
