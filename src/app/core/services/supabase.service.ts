import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase:SupabaseClient;

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

}
