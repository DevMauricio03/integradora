import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-impulso-final',
  imports: [],
  templateUrl: './impulsoFinal.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpulsoFinal { }
