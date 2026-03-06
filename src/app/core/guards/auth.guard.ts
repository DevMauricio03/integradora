import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) { }

  async canActivate(): Promise<boolean> {
    const { data } = await this.supabaseService.getSession();

    if (!data.session) {
      this.router.navigate(['/auth/inicio-sesion']);
      return false;
    }

    // Verificamos si la cuenta ha sido suspendida
    const { isSuspended } = await this.supabaseService.verifySuspension();

    if (isSuspended) {
      await this.supabaseService.signOut();
      this.router.navigate(['/auth/inicio-sesion'], {
        queryParams: { error: 'cuenta_suspendida' }
      });
      return false;
    }

    return true;
  }
}
