import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-planes-impulso',
  imports: [],
  templateUrl: './planesImpulso.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanesImpulso { }
