import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { form, required, submit, FormField, SchemaPathTree, pattern, maxLength } from '@angular/forms/signals';

interface EditPerfilModel {
  nombre: string;
  apellidos: string;
  rol_id: string;
  universidad_id: string;
  carrera_id: string;
  anioGraduacion: string;
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
  mostrarExito = signal(false);
  perfil = signal<any>(null);
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  editModel = signal<EditPerfilModel>({
    nombre: '',
    apellidos: '',
    rol_id: '',
    universidad_id: '',
    carrera_id: '',
    anioGraduacion: ''
  });

  editForm = form(this.editModel, (schema: SchemaPathTree<EditPerfilModel>) => {
    required(schema.nombre, { message: 'El nombre es obligatorio' });
    pattern(schema.nombre, /.*\S.*/, { message: 'El nombre no puede estar vacío' });
    maxLength(schema.nombre, 50, { message: 'Máximo 50 caracteres' });

    required(schema.apellidos, { message: 'Los apellidos son obligatorios' });
    pattern(schema.apellidos, /.*\S.*/, { message: 'Los apellidos no pueden estar vacíos' });
    maxLength(schema.apellidos, 50, { message: 'Máximo 50 caracteres' });
  });

  async ngOnInit() {
    const data = await this.supabaseService.getPerfilActual();
    if (data) {
      this.perfil.set(data);
      this.editModel.update(m => ({
        ...m,
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        rol_id: data.rol_id || '',
        universidad_id: data.universidad_id || '',
        carrera_id: data.carrera_id || '',
        anioGraduacion: data.anioGraduacion || ''
      }));
    }
  }

  irPerfil() {
    this.mostrarExito.set(false);
    this.router.navigate(['/user/perfil']);
  }

  async guardarCambios(event: Event) {
    event.preventDefault();

    if (this.editForm().pending()) return;

    submit(this.editForm, async () => {
      try {
        await this.supabaseService.updatePerfil(this.editModel());
        this.mostrarExito.set(true);
      } catch (error) {
        console.error('Error actualizando perfil', error);
      }
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 2MB');
      return;
    }

    try {
      const url = await this.supabaseService.subirAvatar(file);
      this.perfil.update(p => ({ ...p, foto_url: url }));
    } catch (error) {
      console.error('Error subiendo avatar', error);
    }
  }

  async eliminarFoto() {
    try {
      await this.supabaseService.eliminarAvatar();
      this.perfil.update(p => ({ ...p, foto_url: null }));
    } catch (error) {
      console.error('Error eliminando avatar', error);
    }
  }

  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }
}
