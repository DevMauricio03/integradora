import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'registro',
        loadComponent: () =>
          import('./pages/registro/registro')
            .then(m => m.RegistroPage)
      },
      {
        path: 'inicio-sesion',
        loadComponent: () =>
          import('./pages/inicioSesion/inicioSesion')
            .then(m => m.InicioSesion)
      },
      {
        path: 'bienvenida',
        loadComponent: () =>
          import('./pages/bienvenida/bienvenida')
            .then(m => m.Bienvenida)
      },
      {
        path: 'confirmacion-correo',
        loadComponent: () =>
          import('./pages/confirmacionCorreo/confirmacionCorreo')
            .then(m => m.ConfirmacionCorreo)
      }
    ]
  }
];
