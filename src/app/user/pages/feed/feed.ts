import { Component } from '@angular/core';
import { PostStoreService } from '../../../core/services/post-store.service';
import { inject } from '@angular/core';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, CommonModule],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})

export class Feed { 
  private postStore = inject(PostStoreService);
posts = this.postStore.posts;
}
