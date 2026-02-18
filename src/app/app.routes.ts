import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
 {
    path: '',
    redirectTo: 'auth/bienvenida',
    pathMatch: 'full'
  },

  
{
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },

  {
    path: 'user',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./user/user.routes')
        .then(m => m.USER_ROUTES)
  }
];
