import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mod-report',
  imports: [],
  templateUrl: './modReport.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModReport { }
