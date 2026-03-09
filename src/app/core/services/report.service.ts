import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

/**
 * Layer 1 – Servicio especializado: Reportes.
 * Responsabilidad única: tabla `reportes`.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
    private readonly db = inject(SupabaseClientService).client;

    /** Obtener todos los reportes con joins (admin) */
    async getReportsList() {
        const { data, error } = await this.db
            .from('reportes')
            .select(`
        *,
        publicaciones (
          id, titulo, descripcion, imagen_url, tipo, autor_id,
          autor:perfiles(
            id, nombre, apellidos, foto_url, creado, correoInstitucional,
            carrera:carrera_id(nombre),
            universidades:universidad_id(acronimo, nombre),
            roles:rol_id(nombre)
          )
        ),
        informante:perfiles!reportado_por(
          id, nombre, apellidos, foto_url, creado, correoInstitucional,
          carrera:carrera_id(nombre),
          universidades:universidad_id(acronimo, nombre),
          roles:rol_id(nombre)
        )
      `)
            .order('creado', { ascending: false });

        if (data) {
            data.forEach((r: any) => {
                r.detalles = r.descripcion;
                r.informante_id = r.reportado_por;
                if (r.publicaciones?.autor) {
                    r.autor = r.publicaciones.autor;
                    r.autor_id = r.publicaciones.autor.id;
                }
            });
        }
        return { data, error };
    }

    /** Obtener los primeros N reportes pendientes (dashboard) */
    async getPendingReportsList(limit: number = 2) {
        const { data, error } = await this.db
            .from('reportes')
            .select('*, publicaciones(*), informante:perfiles!reportado_por(*)')
            .eq('estado', 'pendiente')
            .order('creado', { ascending: false })
            .limit(limit);

        if (error?.code === '42P01') return { data: [], error: null };

        if (data) {
            data.forEach((r: any) => {
                r.detalles = r.descripcion;
                r.informante_id = r.reportado_por;
            });
        }
        return { data: data || [], error };
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
            reportado_por: reporte.informante_id,
            motivo: reporte.motivo,
            descripcion: reporte.detalles || '',
            estado: 'pendiente',
            creado: new Date().toISOString()
        });
    }

    /** Cambiar el estado de un reporte (resuelto / rechazado) */
    async updateReportStatus(reportId: string, nuevoEstado: 'resuelto' | 'rechazado') {
        return await this.db
            .from('reportes')
            .update({ estado: nuevoEstado })
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
