import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { PostCardComponent } from '../Post-card/post-card/post-card';
import { PostStoreService } from '../../../core/services/post-store.service';
import { Router } from '@angular/router';
import { NormasComunidad } from '../avisosLegales/normasComunidad';
import { IconComponent } from '../icon/icon.component';
import { CommonModule } from '@angular/common';
import { form, required, submit, FormField, SchemaPathTree, maxLength, validate } from '@angular/forms/signals';

interface PostFormModel {
  type: string;
  subtype: string | null;
  title: string;
  description: string;
  category: string;
  image: string;
  images: string[];

  // Evento fields
  startDate: string;
  endDate: string;
  modality: string;
  location: string;
  cost: string;

  // Oferta fields
  price: string;
  priceUnit: string;
  productStatus: string;
  availability: string;
  serviceType: string;
  availableHours: string;
  contactMethod: string;
  phoneNumber: string;

  // Experiencia fields
  company: string;
  area: string;
  period: string;
  recommendation: string;
}

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [PostCardComponent, NormasComunidad, IconComponent, CommonModule, FormField],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostComponent {

  step = signal<'form' | 'preview'>('form');
  showRules = signal(false);
  isPublishing = signal(false);
  selectedSubtype = signal<'producto' | 'servicio' | null>(null);
  private imageFiles = signal<File[]>([]);

  // ── Promise Guard (prevención de race conditions) ────────────
  private _publishPromise: Promise<void> | null = null;

  private readonly postStore = inject(PostStoreService);
  private readonly router = inject(Router);

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

  postModel = signal<PostFormModel>({
    type: 'aviso',
    subtype: null,
    title: '',
    description: '',
    category: 'General',
    image: '',
    images: [],
    startDate: '',
    endDate: '',
    modality: 'Presencial',
    location: '',
    cost: '',
    price: '',
    priceUnit: 'c.u',
    productStatus: 'Nuevo',
    availability: 'Entrega inmediata',
    serviceType: '',
    availableHours: '',
    contactMethod: 'WhatsApp',
    phoneNumber: '',
    company: '',
    area: '',
    period: '',
    recommendation: ''
  });

  postForm = form(this.postModel, (schema: SchemaPathTree<PostFormModel>) => {
    // Validaciones declarativas
    required(schema.type, { message: 'Selecciona un tipo de publicación' });

    required(schema.title, { message: 'El título es obligatorio' });
    maxLength(schema.title, 100, { message: 'Máximo 100 caracteres' });
    validate(schema.title, (ctx) => {
      const val = ctx.value() || '';
      return val.length >= 5 ? null : { kind: 'minLength', message: 'Mínimo 5 caracteres' };
    });

    required(schema.description, { message: 'La descripción es obligatoria' });
    maxLength(schema.description, 1000, { message: 'Máximo 1000 caracteres' });
    validate(schema.description, (ctx) => {
      const val = ctx.value() || '';
      return val.length >= 10 ? null : { kind: 'minLength', message: 'Mínimo 10 caracteres' };
    });
  });

  currentType = computed(() => this.postModel().type);

  selectType(typeId: string) {
    this.postModel.update(m => {
      const newModel = { ...m, type: typeId };
      if (typeId !== 'oferta') {
        newModel.subtype = null;
        this.selectedSubtype.set(null);
      } else if (!this.selectedSubtype()) {
        newModel.subtype = 'producto';
        this.selectedSubtype.set('producto');
      }
      return newModel;
    });
  }

  selectSubtype(subtypeId: 'producto' | 'servicio') {
    this.selectedSubtype.set(subtypeId);
    this.postModel.update(m => ({ ...m, subtype: subtypeId }));
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

  goToPreview(event: Event) {
    event.preventDefault();

    // Si hay validaciones asíncronas pendientes, esperamos
    if (this.postForm().pending()) return;

    // submit() evalúa el esquema del form, toca los campos si hay error
    // y solo ejecuta el callback si es 100% válido.
    submit(this.postForm, async () => {
      this.step.set('preview');
    });
  }

  backToForm() {
    this.step.set('form');
  }

  async publish() {
    if (this.isPublishing()) return;

    // ── Guard: reutilizar Promise si ya hay una en vuelo
    if (this._publishPromise) return this._publishPromise;

    this.isPublishing.set(true);

    this._publishPromise = (async () => {
      try {
        const postData = { ...this.postModel() };

        // 1. Subir imágenes si hay archivos seleccionados
        if (this.imageFiles().length > 0) {
          console.log('Subiendo archivos:', this.imageFiles());
          const urls = await this.postStore.uploadPostImages(this.imageFiles());
          console.log('URLs obtenidas:', urls);

          if (urls.length === 0) {
            throw new Error('No se pudieron subir las imágenes. Verifica que el bucket "publicaciones" exista y sea público.');
          }

          postData.images = urls;
          postData.image = urls[0];
        }

        await this.postStore.addPost(postData);
        this.router.navigate(['/user/crear/exito'], { state: { post: postData } });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error detallado al publicar:', message);
        alert('Error: ' + message);
      } finally {
        this.isPublishing.set(false);
      }
    })().finally(() => {
      this._publishPromise = null;
    });

    return this._publishPromise;
  }

  handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    // Limitamos a 4 imágenes máximo
    const currentImages = this.postModel().images;
    if (currentImages.length + files.length > 4) {
      alert('Máximo 4 imágenes por publicación');
      return;
    }

    // Guardamos los archivos para subirlos después
    this.imageFiles.update(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.postModel.update(m => ({
          ...m,
          images: [...m.images, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.postModel.update(m => ({
      ...m,
      images: m.images.filter((_, i) => i !== index)
    }));
    this.imageFiles.update(prev => prev.filter((_, i) => i !== index));
  }

  onNumericInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }
}