import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SupabaseService } from './core/services/supabase.service';

class SupabaseServiceStub {
  onAuthStateChange() {
    return {
      data: {
        subscription: {
          unsubscribe() { }
        }
      }
    };
  }

  async getSession() {
    return { data: { session: null } };
  }

  async verifySuspension() {
    return { isSuspended: false };
  }

  async signOut() {
    return {};
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: SupabaseService, useClass: SupabaseServiceStub }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-toast-container')).toBeTruthy();
  });

  it('should show suspension modal when suspension state is active', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.mostrarModalSuspension.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-suspension-modal')).toBeTruthy();
  });
});
