import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { Notificacion } from '../models/supabase.models';

/**
 * Layer 1 – Servicio especializado: Notificaciones.
 * Responsabilidad única: tabla `notificaciones`.
 * Cada método ejecuta UNA sola query hacia UN solo recurso.
 *
 * No gestiona estado — solo consultas CRUD.
 * El estado es manejado por NotificationStoreService (Layer 2).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly db = inject(SupabaseClientService).client;

  /**
   * Obtener notificaciones del usuario actual, ordenadas por fecha más reciente.
   */
  async getNotificaciones(userId: string): Promise<{ data: Notificacion[] | null; error: any }> {
    const { data, error } = await this.db
      .from('notificaciones')
      .select('id, user_id, tipo, mensaje, leido, creado, post_id, comentario_id')
      .eq('user_id', userId)
      .order('creado', { ascending: false });

    return { data: data as Notificacion[] | null, error };
  }

  /**
   * Obtener conteo de notificaciones no leídas.
   */
  async getUnreadCount(userId: string): Promise<{ count: number | null; error: any }> {
    const { count, error } = await this.db
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leido', false);

    return { count, error };
  }

  /**
   * Marcar una notificación como leída.
   */
  async markAsRead(notificationId: string): Promise<{ error: any }> {
    const { error } = await this.db
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', notificationId);

    return { error };
  }

  /**
   * Crear una notificación nueva.
   * Utilizado por servicios administrativos/backend para generar notificaciones.
   */
  async createNotificacion(data: Omit<Notificacion, 'id' | 'creado'>): Promise<{ data: Notificacion | null; error: any }> {
    const { data: result, error } = await this.db
      .from('notificaciones')
      .insert({
        user_id: data.user_id,
        tipo: data.tipo,
        mensaje: data.mensaje,
        leido: data.leido ?? false,
        post_id: data.post_id,
        comentario_id: data.comentario_id,
      })
      .select('id, user_id, tipo, mensaje, leido, creado, post_id, comentario_id')
      .single();

    return { data: result as Notificacion | null, error };
  }

  /**
   * Eliminar una notificación por id.
   */
  async deleteNotification(notificationId: string): Promise<{ error: any }> {
    const { error } = await this.db
      .from('notificaciones')
      .delete()
      .eq('id', notificationId);

    return { error };
  }

  /**
   * Eliminar todas las notificaciones del usuario actual.
   */
  async deleteAllNotifications(userId: string): Promise<{ error: any }> {
    const { error } = await this.db
      .from('notificaciones')
      .delete()
      .eq('user_id', userId);

    return { error };
  }
}
