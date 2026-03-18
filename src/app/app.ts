import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupabaseService } from './core/services/supabase.service';
import { filter } from 'rxjs';
import { SuspensionModal } from './shared/components/suspensionModal/suspensionModal';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';


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
