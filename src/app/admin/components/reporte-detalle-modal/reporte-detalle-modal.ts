import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reporte-detalle-modal',
  imports: [],
  template: `<p>reporte-detalle-modal works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteDetalleModal { }
