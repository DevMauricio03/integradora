import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalNuevoAviso } from '../../components/modal-nuevo-aviso/modal-nuevo-aviso';
import { RouterModule } from '@angular/router';
import { AdminStatsStoreService } from '../../../core/services/admin-stats-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatusBadge, CommonModule, IconComponent, ModalNuevoAviso, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  // Layer 2: AdminStatsStore (todas las queries en paralelo + caching 5 min)
  private readonly statsStore = inject(AdminStatsStoreService);

  isAvisoModalOpen = signal(false);
  showSuccessToast = signal(false);
  toastMessage = signal('');

  // Exponer signals del store directamente a la vista
  readonly totalUsers = this.statsStore.totalUsers;
  readonly usersTrend = this.statsStore.usersTrend;
  readonly activePosts = this.statsStore.activePosts;
  readonly postsTrend = this.statsStore.postsTrend;
  readonly pendingReports = this.statsStore.pendingReports;
  readonly reportsTrend = this.statsStore.reportsTrend;
  readonly recentUsers = this.statsStore.recentUsers;
  readonly quickModeration = this.statsStore.quickModeration;
  readonly chartPathLine = this.statsStore.chartPathLine;
  readonly chartPathFill = this.statsStore.chartPathFill;
  readonly chartLabels = this.statsStore.chartLabels;

  ngOnInit() {
    // Una sola llamada que internamente paralela 9 queries
    this.statsStore.loadStats();
  }

  handleAvisoGuardado() {
    this.isAvisoModalOpen.set(false);
    // Invalidar caché para reflejar el nuevo aviso
    this.statsStore.invalidateCache();
    this.showToast('¡Aviso oficial publicado correctamente!');
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    this.showSuccessToast.set(true);
    setTimeout(() => this.showSuccessToast.set(false), 3000);
  }
}
