import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, ViewChild, ElementRef, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from "../../icon/icon.component";

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit, OnChanges {
  @Input() id: string = '';

  @Input() author: string = '';
  @Input() role: string = '';
  @Input() time: string = '';
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() category: string | undefined = '';
  @Input() badge: string | undefined = '';
  @Input() image: string | undefined = '';
  @Input() images: string[] | undefined = [];
  @Input() avatar: string | undefined = '';
  @Input() expirationDate: string | undefined = '';
  @Input() details: any = {};
  @Input() showControls: boolean = false;
  @Input() estado: string = 'activo';
  @Output() report = new EventEmitter<void>();

  selectedImage = signal<string | null>(null);
  firstImageOrientation = signal<'landscape' | 'portrait' | 'square'>('landscape');

  @ViewChild('imageDialog') imageDialog!: ElementRef<HTMLDialogElement>;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.checkFirstImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['images'] || changes['image']) {
      this.checkFirstImage();
    }
  }

  checkFirstImage() {
    const firstImg = (this.images && this.images.length > 0) ? this.images[0] : this.image;
    if (!firstImg) return;

    const img = new Image();
    img.onload = () => {
      // Usar 1.1 de ratio para no ser tan estrictos con cuadros casi-cuadrados
      if (img.width > img.height * 1.1) {
        this.firstImageOrientation.set('landscape');
      } else if (img.height > img.width * 1.1) {
        this.firstImageOrientation.set('portrait');
      } else {
        this.firstImageOrientation.set('square');
      }
      this.cdr.detectChanges(); // Forzar renderizado pues esto corre asíncronamente
    };
    img.src = firstImg;
  }

  openImage(img: string) {
    this.selectedImage.set(img);
    // Angular needs a tick to render the @if block before we can access the native dialog
    setTimeout(() => {
      this.imageDialog?.nativeElement?.showModal();
      document.body.classList.add('modal-open');
    }, 0);
  }

  closeImage() {
    this.imageDialog?.nativeElement?.close();
    this.selectedImage.set(null);
    document.body.classList.remove('modal-open');
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (!this.images || this.images.length <= 1) return;
    const currentIdx = this.images.indexOf(this.selectedImage()!);
    const prevIdx = (currentIdx - 1 + this.images.length) % this.images.length;
    this.selectedImage.set(this.images[prevIdx]);
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (!this.images || this.images.length <= 1) return;
    const currentIdx = this.images.indexOf(this.selectedImage()!);
    const nextIdx = (currentIdx + 1) % this.images.length;
    this.selectedImage.set(this.images[nextIdx]);
  }

  notifyReport() {
    this.report.emit();
  }

  getBadgeText(): string {
    if (!this.badge) return '';
    const b = this.badge.toLowerCase();
    if (b === 'oferta') {
      return this.details?.subtype || 'Oferta';
    }
    if (b === 'experiencia') return 'Exp. Empresarial';
    if (b === 'aviso oficial') return 'Aviso Oficial';
    return this.badge;
  }

  getBadgeIcon(): IconName {
    const text = this.getBadgeText().toLowerCase();
    if (text.includes('evento')) return 'calendar';
    if (text.includes('producto')) return 'package';
    if (text.includes('servicio')) return 'tool';
    if (text.includes('exp. empresarial') || text.includes('experiencia')) return 'briefcase';
    if (text.includes('aviso oficial')) return 'alert-triangle';
    return 'megaphone';
  }

  getBadgeClass(): string {
    const text = this.getBadgeText().toLowerCase();
    if (text.includes('evento')) return 'badge-evento';
    if (text.includes('producto')) return 'badge-producto';
    if (text.includes('servicio')) return 'badge-servicio';
    if (text.includes('exp. empresarial') || text.includes('experiencia')) return 'badge-experiencia';
    if (text.includes('aviso oficial')) return 'badge-aviso-oficial';
    return 'badge-aviso';
  }

}