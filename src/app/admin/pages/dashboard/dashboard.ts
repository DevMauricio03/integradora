import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
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

  // Chart raw data (from store)
  readonly chartDataPoints = this.statsStore.chartDataPoints;
  readonly chartLabels = this.statsStore.chartLabels;

  // Chart UI state
  readonly hoveredPoint = signal<number | null>(null);
  readonly tooltipData = signal<{ date: string; count: number; change: number | null } | null>(null);
  readonly tooltipPosition = signal({ x: 0, y: 0 });

  // ── VISUAL CALCULATIONS (computed from raw data) ──

  // Y-axis scale (dynamic based on max value)
  readonly yAxisScale = computed(() => {
    const data = this.chartDataPoints();
    const max = Math.max(...data, 1);
    const step = Math.ceil(max / 4);
    return [0, step, step * 2, step * 3, step * 4];
  });

  // SVG coordinates for each data point
  readonly chartPoints = computed(() => {
    const data = this.chartDataPoints();
    const maxVal = Math.max(...data, 1);
    const minY = 20;
    const maxY = 135;
    const width = 500;
    const stepX = width / 4;

    return data.map((count, i) => ({
      x: i * stepX,
      y: maxY - ((count / maxVal) * (maxY - minY)),
      count: count
    }));
  });

  // Hover points (with date + change calculation)
  readonly hoverPoints = computed(() => {
    const points = this.chartPoints();
    const labels = this.chartLabels();
    const data = this.chartDataPoints();

    return points.map((point, i) => ({
      ...point,
      date: labels[i] || '',
      change: i > 0 ? this._calculateChange(data[i - 1], data[i]) : null
    }));
  });

  // SVG path for line
  readonly chartPathLine = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return 'M0,135 L500,135';

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      path += ` C${cp},${points[i - 1].y} ${cp},${points[i].y} ${points[i].x},${points[i].y}`;
    }
    return path;
  });

  // SVG path for fill
  readonly chartPathFill = computed(() => {
    const line = this.chartPathLine();
    return `${line} L500,150 L0,150 Z`;
  });

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

  // ── Tooltip methods ──

  showTooltip(point: { date: string; count: number; change: number | null }, index: number) {
    this.hoveredPoint.set(index);
    this.tooltipData.set(point);
    const chartPoints = this.chartPoints();
    this.tooltipPosition.set({
      x: chartPoints[index].x + 10,
      y: chartPoints[index].y - 60
    });
  }

  hideTooltip() {
    this.hoveredPoint.set(null);
    this.tooltipData.set(null);
  }

  // ── KPI Trend Helpers (reusable) ──

  getTrendLabel(trend: number | null): string {
    if (trend === null) return 'Nuevo';
    if (trend === 0) return '0%';
    return `${trend > 0 ? '+' : ''}${trend}%`;
  }

  getTrendClass(trend: number | null): 'positive' | 'negative' | 'neutral' {
    if (trend === null || trend === 0) return 'neutral';
    return trend > 0 ? 'positive' : 'negative';
  }

  // ── Helper methods ──

  private _calculateChange(prev: number, current: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  }
}
