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

/**
 * @deprecated Este servicio es una FACHADA de compatibilidad.
 * Toda la lógica ha sido migrada a servicios especializados:
 *   - AuthService         → autenticación
 *   - ProfileService      → tabla perfiles
 *   - PublicationService  → tabla publicaciones
 *   - AnuncioService      → tabla anuncios
 *   - ReportService       → tabla reportes
 *   - CatalogService      → universidades, carreras, roles
 *   - StorageService      → subida de archivos
 *
 * Todos los métodos aquí delegan a los servicios correspondientes.
 * Puede eliminarse progresivamente a medida que los componentes
 * migren a usar los servicios especializados directamente.
CREATE OR REPLACE FUNCTION es_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path  = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles p
    JOIN roles r ON r.id = p.rol_id
    WHERE p.id = auth.uid()
      AND r.nombre = 'admin'
  );
$$; */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // Conservamos la propiedad `client` para compatibilidad con adminPublication.service.ts
  private readonly _clientService = inject(SupabaseClientService);
  get client(): SupabaseClient { return this._clientService.client; }

  private readonly authSvc = inject(AuthService);
  private readonly profileSvc = inject(ProfileService);
  private readonly pubSvc = inject(PublicationService);
  private readonly anuncioSvc = inject(AnuncioService);
  private readonly reportSvc = inject(ReportService);
  private readonly catalogSvc = inject(CatalogService);
  private readonly storageSvc = inject(StorageService);

  // ── Auth ──────────────────────────────────────────────────────
  register(email: string, password: string) { return this.authSvc.signUp(email, password); }
  signIn(email: string, password: string) { return this.authSvc.signIn(email, password); }
  signOut() { return this.authSvc.signOut(); }
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
  suspendUser(userId: string, hours: number | null) { return this.profileSvc.suspendUser(userId, hours); }
  verifySuspension() { return this.profileSvc.verifySuspension(); }
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
