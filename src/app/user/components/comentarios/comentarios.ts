import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { AuthService } from '../../../core/services/auth.service';

const MAX_LENGTH = 1000;

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comentarios.html',
  styleUrls: ['./comentarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comentarios implements OnInit {
  /** Cuando disabled=true el input está bloqueado (uso en preview) */
  @Input() disabled = false;
  /** ID del post — requerido para cargar y publicar comentarios */
  @Input() postId = '';

  private readonly svc  = inject(ComentarioService);
  private readonly auth = inject(AuthService);
  private readonly cdr  = inject(ChangeDetectorRef);

  readonly MAX_LENGTH = MAX_LENGTH;

  // ── Estado ────────────────────────────────────────────────────
  readonly comentarios   = signal<Comentario[]>([]);
  readonly isLoading     = signal(false);
  readonly isLoadingMore = signal(false);
  readonly isPublishing  = signal(false);
  readonly hasMore       = signal(false);
  readonly commentText   = signal('');
  readonly errorPublish  = signal<string | null>(null);
  readonly currentUserId = signal<string | null>(null);
  readonly deletingIds   = signal<Set<string>>(new Set());

  /** Cuántos comentarios ya fueron cargados (base del próximo offset). */
  private offset = 0;

  readonly charsLeft = computed(() => MAX_LENGTH - this.commentText().length);

  // ── Ciclo de vida ─────────────────────────────────────────────
  async ngOnInit() {
    const user = await this.auth.getCachedUser();
    this.currentUserId.set(user?.id ?? null);

    if (!this.disabled && this.postId) {
      this.loadPage(0, /* initial */ true);
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

      this.comentarios.update(prev =>
        initial ? data : [...prev, ...data],
      );

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
    if (this.disabled) return;

    const text = this.commentText().trim();
    if (!text) return;
    if (text.length > MAX_LENGTH) return;

    this.errorPublish.set(null);
    this.isPublishing.set(true);

    try {
      const { data, error } = await this.svc.crearComentario(this.postId, text);

      if (error || !data) {
        this.errorPublish.set('No se pudo publicar el comentario. Intenta de nuevo.');
        return;
      }

      // Inserción optimista: el nuevo comentario va al inicio (más reciente)
      this.comentarios.update(prev => [data, ...prev]);
      this.offset += 1;
      this.commentText.set('');
    } finally {
      this.isPublishing.set(false);
      this.cdr.markForCheck();
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────

  async deleteComment(comentarioId: string) {
    this.deletingIds.update(ids => new Set([...ids, comentarioId]));

    try {
      const { error } = await this.svc.deleteComentario(comentarioId);

      if (error) {
        console.error('[Comentarios] Error al eliminar:', error);
        return;
      }

      // Eliminación optimista
      this.comentarios.update(prev => prev.filter(c => c.id !== comentarioId));
      if (this.offset > 0) this.offset -= 1;
    } finally {
      this.deletingIds.update(ids => {
        const next = new Set(ids);
        next.delete(comentarioId);
        return next;
      });
      this.cdr.markForCheck();
    }
  }

  isOwnComment(c: Comentario): boolean {
    return !!this.currentUserId() && c.autor_id === this.currentUserId();
  }

  isDeletingComment(id: string): boolean {
    return this.deletingIds().has(id);
  }

  // ── Input handlers ────────────────────────────────────────────

  onTextInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    // Cortar en límite sin necesidad de un validator externo
    this.commentText.set(value.slice(0, MAX_LENGTH));
    this.errorPublish.set(null);
  }

  handleKey(event: KeyboardEvent) {
    // Ctrl+Enter (o Cmd+Enter en Mac) publica el comentario
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
}

