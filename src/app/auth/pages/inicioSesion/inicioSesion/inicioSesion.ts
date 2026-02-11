import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-inicio-sesion',
  imports: [],
  templateUrl: './inicioSesion.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioSesion { }
