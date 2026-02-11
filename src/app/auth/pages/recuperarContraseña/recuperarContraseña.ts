import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recuperar-contraseña',
  imports: [],
  templateUrl: './recuperarContraseña.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarContraseña { }
