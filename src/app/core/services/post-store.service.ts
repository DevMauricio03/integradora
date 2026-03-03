import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Post {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  expirationDate?: string;
  image?: string;
  author: string;
  authorId: string;
  authorCarreraId?: string;
  role: string;
  time: string;
  rawDate: Date;
  avatar?: string;
  // Dynamic fields
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PostStoreService {
  private supabase = inject(SupabaseService);

  private _posts = signal<Post[]>([]);
  public posts = this._posts.asReadonly();

  private _isLoading = signal<boolean>(false);
  public isLoading = this._isLoading.asReadonly();

  async loadPosts() {
    this._isLoading.set(true);
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
        image: p.imagen_url,
        author: `${p.perfiles?.nombre} ${p.perfiles?.apellidos}`,
        authorId: p.autor_id,
        authorCarreraId: p.perfiles?.carrera_id,
        role: p.perfiles?.roles?.nombre || 'Miembro',
        time: this.formatTime(p.creado),
        rawDate: new Date(p.creado),
        avatar: p.perfiles?.foto_url,
        details: p.detalles // Assuming a JSONB column or similar
      }));
      this._posts.set(formattedPosts);
    }
    this._isLoading.set(false);
  }

  async addPost(postData: any) {
    const { data, error } = await this.supabase.createPost(postData);
    if (error) throw error;
    await this.loadPosts();
    return data;
  }

  private formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;

    // Si tiene más de 24 horas, mostramos la fecha real
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}