import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { SupabaseService } from '../services/supabase.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    supabaseService = jasmine.createSpyObj<SupabaseService>('SupabaseService', [
      'getSession',
      'verifySuspension',
      'signOut',
      'getPerfilActual'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: Router, useValue: router }
      ]
    });

    guard = TestBed.inject(AdminGuard);
  });

  it('redirige a inicio de sesion cuando no hay sesion', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: null } } as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/inicio-sesion']);
  });

  it('permite acceso cuando el perfil es admin', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: { user: { id: 'admin-1' } } } } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: false } as any);
    supabaseService.getPerfilActual.and.resolveTo({ roles: { nombre: 'admin' } } as any);

    const result = await guard.canActivate();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige al feed cuando el usuario no es admin', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: { user: { id: 'user-1' } } } } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: false } as any);
    supabaseService.getPerfilActual.and.resolveTo({ roles: { nombre: 'estudiante' } } as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/user/feed']);
  });
});
