import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
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
export class PostCardComponent {
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

  openImage(img: string) {
    this.selectedImage.set(img);
  }

  closeImage() {
    this.selectedImage.set(null);
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