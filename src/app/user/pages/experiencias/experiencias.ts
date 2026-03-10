import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-experiencias',
  standalone: true,
  imports: [CommonModule, PostCardComponent, IconComponent],
  templateUrl: './experiencias.html',
  styleUrls: ['./experiencias.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experiencias implements OnInit {
  private readonly postStore = inject(PostStoreService);

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal(true);

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const result = await this.postStore.getPostsByTipo('experiencia');
      this.posts.set(result);
    } finally {
      this.isLoading.set(false);
    }
  }
}
