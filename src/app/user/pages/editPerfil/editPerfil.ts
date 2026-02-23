import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-editar-perfil-page',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, ModalBase],
  templateUrl: './editPerfil.html',
  styleUrls: ['./editPerfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarPerfilPage implements OnInit {
  mostrarExito = false;
  perfil: any;
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern('.*\\S.*')]],
    apellidos: ['', [Validators.required, Validators.pattern('.*\\S.*')]],
    rol_id: [''],
    universidad_id: [''],
    carrera_id: [''],
    anioGraduacion: [''],
  });

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Carga el perfil actual y precarga los campos editables del formulario.
  async ngOnInit() {
    this.perfil = await this.supabaseService.getPerfilActual();

    if (this.perfil) {
      this.form.patchValue({
        nombre: this.perfil.nombre,
        apellidos: this.perfil.apellidos,
        rol_id: this.perfil.rol_id,
        universidad_id: this.perfil.universidad_id,
        carrera_id: this.perfil.carrera_id
      });
    }
  }

  // Cierra el modal y regresa a la vista de perfil público.
  irPerfil() {
    this.mostrarExito = false;
    this.router.navigate(['/user/perfil']);
  }

  // Valida el formulario y actualiza los datos básicos del perfil en Supabase.
  async guardarCambios() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      await this.supabaseService.updatePerfil(this.form.value);
      // Fuerza detección de cambios después de actualizar.
      this.cdr.markForCheck();
      this.mostrarExito = true;
    } catch (error) {
      console.error('Error actualizando perfil', error);
    }
  }

  // Valida tamaño, sube la imagen seleccionada y refresca el avatar en pantalla.
  async onFileSelected(event: any) {
    const file: File = event.target.files[0];

    console.log('Archivo seleccionado:', file);

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 2MB');
      return;
    }

    try {
      const url = await this.supabaseService.subirAvatar(file);
      console.log('Avatar subido correctamente. URL:', url);
      this.perfil = {
        ...this.perfil,
        foto_url: url
      };
      // Fuerza detección de cambios para que la imagen se actualice inmediatamente con OnPush.
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Detalle error subiendo avatar:', error);
      console.error('Error subiendo avatar', error);
    }
  }

  // Limpia la foto de perfil en BD y actualiza la vista local con fallback.
  async eliminarFoto() {
    try {
      await this.supabaseService.eliminarAvatar();
      if (this.perfil) {
        this.perfil = {
          ...this.perfil,
          foto_url: null
        };
        // Fuerza detección de cambios para que la imagen se actualice inmediatamente.
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Error eliminando avatar', error);
    }
  }

  // Si la URL del avatar falla, usa la imagen por defecto.
  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }
}
