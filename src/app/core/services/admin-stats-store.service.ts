import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { ProfileService } from './profile.service';
import { PublicationService } from './publication.service';
import { ReportService } from './report.service';
import { CatalogService } from './catalog.service';

const STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Layer 2 – Store: Estadísticas del dashboard de administración.
 *
 * Estrategia de queries (dos modos):
 *
 *  Modo A – RPC (preferido):
 *    Una sola llamada a `get_dashboard_stats()` que devuelve todo.
 *    Requiere que la función SQL esté creada en Supabase
 *    (ver supabase/migrations/get_dashboard_stats.sql).
 *
 *  Modo B – Fallback (Promise.all):
 *    Si la RPC no existe o falla, se ejecutan las 9 queries en paralelo.
 *    Compatible con cualquier estado de la BD.
 *
 * Ambos modos incluyen:
 *   - Loading guard: no recarga si ya hay petición en vuelo.
 *   - Cache TTL de 5 minutos.
 */
@Injectable({ providedIn: 'root' })
export class AdminStatsStoreService {
    private readonly db = inject(SupabaseClientService).client;
    private readonly profileService = inject(ProfileService);
    private readonly pubService = inject(PublicationService);
    private readonly reportService = inject(ReportService);
    private readonly catalogService = inject(CatalogService);

    // ── Signals del estado ────────────────────────────────────────
    readonly isLoading = signal<boolean>(false);
    readonly totalUsers = signal<number>(0);
    readonly usersTrend = signal<number>(0);
    readonly activePosts = signal<number>(0);
    readonly postsTrend = signal<number>(0);
    readonly pendingReports = signal<number>(0);
    readonly reportsTrend = signal<number>(0);
    readonly recentUsers = signal<any[]>([]);
    readonly quickModeration = signal<any[]>([]);
    readonly chartPathLine = signal<string>('M0,135 L125,135 L250,135 L375,135 L500,135');
    readonly chartPathFill = signal<string>('M0,135 L125,135 L250,135 L375,135 L500,135 L500,150 L0,150 Z');
    readonly chartLabels = signal<string[]>(['', '', '', '', '']);

    // ── Control de caché ──────────────────────────────────────────
    private _lastFetch: number | null = null;
    private _loadingPromise: Promise<void> | null = null;

    /**
     * Cargar estadísticas del dashboard.
     * Intenta primero la RPC; si falla vuelve al modo paralelo.
     */
    async loadStats(force = false): Promise<void> {
        if (this.isLoading()) return;
        if (!force && this._lastFetch && Date.now() - this._lastFetch < STATS_CACHE_TTL_MS) return;
        if (this._loadingPromise) return this._loadingPromise;

        this.isLoading.set(true);

        this._loadingPromise = this._loadViaRpc()
            .catch(() => {
                console.warn('[AdminStatsStore] RPC no disponible, usando fallback Promise.all');
                return this._loadViaParallelQueries();
            })
            .finally(() => {
                this._lastFetch = Date.now();
                this.isLoading.set(false);
                this._loadingPromise = null;
            });

        return this._loadingPromise;
    }

    /** Forzar recarga (ej. tras crear/eliminar un aviso) */
    invalidateCache() {
        this._lastFetch = null;
    }

    // ── Modo A: RPC ───────────────────────────────────────────────

    private async _loadViaRpc(): Promise<void> {
        const { data, error } = await this.db.rpc('get_dashboard_stats', { p_days: 30 });

        if (error) throw error; // → activará el fallback

        const d = data as any;

        this.totalUsers.set(Number(d.users_total ?? 0));
        this.usersTrend.set(Number(d.users_trend ?? 0));
        this.activePosts.set(Number(d.posts_total ?? 0));
        this.postsTrend.set(Number(d.posts_trend ?? 0));
        this.pendingReports.set(Number(d.reports_pending ?? 0));
        this.reportsTrend.set(Number(d.reports_trend ?? 0));

        // Recent users: la RPC devuelve el array directamente
        const recentRaw: any[] = Array.isArray(d.recent_users) ? d.recent_users : [];
        this.recentUsers.set(recentRaw.map((u: any) => ({
            nombre: u.nombre,
            apellidos: u.apellidos,
            correoInstitucional: u.correoInstitucional,
            foto_url: u.foto_url,
            creado: u.creado,
            roles: { nombre: u.rol_nombre },
            universidades: { acronimo: u.universidad_acronimo }
        })));

        // Quick moderation
        const quickRaw: any[] = Array.isArray(d.quick_mod) ? d.quick_mod : [];
        const quickMapped = quickRaw.map((r: any) => ({
            ...r,
            detalles: r.descripcion,
            informante_id: r.reportado_por
        }));
        this.quickModeration.set(quickMapped);

        // Chart data
        const chartRaw: { creado: string }[] = Array.isArray(d.chart_data) ? d.chart_data : [];
        this._buildChart(chartRaw);
    }

    // ── Modo B: Fallback – 9 queries en paralelo ──────────────────

    private async _loadViaParallelQueries(): Promise<void> {
        const [
            usersCount, usersTrend,
            postsCount, postsTrend,
            reportsCount, reportsTrend,
            recentUsers, quickMod, chartData
        ] = await Promise.all([
            this.catalogService.getUsersCount(),
            this.catalogService.getTableTrend('perfiles'),
            this.pubService.getActivePostsCount(),
            this.catalogService.getTableTrend('publicaciones'),
            this.reportService.getPendingReportsCount(),
            this.catalogService.getTableTrend('reportes'),
            this.profileService.getRecentUsers(5),
            this.reportService.getPendingReportsList(2),
            this.pubService.getPostsForChart(30),
        ]);

        this.totalUsers.set(usersCount.count);
        this.usersTrend.set(usersTrend);
        this.activePosts.set(postsCount.count);
        this.postsTrend.set(postsTrend);
        this.pendingReports.set(reportsCount.count);
        this.reportsTrend.set(reportsTrend);
        if (recentUsers.data) this.recentUsers.set(recentUsers.data);
        this.quickModeration.set(quickMod.data ?? []);
        this._buildChart(chartData.data ?? []);
    }

    // ── Chart builder ──────────────────────────────────────────────

    private _buildChart(data: { creado: string }[]) {
        const pointsData = [0, 0, 0, 0, 0];
        const now = new Date();
        const rangeMs = 30 * 86400000;

        data.forEach(item => {
            const diffMs = now.getTime() - new Date(item.creado).getTime();
            const index = 4 - Math.floor((diffMs / rangeMs) * 5);
            if (index >= 0 && index <= 4) pointsData[index]++;
        });

        const maxPoints = Math.max(...pointsData, 1);
        const minY = 20, maxY = 135, stepX = 500 / 4;
        const offsets = [0, stepX, stepX * 2, stepX * 3, 500];
        const pointYs = pointsData.map(v => maxY - ((v / maxPoints) * (maxY - minY)));

        let dLine = `M0,${pointYs[0]}`;
        for (let i = 1; i < 5; i++) {
            const cp = offsets[i - 1] + (offsets[i] - offsets[i - 1]) / 2;
            dLine += ` C${cp},${pointYs[i - 1]} ${cp},${pointYs[i]} ${offsets[i]},${pointYs[i]}`;
        }
        this.chartPathLine.set(dLine);
        this.chartPathFill.set(`${dLine} L500,150 L0,150 Z`);

        const labels = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i * 6);
            labels.push(d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }));
        }
        this.chartLabels.set(labels);
    }
}
