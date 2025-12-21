import { Routes } from '@angular/router';

export const CAMPAGNES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./campagne-list/campagne-list.component').then(m => m.CampagneListComponent)
  }
];
