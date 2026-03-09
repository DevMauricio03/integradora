import { Injectable, inject } from '@angular/core';
import { AdminStatsStoreService } from '../../core/services/admin-stats-store.service';

/**
 * Layer 3 – Feature Service: Admin Dashboard.
 * Delega todas las estadísticas al store con caching.
 */
@Injectable({ providedIn: 'root' })
export class AdmindashboardService {
  readonly store = inject(AdminStatsStoreService);

  loadStats(force = false) {
    return this.store.loadStats(force);
  }

  invalidateCache() {
    this.store.invalidateCache();
  }
}
