import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { form, required, email, submit, FormField, SchemaPathTree, maxLength, pattern } from '@angular/forms/signals';

/**
 * Modelo de datos para el formulario de inicio de sesión.
 * Separar el modelo de la UI permite una gestión más limpia.
 */
interface LoginFormModel {
  email: string;
  password: string;
  recordarme: boolean;
}

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [Navbar, RouterLink, FormField],
  templateUrl: './inicioSesion.html',
  styleUrl: './inicioSesion.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioSesion implements OnInit {

  /** 
   * Signal que almacena el estado del formulario. 
   */
  loginModel = signal<LoginFormModel>({
    email: '',
    password: '',
    recordarme: false
  });


  loginForm = form(this.loginModel, (schema: SchemaPathTree<LoginFormModel>) => {
    // Validaciones para el correo: Oligatorio, formato email y filtro institucional .edu
    required(schema.email, { message: 'El correo electrónico es obligatorio' });
    email(schema.email, { message: 'Introduce un formato de correo válido' });
    pattern(schema.email, /^[^\s@]+@[^\s@]+\.edu(\.[a-z]+)?$/i, { message: 'Usa un correo institucional (.edu)' });
    maxLength(schema.email, 25, { message: 'El correo no puede tener más de 25 caracteres' });

    // Validaciones para password: Obligatorio y límite de seguridad
    required(schema.password, { message: 'La contraseña es obligatoria' });
    maxLength(schema.password, 50, { message: 'La contraseña no puede tener más de 50 caracteres' });
  });

  mostrarPassword = signal(false);
  loading = signal(false);
  errorMensaje = signal('');

  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * Al iniciar, verificamos si existe un correo guardado por la funcionalidad 'Recordarme'.
   */
  ngOnInit() {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      this.loginModel.update(m => ({ ...m, email: savedEmail, recordarme: true }));
    }

    // Si venimos de un redireccionamiento por suspensión
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'cuenta_suspendida') {
        this.errorMensaje.set('Tu sesión ha finalizado porque tu cuenta se encuentra suspendida.');
      }
    });
  }

  /**
   * Maneja el envío del formulario.
   */
  async onSubmit(event: Event) {
    event.preventDefault();

    // Evitamos múltiples clics si hay validaciones asíncronas pendientes
    if (this.loginForm().pending()) return;

    this.errorMensaje.set('');

    /**
     * 'submit' es una utilidad de Signal Forms que:
     * 1. Marca todos los campos como 'touched' para mostrar errores.
     * 2. Solo ejecuta el callback si el formulario es 100% válido.
     */
    submit(this.loginForm, async () => {
      this.loading.set(true);
      this.errorMensaje.set('');

      try {
        const { email, password, recordarme } = this.loginModel();

        const { error } = await this.supabaseService.signIn(email, password);

        if (error) {
          // Si hay error en Supabase, verificamos si es por el correo o la contraseña
          const { exists } = await this.supabaseService.checkIfUserExists(email);

          if (exists) {
            this.errorMensaje.set('La contraseña es incorrecta. Inténtalo de nuevo.');
          } else {
            this.errorMensaje.set('El correo electrónico no está registrado.');
          }
          return;
        }

        // Verificamos si la cuenta está suspendida antes de dejarlo entrar
        const perfil = await this.supabaseService.getPerfilActual();
        if (perfil?.estado === 'suspendido') {
          // Si está suspendido, le cerramos la sesión y le mandamos el error
          await this.supabaseService.signOut();
          this.errorMensaje.set('Tu cuenta ha sido suspendida. Contacta a administración para más detalles.');
          return;
        }

        // Lógica de persistencia local
        if (recordarme) {
          localStorage.setItem('remember_email', email);
        } else {
          localStorage.removeItem('remember_email');
        }

        // Navegación basada en roles
        const rol: any = perfil?.roles;
        const nombreRol = Array.isArray(rol) ? rol[0]?.nombre : rol?.nombre;

        if (nombreRol?.toLowerCase()?.includes('admin')) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/user/feed']);
        }
      } catch (err) {
        console.error('Error inesperado en inicio de sesión:', err);
        this.errorMensaje.set('Ocurrió un error inesperado. Inténtalo más tarde.');
      } finally {
        this.loading.set(false);
      }
    });
  }
}
