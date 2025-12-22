import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const user = authService.currentUser();

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // 🔒 BLOQUER LES CANDIDATS DANS LA SALLE D'ATTENTE
  if (user?.role === Role.CANDIDAT) {
    if (state.url.includes('pending-approval')) {
      return true; // Autorisé sur la page d'attente
    }
    router.navigate(['/auth/pending-approval']); // Bloqué ailleurs
    return false;
  }

  // 🔒 BLOQUER LES AUTRES DE LA SALLE D'ATTENTE
  if (state.url.includes('pending-approval')) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};