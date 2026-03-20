import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PublicationService } from '../../../core/services/publication.service';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { CommonModule } from '@angular/common';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';
import { ConfirmModal } from '../../../shared/components/confirmModal/confirmModal';

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  imports: [RouterLink, PostCardComponent, CommonModule, PostSkeletonComponent, ConfirmModal],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPublicoPage implements OnInit {
  private readonly authStore = inject(AuthStoreService);
  private readonly postStore = inject(PostStoreService);
  private readonly pubService = inject(PublicationService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ✅ REACTIVE: Usar signal del store directamente
  readonly perfil = this.authStore.perfil;
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  // Helper computed para normalizar el acceso a propiedades que pueden ser array u objeto
  readonly perfilNormalizado = computed(() => {
    const p = this.perfil();
    if (!p) return null;
    return {
      ...p,
      roles: Array.isArray(p.roles) ? p.roles[0] : p.roles,
      universidades: Array.isArray(p.universidades) ? p.universidades[0] : p.universidades
    };
  });

  readonly isLoading = signal<boolean>(true);
  readonly misPosts = signal<Post[]>([]);
  
  // Modal de confirmación para eliminar post
  readonly confirmModalOpen = signal(false);
  readonly postToDelete = signal<string | null>(null);
  readonly isDeleting = signal(false);

  constructor() {
    // ✅ REACTIVE: Reaccionar automáticamente a cambios del perfil
    // Cuando el perfil se actualiza (ej: después de editar), recarga los posts
    effect(() => {
      const perfilActual = this.perfil();
      if (perfilActual?.id) {
        this.loadPosts(perfilActual.id);
      }
    });
  }

  ngOnInit() {
    this.loadPerfil();
  }

  private async loadPerfil() {
    try {
      // Obtener perfil del store (si no está cargado, lo trae del servidor)
      await this.authStore.getPerfilActual();
      // El effect se disparará automáticamente cuando el perfil esté disponible
    } catch (e) {
      console.error('Error en loadPerfil:', e);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadPosts(userId: string) {
    try {
      this.isLoading.set(true);
      this.cdr.markForCheck();

      const posts = await this.postStore.getPostsForPerfil(userId);
      this.misPosts.set(posts);
    } catch (e) {
      console.error('Error en loadPosts:', e);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }

  // --- Lógica de Eliminación ---
  openDeleteConfirm(postId: string) {
    this.postToDelete.set(postId);
    this.confirmModalOpen.set(true);
  }

  closeDeleteConfirm() {
    this.confirmModalOpen.set(false);
    this.postToDelete.set(null);
  }

  async confirmDeletePost() {
    const id = this.postToDelete();
    if (!id || this.isDeleting()) return;

    this.isDeleting.set(true);
    try {
      const { error } = await this.pubService.deletePost(id);
      if (!error) {
        // Optimistic UI Update
        this.postStore.removePost(id);
        this.misPosts.update(posts => posts.filter(p => p.id !== id));
      } else {
        console.error('Error al eliminar publicación:', error);
      }
    } finally {
      this.isDeleting.set(false);
      this.closeDeleteConfirm();
      this.cdr.markForCheck();
    }
  }
}
