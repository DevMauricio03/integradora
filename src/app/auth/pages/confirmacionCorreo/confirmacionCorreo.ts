import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-confirmacion-correo',
  imports: [],
  templateUrl: './confirmacionCorreo.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionCorreo { }
