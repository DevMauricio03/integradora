import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reporte',
  imports: [],
  template: `<p>reporte works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reporte { }
