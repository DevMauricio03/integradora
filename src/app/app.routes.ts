import { Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';
import { UserGuard } from './core/guards/user.guard';

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
    canActivate: [UserGuard],
    loadChildren: () =>
      import('./user/user.routes')
        .then(m => m.USER_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  }
];
