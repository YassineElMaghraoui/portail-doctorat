import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },

  // Page d'attente (Doit être avant le wildcard)
  {
    path: 'auth/pending-approval',
    loadComponent: () => import('./features/auth/pending-approval/pending-approval.component')
        .then(m => m.PendingApprovalComponent)
  },

  // ✅ LE DASHBOARD INTELLIGENT (Point d'entrée unique)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Modules Doctorant / Directeur
  {
    path: 'inscriptions',
    loadChildren: () => import('./features/inscriptions/inscriptions.routes').then(m => m.INSCRIPTIONS_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'validations',
    loadComponent: () => import('./features/inscriptions/inscription-validation/inscription-validation.component')
        .then(m => m.InscriptionValidationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'soutenances',
    loadChildren: () => import('./features/soutenances/soutenances.routes').then(m => m.SOUTENANCES_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'derogations',
    loadChildren: () => import('./features/derogations/derogations.routes').then(m => m.DEROGATIONS_ROUTES),
    canActivate: [authGuard]
  },

  // ✅ ROUTE ADMIN
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },

  // ✅ ROUTE CAMPAGNES (Déplacée AVANT le **)
  {
    path: 'campagnes',
    loadChildren: () => import('./features/campagnes/campagnes.routes').then(m => m.CAMPAGNES_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'RESPONSABLE_CEDOC'] }
  },

  // Profil utilisateur
  {
    path: 'profil',
    loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent),
    canActivate: [authGuard]
  },

  // ⛔ 404 - DOIT TOUJOURS ÊTRE EN DERNIER ⛔
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];