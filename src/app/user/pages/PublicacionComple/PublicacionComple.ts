import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-publicacion-comple',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './PublicacionComple.html',
  styleUrls: ['./PublicacionComple.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionComple {
  private router = inject(Router);

  irAlInicio() {
    this.router.navigate(['/user/feed']);
  }

  irAImpulso() {
    // Por ahora esto podría ir a la página de planes de impulso si existe
    this.router.navigate(['/user/feed']); // Temporal
  }
}
