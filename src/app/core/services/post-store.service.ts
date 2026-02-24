import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Post {
  id?: string;
  type: string;
  title: string;
  description: string;
  category: string;
  expirationDate?: string;
  image?: string;
  author?: string;
  role?: string;
  time?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostStoreService {
  private supabase = inject(SupabaseService);

  private _posts = signal<Post[]>([]);
  posts = this._posts.asReadonly();

  async loadPosts() {
    const { data, error } = await this.supabase.getPosts();

    if (error) {
      console.error('Error al cargar posts:', error);
      return;
    }

    if (data) {
      const formattedPosts: Post[] = data.map((p: any) => ({
        id: p.id,
        title: p.titulo,
        description: p.descripcion,
        type: p.tipo,
        category: p.categoria || 'General',
        expirationDate: undefined,
        image: p.imagen_url, // Se mantiene por si añades la columna
        author: `${p.perfiles?.nombre} ${p.perfiles?.apellidos}`,
        role: p.perfiles?.roles?.nombre || 'Miembro',
        time: this.formatTime(p.creado),
        avatar: p.perfiles?.foto_url
      }));
      this._posts.set(formattedPosts);
    }
  }

  async addPost(post: Post) {
    const { error } = await this.supabase.createPost(post);
    if (error) {
      console.error('Error al crear post:', error);
      throw error;
    }
    await this.loadPosts();
  }

  private formatTime(dateStr: string): string {
    if (!dateStr) return 'Ahora';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);

    if (diffInMins < 1) return 'Ahora';
    if (diffInMins < 60) return `${diffInMins} m`;
    if (diffInHours < 24) return `${diffInHours} h`;
    return date.toLocaleDateString();
  }

}