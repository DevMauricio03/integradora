import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      *ngIf="paths().length"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="color: #1a1a1a; display: inline-block; vertical-align: middle;"
    >
      <ng-container *ngFor="let d of paths()">
        <path [attr.d]="d" />
      </ng-container>
    </svg>
  `
})
export class IconComponent {

  @Input() name: 'plus' | 'bell' | 'flag' = 'plus';
  @Input() size: number = 18;

  private icons = {
    plus: ['M12 5v14', 'M5 12h14'],
    bell: [
      'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7',
      'M13.73 21a2 2 0 0 1-3.46 0'
    ],
    flag: [
      'M4 15V5a2 2 0 0 1 2-2h11l-1.68 5.06a2 2 0 0 0 0 1.88L17 15H6a2 2 0 0 1-2-2z'
    ]
  };

  paths = computed(() => this.icons[this.name] || []);

}