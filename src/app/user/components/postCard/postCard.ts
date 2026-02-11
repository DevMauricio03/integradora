import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-post-card',
  imports: [],
  template: `<p>postCard works!</p>`,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCard { }
