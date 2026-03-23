import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Navbar } from "../../../shared/components/navbar/navbar";
import { AvisosLegales } from '../../../shared/components/avisosLegales/avisosLegales';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { form, required, email, submit, FormField, SchemaPathTree, pattern, validate, maxLength } from '@angular/forms/signals';
import { TerminosCondiciones } from "../../../shared/components/avisosLegales/terminosCondiciones";

/**
 * Estructura de datos para el formulario de registro.
 */
interface RegisterFormModel {
  nombre: string;
  apellidos: string;
  email: string;
  universidad: string;
  carrera: string;
  password: string;
  confirmarPassword: string;
  aceptaTerminos: boolean;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [Navbar, RouterLink, AvisosLegales, SuccessModal, FormField, TerminosCondiciones],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroPage implements OnInit {

  /**
   * Signal principal que mantiene el estado del modelo.
   */
  registerModel = signal<RegisterFormModel>({
    nombre: '',
    apellidos: '',
    email: '',
    universidad: '',
    carrera: '',
    password: '',
    confirmarPassword: '',
    aceptaTerminos: false
  });

  /**
   * Esquema de validación del registro.
   * Centraliza toda la lógica de validación de forma declarativa.
   */
  registroForm = form(this.registerModel, (schema: SchemaPathTree<RegisterFormModel>) => {
    // Nombre y Apellidos: Obligatorios, solo letras y límite de 50 caracteres
    required(schema.nombre, { message: 'El nombre es obligatorio' });
    pattern(schema.nombre, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo se permiten letras' });
    maxLength(schema.nombre, 50, { message: 'Máximo 50 caracteres' });

    required(schema.apellidos, { message: 'Los apellidos son obligatorios' });
    pattern(schema.apellidos, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo se permiten letras' });
    maxLength(schema.apellidos, 50, { message: 'Máximo 50 caracteres' });

    // Email Institucional: Obligatorio, formato válido, filtro .edu y límite de 25 caracteres
    required(schema.email, { message: 'El correo es obligatorio' });
    email(schema.email, { message: 'Formato de correo inválido' });
    pattern(schema.email, /^[^\s@]+@[^\s@]+\.edu(\.[a-z]+)?$/i, { message: 'Usa un correo institucional (.edu)' });
    maxLength(schema.email, 25, { message: 'Máximo 25 caracteres' });

    // Universidad y Carrera: Campos obligatorios
    required(schema.universidad);
    required(schema.carrera);

    // Password: Validación de fortaleza compleja
    required(schema.password);
    maxLength(schema.password, 50, { message: 'La contraseña no puede exceder 50 caracteres' });
    validate(schema.password, (ctx) => {
      const val = ctx.value();
      if (val.length < 8) return { kind: 'length', message: 'Mínimo 8 caracteres' };
      if (!/[A-Z]/.test(val)) return { kind: 'upper', message: 'Una mayúscula' };
      if (!/\d/.test(val)) return { kind: 'number', message: 'Un número' };
      if (!/[^A-Za-z\d]/.test(val)) return { kind: 'special', message: 'Un carácter especial' };
      return null;
    });

    // Confirmación: Debe coincidir con el campo de contraseña
    required(schema.confirmarPassword);
    required(schema.confirmarPassword, { message: 'confirmar contraseña es obligatorio' });

    validate(schema.confirmarPassword, (ctx) => {
      const pass = ctx.valueOf(schema.password);
      return ctx.value() === pass ? null : { kind: 'mismatch', message: 'Las contraseñas no coinciden' };
    });

    // Términos: Validación personalizada para boolean obligatorio
    validate(schema.aceptaTerminos, (ctx) => {
      return ctx.value() ? null : { kind: 'required', message: 'Debes aceptar los términos' };
    });
  });

  // Requisitos calculados para la UI
  reqLength = computed(() => this.registerModel().password.length >= 8);
  reqUppercase = computed(() => /[A-Z]/.test(this.registerModel().password));
  reqNumber = computed(() => /\d/.test(this.registerModel().password));
  reqSpecial = computed(() => /[^A-Za-z\d]/.test(this.registerModel().password));

  universidades = signal<{ id: string; nombre: string; acronimo: string }[]>([]);
  carreras = signal<{ id: string; nombre: string }[]>([]);

  carreraDropdownAbierto = signal(false);
  carreraBusqueda = signal('');

  carrerasFiltradas = computed(() => {
    const termino = this.carreraBusqueda().trim().toLowerCase();
    if (!termino) return this.carreras();

    return this.carreras().filter(carrera =>
      carrera.nombre.toLowerCase().includes(termino)
    );
  });

  universidadId = signal('');
  carreraId = signal('');

  mostrarPassword = signal(false);
  mostrarConfirmar = signal(false);
  errorRegistro = signal('');
  cargando = signal(false);
  mostrarAviso = signal(false);
  mostrarTerminos = signal(false);
  mostrarSuccess = signal(false);

  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit() {
    this.loadData();
  }

  private async loadData() {
    const [uniRes, carRes] = await Promise.all([
      this.supabaseService.getUniversidades(),
      this.supabaseService.getCarreras()
    ]);

    if (uniRes.data) this.universidades.set(uniRes.data);
    if (carRes.data) this.carreras.set(carRes.data);
  }

  // 🔹 Modal Aviso de Privacidad
  abrirAviso(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.mostrarAviso.set(true);
  }

  cerrarAviso() {
    this.mostrarAviso.set(false);
  }

  // 🔹 Modal terminos y condiciones

  abrirTerminos(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.mostrarTerminos.set(true);
  }

  cerrarTerminos() {
    this.mostrarTerminos.set(false);
  }

  private handleRegistroExitoso() {
    this.mostrarSuccess.set(true);
  }

  cerrarSuccess() {
    this.mostrarSuccess.set(false);
  }

  irALogin() {
    this.mostrarSuccess.set(false);
    this.router.navigate(['/auth/inicio-sesion']);
  }

  // 🔹 Cuando el usuario selecciona/escribe una universidad (case-insensitive)
  onUniversidadChange() {
    const texto = this.registerModel().universidad.toLowerCase();
    const encontrada = this.universidades().find(
      u => u.nombre.toLowerCase() === texto || u.acronimo?.toLowerCase() === texto
    );
    this.universidadId.set(encontrada ? encontrada.id : '');
  }

  onCarreraChange() {
    const texto = this.registerModel().carrera.toLowerCase();
    const encontrada = this.carreras().find(c => c.nombre.toLowerCase() === texto);
    this.carreraId.set(encontrada ? encontrada.id : '');
  }

  onCarreraTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.registroForm.carrera().markAsTouched();
      this.abrirCarreraDropdown();
    }

    if (event.key === 'Escape') {
      this.cerrarCarreraDropdown();
    }
  }

  onCarreraDisplayInput(event: Event) {
    const texto = (event.target as HTMLInputElement).value;
    this.registroForm.carrera().markAsTouched();
    this.carreraDropdownAbierto.set(true);
    this.carreraBusqueda.set(texto);
  }

  seleccionarCarrera(carrera: { id: string; nombre: string }) {
    this.registroForm.carrera().markAsTouched();
    this.registerModel.update(model => ({ ...model, carrera: carrera.nombre }));
    this.carreraId.set(carrera.id);
    this.cerrarCarreraDropdown();
  }

  abrirCarreraDropdown() {
    this.registroForm.carrera().markAsTouched();
    this.carreraDropdownAbierto.set(true);
    this.carreraBusqueda.set('');
  }

  cerrarCarreraDropdown() {
    this.carreraDropdownAbierto.set(false);
    this.carreraBusqueda.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.carreraDropdownAbierto()) return;

    const target = event.target;
    if (!(target instanceof Node)) return;

    if (!this.hostElement.nativeElement.contains(target)) {
      this.cerrarCarreraDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.carreraDropdownAbierto()) {
      this.cerrarCarreraDropdown();
    }
  }

  /**
   * Lógica principal de creación de cuenta.
   * Se ejecuta en dos fases: 1. Auth (Supabase) 2. Perfil (Base de datos).
   */
  async onRegister(event?: Event) {
    event?.preventDefault();
    if (this.registroForm().pending() || this.cargando()) return;

    this.errorRegistro.set('');

    /**
     * 'submit' es una utilidad de Signal Forms que marca campos como tocados
     * y solo se ejecuta si el esquema es válido.
     */
    submit(this.registroForm, async () => {
      this.cargando.set(true);

      try {
        const model = this.registerModel();

        // FASE 1: Registro en Supabase Auth
        const { data, error } = await this.supabaseService.register(model.email, model.password);

        if (error) {
          this.errorRegistro.set(error.message.includes('User already registered')
            ? 'Este correo ya está registrado.'
            : error.message);
          return;
        }

        if (!data?.user) {
          this.errorRegistro.set('No se pudo crear el usuario.');
          return;
        }

        // FASE 2: Creación del perfil con datos adicionales

        // Obtención del rol de alumno
        const { data: rolData, error: rolError } = await this.supabaseService.getRolByNombre('alumno');
        if (rolError || !rolData) {
          this.errorRegistro.set('Error al asignar el rol.');
          return;
        }

        // Guardado de la información extendida del perfil
        const { error: profileError } = await this.supabaseService.createProfile({
          id: data.user.id,
          nombre: model.nombre,
          apellidos: model.apellidos,
          correoInstitucional: model.email,
          rol_id: rolData.id,
          universidad_id: this.universidadId(),
          carrera_id: this.carreraId()
        });

        if (profileError) {
          this.errorRegistro.set('Error al guardar el perfil: ' + profileError.message);
          return;
        }

        // Éxito: Mostrar modal de confirmación
        this.handleRegistroExitoso();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
        this.errorRegistro.set(message);
      } finally {
        this.cargando.set(false);
      }
    });
  }

}
