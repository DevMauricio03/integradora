import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-edit-perfil',
  imports: [],
  templateUrl: './editPerfil.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPerfil { }
