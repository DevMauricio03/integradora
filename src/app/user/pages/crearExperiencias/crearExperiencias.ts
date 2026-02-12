import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-crear-experiencias',
  imports: [],
  templateUrl: './crearExperiencias.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearExperiencias { }
