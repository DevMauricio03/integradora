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

  getAllUsers(search?: string) { return this.profileService.getAllUsers(search); }
  getRecentUsers(limit = 5) { return this.profileService.getRecentUsers(limit); }
  updateUserRole(userId: string, roleId: string) { return this.profileService.updateUserRole(userId, roleId); }
  updateUserStatus(userId: string, estado: string) { return this.profileService.updateUserStatus(userId, estado); }
  suspendUser(userId: string, hours: number | null) { return this.profileService.suspendUser(userId, hours); }

  getUniversidades() { return this.catalogService.getUniversidades(); }
  getRoles() { return this.catalogService.getRoles(); }
}
