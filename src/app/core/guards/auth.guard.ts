import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const { data } = await this.supabaseService.getSession();

    if (!data.session) {
      this.router.navigate(['/auth/inicio-sesion']);
      return false;
    }

    return true;
  }
}
