import { Injectable, inject } from '@angular/core';
import { ProfileService } from '../../core/services/profile.service';
import { CatalogService } from '../../core/services/catalog.service';

/**
 * Layer 3 – Feature Service: Admin Usuarios.
 * Delega a ProfileService y CatalogService del core.
 */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly profileService = inject(ProfileService);
  private readonly catalogService = inject(CatalogService);

  getAllUsers(search?: string) { return this.profileService.getAllUsers({ searchTerm: search }); }
  getRecentUsers(limit = 5) { return this.profileService.getRecentUsers(limit); }
  updateUserRole(userId: string, roleId: string) { return this.profileService.updateUserRole(userId, roleId); }
  /** Suspender con fecha de expiración. hours = null → largo plazo (año 2099). */
  suspendUser(userId: string, hours: number | null) { return this.profileService.suspendUser(userId, hours); }
  /** Reactivar cuenta y limpiar fecha_suspension. */
  unsuspendUser(userId: string) { return this.profileService.unsuspendUser(userId); }

  getUniversidades() { return this.catalogService.getUniversidades(); }
  getRoles() { return this.catalogService.getRoles(); }
}
