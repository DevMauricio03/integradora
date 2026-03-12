import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { CommonModule } from '@angular/common';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  imports: [RouterLink, PostCardComponent, CommonModule, PostSkeletonComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPublicoPage implements OnInit {
  private readonly authStore = inject(AuthStoreService);
  private readonly postStore = inject(PostStoreService);
  private readonly cdr = inject(ChangeDetectorRef);

  public perfil: any;
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  readonly isLoading = signal<boolean>(true);
  readonly misPosts = signal<Post[]>([]);

  ngOnInit() {
    this.loadPerfil();
  }

  private async loadPerfil() {
    try {
      this.perfil = await this.authStore.getPerfilActual();
      this.cdr.markForCheck();

      if (!this.perfil?.id) return;

      const posts = await this.postStore.getPostsForPerfil(this.perfil.id);
      this.misPosts.set(posts);
    } catch (e) {
      console.error('Error en loadPerfil:', e);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }
}
