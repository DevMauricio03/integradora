import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil { }
