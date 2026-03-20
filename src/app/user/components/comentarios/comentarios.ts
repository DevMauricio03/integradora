import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComentarioService,
  Comentario,
  COMENTARIO_PAGE_SIZE,
} from '../../../core/services/comentario.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { ReportService } from '../../../core/services/report.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Post } from '../../../core/services/post-store.service';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { ConfirmModal } from '../../../shared/components/confirmModal/confirmModal';

const MAX_WORDS = 50;

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, ReportModalComponent, ConfirmModal],
  templateUrl: './comentarios.html',
  styleUrls: ['./comentarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comentarios implements OnInit {
  /** Cuando disabled=true el input está bloqueado (uso en preview) */
  @Input() disabled = false;
  /** ID del post — requerido para cargar y publicar comentarios */
  @Input() postId = '';
  /** Publicación completa — requerida para obtener autor_id y enviar notificaciones */
  @Input() publicacion: Post | null = null;

  private readonly svc       = inject(ComentarioService);
  private readonly authStore = inject(AuthStoreService);
  private readonly reportSvc = inject(ReportService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr       = inject(ChangeDetectorRef);

  readonly MAX_WORDS = MAX_WORDS;

  // ── Estado ────────────────────────────────────────────────────
  readonly comentarios    = signal<Comentario[]>([]);
  readonly isLoading      = signal(false);
  readonly isLoadingMore  = signal(false);
  readonly isPublishing   = signal(false);
  readonly hasMore        = signal(false);
  readonly commentText    = signal('');
  readonly errorPublish   = signal<string | null>(null);

  /** ID del usuario autenticado (para saber si es autor de un comentario) */
  readonly currentUserId  = signal<string | null>(null);
  readonly isAdmin        = signal(false);

  /** ID del comentario cuyo menú ⋯ está abierto */
  readonly openMenuId     = signal<string | null>(null);

  /** Control del modal de reporte de comentario */
  readonly showReportModal    = signal(false);
  readonly reportingComment   = signal<Comentario | null>(null);

  /** Control del modal de confirmación de borrado */
  readonly confirmModalOpen   = signal(false);
  readonly commentToDelete    = signal<string | null>(null);
  readonly isDeleting         = signal(false);

  // ── Promise Guards (prevención de race conditions) ────────────
  private _submitPromise: Promise<void> | null = null;
  private _deletePromise: Promise<void> | null = null;

  private offset = 0;

  // ── Conteo de palabras ────────────────────────────────────────
  readonly wordCount = computed(() => {
    const t = this.commentText().trim();
    return t ? t.split(/\s+/).length : 0;
  });

  readonly wordsLeft = computed(() => MAX_WORDS - this.wordCount());

  readonly isOverLimit = computed(() => this.wordCount() > MAX_WORDS);

  // ── Ciclo de vida ─────────────────────────────────────────────
  async ngOnInit() {
    const perfil = await this.authStore.getPerfilActual();
    if (perfil) {
      this.currentUserId.set(perfil.id);
      const roles: any = perfil.roles;
      const roleName = Array.isArray(roles) ? roles[0]?.nombre : roles?.nombre;
      this.isAdmin.set(!!roleName?.toLowerCase().includes('admin'));
    }

    if (!this.disabled && this.postId) {
      this.loadPage(0, true);
    }
  }

  // ── Carga paginada ────────────────────────────────────────────

  private async loadPage(offset: number, initial: boolean): Promise<void> {
    initial ? this.isLoading.set(true) : this.isLoadingMore.set(true);

    try {
      const { data, error } = await this.svc.getComentarios(
        this.postId,
        COMENTARIO_PAGE_SIZE,
        offset,
      );

      if (error || !data) {
        console.error('[Comentarios] Error al cargar:', error);
        return;
      }

      this.comentarios.update(prev => initial ? data : [...prev, ...data]);
      this.offset = offset + data.length;
      this.hasMore.set(data.length === COMENTARIO_PAGE_SIZE);
    } finally {
      initial ? this.isLoading.set(false) : this.isLoadingMore.set(false);
      this.cdr.markForCheck();
    }
  }

  loadMore() {
    if (!this.isLoadingMore() && this.hasMore()) {
      this.loadPage(this.offset, false);
    }
  }

  // ── Publicar ──────────────────────────────────────────────────

  async submitComment() {
    if (this.disabled || this.isPublishing()) return;

    const text = this.commentText().trim();
    if (!text) return;
    if (this.isOverLimit()) {
      this.errorPublish.set(`El comentario no puede superar ${MAX_WORDS} palabras.`);
      return;
    }

    // ── Guard: reutilizar Promise si ya hay una en vuelo
    if (this._submitPromise) return this._submitPromise;

    this.errorPublish.set(null);
    this.isPublishing.set(true);

    this._submitPromise = (async () => {
      try {
        const { data, error } = await this.svc.crearComentario(this.postId, text);

        if (error || !data) {
          this.errorPublish.set('No se pudo publicar el comentario. Intenta de nuevo.');
          return;
        }

        this.comentarios.update(prev => [data, ...prev]);
        this.offset += 1;
        this.commentText.set('');

        // Notificar al autor de la publicación (solo si es diferente usuario)
        if (this.publicacion?.authorId && this.publicacion.authorId !== this.currentUserId()) {
          try {
            const comentaristaName = data.perfiles?.nombre || 'Un usuario';
            await this.notificationService.createNotificacion({
              user_id: this.publicacion.authorId,
              tipo: 'post_comentado',
              mensaje: `${comentaristaName} comentó en tu publicación.`,
              leido: false,
              post_id: this.publicacion.id  // Contexto: ID del post comentado
            });
          } catch (notifError) {
            console.error('Error enviando notificación de comentario:', notifError);
          }
        }
      } finally {
        this.isPublishing.set(false);
        this.cdr.markForCheck();
      }
    })().finally(() => {
      this._submitPromise = null;
    });

    return this._submitPromise;
  }

  // ── Eliminar ──────────────────────────────────────────────────

  openDeleteConfirm(id: string) {
    this.closeMenu();
    this.commentToDelete.set(id);
    this.confirmModalOpen.set(true);
  }

  closeDeleteConfirm() {
    this.confirmModalOpen.set(false);
    this.commentToDelete.set(null);
  }

  async confirmDeleteComment() {
    const id = this.commentToDelete();
    if (!id || this.isDeleting()) return;

    // ── Guard: reutilizar Promise si ya hay una en vuelo
    if (this._deletePromise) return this._deletePromise;

    this.isDeleting.set(true);

    this._deletePromise = (async () => {
      try {
        const { error } = await this.svc.deleteComentario(id);
        if (!error) {
          this.comentarios.update(prev => prev.filter(c => c.id !== id));
          this.offset = Math.max(0, this.offset - 1);
        } else {
          console.error('[Comentarios] Error al eliminar:', error);
        }
      } finally {
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.cdr.markForCheck();
      }
    })().finally(() => {
      this._deletePromise = null;
    });

    return this._deletePromise;
  }

  // ── Reportar comentario ───────────────────────────────────────

  openCommentReport(c: Comentario) {
    this.closeMenu();
    this.reportingComment.set(c);
    this.showReportModal.set(true);
  }

  async handleCommentReport(event: { reason: string; details: string }) {
    const comentario = this.reportingComment();
    if (!comentario) return;

    const perfil = await this.authStore.getPerfilActual();
    if (!perfil) return;

    await this.reportSvc.createReport({
      publicacion_id: this.postId,
      autor_id:       comentario.autor_id,
      informante_id:  perfil.id,
      motivo:         event.reason,
      detalles:       event.details,
      comentario_id:  comentario.id,
    });

    this.showReportModal.set(false);
    this.reportingComment.set(null);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.reportingComment.set(null);
  }

  // ── Menú ⋯ ───────────────────────────────────────────────────

  toggleMenu(id: string) {
    this.openMenuId.update(current => current === id ? null : id);
  }

  closeMenu() {
    this.openMenuId.set(null);
  }

  /** Cierra el menú al hacer clic fuera de él */
  @HostListener('document:click')
  onDocumentClick() {
    if (this.openMenuId() !== null) {
      this.closeMenu();
      this.cdr.markForCheck();
    }
  }

  // ── Input handlers ────────────────────────────────────────────

  onTextInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.commentText.set(value);
    this.errorPublish.set(null);
  }

  handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submitComment();
    }
  }

  // ── Utilidades ────────────────────────────────────────────────

  formatTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now  = Date.now();
    const diff = now - date.getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);

    if (mins < 1)  return 'Ahora';
    if (mins < 60) return `${mins} min`;
    if (hours < 24) return `${hours} h`;
    if (days < 7)   return `${days} d`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  authorName(c: Comentario): string {
    if (!c.perfiles) return 'Usuario';
    const { nombre, apellidos } = c.perfiles;
    return [nombre, apellidos].filter(Boolean).join(' ');
  }

  authorInitial(c: Comentario): string {
    return this.authorName(c).charAt(0).toUpperCase();
  }

  isOwn(c: Comentario): boolean {
    return !!this.currentUserId() && c.autor_id === this.currentUserId();
  }

  canDelete(c: Comentario): boolean {
    return this.isOwn(c) || this.isAdmin();
  }

  canReport(c: Comentario): boolean {
    return !this.isOwn(c);
  }

  reportModalAutor(): string {
    const c = this.reportingComment();
    if (!c) return '';
    return this.authorName(c);
  }
}
