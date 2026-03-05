import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { EditarPerfilPage } from './user/pages/editPerfil/editPerfil';
import { PerfilPublicoPage } from './user/pages/perfil/perfil';

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
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  }
];
