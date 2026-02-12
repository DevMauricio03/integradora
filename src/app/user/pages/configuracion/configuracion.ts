import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  imports: [],
  templateUrl: './configuracion.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Configuracion { }
