import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Page d'accueil
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Auth (public)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Dashboard (protégé)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Inscriptions
  {
    path: 'inscriptions',
    loadChildren: () => import('./features/inscriptions/inscriptions.routes').then(m => m.INSCRIPTIONS_ROUTES),
    canActivate: [authGuard]
  },

  // Campagnes (Admin)
  {
    path: 'campagnes',
    loadChildren: () => import('./features/campagnes/campagnes.routes').then(m => m.CAMPAGNES_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'RESPONSABLE_CEDOC'] }
  },

  // Soutenances
  {
    path: 'soutenances',
    loadChildren: () => import('./features/soutenances/soutenances.routes').then(m => m.SOUTENANCES_ROUTES),
    canActivate: [authGuard]
  },

  // Dérogations
  {
    path: 'derogations',
    loadChildren: () => import('./features/derogations/derogations.routes').then(m => m.DEROGATIONS_ROUTES),
    canActivate: [authGuard]
  },

  // Profil utilisateur
  {
    path: 'profil',
    loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent),
    canActivate: [authGuard]
  },

  // Admin
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
