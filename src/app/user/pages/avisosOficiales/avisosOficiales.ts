import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-avisos-oficiales',
  imports: [],
  templateUrl: './avisosOficiales.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisosOficiales { }
