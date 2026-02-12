import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-publicado',
  imports: [],
  templateUrl: './publicado.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Publicado { }
