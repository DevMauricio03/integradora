import { Routes } from '@angular/router';
import { RegistroPage } from './auth/pages/registro/registro';

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
  }
];
