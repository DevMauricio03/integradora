import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Comentarios } from '../../components/comentarios/comentarios';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FeedViewService } from '../../../core/services/feed-view.service';
import { PostStoreService, Post } from '../../../core/services/post-store.service';

@Component({
  selector: 'app-experiencia-detalle-page',
  standalone: true,
  imports: [CommonModule, Navbar, Comentarios, IconComponent],
  templateUrl: './experienciaDetalle.html',
  styleUrls: ['./experienciaDetalle.css']
})
export class ExperienciaDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feedViewService = inject(FeedViewService);
  private readonly postStore = inject(PostStoreService);

  readonly post = signal<Post | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No se encontró el ID de la experiencia.');
      this.isLoading.set(false);
      return;
    }
    await this.cargarExperiencia(id);
  }

  private async cargarExperiencia(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.feedViewService.getPostById(id);
      if (error || !data) {
        this.error.set('No se pudo cargar la experiencia.');
      } else {
        this.post.set(this.postStore.mapFeedPostPublic(data));
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  volver(): void {
    this.router.navigate(['/user/experiencias']);
  }

  getAutorIniciales(): string {
    const p = this.post();
    return p ? p.author.charAt(0).toUpperCase() : 'U';
  }
}