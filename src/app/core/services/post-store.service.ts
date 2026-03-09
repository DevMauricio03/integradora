import { Injectable, inject, signal, computed } from '@angular/core';
import { FeedViewService, FeedPost, FEED_PAGE_SIZE } from './feed-view.service';
import { StorageService } from './storage.service';
import { PublicationService } from './publication.service';
import { AnuncioService } from './anuncio.service';

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
  details?: any;
  status: string;
}

/**
 * Layer 2 – Store: Feed paginado (publicaciones + anuncios).
 *
 * Estrategia de carga:
 *  Modo A – VIEW (preferido):  una sola query a `feed_posts` por página.
 *  Modo B – Fallback directo:  si la VIEW no existe, usa las queries originales.
 *
 * Paginación:
 *  - loadFeed()      → carga page 0, resetea estado.
 *  - loadMorePosts() → carga page N y AGREGA los posts (no reemplaza).
 *
 * Guards:
 *  - loadMorePosts() no corre mientras loadFeed() esté en progreso.
 *  - Deduplicación por promise compartida en ambas funciones.
 */
@Injectable({ providedIn: 'root' })
export class PostStoreService {
  private readonly feedViewService = inject(FeedViewService);
  private readonly publicationService = inject(PublicationService);
  private readonly anuncioService = inject(AnuncioService);
  private readonly storageService = inject(StorageService);

  // ── Fuentes de verdad ─────────────────────────────────────────
  private readonly _feedPosts = signal<Post[]>([]);
  private readonly _pendingPosts = signal<Post[]>([]);

  // ── Estado de carga ───────────────────────────────────────────
  private readonly _isLoadingFeed = signal<boolean>(false);
  private readonly _isLoadingMore = signal<boolean>(false);
  private readonly _isLoadingPending = signal<boolean>(false);

  // ── Paginación ────────────────────────────────────────────────
  private readonly _currentPage = signal<number>(0);
  private readonly _hasMore = signal<boolean>(true);

  // Promise guards (deduplicación)
  private _feedPromise: Promise<void> | null = null;
  private _morePromise: Promise<void> | null = null;

  // ── Computed signals ──────────────────────────────────────────

  public readonly posts = computed<Post[]>(() =>
    [...this._pendingPosts(), ...this._feedPosts()]
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
  );

  public readonly isLoading = computed<boolean>(() =>
    this._isLoadingFeed() || this._isLoadingPending()
  );

  public readonly isLoadingMore = this._isLoadingMore.asReadonly();
  public readonly hasMore = this._hasMore.asReadonly();
  public readonly currentPage = this._currentPage.asReadonly();

  // ── API pública ────────────────────────────────────────────────

  /**
   * Carga la primera página del feed.
   * Intenta con la VIEW `feed_posts`; si falla hace fallback a queries directas.
   */
  async loadFeed(force = false): Promise<void> {
    if (this._isLoadingFeed() && !force) return;
    if (this._feedPromise) return this._feedPromise;

    this._currentPage.set(0);
    this._hasMore.set(true);
    this._feedPosts.set([]);
    this._isLoadingFeed.set(true);
    this._isLoadingPending.set(true);

    this._feedPromise = Promise.all([
      this._fetchPage(0),
      this.feedViewService.getOwnPendingPosts()
    ]).then(([feedPosts, pendingResult]) => {
      this._feedPosts.set(feedPosts);
      this._pendingPosts.set(
        pendingResult.data ? pendingResult.data.map(p => this.mapPendingPost(p)) : []
      );
      this._hasMore.set(feedPosts.length >= FEED_PAGE_SIZE);
    }).catch(err => {
      console.error('[PostStore] loadFeed error:', err);
      this._feedPosts.set([]);
    }).finally(() => {
      this._feedPromise = null;
      this._isLoadingFeed.set(false);
      this._isLoadingPending.set(false);
    });

    return this._feedPromise;
  }

  /**
   * Carga la siguiente página y AGREGA los posts al array existente.
   *
   * Guard: no corre mientras loadFeed() esté en progreso.
   */
  async loadMorePosts(): Promise<void> {
    // No cargar más mientras la carga inicial está en progreso (race condition fix)
    if (this._isLoadingFeed()) return;
    if (this._isLoadingMore()) return;
    if (!this._hasMore()) return;
    if (this._morePromise) return this._morePromise;

    const nextPage = this._currentPage() + 1;
    this._isLoadingMore.set(true);

    this._morePromise = this._fetchPage(nextPage)
      .then(newPosts => {
        this._feedPosts.update(current => [...current, ...newPosts]);
        this._currentPage.set(nextPage);
        this._hasMore.set(newPosts.length >= FEED_PAGE_SIZE);
      }).catch(err => {
        console.error('[PostStore] loadMorePosts error:', err);
      }).finally(() => {
        this._morePromise = null;
        this._isLoadingMore.set(false);
      });

    return this._morePromise;
  }

  // ── API pública ────────────────────────────────────────────────
  async addPost(postData: any) {
    const { data: resultData, error } = await this.publicationService.createPost(postData);
    if (error) throw error;

    if (resultData) {
      const p = resultData as any;
      const perfilesRaw = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles;
      const rolesRaw = perfilesRaw?.roles;
      const roleName = Array.isArray(rolesRaw)
        ? (rolesRaw[0]?.nombre || 'Miembro')
        : (rolesRaw?.nombre || 'Miembro');

      const mappedPost: Post = {
        id: p.id,
        title: p.titulo,
        description: p.descripcion,
        type: p.tipo,
        category: p.categoria || 'General',
        image: p.imagen_url,
        images: p.imagenes_url || [],
        author: perfilesRaw?.nombre
          ? `${perfilesRaw.nombre} ${perfilesRaw.apellidos || ''}`.trim()
          : 'Usuario Anónimo',
        authorId: p.autor_id,
        authorCarreraId: perfilesRaw?.carrera_id,
        role: roleName,
        time: this.formatTime(p.creado || new Date().toISOString()),
        rawDate: new Date(p.creado || new Date().toISOString()),
        avatar: perfilesRaw?.foto_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${perfilesRaw?.nombre || 'U'}`,
        details: p.detalles,
        status: p.estado || 'pendiente'
      };
      this._pendingPosts.update(current => [mappedPost, ...current]);
    }
    return resultData;
  }

  uploadPostImages(files: File[]): Promise<string[]> {
    return this.storageService.subirImagenesPublicacion(files);
  }

  invalidateCache() {
    this._currentPage.set(0);
    this._hasMore.set(true);
    this._feedPosts.set([]);
  }

  // ── Internos ──────────────────────────────────────────────────

  /**
   * Obtener una página del feed.
   * Modo A: VIEW feed_posts.
   * Modo B fallback: queries directas a publicaciones + anuncios (si la VIEW no existe).
   */
  private async _fetchPage(page: number): Promise<Post[]> {
    const { data, error } = await this.feedViewService.getFeedPosts(page, FEED_PAGE_SIZE);

    // Si la VIEW existe y devuelve datos → usar mapeador plano
    if (!error && data !== null) {
      return data.map(row => this.mapFeedPost(row));
    }

    // Modo B: fallback directo (VIEW no existe o error de acceso)
    console.warn('[PostStore] feed_posts view no disponible, usando fallback. Error:', error?.message);
    return this._fetchPageFallback(page);
  }

  /**
   * Fallback: queries directas cuando la VIEW no está disponible.
   * Solo carga publicaciones (paginadas) + anuncios en page 0.
   */
  private async _fetchPageFallback(page: number): Promise<Post[]> {
    const { data: pubData } = await this.publicationService.getPosts();
    const pubs = pubData ? pubData.map(p => this.mapLegacyPost(p as any)) : [];

    // Anuncios solo en la primera página para evitar duplicados
    if (page === 0) {
      const { data: anunciosData } = await this.anuncioService.getAnuncios();
      const anuncios = anunciosData ? anunciosData.map(a => this.mapLegacyAnuncio(a as any)) : [];
      const combined = [...pubs, ...anuncios].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      this._hasMore.set(false); // En fallback cargamos todo de una vez
      return combined;
    }

    return [];
  }

  // ── Mappers ───────────────────────────────────────────────────

  /** Feed_posts VIEW row → Post (datos ya joinados en BD) */
  private mapFeedPost(row: FeedPost): Post {
    return {
      id: row.id,
      title: row.titulo,
      description: row.descripcion,
      type: row.tipo,
      category: row.categoria || 'General',
      image: row.imagen_url || undefined,
      images: row.imagenes_url || [],
      author: `${row.autor_nombre || ''} ${row.autor_apellidos || ''}`.trim() || 'Usuario Anónimo',
      authorId: row.autor_id,
      authorCarreraId: row.autor_carrera_id || undefined,
      role: row.autor_rol || 'Miembro',
      time: this.formatTime(row.creado || new Date().toISOString()),
      rawDate: new Date(row.creado || new Date().toISOString()),
      avatar: row.autor_foto_url || undefined,
      details: row.detalles,
      status: row.estado || 'activo'
    };
  }

  /** Pending posts row (tiene .perfiles anidado) → Post */
  private mapPendingPost(p: any): Post {
    const perfilesRaw = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles;
    const rolesRaw = perfilesRaw?.roles;
    const roleName = Array.isArray(rolesRaw)
      ? (rolesRaw[0]?.nombre || 'Miembro')
      : (rolesRaw?.nombre || 'Miembro');
    return {
      id: p.id || '',
      title: p.titulo,
      description: p.descripcion,
      type: p.tipo,
      category: p.categoria || 'General',
      image: p.imagen_url || undefined,
      images: p.imagenes_url || [],
      author: `${perfilesRaw?.nombre || ''} ${perfilesRaw?.apellidos || ''}`.trim() || 'Usuario Anónimo',
      authorId: p.autor_id,
      authorCarreraId: perfilesRaw?.carrera_id || undefined,
      role: roleName,
      time: this.formatTime(p.creado || new Date().toISOString()),
      rawDate: new Date(p.creado || new Date().toISOString()),
      avatar: perfilesRaw?.foto_url || undefined,
      details: p.detalles,
      status: p.estado || 'pendiente'
    };
  }

  /** Fallback: publicaciones row con perfiles anidado → Post */
  private mapLegacyPost(p: any): Post {
    const perfilesRaw = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles;
    const rolesRaw = perfilesRaw?.roles;
    const roleName = Array.isArray(rolesRaw)
      ? (rolesRaw[0]?.nombre || 'Miembro')
      : (rolesRaw?.nombre || 'Miembro');
    return {
      id: p.id || '',
      title: p.titulo,
      description: p.descripcion,
      type: p.tipo,
      category: p.categoria || 'General',
      image: p.imagen_url || undefined,
      images: p.imagenes_url || [],
      author: `${perfilesRaw?.nombre || ''} ${perfilesRaw?.apellidos || ''}`.trim() || 'Usuario Anónimo',
      authorId: p.autor_id,
      authorCarreraId: perfilesRaw?.carrera_id || undefined,
      role: roleName,
      time: this.formatTime(p.creado || new Date().toISOString()),
      rawDate: new Date(p.creado || new Date().toISOString()),
      avatar: perfilesRaw?.foto_url || undefined,
      details: p.detalles,
      status: p.estado || 'activo'
    };
  }

  /** Fallback: anuncio row → Post */
  private mapLegacyAnuncio(a: any): Post {
    return {
      id: `anuncio-${a.id}`,
      title: a.titulo,
      description: a.descripcion,
      type: 'Aviso Oficial',
      category: a.ciudad && a.ciudad !== 'Todas' ? a.ciudad : 'General',
      image: a.imagen_url || undefined,
      author: 'Tuunka',
      authorId: 'admin_tuunka',
      role: 'Administrador',
      time: this.formatTime(a.creado || new Date().toISOString()),
      rawDate: new Date(a.creado || new Date().toISOString()),
      avatar: undefined,
      details: { contacto_url: a.contacto_url, fecha_inicio: a.fecha_inicio, fecha_fin: a.fecha_fin },
      status: 'activo'
    };
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
    return date.toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  }
}