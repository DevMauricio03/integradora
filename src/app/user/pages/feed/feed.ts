import { Component, OnInit, inject } from '@angular/core';
import { PostStoreService } from '../../../core/services/post-store.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, CommonModule, IconComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed implements OnInit {
  private postStore = inject(PostStoreService);
  posts = this.postStore.posts;

  ngOnInit() {
    this.postStore.loadPosts();
  }
}
