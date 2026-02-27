import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './soporte.html',
  styleUrl: './soporte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoporteAuth {
  enviado = signal(false);
  ticketNumber = signal('TK-48291');

  constructor(private router: Router) { }

  enviarMensaje(event: Event) {
    event.preventDefault();
    // Simulamos envío
    this.enviado.set(true);
  }

  volver() {
    if (this.enviado()) {
      this.enviado.set(false);
    } else {
      this.router.navigate(['/auth/bienvenida']);
    }
  }
}
