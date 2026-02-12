import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-nueva-publicacion',
  imports: [],
  templateUrl: './nuevaPublicacion.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaPublicacion { }
