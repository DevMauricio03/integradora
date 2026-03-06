import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, computed } from '@angular/core';
// Reutilizando PostSkeletonComponent para el estado de carga
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { PostStoreService } from '../../../core/services/post-store.service';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';

import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  imports: [RouterLink, PostCardComponent, CommonModule, IconComponent, PostSkeletonComponent],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPublicoPage implements OnInit {
  private readonly supabaseService = inject(SupabaseService);
  private readonly postStore = inject(PostStoreService);
  private readonly cdr = inject(ChangeDetectorRef);

  public perfil: any;
  cargando = true;
  isLoading = this.postStore.isLoading;
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  // Filtramos los posts para mostrar solo los que pertenecen al usuario actual
  misPosts = computed(() => {
    const allPosts = this.postStore.posts();
    const userId = this.perfil?.id;

    if (!userId) return [];

    return allPosts.filter(post =>
      String(post.authorId).toLowerCase() === String(userId).toLowerCase()
    );
  });

  ngOnInit() {
    this.loadPerfil();
  }

  private async loadPerfil() {
    try {
      this.perfil = await this.supabaseService.getPerfilActual();
      await this.postStore.loadPosts();
      this.cdr.markForCheck();
    } catch (e) {
      console.error('Error en ngOnInit Perfil:', e);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  // Si falla la imagen del avatar, usa una imagen por defecto.
  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }
}
