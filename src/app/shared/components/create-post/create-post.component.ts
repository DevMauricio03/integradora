import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
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
  selectedSubtype = signal<'producto' | 'servicio' | null>(null);

  private fb = inject(FormBuilder);
  private postStore = inject(PostStoreService);
  private router = inject(Router);

  types = [
    { id: 'aviso', name: 'Aviso', desc: 'Noticias generales', icon: 'megaphone' },
    { id: 'evento', name: 'Evento', desc: 'Fechas y lugares', icon: 'calendar' },
    { id: 'oferta', name: 'Oferta', desc: 'Productos y servicios', icon: 'tag' },
    { id: 'experiencia', name: 'Exp. Empresarial', desc: 'Práctica y empleo', icon: 'briefcase' }
  ];

  subtypes = [
    { id: 'producto', name: 'Producto', desc: 'Artículo físico tangible', icon: 'package' },
    { id: 'servicio', name: 'Servicio', desc: 'Habilidad o asistencia', icon: 'tool' }
  ];

  modalities = ['Presencial', 'Virtual', 'Híbrido'];
  productStatuses = ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Aceptable'];
  availabilities = ['Entrega inmediata', 'Bajo pedido', 'Próximamente'];
  contactMethods = ['WhatsApp', 'Llamada', 'Mensaje interno', 'Correo'];
  priceUnits = ['c.u', 'paquete', 'hora', 'servicio'];

  form = this.fb.group({
    type: ['aviso', Validators.required],
    subtype: [null as string | null],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    category: ['General'],
    image: [''],

    // Evento fields
    startDate: [''],
    endDate: [''],
    modality: ['Presencial'],
    location: [''],
    cost: [''],

    // Oferta (Producto/Servicio) fields
    price: [''],
    priceUnit: ['c.u'],
    productStatus: ['Nuevo'],
    availability: ['Entrega inmediata'],
    serviceType: [''],
    availableHours: [''],
    contactMethod: ['WhatsApp'],
    phoneNumber: [''],

    // Exp. Empresarial fields
    company: [''],
    area: [''],
    period: [''],
    recommendation: ['']
  });

  selectType(typeId: string) {
    this.form.patchValue({ type: typeId });
    if (typeId !== 'oferta') {
      this.selectedSubtype.set(null);
      this.form.patchValue({ subtype: null });
    } else if (!this.selectedSubtype()) {
      this.selectedSubtype.set('producto');
      this.form.patchValue({ subtype: 'producto' });
    }
  }

  selectSubtype(subtypeId: 'producto' | 'servicio') {
    this.selectedSubtype.set(subtypeId);
    this.form.patchValue({ subtype: subtypeId });
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

  get currentType() {
    return this.form.get('type')?.value;
  }
}