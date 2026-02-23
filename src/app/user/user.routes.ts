import { Routes } from '@angular/router';
import { UserLayoutComponent } from './components/userLayout/userLayout';
import { EditarPerfilPage } from './pages/editPerfil/editPerfil';
import { AuthGuard } from '../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      {
      path: 'feed',
      loadComponent: () =>
        import('./pages/feed/feed').then(m => m.Feed),
      data: { title: 'Inicio',showCreateButton: true }
    },
    {
      path: 'perfil',
      loadComponent: () =>
        import('./pages/perfil/perfil').then(m => m.PerfilPublicoPage),
      data: { title: 'Perfil', showCreateButton: true }
    },
    
    {
    path: 'perfil/editar',
    component: EditarPerfilPage,
    canActivate: [AuthGuard]
  },
  {
      path: 'experiencias',
      loadComponent: () =>
        import('./pages/experiencias/experiencias').then(m => m.Experiencias),
      data: { title: 'Experiencias Empresariales', showCreateButton: true }
    },
    {
  path: 'crear',
  loadComponent: () =>
    import('../shared/components/create-post/create-post.component')
      .then(m => m.CreatePostComponent),
  data: { title: 'Nueva Publicación' }
},
      {
        path: '',
        redirectTo: 'feed',
        pathMatch: 'full'
      }
    ]
  }
];