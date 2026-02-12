import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-crear-oferta',
  imports: [],
  templateUrl: './crearOferta.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearOferta { }
