import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  imports: [],
  template: `<p>filterBar works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar { }
