import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-comentarios',
  imports: [],
  template: `<p>comentarios works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comentarios { }
