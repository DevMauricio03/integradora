import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostCardComponent } from '../Post-card/post-card/post-card';
import { PostStoreService } from '../../../core/services/post-store.service';
import { Router } from '@angular/router';
import { NormasComunidad } from '../avisosLegales/normasComunidad';
import { IconComponent } from '../icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [ReactiveFormsModule, PostCardComponent, NormasComunidad, IconComponent, CommonModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostComponent {

  step = signal<'form' | 'preview'>('form');
  showRules = signal(false);
  isPublishing = signal(false);

  private fb = inject(FormBuilder);
  private postStore = inject(PostStoreService);
  private router = inject(Router);

  types = [
    { id: 'aviso', name: 'Aviso', desc: 'Noticias generales', icon: 'megaphone' },
    { id: 'evento', name: 'Evento', desc: 'Fechas y lugares', icon: 'calendar' },
    { id: 'oferta', name: 'Oferta', desc: 'Productos y servicios', icon: 'tag' },
    { id: 'experiencia', name: 'Exp. Empresarial', desc: 'Práctica y empleo', icon: 'briefcase' }
  ];

  categories = [
    'Académico',
    'Deportes',
    'Cultura',
    'Avisos Oficiales',
    'Bolsa de Trabajo',
    'Ventas/Servicios'
  ];

  form = this.fb.group({
    type: ['aviso', Validators.required],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    category: ['', Validators.required],
    expirationDate: [''],
    image: ['']
  });

  selectType(typeId: string) {
    this.form.patchValue({ type: typeId });
  }

  cancel() {
    this.router.navigate(['/user/feed']);
  }

  goBack() {
    this.router.navigate(['/user/feed']);
  }

  openRules() {
    this.showRules.set(true);
  }

  closeRules() {
    this.showRules.set(false);
  }

  goToPreview() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.step.set('preview');
  }

  backToForm() {
    this.step.set('form');
  }

  async publish() {
    if (this.form.invalid || this.isPublishing()) return;

    this.isPublishing.set(true);

    try {
      const postData = this.form.value;
      await this.postStore.addPost(postData as any);
      this.router.navigate(['/user/feed']);
    } catch (err: any) {
      console.error('Error detallado al publicar:', err?.message || err);
      alert('Error al publicar: ' + (err?.message || 'Verifica la consola para más detalles'));
    } finally {
      this.isPublishing.set(false);
    }
  }

  handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.form.patchValue({
        image: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  }
}