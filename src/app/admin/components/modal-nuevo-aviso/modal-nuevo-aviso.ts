import { ChangeDetectionStrategy, Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { form, required, submit, FormField, SchemaPathTree, maxLength, validate } from '@angular/forms/signals';

interface AvisoFormModel {
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    imagen_url: string;
    contacto_url: string;
    ciudad: string;
}

@Component({
    selector: 'app-modal-nuevo-aviso',
    standalone: true,
    imports: [CommonModule, IconComponent, FormField, PostCardComponent],
    templateUrl: './modal-nuevo-aviso.html',
    styleUrls: ['./modal-nuevo-aviso.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalNuevoAviso {
    closed = output<void>();
    avisoCreado = output<void>();

    private readonly supabase = inject(SupabaseService);

    step = signal<'form' | 'preview'>('form');
    isPublishing = signal(false);

    postModel = signal<AvisoFormModel>({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        imagen_url: '',
        contacto_url: '',
        ciudad: 'Todas'
    });

    postForm = form(this.postModel, (schema: SchemaPathTree<AvisoFormModel>) => {
        required(schema.titulo, { message: 'El título es obligatorio' });
        maxLength(schema.titulo, 100, { message: 'Máximo 100 caracteres' });
        validate(schema.titulo, (ctx) => {
            const val = ctx.value() || '';
            return val.length >= 5 ? null : { kind: 'minLength', message: 'Mínimo 5 caracteres' };
        });

        required(schema.descripcion, { message: 'La descripción es obligatoria' });
        maxLength(schema.descripcion, 1000, { message: 'Máximo 1000 caracteres' });
        validate(schema.descripcion, (ctx) => {
            const val = ctx.value() || '';
            return val.length >= 10 ? null : { kind: 'minLength', message: 'Mínimo 10 caracteres' };
        });

        validate(schema.fecha_fin, (ctx) => {
            const fIn = this.postModel().fecha_inicio;
            const fFin = ctx.value();
            if (fIn && fFin && new Date(fFin).getTime() < new Date(fIn).getTime()) {
                return { kind: 'fechasInvalidas', message: 'La fecha de fin debe ser posterior a la de inicio' };
            }
            return null;
        });
    });

    errorMensaje = signal('');

    handleFile(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            this.postModel.update(m => ({
                ...m,
                imagen_url: reader.result as string
            }));
        };
        reader.readAsDataURL(file);
    }

    removeImage(event: Event) {
        event.stopPropagation();
        this.postModel.update(m => ({
            ...m,
            imagen_url: ''
        }));
    }

    goToPreview(event: Event) {
        event.preventDefault();
        this.errorMensaje.set('');

        if (this.postForm().pending()) return;

        submit(this.postForm, async () => {
            this.step.set('preview');
        });
    }

    backToForm() {
        this.step.set('form');
    }

    async publish() {
        if (this.isPublishing()) return;
        this.isPublishing.set(true);
        this.errorMensaje.set('');

        const data = this.postModel();

        try {
            const { error } = await this.supabase.crearAnuncio({
                titulo: data.titulo,
                descripcion: data.descripcion,
                imagen_url: data.imagen_url || null,
                contacto_url: data.contacto_url || null,
                ciudad: data.ciudad,
                fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio).toISOString() : new Date().toISOString(),
                fecha_fin: data.fecha_fin ? new Date(data.fecha_fin).toISOString() : new Date().toISOString()
            });

            if (error) {
                throw error;
            }

            this.avisoCreado.emit();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.errorMensaje.set('Error al guardar el aviso: ' + message);
        } finally {
            this.isPublishing.set(false);
        }
    }

    abrirCalendario(input: HTMLInputElement) {
        try {
            if (typeof input.showPicker === 'function') {
                input.showPicker();
            }
        } catch (e) {
            console.warn('No se pudo abrir el calendario:', e);
        }
    }
}
