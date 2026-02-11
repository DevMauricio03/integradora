import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bienvenida',
  imports: [],
  templateUrl: './bienvenida.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bienvenida { }
