import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComentarioService, Comentario } from '../../../core/services/comentario.service';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './comentarios.html',
  styleUrls: ['./comentarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comentarios implements OnInit {
  @Input() publicacionId!: string;

  private readonly comentarioSvc = inject(ComentarioService);
  private readonly authStore = inject(AuthStoreService);

  readonly comentarios = signal<Comentario[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly isSending = signal(false);
  readonly hasMore = signal(false);
  readonly errorEnvio = signal<string | null>(null);
  readonly estaAutenticado = signal(false);

  nuevoComentario = '';
  private currentPage = 0;

  async ngOnInit(): Promise<void> {
    const perfil = await this.authStore.getPerfilActual();
    this.estaAutenticado.set(!!perfil);
    await this.cargarComentarios();
  }

  private async cargarComentarios(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data, hasMore } = await this.comentarioSvc.getComentarios(this.publicacionId, 0);
      this.comentarios.set(data ?? []);
      this.hasMore.set(hasMore);
      this.currentPage = 0;
    } finally {
      this.isLoading.set(false);
    }
  }

  async cargarMas(): Promise<void> {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.isLoadingMore.set(true);
    try {
      const nextPage = this.currentPage + 1;
      const { data, hasMore } = await this.comentarioSvc.getComentarios(this.publicacionId, nextPage);
      this.comentarios.update(prev => [...prev, ...(data ?? [])]);
      this.hasMore.set(hasMore);
      this.currentPage = nextPage;
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  async enviarComentario(): Promise<void> {
    const texto = this.nuevoComentario.trim();
    if (!texto || this.isSending()) return;

    this.errorEnvio.set(null);
    this.isSending.set(true);
    try {
      const { data, error } = await this.comentarioSvc.crearComentario(this.publicacionId, texto);
      if (error) throw error;
      if (data) {
        this.comentarios.update(prev => [data, ...prev]);
        this.nuevoComentario = '';
      }
    } catch {
      this.errorEnvio.set('No se pudo enviar el comentario. Inténtalo de nuevo.');
    } finally {
      this.isSending.set(false);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarComentario();
    }
  }

  getNombreAutor(c: Comentario): string {
    if (!c.perfiles) return 'Usuario';
    return `${c.perfiles.nombre} ${c.perfiles.apellidos || ''}`.trim();
  }

  getIniciales(c: Comentario): string {
    const nombre = this.getNombreAutor(c);
    return nombre.charAt(0).toUpperCase();
  }

  formatFecha(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }
}
