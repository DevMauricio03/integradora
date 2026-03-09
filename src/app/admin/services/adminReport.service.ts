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
  deleteReport(id: string) { return this.reportService.deleteReport(id); }
}
