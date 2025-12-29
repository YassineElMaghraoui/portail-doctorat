import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  // 🔹 Redirection par défaut
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // 🔹 Dashboard Admin
  {
    path: 'dashboard',
    loadComponent: () =>
        import('./dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
  },

  // ✅ IMPORTANT: Route spécifique AVANT la route générique 'users'
  // 🔹 Ajouter un directeur
  {
    path: 'users/new-director',
    loadComponent: () =>
        import('./new-director/new-director.component')
            .then(m => m.NewDirectorComponent)
  },

  // 🔹 Gestion des utilisateurs
  {
    path: 'users',
    loadComponent: () =>
        import('./user-management/user-management.component')
            .then(m => m.UserManagementComponent)
  },

  // 🔹 Campagnes (routes enfants)
  {
    path: 'campagnes',
    loadChildren: () =>
        import('../campagnes/campagnes.routes')
            .then(m => m.CAMPAGNES_ROUTES)
  },

  // 🔹 Gestion des dérogations
  {
    path: 'derogations',
    loadComponent: () =>
        import('./derogation-management/derogation-management.component')
            .then(m => m.DerogationManagementComponent)
  },

  // 🔹 Soutenances
  {
    path: 'soutenances',
    loadComponent: () =>
        import('./soutenance-list/soutenance-list.component')
            .then(m => m.SoutenanceListComponent)
  },
  {
    path: 'soutenances/:id',
    loadComponent: () =>
        import('./soutenance-detail/soutenance-detail.component')
            .then(m => m.SoutenanceDetailComponent)
  }
];