import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-experiencias',
  imports: [],
  templateUrl: './experiencias.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experiencias { }
