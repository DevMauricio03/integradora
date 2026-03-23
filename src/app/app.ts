import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupabaseService } from './core/services/supabase.service';
import { filter } from 'rxjs';
import { Subscription } from '@supabase/supabase-js';
import { SuspensionModal } from './shared/components/suspensionModal/suspensionModal';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';


// Step 1: Variable a nivel de módulo para proteger el listener de múltiples inicializaciones
let authListenerSub: Subscription | null = null;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SuspensionModal, ToastContainerComponent],
  template: `
    <router-outlet></router-outlet>

    <app-toast-container></app-toast-container>

    @if (mostrarModalSuspension()) {
      <app-suspension-modal
        [tiempoRestante]="tiempoRestante()"
        (confirm)="finalizarSesionForzada()">
      </app-suspension-modal>
    }
  `,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('new_integradora');
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  mostrarModalSuspension = signal(false);
  tiempoRestante = signal('Indefinido');

  ngOnInit() {
    // === LISTENER GLOBAL DE AUTH STATE ===
    // Limpiamos cualquier suscripción previa si la hubiera (Idempotencia global)
    if (authListenerSub) {
      authListenerSub.unsubscribe();
    }

    const { data } = this.supabase.onAuthStateChange((event, session) => {
      // Step 2: Identificar Password Recovery para no tratarlo como login normal
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[App] Recovery detectado. Usuario puede actualizar password.');
        return; // Detenemos aquí, no tratamos como SIGNED_IN
      }

      if (event === 'SIGNED_OUT') {
        // Logout detectado: resetear estado y redirigir
        this.mostrarModalSuspension.set(false);
        this.router.navigate(['/auth/bienvenida']);
      } else if (event === 'SIGNED_IN' && session) {
        // Verificamos que realmente sea un login estándar:
        // Supabase emite SIGNED_IN junto con PASSWORD_RECOVERY al abrir un enlace de recuperación.
        // Como interceptamos PASSWORD_RECOVERY arriba, reducimos los falsos positivos.
        // Aún así, nos aseguramos que estamos en una ruta que espera un login o verificamos.
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
           return; // Seguro adicional contra falsos SIGNED_IN durante recovery
        }
        
        console.log('[App] Login detectado - nuevo usuario activo');
      }
    });
    authListenerSub = data?.subscription;

    // === VERIFICAR SUSPENSIÓN EN CADA NAVEGACIÓN ===
    // Verificamos el estado de la cuenta en cada cambio de ruta principal
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkUserStatus();
    });
  }

  private async checkUserStatus() {
    // Si ya estamos mostrando el modal, no hace falta re-checar
    if (this.mostrarModalSuspension()) return;

    const { data: { session } } = await this.supabase.getSession();
    if (!session) return;

    const { isSuspended, remains } = await this.supabase.verifySuspension();
    if (isSuspended) {
      this.tiempoRestante.set(remains || 'Indefinido');
      this.mostrarModalSuspension.set(true);
    }
  }

  async finalizarSesionForzada() {
    await this.supabase.signOut();
    this.mostrarModalSuspension.set(false);
    this.router.navigate(['/auth/bienvenida']);
  }
}
