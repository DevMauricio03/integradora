import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-registro',
  imports: [],
  templateUrl: './registro.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro { }
