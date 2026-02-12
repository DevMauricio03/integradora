import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  imports: [],
  template: `<p>statusBadge works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge { }
