import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mod-usuarios',
  imports: [],
  templateUrl: './modUsuarios.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModUsuarios { }
