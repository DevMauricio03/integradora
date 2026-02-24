import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    @if (paths().length) {
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="display: inline-block; vertical-align: middle;"
      >
        @for (d of paths(); track d) {
          <path [attr.d]="d" />
        }
      </svg>
    }
  `
})
export class IconComponent {

  @Input() name: 'plus' | 'bell' | 'flag' | 'home' | 'briefcase' | 'megaphone' | 'user' | 'settings' | 'search' | 'users' | 'shield' | 'graduation' | 'ban' | 'calendar' | 'tag' | 'upload' | 'arrow-left' | 'check' | 'chevron-down' = 'plus';
  @Input() size: number = 18;

  private icons = {
    plus: ['M12 5v14', 'M5 12h14'],
    bell: [
      'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7',
      'M13.73 21a2 2 0 0 1-3.46 0'
    ],
    flag: [
      'M4 15V5a2 2 0 0 1 2-2h11l-1.68 5.06a2 2 0 0 0 0 1.88L17 15H6a2 2 0 0 1-2-2z'
    ],
    home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
    briefcase: ['M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M2 21h20', 'M13 11a2 2 0 1 1-2 2 2 2 0 0 1 2-2z'],
    megaphone: ['M11 5L6 9H2v6h4l5 4V5z', 'M19.07 4.93a10 10 0 0 1 0 14.14', 'M15.54 8.46a5 5 0 0 1 0 7.07'],
    user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'],
    search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
    users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M8 11l3 3 5-5'],
    graduation: ['M22 10v6M2 10l10-5 10 5-10 5z', 'M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5'],
    ban: ['M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', 'M4.93 4.93l14.14 14.14'],
    calendar: ['M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
    tag: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
    upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
    'arrow-left': ['M19 12H5', 'M12 19l-7-7 7-7'],
    check: ['M20 6L9 17l-5-5'],
    'chevron-down': ['M6 9l6 6 6-6']
  };

  paths = computed(() => this.icons[this.name] || []);

}