import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-restablecer-contraseña',
  imports: [],
  templateUrl: './restablecerContraseña.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestablecerContraseña { }
