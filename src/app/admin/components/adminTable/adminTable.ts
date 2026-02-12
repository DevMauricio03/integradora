import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-table',
  imports: [],
  template: `<p>adminTable works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTable { }
