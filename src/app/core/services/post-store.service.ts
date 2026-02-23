import { Injectable, signal } from '@angular/core';

export interface Post {
  type: string;
  title: string;
  description: string;
  category: string;
  expirationDate?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostStoreService {

  private _posts = signal<Post[]>([]);

  posts = this._posts.asReadonly();

  addPost(post: Post) {
    this._posts.update(posts => [post, ...posts]);
  }

}