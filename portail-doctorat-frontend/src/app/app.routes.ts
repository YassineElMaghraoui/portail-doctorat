import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ============================================
  // PAGES PUBLIQUES (Sans AuthGuard)
  // ============================================
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'pending-approval',
    loadComponent: () => import('./features/auth/pending-approval/pending-approval.component').then(m => m.PendingApprovalComponent)
  },

  // ============================================
  // DASHBOARD & PROFIL (Commun)
  // ============================================
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profil',
    loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent),
    canActivate: [authGuard]
  },

  // ============================================
  // DOCTORANT
  // ============================================
  {
    path: 'inscriptions',
    loadComponent: () => import('./features/inscriptions/inscription-list/inscription-list.component').then(m => m.InscriptionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inscriptions/nouvelle',
    loadComponent: () => import('./features/inscriptions/inscription-form/inscription-form.component').then(m => m.InscriptionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'derogations',
    loadComponent: () => import('./features/derogations/derogation-list/derogation-list.component').then(m => m.DerogationListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'derogations/nouvelle',
    loadComponent: () => import('./features/derogations/derogation-form/derogation-form.component').then(m => m.DerogationFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'soutenances',
    loadChildren: () => import('./features/soutenances/soutenances.routes').then(m => m.SOUTENANCES_ROUTES),
    canActivate: [authGuard]
  },

  // ============================================
  // DIRECTEUR DE THÈSE
  // ============================================
  {
    path: 'director/my-students',
    loadComponent: () => import('./features/directeur/my-students/my-students.component').then(m => m.MyStudentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'validations',
    loadComponent: () => import('./features/directeur/validation/director-validation.component').then(m => m.DirectorValidationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'director/reinscriptions',
    loadComponent: () => import('./features/directeur/reinscriptions/directeur-reinscriptions.component').then(m => m.DirecteurReinscriptionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'director/derogations',
    loadComponent: () => import('./features/directeur/derogations/director-derogations.component').then(m => m.DirectorDerogationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'director/soutenances',
    loadComponent: () => import('./features/directeur/soutenances/director-soutenance.component').then(m => m.DirectorSoutenanceComponent),
    canActivate: [authGuard]
  },

  // ============================================
  // ADMIN
  // ============================================
  {
    path: 'admin/campagnes',
    loadComponent: () => import('./features/campagnes/campagne-list/campagne-list.component').then(m => m.CampagneListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/campagnes/nouvelle',
    loadComponent: () => import('./features/campagnes/campagne-form/campagne-form.component').then(m => m.CampagneFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/campagnes/modifier/:id',
    loadComponent: () => import('./features/campagnes/campagne-form/campagne-form.component').then(m => m.CampagneFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/reinscriptions',
    loadComponent: () => import('./features/admin/reinscriptions/admin-reinscriptions.component').then(m => m.AdminReinscriptionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/derogations',
    loadComponent: () => import('./features/admin/derogation-management/derogation-management.component').then(m => m.DerogationManagementComponent),
    canActivate: [authGuard]
  },

  // ✅ CORRECTION ICI : Remplacement de SoutenanceListComponent par AdminSoutenanceComponent
  {
    path: 'admin/soutenances',
    loadComponent: () => import('./features/admin/soutenance-list/soutenance-list.component').then(m => m.AdminSoutenanceComponent),
    canActivate: [authGuard]
  },

  {
    path: 'admin/soutenances/:id',
    loadComponent: () => import('./features/admin/soutenance-detail/soutenance-detail.component').then(m => m.SoutenanceDetailComponent),
    canActivate: [authGuard]
  },

  {
    path: 'admin/users/new-director',
    loadComponent: () => import('./features/admin/new-director/new-director.component').then(m => m.NewDirectorComponent),
    canActivate: [authGuard]
  },

  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '/dashboard' }
];