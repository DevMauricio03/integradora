import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { PublicationService } from './publication.service';
import { AnuncioService } from './anuncio.service';
import { ReportService } from './report.service';
import { CatalogService } from './catalog.service';
import { StorageService } from './storage.service';
import { AuthStoreService } from './auth-store.service';
import { NotificationStoreService } from './notification-store.service';
import { PostStoreService } from './post-store.service';
import { AdminStatsStoreService } from './admin-stats-store.service';
import { AdminUsersStoreService } from './admin-users-store.service';
import { AdminReportsStoreService } from './admin-reports-store.service';
import { AdminPublicationsStoreService } from './admin-publications-store.service';


@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // Conservamos la propiedad `client` para compatibilidad con adminPublication.service.ts
  private readonly _clientService = inject(SupabaseClientService);
  get client(): SupabaseClient { return this._clientService.client; }

  private readonly authSvc = inject(AuthService);
  private readonly authStoreSvc = inject(AuthStoreService);
  private readonly profileSvc = inject(ProfileService);
  private readonly pubSvc = inject(PublicationService);
  private readonly anuncioSvc = inject(AnuncioService);
  private readonly reportSvc = inject(ReportService);
  private readonly catalogSvc = inject(CatalogService);
  private readonly storageSvc = inject(StorageService);
  private readonly notificationStoreSvc = inject(NotificationStoreService);
  private readonly postStoreSvc = inject(PostStoreService);
  private readonly adminStatsStoreSvc = inject(AdminStatsStoreService);
  private readonly adminUsersStoreSvc = inject(AdminUsersStoreService);
  private readonly adminReportsStoreSvc = inject(AdminReportsStoreService);
  private readonly adminPublicationsStoreSvc = inject(AdminPublicationsStoreService);

  // ── Auth ──────────────────────────────────────────────────────
  register(email: string, password: string) { return this.authSvc.signUp(email, password); }
  signIn(email: string, password: string) { return this.authSvc.signIn(email, password); }

  async signOut() {
    // Invalidate ALL stores - complete cleanup for session switch
    this.notificationStoreSvc.invalidate();
    this.authStoreSvc.invalidatePerfil();
    this.postStoreSvc.invalidateCache();
    this.adminStatsStoreSvc.invalidateCache();
    this.adminUsersStoreSvc.invalidate();
    this.adminReportsStoreSvc.invalidate();
    this.adminPublicationsStoreSvc.invalidate();
    this.catalogSvc.clearCache();

    // Clear auth token
    return this.authSvc.signOut();
  }

  getSession() { return this.authSvc.getSession(); }
  onAuthStateChange(cb: (e: any, s: any) => void) { return this.authSvc.onAuthStateChange(cb); }
  resetPassword(email: string) { return this.authSvc.resetPassword(email); }
  updatePassword(newPassword: string) { return this.authSvc.updatePassword(newPassword); }

  // ── Perfil ────────────────────────────────────────────────────
  createProfile(perfil: Parameters<ProfileService['createProfile']>[0]) {
    return this.profileSvc.createProfile(perfil);
  }
  getPerfilActual() { return this.profileSvc.getPerfilActual(); }
  updatePerfil(datos: Parameters<ProfileService['updatePerfil']>[0]) {
    return this.profileSvc.updatePerfil(datos);
  }
  checkIfUserExists(email: string) { return this.profileSvc.checkIfUserExists(email); }
  updateUserStatus(userId: string, estado: string) { return this.profileSvc.updateUserStatus(userId, estado); }
  /** @deprecated Usa suspendUserRpc() para suspensiones seguras vía RPC. */
  suspendUser(userId: string, hours: number | null) { return this.profileSvc.suspendUser(userId, hours); }
  /** Suspend via secure SECURITY DEFINER RPC. Validates admin role server-side. */
  suspendUserRpc(userId: string, duration: '1_day' | '7_days' | '30_days' | 'permanent') {
    return this.profileSvc.suspendUserRpc(userId, duration);
  }
  /** Unsuspend via secure SECURITY DEFINER RPC. Validates admin role server-side. */
  unsuspendUserRpc(userId: string) { return this.profileSvc.unsuspendUserRpc(userId); }
  verifySuspension() { return this.authStoreSvc.verifySuspension(); }
  getAllUsers(search?: string) { return this.profileSvc.getAllUsers({ searchTerm: search }); }
  getRecentUsers(limit = 5) { return this.profileSvc.getRecentUsers(limit); }
  updateUserRole(userId: string, roleId: string) { return this.profileSvc.updateUserRole(userId, roleId); }

  // ── Publicaciones ─────────────────────────────────────────────
  getPosts() { return this.pubSvc.getPosts(); }
  createPost(post: Parameters<PublicationService['createPost']>[0]) {
    return this.pubSvc.createPost(post);
  }
  getUserRecentPosts(userId: string, limit = 2) { return this.pubSvc.getUserRecentPosts(userId, limit); }
  getActivePostsCount() { return this.pubSvc.getActivePostsCount(); }
  getPostsForChart(days = 30) { return this.pubSvc.getPostsForChart(days); }

  // ── Anuncios ──────────────────────────────────────────────────
  getAnuncios() { return this.anuncioSvc.getAnuncios(); }
  crearAnuncio(datos: any) { return this.anuncioSvc.crearAnuncio(datos); }

  // ── Reportes ──────────────────────────────────────────────────
  createReport(r: Parameters<ReportService['createReport']>[0]) { return this.reportSvc.createReport(r); }
  getReportsList() { return this.reportSvc.getReportsList(); }
  getPendingReportsList(limit = 2) { return this.reportSvc.getPendingReportsList(limit); }
  getPendingReportsCount() { return this.reportSvc.getPendingReportsCount(); }
  updateReportStatus(id: string, estado: 'resuelto' | 'rechazado') {
    return this.reportSvc.updateReportStatus(id, estado);
  }
  deleteReport(id: string) { return this.reportSvc.deleteReport(id); }

  // ── Catálogos ─────────────────────────────────────────────────
  getUniversidades() { return this.catalogSvc.getUniversidades(); }
  getCarreras() { return this.catalogSvc.getCarreras(); }
  getRolesList() { return this.catalogSvc.getRoles(); }
  getRolByNombre(nombre: string) { return this.catalogSvc.getRolByNombre(nombre); }
  getUsersCount() { return this.catalogSvc.getUsersCount(); }
  getTableTrend(table: string, days = 30) { return this.catalogSvc.getTableTrend(table, days); }

  // ── Storage ───────────────────────────────────────────────────
  subirAvatar(file: File) { return this.storageSvc.subirAvatar(file); }
  eliminarAvatar() { return this.storageSvc.eliminarAvatar(); }
  subirImagenesPublicacion(files: File[]) { return this.storageSvc.subirImagenesPublicacion(files); }
}
