import { ChangeDetectionStrategy, Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStoreService } from '../../../core/services/post-store.service';
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

  // Filtramos los posts para mostrar solo los de tipo 'experiencia'
  posts = computed(() =>
    this.postStore.posts().filter(post => post.type.toLowerCase() === 'experiencia')
  );

  ngOnInit() {
    this.postStore.loadPosts();
  }
}
