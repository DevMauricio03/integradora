import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-feed',
  imports: [],
  templateUrl: './feed.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feed { }
