import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, IconComponent, Navbar],
  templateUrl: './soporte.html',
  styleUrl: './soporte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoporteAuth {
  enviado = signal(false);
  cargando = signal(false);
  ticketNumber = signal('TK-48291');

  constructor(private readonly router: Router) { }

  enviarMensaje(event: Event) {
    event.preventDefault();
    if (this.cargando()) return;
    this.cargando.set(true);

    // Simulamos envío
    setTimeout(() => {
      this.enviado.set(true);
      this.cargando.set(false);
    }, 1000);
  }

  volver() {
    if (this.enviado()) {
      this.enviado.set(false);
    } else {
      this.router.navigate(['/auth/bienvenida']);
    }
  }
}
