import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://osdecmrfyxxieyrmtugv.supabase.co',
      'sb_publishable_ui93Xiqzl7OAoaY0nNanBw_xFpJtWst'
    );
  }
  get client(): SupabaseClient {
    return this.supabase;
  }

  // 🔹 Registro en auth
  async register(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    return { data, error };
  }

  // 🔹 Crear perfil en tabla perfiles
  async createProfile(perfil: {
    id: string;
    nombre: string;
    apellidos: string;
    correoInstitucional: string;
    rol_id: string;
    universidad_id: string;
    carrera_id: string;
  }) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .insert(perfil);

    return { data, error };
  }

  // 🔹 Obtener lista de universidades
  async getUniversidades() {
    const { data, error } = await this.supabase
      .from('universidades')
      .select('id, nombre, acronimo')
      .order('nombre');

    return { data, error };
  }

  // 🔹 Obtener lista de carreras
  async getCarreras() {
    const { data, error } = await this.supabase
      .from('carrera')
      .select('id, nombre')
      .order('nombre');

    return { data, error };
  }

  // 🔹 Obtener rol por nombre
  async getRolByNombre(nombre: string) {
    const { data, error } = await this.supabase
      .from('roles')
      .select('id')
      .eq('nombre', nombre)
      .single();

    return { data, error };
  }

  // 🔹 Recuperar contraseña
  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/auth/nueva-password'
    });
  }

  // 🔹 Iniciar sesión
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  // 🔹 Cerrar sesión
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // 🔹 Obtener sesión actual
  async getSession() {
    return await this.supabase.auth.getSession();
  }

  // 🔹 Escuchar cambios de autenticación
  onAuthStateChange(callback: any) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // 🔹 Actualizar contraseña
  async updatePassword(newPassword: string) {
    return await this.supabase.auth.updateUser({ password: newPassword });
  }

  async getPerfilActual() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*, roles(nombre)')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async checkIfUserExists(email: string) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id')
      .eq('correoInstitucional', email)
      .maybeSingle();
    return { exists: !!data, error };
  }

  async updatePerfil(datos: any) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { error } = await this.supabase
      .from('perfiles')
      .update({
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        rol_id: datos.rol_id,
        actualizado: new Date()
      })
      .eq('id', user.id);

    if (error) {
      console.error(error);
      throw error;
    }

    return true;
  }

  async subirAvatar(file: File) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const userId = user.id;
    const fileName = `avatars/${userId}-${Date.now()}.jpg`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    let { error: updateError } = await this.supabase
      .from('perfiles')
      .update({ foto_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      const { error: fallbackError } = await this.supabase
        .from('perfiles')
        .update({ foto_perfil: publicUrl })
        .eq('id', user.id);

      if (fallbackError) {
        throw fallbackError;
      }
    }

    return publicUrl;
  }

  async eliminarAvatar() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    let { error: updateError } = await this.supabase
      .from('perfiles')
      .update({ foto_url: null })
      .eq('id', user.id);

    if (updateError) {
      const { error: fallbackError } = await this.supabase
        .from('perfiles')
        .update({ foto_perfil: null })
        .eq('id', user.id);

      if (fallbackError) {
        throw fallbackError;
      }
    }

    return true;
  }

  // 🔹 Publicaciones
  async createPost(post: any) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const detalles: any = {};
    if (post.type === 'evento') {
      detalles.startDate = post.startDate;
      detalles.endDate = post.endDate;
      detalles.modality = post.modality;
      detalles.location = post.location;
      detalles.cost = post.cost;
    } else if (post.type === 'oferta') {
      detalles.subtype = post.subtype;
      detalles.price = post.price;
      detalles.priceUnit = post.priceUnit;
      detalles.contactMethod = post.contactMethod;
      detalles.phoneNumber = post.phoneNumber;

      if (post.subtype === 'producto') {
        detalles.productStatus = post.productStatus;
        detalles.availability = post.availability;
      } else {
        detalles.serviceType = post.serviceType;
        detalles.availableHours = post.availableHours;
      }
    } else if (post.type === 'experiencia') {
      detalles.company = post.company;
      detalles.area = post.area;
      detalles.period = post.period;
      detalles.recommendation = post.recommendation;
    }

    const { data, error } = await this.supabase
      .from('publicaciones')
      .insert({
        titulo: post.title,
        descripcion: post.description,
        tipo: post.type,
        autor_id: user.id,
        estado: 'activo',
        imagen_url: post.image || null,
        categoria: post.category,
        detalles: detalles // Columna JSONB
      });

    return { data, error };
  }

  async getPosts() {
    const { data, error } = await this.supabase
      .from('publicaciones')
      .select('*, perfiles(nombre, apellidos, foto_url, carrera_id, roles(nombre))')
      .order('creado', { ascending: false });

    return { data, error };
  }

  // 🔹 Admin Estadísticas
  async getUsersCount() {
    const { count, error } = await this.supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true });
    return { count: count || 0, error };
  }

  async getActivePostsCount() {
    const { count, error } = await this.supabase
      .from('publicaciones')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');
    return { count: count || 0, error };
  }

  /* Nota: si la tabla se llama diferente a 'reportes' se deberá ajustar. Asumimos 'reportes' con 'estado=pendiente' */
  async getPendingReportsCount() {
    const { count, error } = await this.supabase
      .from('reportes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');

    // Fallback if table doesn't exist yet
    if (error && error.code === '42P01') {
      return { count: 0, error: null };
    }

    return { count: count || 0, error };
  }

  async getRecentUsers(limit: number = 5) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('nombre, apellidos, correoInstitucional, foto_url, creado, roles(nombre), universidades(acronimo)')
      .order('creado', { ascending: false })
      .limit(limit);
    return { data, error };
  }

  // Compara los registros de los últimos X días contra los X días anteriores
  async getTableTrend(table: string, days: number = 30) {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const previousPeriodStart = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000).toISOString();

    const { count: currentCount, error } = await this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('creado', currentPeriodStart);

    if (error && error.code === '42P01') {
      return 0; // Si la tabla aún no existe devolvemos 0% (útil para "reportes")
    }

    const { count: previousCount } = await this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('creado', previousPeriodStart)
      .lt('creado', currentPeriodStart);

    const curr = currentCount || 0;
    const prev = previousCount || 0;

    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // Trae la fecha de creación de posts de los últimos 30 días para armar la gráfica SVG
  async getPostsForChart(days: number = 30) {
    const startDate = new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.supabase
      .from('publicaciones')
      .select('creado')
      .gte('creado', startDate)
      .order('creado', { ascending: true });
    return { data: data || [], error };
  }

  // Trae los reportes pendientes que formarán parte de la bandeja de Moderación rápida (simulado o si existe la tabla real)
  async getPendingReportsList(limit: number = 2) {
    const { data, error } = await this.supabase
      .from('reportes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('creado', { ascending: false })
      .limit(limit);

    if (error && error.code === '42P01') {
      return { data: [], error: null }; // Tabla aún no existe
    }
    return { data: data || [], error };
  }

  // 🔹 Todos los usuarios (para Admin -> Usuarios)
  async getAllUsers(searchTerm?: string) {
    let query = this.supabase
      .from('perfiles')
      .select('id, nombre, apellidos, correoInstitucional, foto_url, creado, roles(nombre), universidades(acronimo)')
      .order('creado', { ascending: false });

    // Filtrado por buscador
    if (searchTerm) {
      query = query.or(`nombre.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,correoInstitucional.ilike.%${searchTerm}%`);
    }

    // Nota: Como no tenemos todavía el campo 'estado' (baneado, activo, suspendido) en perfiles, todos saldrán activos.
    const { data, error } = await query;
    return { data: data || [], error };
  }
}
