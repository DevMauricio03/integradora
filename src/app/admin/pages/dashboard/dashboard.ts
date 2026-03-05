import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatusBadge, CommonModule, IconComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class Dashboard implements OnInit {
  private supabase = inject(SupabaseService);

  totalUsers = signal<number>(0);
  usersTrend = signal<number>(0);

  activePosts = signal<number>(0);
  postsTrend = signal<number>(0);

  pendingReports = signal<number>(0);
  reportsTrend = signal<number>(0);

  recentUsers = signal<any[]>([]);
  quickModeration = signal<any[]>([]);

  // Para la gráfica
  chartPathLine = signal<string>('M0,135 L125,135 L250,135 L375,135 L500,135');
  chartPathFill = signal<string>('M0,135 L125,135 L250,135 L375,135 L500,135 L500,150 L0,150 Z');
  chartLabels = signal<string[]>(['', '', '', '', '']);

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    const usersRes = await this.supabase.getUsersCount();
    this.totalUsers.set(usersRes.count);
    this.usersTrend.set(await this.supabase.getTableTrend('perfiles'));

    const postsRes = await this.supabase.getActivePostsCount();
    this.activePosts.set(postsRes.count);
    this.postsTrend.set(await this.supabase.getTableTrend('publicaciones'));

    const reportsRes = await this.supabase.getPendingReportsCount();
    this.pendingReports.set(reportsRes.count);
    this.reportsTrend.set(await this.supabase.getTableTrend('reportes'));

    const recentRes = await this.supabase.getRecentUsers(5);
    if (recentRes.data) this.recentUsers.set(recentRes.data);

    const modRes = await this.supabase.getPendingReportsList(2);
    this.quickModeration.set(modRes.data);

    await this.buildChart();
  }

  async buildChart() {
    const { data } = await this.supabase.getPostsForChart(30);

    // Dividimos los 30 días en 5 slots
    const pointsData = [0, 0, 0, 0, 0];
    const now = new Date();
    const rangeInMs = 30 * 24 * 60 * 60 * 1000;

    if (data && data.length > 0) {
      data.forEach(item => {
        const pDate = new Date(item.creado).getTime();
        const diffMs = now.getTime() - pDate;
        const index = 4 - Math.floor((diffMs / rangeInMs) * 5);
        if (index >= 0 && index <= 4) pointsData[index]++;
      });
    }

    const maxPoints = Math.max(...pointsData, 1);
    const minY = 20; // Top bounding box visual
    const maxY = 135; // Bottom visual

    const stepX = 500 / 4;
    const curveOffsets = [0, stepX, stepX * 2, stepX * 3, 500];

    const pointYs = pointsData.map(val => maxY - ((val / maxPoints) * (maxY - minY)));

    let dLine = `M0,${pointYs[0]}`;
    for (let i = 1; i < 5; i++) {
      const prevX = curveOffsets[i - 1];
      const prevY = pointYs[i - 1];
      const currX = curveOffsets[i];
      const currY = pointYs[i];

      const cp1x = prevX + (currX - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (currX - prevX) / 2;
      const cp2y = currY;

      dLine += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
    }

    this.chartPathLine.set(dLine);
    this.chartPathFill.set(`${dLine} L500,150 L0,150 Z`);

    // Etiquetas
    const labels = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 6));
      labels.push(d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }));
    }
    this.chartLabels.set(labels);
  }
}
