import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  // 🔹 Page d'accueil Admin
  {
    path: '',
    loadComponent: () =>
        import('./dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
  },

  // 🔴 IMPORTANT : la route spécifique doit être AVANT la route générale
  {
    path: 'users/new-director',
    loadComponent: () =>
        import('./user-management/director-form/director-form.component')
            .then(m => m.DirectorFormComponent)
  },

  // 🔴 Route générale des utilisateurs (avec pathMatch: 'full')
  {
    path: 'users',
    loadComponent: () =>
        import('./user-management/user-management.component')
            .then(m => m.UserManagementComponent),
    pathMatch: 'full'
  },

  // 🔹 Autres routes Admin
  {
    path: 'derogations',
    loadComponent: () =>
        import('./derogation-management/derogation-management.component')
            .then(m => m.DerogationManagementComponent)
  },
  {
    path: 'inscriptions',
    loadComponent: () =>
        import('./pages/inscription-validation/admin-inscription-validation.component')
            .then(m => m.AdminInscriptionValidationComponent)
  }
];
