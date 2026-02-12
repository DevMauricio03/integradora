import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-avisos-legales',
  imports: [],
  template: `<p>avisosLegales works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisosLegales { }
