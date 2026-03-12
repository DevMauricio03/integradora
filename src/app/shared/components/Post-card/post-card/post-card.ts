import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, ViewChild, ElementRef, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from "../../icon/icon.component";

import { ShareModalComponent } from '../../share-modal/share-modal';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, IconComponent, ShareModalComponent],
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
  @Input() authorId: string = '';
  @Input() currentUserId: string = '';
  /** En vista previa: oculta acciones del footer (reporte, compartir) */
  @Input() isPreview: boolean = false;
  /** En feed de experiencias: trunca el contenido y muestra CTA */
  @Input() truncate: boolean = false;
  @Output() report = new EventEmitter<void>();
  @Output() viewFull = new EventEmitter<string>();
  @Output() deleted = new EventEmitter<string>();

  get isAuthor(): boolean {
    return !!this.currentUserId && this.currentUserId === this.authorId;
  }

  selectedImage = signal<string | null>(null);
  firstImageOrientation = signal<'landscape' | 'portrait' | 'square'>('landscape');
  showShareModal = signal(false);
  shareUrl = signal('');

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

  notifyDelete() {
    this.deleted.emit(this.id);
  }

  notifyViewFull() {
    this.viewFull.emit(this.id);
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

  /**
   * Convierte una URL de Supabase Storage a una versión thumbnail ultra-ligera.
   *
   * Supabase expone: /storage/v1/render/image/public/<bucket>/<path>?width=40&quality=20
   * La versión tiny (~2-5 kB) es ideal para .blurred-bg porque blur(8px)
   * elimina el detalle de alta frecuencia de todos modos.
   *
   * URLs que no sean de Supabase Storage se devuelven sin cambios.
   */
  /**
   * Convierte una URL de Supabase Storage a una versión thumbnail ultra-ligera.
   */
  getThumbnailUrl(url: string | undefined): string {
    if (!url) return '';
    const marker = '/storage/v1/object/public/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const base = url.substring(0, idx);
    const cleanPath = url.substring(idx + marker.length).split('?')[0];
    return `${base}/storage/v1/render/image/public/${cleanPath}?width=40&quality=20&resize=cover`;
  }

  /**
   * Genera la URL de la publicación y abre el modal de compartir.
   */
  handleShare(event: Event) {
    event.stopPropagation();
    const baseUrl = window.location.origin;

    const isExperiencia = this.badge?.toLowerCase() === 'experiencia';
    const path = isExperiencia
      ? `/user/experiencias/${this.id}`
      : `/user/post/${this.id}`;

    this.shareUrl.set(`${baseUrl}${path}`);
    this.showShareModal.set(true);
  }

  closeShareModal() {
    this.showShareModal.set(false);
  }

  /**
   * Verifica si el método de contacto es WhatsApp
   */
  isWhatsAppContact(): boolean {
    return this.details?.contactMethod?.toLowerCase() === 'whatsapp';
  }

  /**
   * Limpia el número de teléfono removiendo espacios, guiones y caracteres especiales
   * excepto el símbolo + inicial si existe
   */
  cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Si comienza con +, lo preservamos temporalmente
    const hasPlus = phone.trim().startsWith('+');
    
    // Remover todos los caracteres que no sean dígitos
    let cleaned = phone.replace(/\D/g, '');
    
    // Si no tiene código de país y tiene 10 dígitos (formato mexicano sin código)
    // agregamos el código de país de México (52)
    if (cleaned.length === 10 && !hasPlus) {
      cleaned = '52' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Genera el enlace de WhatsApp con mensaje prellenado
   */
  getWhatsAppLink(): string {
    if (!this.details?.phoneNumber) return '#';
    
    const cleanedNumber = this.cleanPhoneNumber(this.details.phoneNumber);
    
    if (!cleanedNumber) return '#';
    
    // Crear mensaje prellenado
    const message = `Hola, vi tu publicación "${this.title}" en Tuunka y me gustaría pedir más información.`;
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
  }

  /**
   * Abre WhatsApp en una nueva pestaña
   */
  openWhatsApp(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const link = this.getWhatsAppLink();
    
    if (link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }
}