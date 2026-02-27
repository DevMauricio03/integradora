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
      .select('*, perfiles(nombre, apellidos, foto_url, roles(nombre))')
      .order('creado', { ascending: false });

    return { data, error };
  }
}
