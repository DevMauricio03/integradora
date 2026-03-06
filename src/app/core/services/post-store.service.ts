import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Post as PostDB, Anuncio } from '../models/supabase.models';

export interface Post {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  expirationDate?: string;
  image?: string;
  images?: string[];
  author: string;
  authorId: string;
  authorCarreraId?: string;
  role: string;
  time: string;
  rawDate: Date;
  avatar?: string;
  // Dynamic fields
  details?: any;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostStoreService {
  private readonly supabase = inject(SupabaseService);

  private readonly _posts = signal<Post[]>([]);
  public posts = this._posts.asReadonly();

  private readonly _isLoading = signal<boolean>(false);
  public isLoading = this._isLoading.asReadonly();

  async loadPosts() {
    this._isLoading.set(true);

    // Ejecutar ambas promesas en paralelo
    const [postsRes, anunciosRes] = await Promise.all([
      this.supabase.getPosts(),
      this.supabase.getAnuncios()
    ]);

    if (postsRes.error) {
      console.error('Error al cargar posts:', postsRes.error);
    }
    if (anunciosRes.error) {
      console.error('Error al cargar anuncios:', anunciosRes.error);
    }

    let allPosts: Post[] = [];

    if (postsRes.data) {
      allPosts = allPosts.concat(postsRes.data.map((p: PostDB) => {
        const roles = p.perfiles?.roles;
        const roleName = Array.isArray(roles) ? (roles[0]?.nombre || 'Miembro') : (roles?.nombre || 'Miembro');

        return {
          id: p.id || '',
          title: p.titulo,
          description: p.descripcion,
          type: p.tipo,
          category: p.categoria || 'General',
          expirationDate: undefined,
          image: p.imagen_url || undefined,
          images: p.imagenes_url || [],
          author: `${p.perfiles?.nombre || ''} ${p.perfiles?.apellidos || ''}`.trim() || 'Usuario Anónimo',
          authorId: p.autor_id,
          authorCarreraId: p.perfiles?.carrera_id || undefined,
          role: roleName,
          time: this.formatTime(p.creado || new Date().toISOString()),
          rawDate: new Date(p.creado || new Date().toISOString()),
          avatar: p.perfiles?.foto_url || undefined,
          details: p.detalles,
          status: p.estado || 'activo'
        };
      }));
    }

    if (anunciosRes.data) {
      allPosts = allPosts.concat(anunciosRes.data.map((a: Anuncio) => ({
        id: `anuncio-${a.id}`,
        title: a.titulo,
        description: a.descripcion,
        type: 'Aviso Oficial',
        category: a.ciudad && a.ciudad !== 'Todas' ? a.ciudad : 'General',
        expirationDate: undefined,
        image: a.imagen_url || undefined,
        author: 'Tuunka',
        authorId: 'admin_tuunka',
        role: 'Administrador',
        time: this.formatTime(a.creado || new Date().toISOString()),
        rawDate: new Date(a.creado || new Date().toISOString()),
        avatar: undefined,
        details: {
          contacto_url: a.contacto_url,
          fecha_inicio: a.fecha_inicio,
          fecha_fin: a.fecha_fin
        },
        status: 'activo'
      })));
    }

    // Ordenar de más reciente a más antiguo
    allPosts.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    this._posts.set(allPosts);
    this._isLoading.set(false);
  }

  async addPost(postData: any) {
    const { data, error } = await this.supabase.createPost(postData);
    if (error) throw error;
    await this.loadPosts();
    return data;
  }

  async uploadPostImages(files: File[]) {
    return await this.supabase.subirImagenesPublicacion(files);
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
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  }
}