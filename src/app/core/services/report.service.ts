import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

/**
 * Layer 1 – Servicio especializado: Reportes.
 * Lee desde la vista `admin_reports` (que resuelve todos los joins en SQL)
 * y escribe directamente en la tabla `reportes`.
 *
 * Cada método privado tiene una sola responsabilidad (principio de atomicidad).
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
    private readonly db = inject(SupabaseClientService).client;

    // ── Lectura (admin) ──────────────────────────────────────────

    /** Obtener reportes paginados con filtros (admin panel) */
    async getReportsList(params?: { page?: number; pageSize?: number; filter?: string; searchTerm?: string }) {
        let query = this.buildBaseQuery();

        query = this.applyEstadoFilter(query, params?.filter);
        query = this.applySearchFilter(query, params?.searchTerm);
        query = query.order('creado', { ascending: false });
        query = this.applyPagination(query, params?.page, params?.pageSize);

        return await this.executeQuery(query);
    }

    /**
     * 1. Construye la query base desde la vista `admin_reports`.
     * La vista ya resuelve todos los LEFT JOINs en PostgreSQL,
     * eliminando la dependencia de los joins de PostgREST que
     * causaban el retorno vacío por RLS en las tablas unidas.
     */
    private buildBaseQuery() {
        console.log('[ReportService] buildBaseQuery() → admin_reports');
        return this.db
            .from('admin_reports')
            .select('*', { count: 'exact' });
    }

    /**
     * 2. Aplica filtro de estado (pendiente / resuelto / todas).
     * Opera sobre la columna `estado` que viene directamente de la vista.
     */
    private applyEstadoFilter(query: any, filter?: string) {
        if (!filter || filter.toLowerCase() === 'todas') {
            console.log('[ReportService] applyEstadoFilter() → sin filtro (todas)');
            return query;
        }

        // Normalizar: aceptar plural o singular
        const normalized = filter.toLowerCase().replace(/s$/, '');
        console.log('[ReportService] applyEstadoFilter() → estado =', normalized);
        return query.eq('estado', normalized);
    }

    /**
     * 3. Aplica búsqueda de texto libre sobre motivo y descripción.
     * Ambas columnas están disponibles directamente en la vista.
     */
    private applySearchFilter(query: any, searchTerm?: string) {
        if (!searchTerm?.trim()) return query;
        console.log('[ReportService] applySearchFilter() → término:', searchTerm);
        return query.or(`motivo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
    }

    /**
     * 4. Aplica paginación con rango (from / to).
     * pageSize = 5 por defecto (configurado en el store).
     */
    private applyPagination(query: any, page?: number, pageSize?: number) {
        if (page === undefined || pageSize === undefined) return query;

        const from = page * pageSize;
        const to = from + pageSize - 1;
        console.log(`[ReportService] applyPagination() → rango: ${from}-${to}`);
        return query.range(from, to);
    }

    /**
     * 5. Ejecuta la query y mapea las columnas planas de la vista
     * al modelo anidado que espera la UI (publicaciones, autor, informante).
     *
     * La vista devuelve columnas como `pub_titulo`, `autor_nombre`, etc.
     * Este método las convierte en los objetos anidados que usa el template.
     */
    private async executeQuery(query: any) {
        const { data, count, error } = await query;

        console.log('[ReportService] executeQuery() → raw data:', data);
        console.log('[ReportService] executeQuery() → count:', count);
        if (error) console.error('[ReportService] executeQuery() → error:', error);

        if (!data) return { data: [], count: 0, error };

        const mapped = data.map((r: any) => this.mapViewRow(r));
        return { data: mapped, count: count || 0, error };
    }

    /**
     * Transforma una fila plana de `admin_reports` en el objeto anidado
     * que usan el template y los modales.
     */
    private mapViewRow(r: any) {
        return {
            // Campos del reporte
            id:             r.id,
            publicacion_id: r.publicacion_id,
            reportado_por:  r.reportado_por,
            motivo:         r.motivo,
            descripcion:    r.descripcion,
            detalles:       r.descripcion,      // alias para modales
            estado:         r.estado,
            creado:         r.creado,

            // Objeto publicaciones (compatible con template)
            publicaciones: r.pub_titulo ? {
                titulo:       r.pub_titulo,
                descripcion:  r.pub_descripcion,
                imagen_url:   r.pub_imagen_url,
                tipo:         r.pub_tipo,
            } : null,

            // Datos del autor (compatible con template y modal)
            autor_id: r.autor_id ?? null,
            autor: r.autor_id ? {
                id:          r.autor_id,
                nombre:      r.autor_nombre,
                apellidos:   r.autor_apellidos,
                foto_url:    r.autor_foto_url,
                correoInstitucional: r.autor_correo,
                creado:      r.autor_creado,
                carrera:     r.autor_carrera     ? { nombre: r.autor_carrera }                    : null,
                universidades: r.autor_universidad ? { acronimo: r.autor_universidad_acronimo, nombre: r.autor_universidad } : null,
                roles:       r.autor_rol         ? { nombre: r.autor_rol }                        : null,
            } : null,

            // Datos del informante (compatible con template y modal)
            informante_id: r.informante_id ?? null,
            informante: r.informante_id ? {
                id:          r.informante_id,
                nombre:      r.informante_nombre,
                apellidos:   r.informante_apellidos,
                foto_url:    r.informante_foto_url,
                correoInstitucional: r.informante_correo,
                creado:      r.informante_creado,
                carrera:     r.informante_carrera     ? { nombre: r.informante_carrera }                          : null,
                universidades: r.informante_universidad ? { acronimo: r.informante_universidad_acronimo, nombre: r.informante_universidad } : null,
                roles:       r.informante_rol         ? { nombre: r.informante_rol }                              : null,
            } : null,
        };
    }

    // ── Lectura (dashboard) ──────────────────────────────────────

    /** Obtener los primeros N reportes pendientes (dashboard) */
    async getPendingReportsList(limit: number = 2) {
        const { data, error } = await this.db
            .from('admin_reports')
            .select('*')
            .eq('estado', 'pendiente')
            .order('creado', { ascending: false })
            .limit(limit);

        if (error?.code === '42P01') return { data: [], error: null };

        const mapped = (data || []).map((r: any) => this.mapViewRow(r));
        return { data: mapped, error };
    }

    /** Contar reportes pendientes (dashboard) */
    async getPendingReportsCount() {
        const { count, error } = await this.db
            .from('reportes')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'pendiente');

        if (error?.code === '42P01') return { count: 0, error: null };
        return { count: count || 0, error };
    }

    // ── Escritura ────────────────────────────────────────────────

    /** Crear un nuevo reporte de publicación */
    async createReport(reporte: {
        publicacion_id: string;
        autor_id: string;
        informante_id: string;
        motivo: string;
        detalles?: string;
    }) {
        return await this.db.from('reportes').insert({
            publicacion_id: reporte.publicacion_id,
            reportado_por:  reporte.informante_id,
            motivo:         reporte.motivo,
            descripcion:    reporte.detalles || '',
            estado:         'pendiente',
            creado:         new Date().toISOString()
        });
    }

    /** Cambiar el estado de un reporte (resuelto / rechazado) */
    async updateReportStatus(reportId: string, nuevoEstado: 'resuelto' | 'rechazado') {
        return await this.db
            .from('reportes')
            .update({ estado: nuevoEstado })
            .eq('id', reportId);
    }

    /**
     * Descarta un reporte marcándolo como 'descartado'.
     * El registro permanece en la BD para historial de moderación.
     * NO elimina el reporte. NO elimina la publicación.
     */
    async discardReport(reportId: string) {
        return await this.db
            .from('reportes')
            .update({ estado: 'descartado' })
            .eq('id', reportId);
    }

    /** Eliminar un reporte definitivamente */
    async deleteReport(reportId: string) {
        return await this.db
            .from('reportes')
            .delete()
            .eq('id', reportId)
            .select();
    }
}
