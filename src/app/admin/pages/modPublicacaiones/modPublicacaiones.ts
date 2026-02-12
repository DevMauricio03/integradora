import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mod-publicacaiones',
  imports: [],
  templateUrl: './modPublicacaiones.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModPublicacaiones { }
