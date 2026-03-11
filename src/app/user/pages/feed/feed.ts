import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { Router } from '@angular/router';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { ReportService } from '../../../core/services/report.service';
import { PublicationService } from '../../../core/services/publication.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { Carrera } from '../../../core/models/supabase.models';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, CommonModule, IconComponent, PostSkeletonComponent, ReportModalComponent, SuccessModal],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed implements OnInit, AfterViewInit, OnDestroy {
  // Layer 2: Store (estado + caching + paginación)
  private readonly postStore = inject(PostStoreService);
  // Layer 2: AuthStore (perfil cacheado)
  private readonly authStore = inject(AuthStoreService);
  // Layer 1: ReportService
  private readonly reportSvc = inject(ReportService);
  // Layer 1: PublicationService (para soft-delete de posts propios)
  private readonly publicationSvc = inject(PublicationService);
  // Layer 3: FeedServices (carreras para filtro)
  private readonly catalogService = inject(CatalogService);
  readonly router = inject(Router);

  // ── Signals del store (expuestos al template) ─────────────────
  posts = this.postStore.posts;
  isLoading = this.postStore.isLoading;
  isLoadingMore = this.postStore.isLoadingMore;
  hasMore = this.postStore.hasMore;

  carreras = signal<Carrera[]>([]);
  currentUserId = signal<string | null>(null);

  // ── Filtros ───────────────────────────────────────────────────
  selectedTipo = signal<string>('todas');
  selectedFecha = signal<string>('todas');
  selectedCarrera = signal<string>('todas');

  // ── Modal de reporte ──────────────────────────────────────────
  showReportModal = signal<boolean>(false);
  showSuccessReport = signal<boolean>(false);
  selectedPostForReport = signal<any>(null);
  isReporting = signal<boolean>(false);

  // ── Sentinel para IntersectionObserver ────────────────────────
  /** Elemento al final del feed que activa la carga automática. */
  @ViewChild('scrollAnchor') private scrollAnchorRef!: ElementRef<HTMLDivElement>;
  private _observer: IntersectionObserver | null = null;

  // ── Posts filtrados ───────────────────────────────────────────
  filteredPosts = computed(() => {
    let currentPosts = this.posts().filter(p => p.status === 'activo' || p.status === 'pendiente');

    const tipo = this.selectedTipo();
    if (tipo !== 'todas') {
      if (tipo === 'avisos') {
        currentPosts = currentPosts.filter((p: Post) =>
          p.type.toLowerCase() === 'aviso' || p.type.toLowerCase() === 'aviso oficial');
      } else if (tipo === 'eventos') {
        currentPosts = currentPosts.filter((p: Post) => p.type === 'evento');
      } else if (tipo === 'servicios') {
        currentPosts = currentPosts.filter((p: Post) =>
          p.type === 'oferta' && p.details?.subtype === 'servicio');
      } else if (tipo === 'productos') {
        currentPosts = currentPosts.filter((p: Post) =>
          p.type === 'oferta' && p.details?.subtype === 'producto');
      } else {
        currentPosts = currentPosts.filter((p: Post) => p.type === tipo);
      }
    }

    const fecha = this.selectedFecha();
    if (fecha !== 'todas') {
      const today = new Date();
      currentPosts = currentPosts.filter((p: Post) => {
        const pDate = new Date(p.rawDate);
        if (fecha === 'este dia') return pDate.toDateString() === today.toDateString();
        if (fecha === 'esta semana') {
          const diffDays = Math.floor((Date.now() - pDate.getTime()) / 86400000);
          return diffDays >= 0 && diffDays <= 7;
        }
        if (fecha === 'este mes') return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
        if (fecha === 'este ano') return pDate.getFullYear() === today.getFullYear();
        return true;
      });
    }

    const carrera = this.selectedCarrera();
    if (carrera !== 'todas') {
      currentPosts = currentPosts.filter((p: Post) =>
        p.authorCarreraId === carrera || p.type === 'Aviso Oficial');
    }

    return currentPosts;
  });

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit() {
    this.initialLoad();
  }

  ngAfterViewInit() {
    this._setupIntersectionObserver();
  }

  ngOnDestroy() {
    this._observer?.disconnect();
    this._observer = null;
  }

  // Imágenes ya solicitadas al prefetcher (deduplicación)
  private readonly _prefetched = new Set<string>();

  private async initialLoad() {
    const [, carrerasRes, perfil] = await Promise.all([
      this.postStore.loadFeed(),
      this.catalogService.getCarreras(),
      this.authStore.getPerfilActual()
    ]);
    if (carrerasRes.data) this.carreras.set(carrerasRes.data);
    if (perfil) this.currentUserId.set(perfil.id);

    const posts = this.postStore.posts();
    const firstImageUrl = posts[0]?.images?.[0] ?? posts[0]?.image;
    if (firstImageUrl) this._preloadFirstImage(firstImageUrl);
    this._prefetchImages(posts, 1);

    // TIMING FIX: el IntersectionObserver solo dispara en CAMBIOS de intersección,
    // no en el estado actual. Si con 3 posts el sentinel ya fue visible antes
    // de que isLoading() bajara a false, el observer nunca vuelve a disparar.
    // Por eso forzamos una comprobación manual aquí, DESPUÉS de que carga termine.
    this._checkAndLoadMore();
  }

  /**
   * Pre-descarga en background las imágenes de los posts a partir de `startIndex`.
   * Solo toma los siguientes `count` posts para no saturar la red.
   *
   * Condiciones:
   *  - Omite si la red es 2G (navigator.connection?.effectiveType)
   *  - Omite URLs ya solicitadas (_prefetched Set)
   *  - No bloquea el hilo principal (new Image() es asíncrono)
   */
  private _prefetchImages(posts: any[], startIndex: number, count = 3): void {
    if (typeof navigator === 'undefined') return;

    // No prefetchar en conexiones 2G para ahorrar datos
    const conn = (navigator as any).connection;
    if (conn?.effectiveType === '2g') return;

    posts.slice(startIndex, startIndex + count).forEach(post => {
      const urls: string[] = [
        ...(post.images ?? []),
        post.image
      ].filter(Boolean);

      urls.forEach(url => {
        if (this._prefetched.has(url)) return;
        this._prefetched.add(url);
        const img = new Image();
        img.src = url;   // dispara descarga en background; el browser la cachea
      });
    });
  }

  /**
   * Inserta <link rel="preload" as="image"> en <head> para la primera
   * imagen del feed, indicando al browser que la descargue inmediatamente
   * aunque el componente PostCard todavía no haya sido renderizado.
   *
   * Deduplicación: usa el atributo `data-preload-feed` para evitar
   * insertar más de un tag por sesión.
   */
  private _preloadFirstImage(url: string): void {
    if (typeof document === 'undefined') return; // SSR guard

    // Evitar duplicados
    if (document.head.querySelector('link[data-preload-feed]')) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.setAttribute('data-preload-feed', 'true');
    document.head.appendChild(link);
  }

  // ── Infinite scroll ───────────────────────────────────────────

  /**
   * Configura el IntersectionObserver sobre el elemento sentinel (#scrollAnchor).
   * Cuando el sentinel entra en el viewport:
   *   1. Verifica que haya más páginas (hasMore).
   *   2. Verifica que no haya una petición en vuelo (isLoadingMore).
   *   3. Lanza loadMorePosts().
   *
   * El observer se desconecta en ngOnDestroy para evitar memory leaks.
   * threshold: 0.1 → dispara cuando el 10% del sentinel es visible.
   * rootMargin: '0px 0px 200px 0px' → anticipa la carga 200px antes del borde.
   */
  private _setupIntersectionObserver() {
    if (!this.scrollAnchorRef?.nativeElement) return;

    this._observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this._checkAndLoadMore();
        }
      },
      {
        // 400px de margen anticipa la carga antes de que el usuario llegue al fondo
        rootMargin: '0px 0px 400px 0px',
        threshold: 0
      }
    );

    this._observer.observe(this.scrollAnchorRef.nativeElement);
  }

  /**
   * Comprueba si se puede cargar más y lo hace.
   * Centralizado aquí para poder llamarlo tanto desde el observer
   * como manualmente tras initialLoad() (timing fix).
   */
  private _checkAndLoadMore(): void {
    if (this.hasMore() && !this.isLoadingMore() && !this.isLoading()) {
      this.postStore.loadMorePosts();
    }
  }

  /** Botón de fallback manual para cargar más posts. */
  async loadMore() {
    await this.postStore.loadMorePosts();
    // Prefetch de las siguientes imágenes después de que la página nueva llegó
    const posts = this.postStore.posts();
    const newPageStart = posts.length - 3; // los 3 recién llegados ya son visibles
    this._prefetchImages(posts, newPageStart + 3);
  }

  // ── Filtros ───────────────────────────────────────────────────

  onTipoChange(event: Event) { this.selectedTipo.set((event.target as HTMLSelectElement).value); }
  onFechaChange(event: Event) { this.selectedFecha.set((event.target as HTMLSelectElement).value); }
  onCarreraChange(event: Event) { this.selectedCarrera.set((event.target as HTMLSelectElement).value); }

  // ── Reporte ───────────────────────────────────────────────────

  // ── Eliminar publicación propia ───────────────────────────

  async handleDeletePost(postId: string) {
    try {
      await this.publicationSvc.softDeletePost(postId);
      this.postStore.removePost(postId);
    } catch (err) {
      console.error('[Feed] Error al eliminar publicación:', err);
    }
  }

  // ── Reporte ───────────────────────────────────────────────

  openReportModal(post: any) {
    this.selectedPostForReport.set(post);
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.selectedPostForReport.set(null);
  }

  async handleReport(event: { reason: string; details: string }) {
    this.isReporting.set(true);

    try {
      const perfilActual = await this.authStore.getPerfilActual();
      if (!perfilActual) {
        alert('Debes iniciar sesión para reportar.');
        return;
      }

      const post = this.selectedPostForReport();
      const { error } = await this.reportSvc.createReport({
        publicacion_id: post.id,
        autor_id: post.authorId || post.autor_id,
        informante_id: perfilActual.id,
        motivo: event.reason,
        detalles: event.details
      });

      if (error) throw error;
      this.closeReportModal();
      this.showSuccessReport.set(true);
    } catch (err) {
      console.error('Error al reportar:', err);
      alert('No se pudo enviar el reporte.');
    } finally {
      this.isReporting.set(false);
    }
  }
}
