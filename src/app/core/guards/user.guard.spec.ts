import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UserGuard } from './user.guard';
import { SupabaseService } from '../services/supabase.service';
import { AuthStoreService } from '../services/auth-store.service';

describe('UserGuard', () => {
  let guard: UserGuard;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let authStore: jasmine.SpyObj<AuthStoreService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    supabaseService = jasmine.createSpyObj<SupabaseService>('SupabaseService', [
      'getSession',
      'verifySuspension',
      'signOut'
    ]);
    authStore = jasmine.createSpyObj<AuthStoreService>('AuthStoreService', ['getPerfilActual']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        UserGuard,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: AuthStoreService, useValue: authStore },
        { provide: Router, useValue: router }
      ]
    });

    guard = TestBed.inject(UserGuard);
  });

  it('redirige a inicio de sesion cuando no hay sesion', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: null } } as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/inicio-sesion']);
  });

  it('redirige al dashboard admin cuando el perfil es admin', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: { user: { id: 'admin-1' } } } } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: false } as any);
    authStore.getPerfilActual.and.resolveTo({ roles: { nombre: 'admin' } } as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('permite acceso cuando el perfil es de usuario normal', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: { user: { id: 'user-1' } } } } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: false } as any);
    authStore.getPerfilActual.and.resolveTo({ roles: { nombre: 'estudiante' } } as any);

    const result = await guard.canActivate();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
