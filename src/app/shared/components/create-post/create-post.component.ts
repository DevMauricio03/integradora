import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostCardComponent } from '../Post-card/post-card/post-card';
import { PostStoreService } from '../../../core/services/post-store.service';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [ReactiveFormsModule, PostCardComponent],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostComponent {

  step = signal<'form' | 'preview'>('form');
  showRules = signal(false);

private fb = inject(FormBuilder);
private postStore = inject(PostStoreService);

@Output() postCreated = new EventEmitter<any>();

form = this.fb.group({
  type: ['aviso', Validators.required],
  title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50)]],
  description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
  category: ['', Validators.required],
  expirationDate: [''],
  image: ['']
});

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

  openRules() {
    this.showRules.set(true);
  }

  closeRules() {
    this.showRules.set(false);
  }

  publish() {
  if (this.form.invalid) return;

  const postData = this.form.value;

  this.postStore.addPost(postData as any);

  this.step.set('form');
  this.showRules.set(false);

  // cerrar modal (si lo controlas por output)
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