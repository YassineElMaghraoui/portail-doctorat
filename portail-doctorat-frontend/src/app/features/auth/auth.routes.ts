import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
  },
  // ✅ AJOUTER CETTE ROUTE
  {
    path: 'pending-approval',
    loadComponent: () => import('./pending-approval/pending-approval.component').then(m => m.PendingApprovalComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];