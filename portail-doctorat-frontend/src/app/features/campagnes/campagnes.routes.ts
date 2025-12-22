import { Routes } from '@angular/router';

export const CAMPAGNES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./campagne-list/campagne-list.component').then(m => m.CampagneListComponent)
  },
  // Route pour CRÉER
  {
    path: 'nouvelle',
    loadComponent: () => import('./campagne-form/campagne-form.component').then(m => m.CampagneFormComponent)
  },
  // Route pour MODIFIER
  {
    path: 'modifier/:id',
    loadComponent: () => import('./campagne-form/campagne-form.component').then(m => m.CampagneFormComponent)
  }
];