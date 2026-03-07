import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Perfil, Universidad, Carrera, Rol, Post, Anuncio } from '../models/supabase.models';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;

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
    rol_id?: string;
    universidad_id?: string;
    carrera_id?: string | null;
    foto_url?: string | null;
    foto_perfil?: string | null;
    creado?: string;
    estado?: string;
  }): Promise<{ data: Perfil[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .insert(perfil);

    return { data: data as unknown as Perfil[], error };
  }

  // 🔹 Obtener lista de universidades
  async getUniversidades(): Promise<{ data: Universidad[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('universidades')
      .select('id, nombre, acronimo')
      .order('nombre');

    return { data: data as unknown as Universidad[], error };
  }

  // 🔹 Obtener lista de carreras
  async getCarreras(): Promise<{ data: Carrera[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('carrera')
      .select('id, nombre')
      .order('nombre');

    return { data: data as unknown as Carrera[], error };
  }

  // 🔹 Obtener rol por nombre
  async getRolByNombre(nombre: string): Promise<{ data: Partial<Rol> | null, error: any }> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('id')
      .eq('nombre', nombre)
      .single();

    return { data: data as unknown as Partial<Rol>, error };
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
  onAuthStateChange(callback: (event: any, session: any) => void) {
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

    return data as unknown as Perfil;
  }

  // 🔹 Verificar si el usuario está suspendido realmente
  async verifySuspension(): Promise<{ isSuspended: boolean; remains?: string }> {
    const perfil = await this.getPerfilActual();
    if (perfil?.estado !== 'suspendido') return { isSuspended: false };

    // Si tiene fecha de suspensión, verificamos si ya pasó
    if (perfil.fecha_suspension) {
      const now = new Date();
      const suspensionEnd = new Date(perfil.fecha_suspension);

      if (now > suspensionEnd) {
        // La suspensión ya terminó, lo reactivamos automáticamente
        await this.updateUserStatus(perfil.id, 'activo');
        return { isSuspended: false };
      }

      // Calculamos cuánto tiempo queda para informarle al usuario si es necesario
      const diffMs = suspensionEnd.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      const remains = days > 0 ? `${days} días` : `${hours} horas`;

      return { isSuspended: true, remains };
    }

    // Si no tiene fecha, es permanente
    return { isSuspended: true, remains: 'indefinido' };
  }

  async checkIfUserExists(email: string) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id')
      .eq('correoInstitucional', email)
      .maybeSingle();
    return { exists: !!data, error };
  }

  async updatePerfil(datos: Partial<Perfil> & { rol_id: string }) {
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
  async createPost(post: Omit<Post, 'autor_id' | 'estado'> & { type: string, title: string, description: string, image?: string, images?: string[], category?: string, startDate?: string, endDate?: string, modality?: string, location?: string, cost?: string, subtype?: string, price?: number, priceUnit?: string, contactMethod?: string, phoneNumber?: string, productStatus?: string, availability?: string, serviceType?: string, availableHours?: string, company?: string, area?: string, period?: string, recommendation?: string }) {
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

    console.log('Insertando post con datos:', {
      titulo: post.title,
      image: post.images?.[0] || post.image,
      images_count: post.images?.length || 0
    });

    const { data, error } = await this.supabase
      .from('publicaciones')
      .insert({
        titulo: post.title,
        descripcion: post.description,
        tipo: post.type,
        autor_id: user.id,
        estado: 'pendiente',
        imagen_url: (post.images && post.images.length > 0) ? post.images[0] : (post.image || null),
        imagenes_url: (post.images && post.images.length > 0) ? post.images : null,
        categoria: post.category,
        detalles: detalles
      });

    return { data, error };
  }

  async getPosts(): Promise<{ data: Post[] | null, error: any }> {
    const { data: { user } } = await this.supabase.auth.getUser();

    let query = this.supabase
      .from('publicaciones')
      .select('*, perfiles(nombre, apellidos, foto_url, carrera_id, roles(nombre))');

    if (user) {
      // Show active posts OR pending posts belonging to the current user
      query = query.or(`estado.eq.activo,and(estado.eq.pendiente,autor_id.eq.${user.id})`);
    } else {
      // If not logged in, only show active posts
      query = query.eq('estado', 'activo');
    }

    const { data, error } = await query.order('creado', { ascending: false });
    return { data: data as Post[], error };
  }

  async getUserRecentPosts(userId: string, limit: number = 2) {
    const { data, error } = await this.supabase
      .from('publicaciones')
      .select('titulo, tipo, creado')
      .eq('autor_id', userId)
      .order('creado', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  async getAnuncios(): Promise<{ data: Anuncio[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('anuncios')
      .select('*')
      .eq('estado', 'activo')
      .order('creado', { ascending: false });

    return { data: data as Anuncio[], error };
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
    if (error?.code === '42P01') {
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

    if (error?.code === '42P01') {
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
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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
      .select('*, publicaciones(*), informante:perfiles!reportado_por(*)')
      .eq('estado', 'pendiente')
      .order('creado', { ascending: false })
      .limit(limit);

    if (error?.code === '42P01') {
      return { data: [], error: null };
    }

    if (data) {
      data.forEach((r: any) => {
        r.detalles = r.descripcion;
        r.informante_id = r.reportado_por;
      });
    }

    return { data: data || [], error };
  }

  // 🔹 Todos los usuarios (para Admin -> Usuarios)
  async getAllUsers(searchTerm?: string) {
    let query = this.supabase
      .from('perfiles')
      .select('id, nombre, apellidos, correoInstitucional, foto_url, creado, estado, roles(nombre), universidades(acronimo)')
      .order('creado', { ascending: false });

    // Filtrado por buscador
    if (searchTerm) {
      query = query.or(`nombre.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,correoInstitucional.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    return { data: (data as unknown as Perfil[]) || [], error };
  }

  // 🔹 Todos los roles
  async getRolesList() {
    const { data, error } = await this.supabase
      .from('roles')
      .select('id, nombre')
      .order('nombre');
    return { data, error };
  }

  // 🔹 Actualizar rol de usuario
  async updateUserRole(userId: string, roleId: string) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .update({ rol_id: roleId })
      .eq('id', userId);
    return { data, error };
  }

  // 🔹 Actualizar estado de usuario (Activo/Suspendido)
  async updateUserStatus(userId: string, nuevoEstado: string) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .update({ estado: nuevoEstado })
      .eq('id', userId);
    return { data, error };
  }

  // 🔹 Crear reporte de publicación (FORCED REBUILD v2 - Schema check)
  async createReport(reporte: {
    publicacion_id: string;
    autor_id: string;
    informante_id: string;
    motivo: string;
    detalles?: string;
  }) {
    // ⚠️ REVISIÓN DE ESQUEMA REAL:
    // pub_id: reporte.publicacion_id
    // reportado_por (FK): reporte.informante_id
    // motivo: reporte.motivo
    // descripcion: reporte.detalles

    const payload = {
      publicacion_id: reporte.publicacion_id,
      reportado_por: reporte.informante_id,
      motivo: reporte.motivo,
      descripcion: reporte.detalles || '',
      estado: 'pendiente',
      creado: new Date().toISOString()
    };

    console.log('Enviando reporte con payload:', payload);

    return await this.supabase
      .from('reportes')
      .insert(payload);
  }

  // 🔹 Suspender usuario con fecha de fin
  async suspendUser(userId: string, hours: number | null) {
    let fechaSuspension: string | null = null;

    if (hours === null) {
      // Suspension permanente (ponemos una fecha muy lejana)
      fechaSuspension = '2099-12-31T23:59:59Z';
    } else {
      const date = new Date();
      date.setHours(date.getHours() + hours);
      fechaSuspension = date.toISOString();
    }

    return await this.supabase
      .from('perfiles')
      .update({
        estado: 'suspendido',
        fecha_suspension: fechaSuspension
      })
      .eq('id', userId);
  }

  // 🔹 Obtener reportes (Admin)
  async getReportsList() {
    const { data, error } = await this.supabase
      .from('reportes')
      .select(`
        *,
        publicaciones (
          id, titulo, descripcion, imagen_url, tipo, autor_id,
          autor:perfiles(
            id, nombre, apellidos, foto_url, creado, correoInstitucional,
            carrera:carrera_id(nombre),
            universidades:universidad_id(acronimo, nombre),
            roles:rol_id(nombre)
          )
        ),
        informante:perfiles!reportado_por(
          id, nombre, apellidos, foto_url, creado, correoInstitucional,
          carrera:carrera_id(nombre),
          universidades:universidad_id(acronimo, nombre),
          roles:rol_id(nombre)
        )
      `)
      .order('creado', { ascending: false });

    if (data) {
      data.forEach((r: any) => {
        // Mapeamos para que los componentes el front sigan funcionando
        r.detalles = r.descripcion;
        r.informante_id = r.reportado_por;

        if (r.publicaciones?.autor) {
          r.autor = r.publicaciones.autor;
          r.autor_id = r.publicaciones.autor.id;
        }
      });
    }

    return { data, error };
  }

  // 🔹 Resolver reporte
  async updateReportStatus(reportId: string, nuevoEstado: 'resuelto' | 'rechazado') {
    return await this.supabase
      .from('reportes')
      .update({ estado: nuevoEstado })
      .eq('id', reportId);
  }

  // 🔹 Eliminar reporte definitivamente
  async deleteReport(reportId: string) {
    // Agregamos .select() para que Supabase nos devuelva lo que borró. 
    // Si la data está vacía pero no hay error, significa que RLS (Row Level Security) bloqueó el DELETE.
    return await this.supabase
      .from('reportes')
      .delete()
      .eq('id', reportId)
      .select();
  }

  // 🔹 Crear Anuncio Oficial (Admin)
  async crearAnuncio(datos: any) {
    return await this.supabase
      .from('anuncios')
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        imagen_url: datos.imagen_url,
        contacto_url: datos.contacto_url,
        ciudad: datos.ciudad,
        estado: 'activo',
        activo: true,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin: datos.fecha_fin,
        creado: new Date().toISOString()
      });
  }

  async subirImagenesPublicacion(files: File[]): Promise<string[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const fileName = `posts/${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from('publicaciones')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Error en Storage: ${uploadError.message}. Asegúrate de que el bucket "publicaciones" exista y permita subidas.`);
      }

      const { data } = this.supabase.storage.from('publicaciones').getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
    return urls;
  }
}
