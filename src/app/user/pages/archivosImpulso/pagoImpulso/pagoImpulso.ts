import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-pago-impulso',
  imports: [],
  templateUrl: './pagoImpulso.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagoImpulso { }
