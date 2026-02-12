import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-detalle-modal',
  imports: [],
  template: `<p>detalleModal works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleModal { }
