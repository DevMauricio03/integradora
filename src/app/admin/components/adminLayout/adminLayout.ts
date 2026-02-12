import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  imports: [],
  template: `<p>adminLayout works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout { }
