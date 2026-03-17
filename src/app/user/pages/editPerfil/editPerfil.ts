import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStoreService } from '../../../core/services/auth-store.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { form, required, submit, FormField, SchemaPathTree, pattern, maxLength } from '@angular/forms/signals';
import { Carrera } from '../../../core/models/supabase.models';

// ── Constantes del módulo ──────────────────────────────────────────────────────
/** Solo letras (incluye tildes y Ñ) y espacios. Sin dígitos ni símbolos. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const ANIO_ACTUAL = new Date().getFullYear();

interface EditPerfilModel {
  nombre: string;
  apellidos: string;
  anioGraduacion: string;
  carreraId: string;
}

@Component({
  selector: 'app-editar-perfil-page',
  standalone: true,
  imports: [CommonModule, ModalBase, FormField],
  templateUrl: './editPerfil.html',
  styleUrls: ['./editPerfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarPerfilPage implements OnInit {
  // ── Signals de UI ────────────────────────────────────────────────────────────
  readonly mostrarExito   = signal(false);
  readonly guardando      = signal(false);
  readonly subiendoFoto   = signal(false);
  readonly errorFoto      = signal<string | null>(null);
  readonly perfil         = signal<any>(null);
  readonly carreras       = signal<Carrera[]>([]);
  readonly errorGuardando = signal<string | null>(null);

  readonly defaultAvatarUrl =
    'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  /**
   * Rango dinámico de años de graduación.
   * Desde 5 años atrás hasta 10 años adelante respecto al año actual.
   */
  readonly aniosGraduacion: number[] = Array.from(
    { length: 16 },
    (_, i) => ANIO_ACTUAL - 5 + i,
  );

  // ── Servicios ────────────────────────────────────────────────────────────────
  private readonly authStore        = inject(AuthStoreService);
  private readonly supabaseService  = inject(SupabaseService);
  private readonly router           = inject(Router);

  // ── Modelo y formulario (signal-based forms) ─────────────────────────────────
  readonly editModel = signal<EditPerfilModel>({
    nombre:          '',
    apellidos:       '',
    anioGraduacion:  '',
    carreraId:       '',
  });

  readonly editForm = form(this.editModel, (schema: SchemaPathTree<EditPerfilModel>) => {
    // --- Nombre ---
    required(schema.nombre,  { message: 'El nombre es obligatorio' });
    pattern( schema.nombre,  /^.{2,}$/,   { message: 'Mínimo 2 caracteres' });
    pattern( schema.nombre,  SOLO_LETRAS, { message: 'Solo letras y espacios, sin números' });
    maxLength(schema.nombre, 50,          { message: 'Máximo 50 caracteres' });

    // --- Apellidos ---
    required(schema.apellidos,  { message: 'Los apellidos son obligatorios' });
    pattern( schema.apellidos,  /^.{2,}$/,   { message: 'Mínimo 2 caracteres' });
    pattern( schema.apellidos,  SOLO_LETRAS, { message: 'Solo letras y espacios, sin números' });
    maxLength(schema.apellidos, 50,          { message: 'Máximo 50 caracteres' });
  });

  // ── Ciclo de vida ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarPerfil();
    this.cargarCarreras();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────
  private async cargarPerfil(): Promise<void> {
    const data = await this.authStore.getPerfilActual();
    if (!data) return;

    this.perfil.set(data);
    this.editModel.update(m => ({
      ...m,
      nombre:         data.nombre          || '',
      apellidos:      data.apellidos        || '',
      anioGraduacion: data.anio_graduacion?.toString() || '',
      // Prefiere el id del join (carrera.id); fallback a carrera_id plano
      carreraId:      data.carrera?.id ?? data.carrera_id ?? '',
    }));
  }

  private async cargarCarreras(): Promise<void> {
    const { data } = await this.supabaseService.getCarreras();
    if (data) this.carreras.set(data);
  }

  // ── Guardado ─────────────────────────────────────────────────────────────────
  guardarCambios(event: Event): void {
    event.preventDefault();
    if (this.guardando()) return;
    this.errorGuardando.set(null);

    /**
     * submit() es síncrono: llama el callback solo si la validación pasa.
     * guardando se activa DENTRO del callback para no romper el estado
     * cuando la validación falla.
     */
    submit(this.editForm, async () => {
      this.guardando.set(true);
      try {
        await this.supabaseService.updatePerfil(this.editModel());
        this.authStore.invalidatePerfil();
        this.mostrarExito.set(true);
      } catch (err) {
        console.error('[EditarPerfil] Error al guardar:', err);
        this.errorGuardando.set('Ocurrió un error al guardar. Intenta de nuevo.');
      } finally {
        this.guardando.set(false);
      }
    });
  }

  // ── Handlers de selects nativos ──────────────────────────────────────────────
  onAnioChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.editModel.update(m => ({ ...m, anioGraduacion: value }));
  }

  onCarreraChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.editModel.update(m => ({ ...m, carreraId: value }));
  }

  // ── Navegación ───────────────────────────────────────────────────────────────
  irPerfil(): void {
    this.mostrarExito.set(false);
    this.router.navigate(['/user/perfil']);
  }

  // ── Avatar ───────────────────────────────────────────────────────────────────
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    // Reset input so the same file can be selected again if needed
    input.value = '';
    if (!file) return;

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      this.errorFoto.set(`La imagen debe pesar menos de ${MAX_SIZE_MB} MB`);
      return;
    }

    this.errorFoto.set(null);
    this.subiendoFoto.set(true);

    // Show an instant local preview while the upload is in progress
    // (same FileReader pattern used in the post image flow)
    const reader = new FileReader();
    reader.onload = () => {
      this.perfil.update(p => ({ ...p, foto_url: reader.result as string }));
    };
    reader.readAsDataURL(file);

    try {
      const url = await this.supabaseService.subirAvatar(file);
      // Replace the local blob preview with the persisted remote URL
      this.perfil.update(p => ({ ...p, foto_url: url }));
      this.authStore.invalidatePerfil();
    } catch (err) {
      console.error('[EditarPerfil] Error subiendo avatar:', err);
      this.errorFoto.set('No se pudo subir la foto. Inténtalo de nuevo.');
    } finally {
      this.subiendoFoto.set(false);
    }
  }

  async eliminarFoto(): Promise<void> {
    try {
      await this.supabaseService.eliminarAvatar();
      this.perfil.update(p => ({ ...p, foto_url: null }));
      this.authStore.invalidatePerfil();
    } catch (err) {
      console.error('[EditarPerfil] Error eliminando avatar:', err);
    }
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultAvatarUrl;
  }
}
