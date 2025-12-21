import { Routes } from '@angular/router';

export const DEROGATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./derogation-list/derogation-list.component').then(m => m.DerogationListComponent)
  },
  {
    path: 'nouvelle',
    loadComponent: () => import('./derogation-form/derogation-form.component').then(m => m.DerogationFormComponent)
  }
];
