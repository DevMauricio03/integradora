import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { ReportService } from './report.service';
import { SupabaseClientService } from './supabase-client.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AdminReportsStoreService {
    private readonly reportService = inject(ReportService);
    private readonly supabaseClient = inject(SupabaseClientService).client;
    private readonly destroyRef = inject(DestroyRef);

    private readonly _items = signal<any[]>([]);
    private readonly _totalCount = signal<number>(0);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _currentPage = signal<number>(0);
    private readonly _filter = signal<string>('todas');
    private readonly _searchTerm = signal<string>('');
    private readonly _pageSize = signal<number>(5);

    // ── Realtime Channel ──────────────────────────────────────────
    private _realtimeChannel: RealtimeChannel | null = null;
    private _realtimeInitialized = false;

    items = this._items.asReadonly();
    totalCount = this._totalCount.asReadonly();
    isLoading = this._isLoading.asReadonly();
    currentPage = this._currentPage.asReadonly();
    filter = this._filter.asReadonly();
    searchTerm = this._searchTerm.asReadonly();
    pageSize = this._pageSize.asReadonly();

    hasMore = computed(() => {
        const loaded = (this._currentPage() + 1) * this._pageSize();
        return loaded < this._totalCount();
    });

    constructor() {
        // Cleanup automático cuando se destruye el servicio
        this.destroyRef.onDestroy(() => {
            this._unsubscribeFromRealtime();
        });
    }

    async loadReports() {
        if (this._isLoading()) return;

        this._isLoading.set(true);
        const { data, count, error } = await this.reportService.getReportsList({
            page: this._currentPage(),
            pageSize: this._pageSize(),
            filter: this._filter(),
            searchTerm: this._searchTerm()
        });

        if (!error && data) {
            this._items.set(data);
            this._totalCount.set(count || 0);
        } else {
            console.error('[AdminReportsStore] Error:', error);
        }

        this._isLoading.set(false);
    }

    setFilter(newFilter: string) {
        if (this._filter() === newFilter) return;
        this._filter.set(newFilter);
        this._currentPage.set(0);
        this.loadReports();
    }

    setSearchTerm(term: string) {
        if (this._searchTerm() === term) return;
        this._searchTerm.set(term);
        this._currentPage.set(0);
        this.loadReports();
    }

    nextPage() {
        if (this.hasMore()) {
            this._currentPage.update(p => p + 1);
            this.loadReports();
        }
    }

    prevPage() {
        if (this._currentPage() > 0) {
            this._currentPage.update(p => p - 1);
            this.loadReports();
        }
    }

    refresh() {
        this.loadReports();
    }

    invalidate() {
        this._items.set([]);
        this._totalCount.set(0);
        this._isLoading.set(false);
        this._currentPage.set(0);
        this._filter.set('todas');
        this._searchTerm.set('');
    }

    /**
     * ✅ Inicializar Realtime para escuchar cambios en reportes
     *
     * Escucha INSERT y UPDATE en tabla "reportes"
     * Agrega/actualiza reportes al estado sin recargar
     * Se debe llamar automáticamente desde AdminLayout
     */
    public initRealtime(): void {
        console.log('[AdminReportsStore] 🔐 initRealtime() - inicializando...');

        // Si ya está activo, no reinicializar
        if (this._realtimeInitialized && this._realtimeChannel) {
            console.log('[AdminReportsStore] ℹ️ Realtime ya activo, saltando init');
            return;
        }

        // Limpiar cualquier suscripción anterior
        this._unsubscribeFromRealtime();

        // Crear nueva suscripción
        this._subscribeToRealtime();
    }

    /**
     * Suscribirse a cambios en tiempo real de la tabla reportes
     * Escucha INSERT (nuevos reportes) y UPDATE (cambios de estado)
     */
    private _subscribeToRealtime(): void {
        try {
            console.log('[AdminReportsStore] 🔌 Intentando conectar a Realtime');

            this._realtimeChannel = this.supabaseClient
                .channel('admin-reportes-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'reportes'
                    },
                    (payload) => {
                        console.log('[AdminReportsStore] 📨 EVENTO REALTIME RECIBIDO:', payload.eventType, payload.new);

                        if (payload.eventType === 'INSERT') {
                            this._handleReportInsert(payload.new);
                        } else if (payload.eventType === 'UPDATE') {
                            this._handleReportUpdate(payload.new);
                        } else if (payload.eventType === 'DELETE') {
                            this._handleReportDelete(payload.old);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('[AdminReportsStore] 🔔 Estado Realtime:', status);

                    if (status === 'SUBSCRIBED') {
                        this._realtimeInitialized = true;
                        console.log('[AdminReportsStore] ✅ CONECTADO a Realtime exitosamente');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('[AdminReportsStore] ❌ ERROR - Verifica que Realtime esté HABILITADO en Supabase');
                    } else if (status === 'TIMED_OUT') {
                        console.error('[AdminReportsStore] ⏱️ TIMEOUT en conexión');
                    }
                });
        } catch (err) {
            console.error('[AdminReportsStore] 💥 Error al suscribirse a Realtime:', err);
        }
    }

    /**
     * Handler para INSERT: agrega nuevo reporte sin duplicados
     */
    private _handleReportInsert(newReport: any): void {
        if (!newReport || !newReport.id) {
            console.log('[AdminReportsStore] ⚠️ Reporte inválido en INSERT, ignorando');
            return;
        }

        // ── DEDUPLICACIÓN ─────────────────────────────────────
        const exists = this._items().some(r => r.id === newReport.id);
        if (exists) {
            console.log('[AdminReportsStore] ⚠️ Reporte duplicado ignorado:', newReport.id);
            return;
        }

        // Mapear el reporte igual que lo hace ReportService
        const mappedReport = this._mapReportRow(newReport);

        // ¿Debe incluirse este reporte basado en filtro actual?
        if (this._shouldIncludeReport(mappedReport)) {
            console.log('[AdminReportsStore] ✨ Agregando nuevo reporte:', newReport.id);

            // Agregar al inicio de la lista
            this._items.update(prev => [mappedReport, ...prev]);

            // Incrementar total count
            this._totalCount.update(count => count + 1);
        }
    }

    /**
     * Handler para UPDATE: actualiza reporte existente
     */
    private _handleReportUpdate(updatedReport: any): void {
        if (!updatedReport || !updatedReport.id) {
            console.log('[AdminReportsStore] ⚠️ Reporte inválido en UPDATE, ignorando');
            return;
        }

        const mappedReport = this._mapReportRow(updatedReport);

        this._items.update(list => {
            const exists = list.some(r => r.id === updatedReport.id);

            if (exists) {
                // Actualizar reporte existente
                console.log('[AdminReportsStore] 🔄 Actualizando reporte:', updatedReport.id);
                return list.map(r => r.id === updatedReport.id ? mappedReport : r);
            } else {
                // Si el reporte actualizado cumple con el filtro actual y no estaba en la lista
                if (this._shouldIncludeReport(mappedReport)) {
                    console.log('[AdminReportsStore] ✨ Agregando reporte actualizado:', updatedReport.id);
                    return [mappedReport, ...list];
                }
                return list;
            }
        });
    }

    /**
     * Handler para DELETE: elimina reporte de la lista
     */
    private _handleReportDelete(deletedReport: any): void {
        if (!deletedReport || !deletedReport.id) return;

        const hadReport = this._items().some(r => r.id === deletedReport.id);

        if (hadReport) {
            console.log('[AdminReportsStore] 🗑️ Eliminando reporte:', deletedReport.id);
            this._items.update(list => list.filter(r => r.id !== deletedReport.id));
            this._totalCount.update(count => Math.max(0, count - 1));
        }
    }

    /**
     * Determinar si un reporte debe incluirse basado en filtro actual
     */
    private _shouldIncludeReport(report: any): boolean {
        const filter = this._filter();

        if (filter === 'todas') return true;
        if (filter === 'pendiente' && report.estado === 'pendiente') return true;
        if (filter === 'resuelto' && report.estado === 'resuelto') return true;
        if (filter === 'rechazado' && report.estado === 'rechazado') return true;

        return false;
    }

    /**
     * Mapear fila plana de reportes a objeto anidado (igual que ReportService)
     */
    private _mapReportRow(r: any) {
        return {
            id: r.id,
            publicacion_id: r.publicacion_id,
            comentario_id: r.comentario_id ?? null,
            tipo_reporte: r.tipo_reporte ?? 'publicacion',
            reportado_por: r.reportado_por,
            motivo: r.motivo,
            descripcion: r.descripcion,
            detalles: r.descripcion,
            estado: r.estado,
            creado: r.creado,
            resuelto_por: r.resuelto_por ?? null,
            resuelto_en: r.resuelto_en ?? null,
            resolucion: r.resolucion ?? null,
            publicaciones: r.pub_titulo ? {
                titulo: r.pub_titulo,
                descripcion: r.pub_descripcion,
                imagen_url: r.pub_imagen_url,
                tipo: r.pub_tipo,
            } : null,
            comentario: (r.tipo_reporte === 'comentario' && r.com_contenido) ? {
                id: r.comentario_id,
                contenido: r.com_contenido,
                creado: r.com_creado,
            } : null,
            autor_id: r.autor_id ?? null,
            autor: r.autor_id ? {
                id: r.autor_id,
                nombre: r.autor_nombre,
                apellidos: r.autor_apellidos,
                foto_url: r.autor_foto_url,
            } : null,
            informante_id: r.informante_id ?? null,
            informante: r.informante_id ? {
                id: r.informante_id,
                nombre: r.informante_nombre,
                apellidos: r.informante_apellidos,
                foto_url: r.informante_foto_url,
            } : null,
        };
    }

    /**
     * Desuscribirse del canal Realtime
     */
    private _unsubscribeFromRealtime(): void {
        if (this._realtimeChannel) {
            this.supabaseClient.removeChannel(this._realtimeChannel);
            this._realtimeChannel = null;
            this._realtimeInitialized = false;
            console.log('[AdminReportsStore] Desuscrito de Realtime');
        }
    }

    /**
     * Limpiar Realtime completamente (para logout)
     */
    public destroyRealtime(): void {
        this._unsubscribeFromRealtime();
    }
}
