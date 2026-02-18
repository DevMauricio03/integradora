import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-normas-comunidad',
  imports: [],
  template: `<p>normasComunidad works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormasComunidad { }
