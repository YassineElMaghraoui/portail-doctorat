import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'derogations',
    loadComponent: () => import('./derogation-management/derogation-management.component').then(m => m.DerogationManagementComponent)
  },
  {
    path: 'inscriptions',
    loadComponent: () => import('./inscription-management/inscription-management.component').then(m => m.InscriptionManagementComponent)
  }
];
