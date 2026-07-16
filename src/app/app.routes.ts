import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/enums';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'meus-pedidos',
        loadComponent: () =>
          import('./features/requests/my-requests/my-requests.component').then((m) => m.MyRequestsComponent),
        canActivate: [roleGuard([UserRole.COLABORADOR])],
      },
      {
        path: 'novo-pedido',
        loadComponent: () =>
          import('./features/requests/new-request/new-request.component').then((m) => m.NewRequestComponent),
        canActivate: [roleGuard([UserRole.COLABORADOR])],
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./features/requests/request-detail/request-detail.component').then(
            (m) => m.RequestDetailComponent,
          ),
      },
      {
        path: 'pedidos-pendentes',
        loadComponent: () =>
          import('./features/requests/pending-requests/pending-requests.component').then(
            (m) => m.PendingRequestsComponent,
          ),
        canActivate: [roleGuard([UserRole.APROVADOR])],
      },
      {
        path: 'pedidos-pendentes/:id/decisao',
        loadComponent: () =>
          import('./features/requests/approve-request/approve-request.component').then(
            (m) => m.ApproveRequestComponent,
          ),
        canActivate: [roleGuard([UserRole.APROVADOR])],
      },
      {
        path: 'todos-os-pedidos',
        loadComponent: () =>
          import('./features/requests/all-requests/all-requests.component').then((m) => m.AllRequestsComponent),
        canActivate: [roleGuard([UserRole.APROVADOR])],
      },
      {
        path: 'aplicacoes',
        loadComponent: () =>
          import('./features/applications/applications.component').then((m) => m.ApplicationsComponent),
      },
      {
        path: 'utilizadores',
        loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
        canActivate: [roleGuard([UserRole.APROVADOR])],
      },
      
      {
        path: 'perfil',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
