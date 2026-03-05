import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    template: `
    <span [class]="getBadgeClasses()">
      {{ text }}
    </span>
  `,
    styles: [`
    .base-badge {
      display: inline-block;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    
    /* Variantes por contexto */
    .variant-status {
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    
    .variant-mod {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: none;
    }

    /* Colores */
    .color-active {
      background: #D1FAE5;
      color: #059669;
    }

    .color-pending {
      background: #FEF3C7;
      color: #D97706;
    }

    .color-suspended {
      background: #F3E8FF;
      color: var(--text-secondary);
    }

    .color-spam {
      background: #FEE2E2;
      color: #EF4444;
    }

    .color-group {
      background: #DBEAFE;
      color: #3B82F6;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadge {
    @Input({ required: true }) text!: string;
    @Input() type: 'active' | 'pending' | 'suspended' | 'spam' | 'group' = 'active';

    getBadgeClasses(): string {
        let variant = 'variant-status';
        if (this.type === 'spam' || this.type === 'group') {
            variant = 'variant-mod';
        }

        return `base-badge ${variant} color-${this.type}`;
    }
}
