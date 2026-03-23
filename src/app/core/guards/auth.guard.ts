import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { NotificationStoreService } from '../services/notification-store.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly notificationStore = inject(NotificationStoreService);

  async canActivate(): Promise<boolean> {
    const { data } = await this.supabaseService.getSession();

    if (!data.session) {
      this.router.navigate(['/auth/inicio-sesion']);
      return false;
    }

    // Initialize Realtime for active session
    // Covers the case when user reloads the page or navigates without logout
    if (data.session.user?.id) {
      console.log('[AuthGuard] Active session detected, initializing Realtime for userId:', data.session.user.id);
      this.notificationStore.initRealtime(data.session.user.id);
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
