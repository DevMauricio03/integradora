import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-experiencias-completas',
  imports: [],
  templateUrl: './experienciasCompletas.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienciasCompletas { }
