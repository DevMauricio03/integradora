import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-feed-services',
  imports: [],
  template: `<p>feedServices works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedServices { }
