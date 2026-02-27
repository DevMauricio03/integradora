import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from "../../icon/icon.component";

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {

  @Input() author: string = '';
  @Input() role: string = '';
  @Input() time: string = '';
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() category: string | undefined = '';
  @Input() badge: string | undefined = '';
  @Input() image: string | undefined = '';
  @Input() avatar: string | undefined = '';
  @Input() expirationDate: string | undefined = '';
  @Input() details: any = {};
  @Input() showControls: boolean = false;

  getBadgeText(): string {
    if (!this.badge) return '';
    const b = this.badge.toLowerCase();
    if (b === 'oferta') {
      return this.details?.subtype || 'Oferta';
    }
    if (b === 'experiencia') return 'Exp. Empresarial';
    return this.badge;
  }

  getBadgeIcon(): any {
    const text = this.getBadgeText().toLowerCase();
    if (text.includes('evento')) return 'calendar';
    if (text.includes('producto')) return 'package';
    if (text.includes('servicio')) return 'tool';
    if (text.includes('exp. empresarial') || text.includes('experiencia')) return 'briefcase';
    return 'megaphone';
  }

  getBadgeClass(): string {
    const text = this.getBadgeText().toLowerCase();
    if (text.includes('evento')) return 'badge-evento';
    if (text.includes('producto')) return 'badge-producto';
    if (text.includes('servicio')) return 'badge-servicio';
    if (text.includes('exp. empresarial') || text.includes('experiencia')) return 'badge-experiencia';
    return 'badge-aviso';
  }

}