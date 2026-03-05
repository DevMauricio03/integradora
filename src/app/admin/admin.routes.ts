import { Routes } from '@angular/router';
import { AdminLayout } from './components/adminLayout/adminLayout';
import { Dashboard } from './pages/dashboard/dashboard';
import { AdminUsers } from './pages/users/users';
import { AdminPublications } from './pages/publications/publications';
import { AdminReports } from './pages/reports/reports';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        component: AdminLayout,
        children: [
            {
                path: 'dashboard',
                component: Dashboard
            },
            {
                path: 'users',
                component: AdminUsers
            },
            {
                path: 'publications',
                component: AdminPublications
            },
            {
                path: 'reports',
                component: AdminReports
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
