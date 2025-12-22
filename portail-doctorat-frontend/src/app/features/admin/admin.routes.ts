import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    // Vérifiez aussi si celui-ci est dans 'pages' ou non
    loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'derogations',
    loadComponent: () => import('./derogation-management/derogation-management.component').then(m => m.DerogationManagementComponent)
  },
  {
    path: 'inscriptions',
    // ✅ CORRECTION ICI : Ajout de '/pages/' dans le chemin
    loadComponent: () => import('./pages/inscription-validation/admin-inscription-validation.component')
        .then(m => m.AdminInscriptionValidationComponent)
  }
];