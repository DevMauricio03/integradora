import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-publicacion-comple',
  imports: [],
  templateUrl: './PublicacionComple.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionComple { }
