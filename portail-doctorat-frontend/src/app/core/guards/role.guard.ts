import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Récupérer les rôles autorisés depuis les données de la route
  const allowedRoles = route.data['roles'] as Role[];
  
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  
  // Vérifier si l'utilisateur a un des rôles autorisés
  if (authService.hasRole(allowedRoles)) {
    return true;
  }
  
  // Rediriger vers dashboard si pas autorisé
  router.navigate(['/dashboard']);
  return false;
};
