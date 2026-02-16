import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Navbar } from "../../../shared/components/navbar/navbar";

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, Navbar, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroPage implements OnInit {

  nombre: string = '';
  apellidos: string = '';
  email: string = '';
  password: string = '';
  confirmarPassword: string = '';
  aceptaTerminos: boolean = false;

  // 🔹 Selección de universidad y carrera (texto visible + id)
  universidadTexto: string = '';
  universidadId: string = '';
  carreraTexto: string = '';
  carreraId: string = '';

  // 🔹 Listas cargadas desde BD
  universidades: { id: string; nombre: string; acronimo: string }[] = [];
  carreras: { id: string; nombre: string }[] = [];

  // 🔹 Variables reactivas para requisitos
  reqLength = false;
  reqUppercase = false;
  reqNumber = false;
  reqSpecial = false;

  // 🔹 Estado del formulario
  passwordsCoinciden = true;
  mostrarPassword = false;
  mostrarConfirmar = false;
  errorRegistro: string = '';
  cargando = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Cargar universidades y carreras desde Supabase
    const [uniRes, carRes] = await Promise.all([
      this.supabaseService.getUniversidades(),
      this.supabaseService.getCarreras()
    ]);

    if (uniRes.data) this.universidades = uniRes.data;
    if (carRes.data) this.carreras = carRes.data;
  }

  // 🔹 Cuando el usuario selecciona/escribe una universidad (case-insensitive)
  onUniversidadChange() {
    const texto = this.universidadTexto.toLowerCase();
    const encontrada = this.universidades.find(
      u => u.nombre.toLowerCase() === texto || u.acronimo?.toLowerCase() === texto
    );
    this.universidadId = encontrada ? encontrada.id : '';
  }

  // 🔹 Cuando el usuario selecciona/escribe una carrera (case-insensitive)
  onCarreraChange() {
    const texto = this.carreraTexto.toLowerCase();
    const encontrada = this.carreras.find(c => c.nombre.toLowerCase() === texto);
    this.carreraId = encontrada ? encontrada.id : '';
  }

  // 🔹 Validación reactiva de contraseña
  validarPassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.password = value;

    this.reqLength = value.length >= 8;
    this.reqUppercase = /[A-Z]/.test(value);
    this.reqNumber = /[0-9]/.test(value);
    this.reqSpecial = /[^A-Za-z0-9]/.test(value);

    if (this.confirmarPassword.length > 0) {
      this.passwordsCoinciden = this.password === this.confirmarPassword;
    }
  }

  // 🔹 Validar que las contraseñas coincidan
  validarConfirmacion(event: Event) {
    this.confirmarPassword = (event.target as HTMLInputElement).value;
    this.passwordsCoinciden = this.password === this.confirmarPassword;
  }

  // 🔹 Verificar si todos los requisitos se cumplen
  get passwordValida(): boolean {
    return this.reqLength && this.reqUppercase && this.reqNumber && this.reqSpecial;
  }

  // 🔹 Validar que el email sea institucional (.edu, .edu.mx, .edu.co, etc)
  get emailInstitucionalValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.edu(\.[a-z]+)?$/i.test(this.email);
  }

  // 🔹 Verificar si el formulario es válido
  get formularioValido(): boolean {
    return (
      this.nombre.trim() !== '' &&
      this.apellidos.trim() !== '' &&
      this.email.trim() !== '' &&
      this.emailInstitucionalValido &&
      this.universidadId !== '' &&
      this.carreraId !== '' &&
      this.password.trim() !== '' &&
      this.passwordValida &&
      this.passwordsCoinciden &&
      this.aceptaTerminos
    );
  }

  async onRegister() {
    if (!this.formularioValido) return;

    this.errorRegistro = '';
    this.cargando = true;

    try {
      // Paso 1: Crear usuario en auth
      const { data, error } = await this.supabaseService.register(
        this.email,
        this.password
      );

      if (error) {
        if (error.message.includes('User already registered')) {
          this.errorRegistro = 'Este correo ya está registrado.';
        } else {
          this.errorRegistro = error.message;
        }
        return;
      }

      if (!data?.user) {
        this.errorRegistro = 'No se pudo crear el usuario.';
        return;
      }

      // Paso 2: Obtener rol_id de "alumno"
      const { data: rolData, error: rolError } = await this.supabaseService.getRolByNombre('alumno');

      if (rolError || !rolData) {
        this.errorRegistro = 'Error al asignar el rol.';
        return;
      }

      // Paso 3: Guardar perfil en tabla perfiles
      const { error: profileError } = await this.supabaseService.createProfile({
        id: data.user.id,
        nombre: this.nombre,
        apellidos: this.apellidos,
        correoInstitucional: this.email,
        rol_id: rolData.id,
        universidad_id: this.universidadId,
        carrera_id: this.carreraId
      });

      if (profileError) {
        this.errorRegistro = 'Error al guardar el perfil: ' + profileError.message;
        return;
      }

      // Paso 4: Registro completo → redirigir a confirmación
      this.router.navigate(['/auth/confirmacion-correo']);

    } catch (err) {
      this.errorRegistro = 'Ocurrió un error inesperado. Intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

}
