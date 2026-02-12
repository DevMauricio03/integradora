import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-notificaciones',
  imports: [],
  templateUrl: './notificaciones.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notificaciones { }
