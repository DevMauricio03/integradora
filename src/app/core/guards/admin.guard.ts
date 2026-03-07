import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly router: Router
    ) { }

    async canActivate(): Promise<boolean> {
        const sessionResponse = await this.supabaseService.getSession();

        if (!sessionResponse.data.session) {
            this.router.navigate(['/auth/inicio-sesion']);
            return false;
        }

        const { isSuspended } = await this.supabaseService.verifySuspension();
        if (isSuspended) {
            await this.supabaseService.signOut();
            this.router.navigate(['/auth/inicio-sesion'], {
                queryParams: { error: 'cuenta_suspendida' }
            });
            return false;
        }

        const perfil = await this.supabaseService.getPerfilActual();
        if (!perfil) {
            this.router.navigate(['/auth/inicio-sesion']);
            return false;
        }

        const roles: any = perfil.roles;
        const roleName = Array.isArray(roles) ? roles[0]?.nombre : roles?.nombre;

        if (roleName?.toLowerCase()?.includes('admin')) {
            return true;
        }

        // Si no es admin, redirigir al feed de usuario normal
        this.router.navigate(['/user/feed']);
        return false;
    }
}
