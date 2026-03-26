import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { SupabaseService } from '../services/supabase.service';
import { NotificationStoreService } from '../services/notification-store.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let router: jasmine.SpyObj<Router>;
  let notificationStore: jasmine.SpyObj<NotificationStoreService>;

  beforeEach(() => {
    supabaseService = jasmine.createSpyObj<SupabaseService>('SupabaseService', [
      'getSession',
      'verifySuspension',
      'signOut'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    notificationStore = jasmine.createSpyObj<NotificationStoreService>('NotificationStoreService', [
      'initRealtime'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: Router, useValue: router },
        { provide: NotificationStoreService, useValue: notificationStore }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('redirige a inicio de sesion cuando no hay sesion', async () => {
    supabaseService.getSession.and.resolveTo({ data: { session: null } } as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/inicio-sesion']);
  });

  it('cierra sesion y redirige cuando la cuenta esta suspendida', async () => {
    supabaseService.getSession.and.resolveTo({
      data: { session: { user: { id: 'user-1' } } }
    } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: true } as any);
    supabaseService.signOut.and.resolveTo({} as any);

    const result = await guard.canActivate();

    expect(result).toBeFalse();
    expect(notificationStore.initRealtime).toHaveBeenCalledWith('user-1');
    expect(supabaseService.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/inicio-sesion'], {
      queryParams: { error: 'cuenta_suspendida' }
    });
  });

  it('permite acceso cuando la sesion es valida y no hay suspension', async () => {
    supabaseService.getSession.and.resolveTo({
      data: { session: { user: { id: 'user-1' } } }
    } as any);
    supabaseService.verifySuspension.and.resolveTo({ isSuspended: false } as any);

    const result = await guard.canActivate();

    expect(result).toBeTrue();
    expect(notificationStore.initRealtime).toHaveBeenCalledWith('user-1');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
