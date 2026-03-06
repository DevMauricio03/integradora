import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publicacion-comple',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './PublicacionComple.html',
  styleUrls: ['./PublicacionComple.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionComple implements OnInit {
  private router = inject(Router);
  post = signal<any>(null);

  ngOnInit() {
    const state = window.history.state;
    if (state && state.post) {
      this.post.set(state.post);
    }
  }

  irAlInicio() {
    this.router.navigate(['/user/feed']);
  }

  irAImpulso() {
    this.router.navigate(['/user/feed']); // Temporal
  }
}
