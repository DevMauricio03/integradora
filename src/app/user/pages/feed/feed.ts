import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { PostStoreService } from '../../../core/services/post-store.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, CommonModule, IconComponent, PostSkeletonComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed implements OnInit {
  private postStore = inject(PostStoreService);
  private supabase = inject(SupabaseService);

  posts = this.postStore.posts;
  isLoading = this.postStore.isLoading;

  carreras = signal<any[]>([]);

  // Filtros
  selectedTipo = signal<string>('todas');
  selectedFecha = signal<string>('todas');
  selectedCarrera = signal<string>('todas');

  // Posts filtrados computados a partir de los signals
  filteredPosts = computed(() => {
    let currentPosts = this.posts();

    // 1. Filtro por Tipo
    const tipo = this.selectedTipo();
    if (tipo !== 'todas') {
      if (tipo === 'avisos') {
        currentPosts = currentPosts.filter(p => p.type === 'aviso');
      } else if (tipo === 'eventos') {
        currentPosts = currentPosts.filter(p => p.type === 'evento');
      } else if (tipo === 'servicios') {
        currentPosts = currentPosts.filter(p => p.type === 'oferta' && p.details?.subtype === 'servicio');
      } else if (tipo === 'productos') {
        currentPosts = currentPosts.filter(p => p.type === 'oferta' && p.details?.subtype === 'producto');
      } else {
        currentPosts = currentPosts.filter(p => p.type === tipo);
      }
    }

    // 2. Filtro por Fecha
    const fecha = this.selectedFecha();
    if (fecha !== 'todas') {
      const today = new Date();
      currentPosts = currentPosts.filter(p => {
        const pDate = new Date(p.rawDate);
        if (fecha === 'este dia') {
          return pDate.toDateString() === today.toDateString();
        } else if (fecha === 'esta semana') {
          const diffDays = Math.floor((today.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        } else if (fecha === 'este mes') {
          return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
        } else if (fecha === 'este ano') {
          return pDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    // 3. Filtro por Carrera
    const carrera = this.selectedCarrera();
    if (carrera !== 'todas') {
      currentPosts = currentPosts.filter(p => p.authorCarreraId === carrera);
    }

    return currentPosts;
  });

  async ngOnInit() {
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
}
