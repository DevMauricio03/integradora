import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Carrera } from '../../../core/models/supabase.models';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, CommonModule, IconComponent, PostSkeletonComponent, ReportModalComponent, SuccessModal],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed implements OnInit {
  private readonly postStore = inject(PostStoreService);
  private readonly supabase = inject(SupabaseService);

  posts = this.postStore.posts;
  isLoading = this.postStore.isLoading;

  carreras = signal<Carrera[]>([]);

  // Filtros
  selectedTipo = signal<string>('todas');
  selectedFecha = signal<string>('todas');
  selectedCarrera = signal<string>('todas');

  // Modal de reporte
  showReportModal = signal<boolean>(false);
  showSuccessReport = signal<boolean>(false);
  selectedPostForReport = signal<any>(null);
  isReporting = signal<boolean>(false);

  // Posts filtrados computados a partir de los signals
  filteredPosts = computed(() => {
    let currentPosts = this.posts().filter(p => p.status === 'activo');

    // 1. Filtro por Tipo
    const tipo = this.selectedTipo();
    if (tipo !== 'todas') {
      if (tipo === 'avisos') {
        currentPosts = currentPosts.filter((p: Post) => p.type.toLowerCase() === 'aviso' || p.type.toLowerCase() === 'aviso oficial');
      } else if (tipo === 'eventos') {
        currentPosts = currentPosts.filter((p: Post) => p.type === 'evento');
      } else if (tipo === 'servicios') {
        currentPosts = currentPosts.filter((p: Post) => p.type === 'oferta' && p.details?.subtype === 'servicio');
      } else if (tipo === 'productos') {
        currentPosts = currentPosts.filter((p: Post) => p.type === 'oferta' && p.details?.subtype === 'producto');
      } else {
        currentPosts = currentPosts.filter((p: Post) => p.type === tipo);
      }
    }

    // 2. Filtro por Fecha
    const fecha = this.selectedFecha();
    if (fecha !== 'todas') {
      const today = new Date();
      currentPosts = currentPosts.filter((p: Post) => {
        const pDate = new Date(p.rawDate);
        if (fecha === 'este dia') {
          return pDate.toDateString() === today.toDateString();
        } else if (fecha === 'esta semana') {
          const diffDays = Math.floor((Date.now() - pDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        } else if (fecha === 'este mes') {
          return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
        } else if (fecha === 'este ano') {
          return pDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    // 3. Filtro por Carrera (Los Avisos Oficiales se muestran siempre)
    const carrera = this.selectedCarrera();
    if (carrera !== 'todas') {
      currentPosts = currentPosts.filter((p: Post) => p.authorCarreraId === carrera || p.type === 'Aviso Oficial');
    }

    return currentPosts;
  });

  ngOnInit() {
    this.initialLoad();
  }

  private async initialLoad() {
    this.postStore.loadPosts();

    const { data } = await this.supabase.getCarreras();
    if (data) {
      this.carreras.set(data);
    }
  }

  onTipoChange(event: Event) {
    this.selectedTipo.set((event.target as HTMLSelectElement).value);
  }

  onFechaChange(event: Event) {
    this.selectedFecha.set((event.target as HTMLSelectElement).value);
  }

  onCarreraChange(event: Event) {
    this.selectedCarrera.set((event.target as HTMLSelectElement).value);
  }

  // 🔹 Lógica de Reporte
  openReportModal(post: any) {
    this.selectedPostForReport.set(post);
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.selectedPostForReport.set(null);
  }

  async handleReport(event: { reason: string, details: string }) {
    if (this.isReporting()) return;
    this.isReporting.set(true);

    try {
      const perfilActual = await this.supabase.getPerfilActual();
      if (!perfilActual) {
        alert('Debes iniciar sesión para reportar.');
        return;
      }

      const post = this.selectedPostForReport();
      const { error } = await this.supabase.createReport({
        publicacion_id: post.id,
        autor_id: post.authorId || post.autor_id, // Depende de cómo venga del store
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
