import { Injectable, inject } from '@angular/core';
import { ReportService } from '../../core/services/report.service';

/**
 * Layer 3 – Feature Service: Admin Reportes.
 * Delega a ReportService del core.
 */
@Injectable({ providedIn: 'root' })
export class AdminReportService {
  private readonly reportService = inject(ReportService);

  getReportsList() { return this.reportService.getReportsList(); }
  getPendingReportsList(limit = 2) { return this.reportService.getPendingReportsList(limit); }
  createReport(r: Parameters<ReportService['createReport']>[0]) { return this.reportService.createReport(r); }
  updateReportStatus(id: string, estado: 'resuelto' | 'rechazado') {
    return this.reportService.updateReportStatus(id, estado);
  }
  /** Hard-delete. Solo para casos extremos (contenido ilegal comprobado). */
  deleteReport(id: string) { return this.reportService.deleteReport(id); }

  // ── Acción de moderación transaccional (RPC) ────────────────────

  /**
   * Ejecuta una acción de moderación en una sola transacción.
   * La RPC valida admin + estado pendiente antes de operar.
   */
  moderarReporte(
    reportId: string,
    accion: 'eliminar_publicacion' | 'suspender_usuario' | 'descartar',
    horas?: number | null,
  ) {
    return this.reportService.moderarReporte(reportId, accion, horas);
  }
}
