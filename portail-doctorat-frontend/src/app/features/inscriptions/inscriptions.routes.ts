import { Routes } from '@angular/router';

export const INSCRIPTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inscription-list/inscription-list.component').then(m => m.InscriptionListComponent)
  },
  {
    path: 'nouvelle',
    loadComponent: () => import('./inscription-form/inscription-form.component').then(m => m.InscriptionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./inscription-detail/inscription-detail.component').then(m => m.InscriptionDetailComponent)
  },
  {
    // ✅ Route existante pour l'édition
    path: ':id/edit',
    loadComponent: () => import('./inscription-form/inscription-form.component').then(m => m.InscriptionFormComponent)
  },
  {
    // ✅ AJOUT : Route alternative "modifier/:id" pour éviter le 404
    path: 'modifier/:id',
    loadComponent: () => import('./inscription-form/inscription-form.component').then(m => m.InscriptionFormComponent)
  }
];