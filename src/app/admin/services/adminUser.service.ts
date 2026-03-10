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

  /**
   * Suspend a user via secure server-side RPC.
   * All validation (admin role, self-suspension guard) happens in the DB function.
   *
   * @param duration '1_day' | '7_days' | '30_days' | 'permanent'
   */
  suspendUserRpc(userId: string, duration: '1_day' | '7_days' | '30_days' | 'permanent') {
    return this.profileService.suspendUserRpc(userId, duration);
  }

  /**
   * Reactivate a user via secure server-side RPC.
   * All validation (admin role) happens in the DB function.
   */
  unsuspendUserRpc(userId: string) {
    return this.profileService.unsuspendUserRpc(userId);
  }

  getUniversidades() { return this.catalogService.getUniversidades(); }
  getRoles() { return this.catalogService.getRoles(); }
}
