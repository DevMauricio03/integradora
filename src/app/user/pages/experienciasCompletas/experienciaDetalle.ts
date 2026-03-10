import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { Comentarios } from '../../components/comentarios/comentarios';

@Component({
  selector: 'app-experiencia-detalle-page',
  standalone: true,
  imports: [PostCardComponent, Comentarios],
  templateUrl: './experienciaDetalle.html',
  styleUrls: ['./experienciaDetalle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienciaDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postStore = inject(PostStoreService);

  readonly post = signal<Post | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.isLoading.set(false); return; }

    try {
      const result = await this.postStore.getPostById(id);
      if (result) {
        this.post.set(result);
      } else {
        this.notFound.set(true);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  volver() {
    this.router.navigate(['/user/experiencias']);
  }
}
