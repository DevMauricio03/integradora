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
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { ReportService } from '../../../core/services/report.service';
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
  // Layer 3: FeedServices (carreras para filtro)
  private readonly catalogService = inject(CatalogService);

  // ── Signals del store (expuestos al template) ─────────────────
  posts = this.postStore.posts;
  isLoading = this.postStore.isLoading;
  isLoadingMore = this.postStore.isLoadingMore; // true solo al cargar páginas adicionales
  hasMore = this.postStore.hasMore;       // false cuando no hay más posts

  carreras = signal<Carrera[]>([]);

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

  // ── Carga inicial ─────────────────────────────────────────────

  private async initialLoad() {
    const [, carrerasRes] = await Promise.all([
      this.postStore.loadFeed(),
      this.catalogService.getCarreras()
    ]);
    if (carrerasRes.data) this.carreras.set(carrerasRes.data);
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
        // Guard triple: hay más páginas, no está cargando más, y la carga inicial terminó
        if (entry.isIntersecting
          && this.hasMore()
          && !this.isLoadingMore()
          && !this.isLoading()) {   // ← evita disparar durante loadFeed()
          this.postStore.loadMorePosts();
        }
      },
      {
        rootMargin: '0px 0px 200px 0px',
        threshold: 0.1
      }
    );

    this._observer.observe(this.scrollAnchorRef.nativeElement);
  }

  /** Botón de fallback manual para cargar más posts. */
  loadMore() {
    this.postStore.loadMorePosts();
  }

  // ── Filtros ───────────────────────────────────────────────────

  onTipoChange(event: Event) { this.selectedTipo.set((event.target as HTMLSelectElement).value); }
  onFechaChange(event: Event) { this.selectedFecha.set((event.target as HTMLSelectElement).value); }
  onCarreraChange(event: Event) { this.selectedCarrera.set((event.target as HTMLSelectElement).value); }

  // ── Reporte ───────────────────────────────────────────────────

  openReportModal(post: any) {
    this.selectedPostForReport.set(post);
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.selectedPostForReport.set(null);
  }

  async handleReport(event: { reason: string; details: string }) {
    if (this.isReporting()) return;
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
