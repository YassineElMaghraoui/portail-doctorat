import { Routes } from '@angular/router';

export const SOUTENANCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./soutenance-list/soutenance-list.component').then(m => m.SoutenanceListComponent)
  }
];
