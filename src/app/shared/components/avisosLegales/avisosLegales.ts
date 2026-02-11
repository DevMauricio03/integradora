import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-avisos-legales',
  imports: [],
  templateUrl: './avisosLegales.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisosLegales { }
