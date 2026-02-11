import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-soporte',
  imports: [],
  templateUrl: './soporte.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Soporte { }
