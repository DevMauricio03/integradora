import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'feed',
    loadComponent: () =>
      import('./pages/feed/feed')
        .then(m => m.Feed)
  }
];