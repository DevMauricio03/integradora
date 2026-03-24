import { Routes } from '@angular/router';
import { UserLayoutComponent } from './components/userLayout/userLayout';
import { EditarPerfilPage } from './pages/editPerfil/editPerfil';
import { AuthGuard } from '../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'feed',
        loadComponent: () =>
          import('./pages/feed/feed').then(m => m.Feed),
        data: { title: 'Inicio', showCreateButton: true }
      },
      {
        path: 'feed/boost/plan-selection',
        loadComponent: () => import('./pages/feed/boost/plan-selection/plan-selection').then(m => m.PlanSelectionComponent),
        data: { title: 'Impulsar' }
      },
      {
        path: 'feed/boost/payment',
        loadComponent: () => import('./pages/feed/boost/payment/payment').then(m => m.PaymentComponent),
        data: { title: 'Pago' }
      },
      {
        path: 'feed/boost/success',
        loadComponent: () => import('./pages/feed/boost/success/success').then(m => m.SuccessComponent),
        data: { title: 'Impulsado' }
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil').then(m => m.PerfilPublicoPage),
        data: { title: 'Perfil', showCreateButton: true, hideSearch: true, centerTitle: true }
      },

      {
        path: 'perfil/editar',
        component: EditarPerfilPage,
        canActivate: [AuthGuard],
        data: { title: 'Editar Perfil', hideSearch: true, centerTitle: true }
      },
      {
        path: 'experiencias',
        loadComponent: () =>
          import('./pages/experiencias/experiencias').then(m => m.Experiencias),
        data: { title: 'Experiencias Empresariales', showCreateButton: true }
      },
      {
        path: 'experiencias/:id',
        loadComponent: () =>
          import('./pages/experienciasCompletas/experienciaDetalle').then(m => m.ExperienciaDetallePage),
        data: { title: 'Detalle de Experiencia', hideSearch: true, centerTitle: true }
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./pages/avisos-oficiales/avisos-oficiales').then(m => m.AvisosOficiales),
        data: { title: 'Avisos Oficiales', showCreateButton: true }
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('../shared/components/create-post/create-post.component')
            .then(m => m.CreatePostComponent),
        data: { title: 'Nueva Publicación', hideSearch: true, centerTitle: true }
      },
      {
        path: 'crear/exito',
        loadComponent: () =>
          import('./pages/PublicacionComple/PublicacionComple').then(m => m.PublicacionComple),
        data: { title: 'Publicado', hideSearch: true }
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./pages/configuracion/configuracion').then(m => m.Configuracion),
        data: { title: 'Configuración', hideSearch: true }
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/notificaciones/notificaciones').then(m => m.Notificaciones),
        data: { title: 'Notificaciones', hideSearch: true, centerTitle: true }
      },
      {
        path: '',
        redirectTo: 'feed',
        pathMatch: 'full'
      }
    ]
  }
];